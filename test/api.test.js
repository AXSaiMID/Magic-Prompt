'use strict';

/**
 * Teste de integração da API: sobe o servidor em uma porta livre, com um
 * diretório de dados temporário, e exercita o fluxo completo — criar projeto,
 * gerar prompt, enviar arquivos, baixar o .zip e excluir.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

// Diretório de dados isolado — precisa existir antes de carregar o store.
const DIR_TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'magic-prompt-test-'));
process.env.MAGIC_PROMPT_DATA = DIR_TEMP;

const { servidor } = require('../server/index');
const { clienteVeterinaria, ARQUIVOS_EXEMPLO } = require('./fixtures/clientes');

let base = '';
let projetoId = '';

function png1x1() {
  const chunk = (tipo, dados) => {
    const corpo = Buffer.concat([Buffer.from(tipo), dados]);
    const tamanho = Buffer.alloc(4);
    tamanho.writeUInt32BE(dados.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32 ? zlib.crc32(corpo) >>> 0 : requerCrc(corpo));
    return Buffer.concat([tamanho, corpo, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const idat = zlib.deflateSync(Buffer.from([0x00, 0xff, 0x00, 0x00]));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// zlib.crc32 só existe no Node 20.15+; fallback simples para versões anteriores.
function requerCrc(buffer) {
  const { crc32 } = require('../server/lib/zip');
  return crc32(buffer);
}

function corpoMultipart(campos, arquivos) {
  const boundary = `----magicprompt${Date.now()}`;
  const partes = [];
  for (const [nome, valor] of Object.entries(campos || {})) {
    partes.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${nome}"\r\n\r\n${valor}\r\n`));
  }
  for (const arquivo of arquivos || []) {
    partes.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${arquivo.campo}"; filename="${arquivo.nome}"\r\nContent-Type: ${arquivo.tipo}\r\n\r\n`));
    partes.push(arquivo.dados);
    partes.push(Buffer.from('\r\n'));
  }
  partes.push(Buffer.from(`--${boundary}--\r\n`));
  return { boundary, corpo: Buffer.concat(partes) };
}

async function json(caminho, opcoes = {}) {
  const resposta = await fetch(`${base}${caminho}`, opcoes);
  const texto = await resposta.text();
  return { status: resposta.status, dados: texto ? JSON.parse(texto) : null, headers: resposta.headers };
}

test.before(async () => {
  await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => servidor.close(resolve));
  fs.rmSync(DIR_TEMP, { recursive: true, force: true });
});

test('health responde com a versão e a quantidade de segmentos', async () => {
  const { status, dados } = await json('/api/health');
  assert.equal(status, 200);
  assert.equal(dados.ok, true);
  assert.equal(dados.segmentos, 7);
});

test('lista segmentos, objetivos e estilos para a interface', async () => {
  const { status, dados } = await json('/api/segmentos');
  assert.equal(status, 200);
  assert.equal(dados.modelos.length, 7);
  assert.ok(dados.objetivos.length >= 5);
  assert.ok(dados.estilos.includes('Minimalista'));
  assert.ok(dados.idiomas.some((i) => i.id === 'pt-BR'));
});

test('sugestões de um segmento estão disponíveis', async () => {
  const { status, dados } = await json('/api/segmentos/veterinaria/sugestoes');
  assert.equal(status, 200);
  assert.ok(dados.servicos.length >= 8);
  assert.ok(dados.paginas.some((p) => p.nome === 'Home'));
});

test('rejeita criação sem os campos obrigatórios', async () => {
  const { status, dados } = await json('/api/projetos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dados: { segmento: 'veterinaria', empresa: {} } }),
  });
  assert.equal(status, 422);
  assert.ok(dados.erros.some((e) => e.campo === 'empresa.nomeFantasia'));
});

test('gera prompt sem salvar (pré-visualização)', async () => {
  const { status, dados } = await json('/api/prompt/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dados: clienteVeterinaria }),
  });
  assert.equal(status, 200);
  assert.ok(dados.prompt.includes('Clínica Vida Animal'));
  assert.equal(dados.meta.segmento, 'veterinaria');
});

test('cria o projeto e grava prompt + arquivos de apoio na pasta do cliente', async () => {
  const { status, dados } = await json('/api/projetos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dados: clienteVeterinaria, forcar: true }),
  });
  assert.equal(status, 201);
  projetoId = dados.projeto.id;
  assert.equal(dados.meta.pasta, 'renata-lima_clinica-vida-animal');
  assert.ok(dados.prompt.length > 12000);

  const pasta = path.join(DIR_TEMP, 'clientes', projetoId);
  for (const arquivo of ['prompt_site.txt', 'prompt_resumo.txt', 'LEIA-ME.txt', 'dados.json', 'conteudo/textos.md', 'conteudo/faq.md', 'branding/identidade-visual.md']) {
    assert.ok(fs.existsSync(path.join(pasta, arquivo)), `arquivo de apoio ausente: ${arquivo}`);
  }
});

test('projeto aparece no histórico com resumo', async () => {
  const { dados } = await json('/api/projetos');
  assert.equal(dados.total, 1);
  assert.equal(dados.projetos[0].id, projetoId);
  assert.equal(dados.projetos[0].pasta, 'renata-lima_clinica-vida-animal');
  assert.ok(dados.projetos[0].resumo.paginas >= 5);
});

test('upload em multipart salva o arquivo e atualiza o prompt', async () => {
  const { boundary, corpo } = corpoMultipart({}, [
    { campo: 'arquivos', nome: 'banner-fachada.png', tipo: 'image/png', dados: png1x1() },
    { campo: 'arquivos', nome: 'foto do espaço (1).png', tipo: 'image/png', dados: png1x1() },
  ]);
  const resposta = await fetch(`${base}/api/projetos/${projetoId}/arquivos?categoria=midias`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body: corpo,
  });
  const dados = await resposta.json();
  assert.equal(resposta.status, 201, JSON.stringify(dados));
  assert.deepEqual(dados.arquivos.midias.map((a) => a.nome).sort(), ['banner-fachada.png', 'foto-do-espaco-1.png']);
  assert.ok(dados.prompt.includes('banner-fachada.png'), 'o prompt deve citar o arquivo enviado');
  assert.ok(dados.meta.arquivos.midias === 2);
});

test('entrega o arquivo bruto para pré-visualização', async () => {
  const resposta = await fetch(`${base}/api/projetos/${projetoId}/arquivos/raw?categoria=midias&nome=banner-fachada.png`);
  assert.equal(resposta.status, 200);
  assert.equal(resposta.headers.get('content-type'), 'image/png');
  const buffer = Buffer.from(await resposta.arrayBuffer());
  assert.equal(buffer[0], 0x89);
});

test('bloqueia acesso a arquivos fora da pasta do cliente', async () => {
  const resposta = await fetch(`${base}/api/projetos/${projetoId}/arquivos/raw?categoria=midias&nome=../../../../etc/passwd`);
  assert.ok([404, 403].includes(resposta.status), `esperado 404/403, recebido ${resposta.status}`);
});

test('atualiza os dados e regenera o prompt', async () => {
  const alterado = JSON.parse(JSON.stringify(clienteVeterinaria));
  alterado.empresa.nomeFantasia = 'Vida Animal Centro';
  alterado.opcoes.ecommerce = false;
  const { dados } = await json(`/api/projetos/${projetoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dados: alterado }),
  });
  assert.ok(dados.prompt.includes('Vida Animal Centro'));
  assert.ok(!/Loja online — especificação/.test(dados.prompt), 'sem e-commerce o prompt não deve ter especificação de loja');
  assert.ok(dados.meta.paginas.length > 0);
});

test('salva edição manual do prompt', async () => {
  const { status } = await json(`/api/projetos/${projetoId}/prompt`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'PROMPT EDITADO À MÃO' }),
  });
  assert.equal(status, 200);
  const { dados } = await json(`/api/projetos/${projetoId}`);
  assert.equal(dados.prompt, 'PROMPT EDITADO À MÃO');
  assert.equal(dados.projeto.promptEditadoManualmente, true);
});

test('baixa o .zip com a pasta completa do cliente', async () => {
  const resposta = await fetch(`${base}/api/projetos/${projetoId}/download`);
  assert.equal(resposta.status, 200);
  assert.equal(resposta.headers.get('content-type'), 'application/zip');
  assert.match(resposta.headers.get('content-disposition') || '', /clinic|vida-animal|renata/);

  const buffer = Buffer.from(await resposta.arrayBuffer());
  assert.equal(buffer.readUInt32LE(0), 0x04034b50, 'deve começar com assinatura de ZIP');

  // Verifica os nomes das entradas varrendo o índice central.
  const assinaturaCentral = Buffer.from([0x50, 0x4b, 0x01, 0x02]);
  const nomes = [];
  let p = buffer.indexOf(assinaturaCentral);
  while (p !== -1) {
    const tamanhoNome = buffer.readUInt16LE(p + 28);
    nomes.push(buffer.slice(p + 46, p + 46 + tamanhoNome).toString('utf8'));
    p = buffer.indexOf(assinaturaCentral, p + 46 + tamanhoNome);
  }
  assert.ok(nomes.some((n) => n.endsWith('prompt_site.txt')));
  assert.ok(nomes.some((n) => n.endsWith('prompt_resumo.txt')));
  assert.ok(nomes.some((n) => n.endsWith('LEIA-ME.txt')));
  assert.ok(nomes.some((n) => n.includes('midias/banner-fachada.png')));
  assert.ok(nomes.some((n) => n.endsWith('conteudo/stextos.md') || n.endsWith('conteudo/textos.md')));
  assert.ok(nomes.some((n) => n.endsWith('dados-cliente.json')));
  assert.ok(nomes.every((n) => n.startsWith('renata-lima_')), 'todo o conteúdo deve estar dentro da pasta do cliente');
});

test('duplica a estrutura para outro cliente do mesmo segmento', async () => {
  const { status, dados } = await json(`/api/projetos/${projetoId}/duplicar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nomeContato: 'João Dias', nomeFantasia: 'Clínica Amigo Fiel' }),
  });
  assert.equal(status, 201);
  assert.notEqual(dados.projeto.id, projetoId);
  assert.equal(dados.meta.pasta, 'joao-dias_clinica-amigo-fiel');
  assert.ok(dados.prompt.includes('Clínica Amigo Fiel'));
  assert.ok(!dados.prompt.includes('Vida Animal Centro'));

  const lista = await json('/api/projetos');
  assert.equal(lista.dados.total, 2);
});

test('exclui o projeto e mantém o histórico consistente', async () => {
  const { status } = await json(`/api/projetos/${projetoId}`, { method: 'DELETE' });
  assert.equal(status, 200);
  const { dados } = await json('/api/projetos');
  assert.equal(dados.total, 1);
  assert.ok(!dados.projetos.some((p) => p.id === projetoId));
  assert.equal(fs.existsSync(path.join(DIR_TEMP, 'clientes', projetoId)), false);
});

test('responde 404 para rotas e projetos inexistentes', async () => {
  const rota = await json('/api/nao-existe');
  assert.equal(rota.status, 404);
  const projeto = await json('/api/projetos/00000000-0000-0000-0000-000000000000');
  assert.equal(projeto.status, 404);
});

test('serve a interface web na raiz', async () => {
  const resposta = await fetch(`${base}/`);
  assert.equal(resposta.status, 200);
  assert.match(resposta.headers.get('content-type') || '', /text\/html/);
  const html = await resposta.text();
  assert.ok(html.includes('Magic Prompt'));
});
