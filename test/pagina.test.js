'use strict';

/**
 * Testes da PÁGINA ESTÁTICA (docs/).
 *
 * O ponto central: o motor empacotado para o navegador precisa produzir
 * EXATAMENTE o mesmo prompt que o servidor. Se alguém alterar server/lib/*.js
 * e esquecer de rodar `npm run pagina`, os testes falham.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const DIR_DOCS = path.join(RAIZ, 'docs');
const ARQ_MOTOR = path.join(DIR_DOCS, 'motor.js');

const { gerarPrompt, gerarPromptResumo, validarDados } = require('../server/lib/prompt-engine');
const { gerarArquivosDeApoio } = require('../server/lib/pacote');
const { ZipWriter } = require('../server/lib/zip');
const { clienteEstetica, clienteBarbearia, clienteVeterinaria, ARQUIVOS_EXEMPLO } = require('./fixtures/clientes');

/* ------------------------------ helpers ------------------------------ */

function hashArquivo(caminho) {
  return crypto.createHash('sha256').update(fs.readFileSync(caminho)).digest('hex');
}

/** Carrega o bundle em um contexto isolado, como se fosse o navegador. */
function carregarMotorNoNavegador() {
  const codigo = fs.readFileSync(ARQ_MOTOR, 'utf8');
  const sandbox = { TextEncoder, TextDecoder, console };
  vm.createContext(sandbox);
  vm.runInContext(codigo, sandbox, { filename: 'docs/motor.js' });
  return sandbox.MagicPromptMotor;
}

/** Lê o índice central de um ZIP (mesma verificação usada em zip.test.js). */
function lerEstruturaZip(buffer) {
  let posFim = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { posFim = i; break; }
  }
  assert.notEqual(posFim, -1, 'assinatura de fim do ZIP não encontrada');
  const quantidade = buffer.readUInt16LE(posFim + 10);
  const entradas = [];
  let p = buffer.readUInt32LE(posFim + 16);
  for (let i = 0; i < quantidade; i++) {
    assert.equal(buffer.readUInt32LE(p), 0x02014b50, 'cabeçalho central inválido');
    const crc = buffer.readUInt32LE(p + 16);
    const tamanho = buffer.readUInt32LE(p + 24);
    const tamanhoNome = buffer.readUInt16LE(p + 28);
    const offset = buffer.readUInt32LE(p + 42);
    const nome = buffer.toString('utf8', p + 46, p + 46 + tamanhoNome);
    const nomeLocal = buffer.readUInt16LE(offset + 26);
    const inicio = offset + 30 + nomeLocal;
    entradas.push({ nome, crc, tamanho, conteudo: buffer.subarray(inicio, inicio + tamanho) });
    p += 46 + tamanhoNome + buffer.readUInt16LE(p + 30) + buffer.readUInt16LE(p + 32);
  }
  return entradas;
}

/* ------------------------------ build ------------------------------ */

test('a pasta docs/ está publicada com todos os arquivos necessários', () => {
  for (const arquivo of ['index.html', 'styles.css', 'app.js', 'motor.js', '.nojekyll', 'README.md']) {
    assert.ok(fs.existsSync(path.join(DIR_DOCS, arquivo)), `arquivo ausente em docs/: ${arquivo}`);
  }
  const html = fs.readFileSync(path.join(DIR_DOCS, 'index.html'), 'utf8');
  for (const recurso of ['./styles.css', './app.js', './motor.js']) {
    assert.ok(html.includes(recurso), `index.html não referencia ${recurso}`);
  }
  // Caminhos relativos: funciona tanto em /docs quanto na raiz do domínio do Pages.
  assert.ok(!/src="\/(?!\/)/.test(html), 'a página deve usar caminhos relativos para funcionar no GitHub Pages');
});

test('o bundle está atualizado em relação ao código-fonte (npm run pagina)', () => {
  const antes = hashArquivo(ARQ_MOTOR);
  execFileSync(process.execPath, [path.join(RAIZ, 'scripts', 'build-pagina.js')], { cwd: RAIZ, stdio: 'pipe' });
  const depois = hashArquivo(ARQ_MOTOR);
  assert.equal(depois, antes, 'docs/motor.js está desatualizado: rode `npm run pagina` e faça o commit');
});

test('o bundle contém os módulos do servidor', () => {
  const bundle = fs.readFileSync(ARQ_MOTOR, 'utf8');
  for (const modulo of ['utils', 'segmentos', 'prompt-engine', 'pacote', 'zip']) {
    assert.ok(bundle.includes(`REGISTRO['${modulo}']`), `módulo ausente no bundle: ${modulo}`);
  }
  assert.ok(bundle.includes('BufferShim'), 'deve incluir o Buffer para navegador');
  assert.ok(bundle.includes('MagicPromptMotor'), 'deve exportar a API do motor');
});

/* --------------------- equivalência servidor x navegador --------------------- */

test('o motor no navegador gera o MESMO prompt que o servidor', () => {
  const motor = carregarMotorNoNavegador();
  const casos = [
    { dados: clienteEstetica, arquivos: ARQUIVOS_EXEMPLO },
    { dados: clienteBarbearia, arquivos: {} },
    { dados: clienteVeterinaria, arquivos: ARQUIVOS_EXEMPLO },
  ];
  assert.equal(motor.versao, require('../server/lib/prompt-engine').VERSAO);

  for (const caso of casos) {
    const noServidor = gerarPrompt(caso.dados, caso.arquivos);
    const noNavegador = motor.gerarPrompt(caso.dados, caso.arquivos);
    assert.equal(noNavegador.texto, noServidor.texto, `prompt diferente para o segmento ${caso.dados.segmento}`);

    // geradoEm é o único campo que pode divergir (as duas gerações acontecem em
    // milissegundos diferentes) — todo o resto do metadado tem de ser idêntico.
    const metaNavegador = JSON.parse(JSON.stringify(noNavegador.meta));
    const metaServidor = JSON.parse(JSON.stringify(noServidor.meta));
    delete metaNavegador.geradoEm;
    delete metaServidor.geradoEm;
    assert.deepEqual(metaNavegador, metaServidor);
  }
});

test('o resumo curto também é idêntico nos dois modos', () => {
  const motor = carregarMotorNoNavegador();
  assert.equal(
    motor.gerarPromptResumo(clienteEstetica, ARQUIVOS_EXEMPLO),
    gerarPromptResumo(clienteEstetica, ARQUIVOS_EXEMPLO)
  );
});

test('os arquivos de apoio gerados no navegador são idênticos aos do servidor', () => {
  const motor = carregarMotorNoNavegador();
  const meta = gerarPrompt(clienteVeterinaria, ARQUIVOS_EXEMPLO).meta;
  const noServidor = gerarArquivosDeApoio(clienteVeterinaria, ARQUIVOS_EXEMPLO, meta);
  const noNavegador = motor.gerarArquivosDeApoio(clienteVeterinaria, ARQUIVOS_EXEMPLO, meta);
  assert.deepEqual(Object.keys(noNavegador).sort(), Object.keys(noServidor).sort());
  for (const chave of Object.keys(noServidor)) {
    assert.equal(noNavegador[chave], noServidor[chave], `conteúdo diferente em ${chave}`);
  }
});

test('a validação e as sugestões de segmento funcionam no navegador', () => {
  const motor = carregarMotorNoNavegador();
  const vazio = motor.validarDados({}, {});
  assert.equal(vazio.ok, false);
  assert.equal(vazio.erros.length, validarDados({}, {}).erros.length);

  const sugestoes = motor.sugestoesDoModelo('barbearia');
  assert.ok(sugestoes.servicos.length >= 8);
  assert.equal(motor.listarModelos().length, 14);
});

/* --------------------- ZIP montado no navegador --------------------- */

test('o .zip montado no navegador é válido e contém a pasta do cliente', () => {
  const motor = carregarMotorNoNavegador();
  const meta = gerarPrompt(clienteEstetica, ARQUIVOS_EXEMPLO).meta;
  const apoio = motor.gerarArquivosDeApoio(clienteEstetica, ARQUIVOS_EXEMPLO, meta);

  const zip = new motor.ZipWriter();
  zip.adicionar(`${meta.pasta}/prompt_site.txt`, motor.gerarPrompt(clienteEstetica, ARQUIVOS_EXEMPLO).texto);
  zip.adicionar(`${meta.pasta}/dados-cliente.json`, `${JSON.stringify(clienteEstetica, null, 2)}\n`);
  for (const [caminho, conteudo] of Object.entries(apoio)) zip.adicionar(`${meta.pasta}/${caminho}`, conteudo);
  // arquivo binário: passa pelo Buffer do navegador
  zip.adicionar(`${meta.pasta}/midias/banner-fachada.jpg`, motor.Buffer.from(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])));

  const binario = Buffer.from(zip.finalizar()); // BufferShim (navegador) -> Buffer (Node)
  const entradas = lerEstruturaZip(binario);

  const nomes = entradas.map((e) => e.nome).sort();
  assert.ok(nomes.includes(`${meta.pasta}/prompt_site.txt`));
  assert.ok(nomes.includes(`${meta.pasta}/prompt_resumo.txt`));
  assert.ok(nomes.includes(`${meta.pasta}/LEIA-ME.txt`));
  assert.ok(nomes.includes(`${meta.pasta}/dados-cliente.json`));
  assert.ok(nomes.includes(`${meta.pasta}/conteudo/faq.md`));
  assert.ok(nomes.includes(`${meta.pasta}/branding/identidade-visual.md`));
  assert.ok(nomes.includes(`${meta.pasta}/midias/banner-fachada.jpg`));
  assert.ok(nomes.every((n) => n.startsWith(meta.pasta)), 'todo o conteúdo deve estar dentro da pasta do cliente');

  // integridade: o CRC de cada entrada confere com o conteúdo gravado
  for (const entrada of entradas) {
    assert.equal(ZipWriter.prototype.adicionar && require('../server/lib/zip').crc32(entrada.conteudo), entrada.crc, `CRC divergente em ${entrada.nome}`);
  }

  // o prompt dentro do zip é exatamente o prompt gerado
  const doZip = entradas.find((e) => e.nome.endsWith('prompt_site.txt'));
  assert.equal(doZip.conteudo.toString('utf8'), gerarPrompt(clienteEstetica, ARQUIVOS_EXEMPLO).texto);

  // arquivo binário preservado byte a byte
  const bin = entradas.find((e) => e.nome.endsWith('banner-fachada.jpg'));
  assert.deepEqual([...bin.conteudo], [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
});

test('o Buffer do navegador aceita os casos de uso do escritor de ZIP', () => {
  const motor = carregarMotorNoNavegador();
  const B = motor.Buffer;
  assert.equal(B.from('ação').length, 6); // UTF-8: ç e ã ocupam 2 bytes cada
  assert.equal(B.from('ação').toString().normalize('NFC'), 'ação'.normalize('NFC'));
  assert.deepEqual([...B.from([1, 2, 3])], [1, 2, 3]);
  assert.deepEqual([...B.from(Uint8Array.from([9, 8]))], [9, 8]);
  assert.equal(B.alloc(4).length, 4);
  assert.equal(B.isBuffer(B.alloc(1)), true);
  assert.equal(B.isBuffer(new Uint8Array(1)), false);
  const concatenado = B.concat([B.from([1, 2]), B.from([3])]);
  assert.deepEqual([...concatenado], [1, 2, 3]);
  const buffer = B.alloc(6);
  buffer.writeUInt32LE(0xdeadbeef, 0);
  buffer.writeUInt16LE(0x1234, 4);
  assert.equal(buffer.readUInt32LE(0), 0xdeadbeef);
  assert.equal(buffer.readUInt16LE(4), 0x1234);
  assert.deepEqual([...B.from([5, 6, 7, 8]).slice(1, 3)], [6, 7]);
  const alvo = B.from([1, 2, 3, 4, 5]);
  assert.equal(alvo.indexOf(B.from([4, 5])), 3);
  assert.equal(alvo.indexOf(B.from([9])), -1);
});

/* --------------------- sanidade da interface estática --------------------- */

test('todo $("#id") do app estático existe no HTML', () => {
  const html = fs.readFileSync(path.join(DIR_DOCS, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(DIR_DOCS, 'app.js'), 'utf8');
  const idsHtml = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const idsDinamicos = new Set([...app.matchAll(/id="([\w-]+)"/g)].map((m) => m[1]));
  const usados = new Set([...app.matchAll(/\$\('#([\w-]+)'\)/g)].map((m) => m[1]));
  const ausentes = [...usados].filter((id) => !idsHtml.has(id) && !idsDinamicos.has(id));
  assert.deepEqual(ausentes, [], `ids usados no app estático e inexistentes: ${ausentes.join(', ')}`);
});

test('o app estático cobre as sete etapas e as ações principais', () => {
  const app = fs.readFileSync(path.join(DIR_DOCS, 'app.js'), 'utf8');
  for (const aba of ['segmento', 'empresa', 'negocio', 'redes', 'visual', 'conteudo', 'arquivos']) {
    assert.ok(app.includes(`id: '${aba}'`), `aba ausente: ${aba}`);
  }
  assert.ok(app.includes('MagicPromptMotor.gerarPrompt'), 'deve gerar o prompt no navegador');
  assert.ok(app.includes('btn-baixar-zip'), 'deve permitir baixar a pasta em .zip');
  assert.ok(app.includes('localStorage'), 'deve manter o histórico no navegador');
  assert.ok(!/fetch\(/.test(app), 'a versão estática não deve depender de chamadas ao servidor');
});
