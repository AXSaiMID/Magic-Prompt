'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { ZipWriter, crc32 } = require('../server/lib/zip');

function lerEstruturaZip(buffer) {
  // Localiza o End Of Central Directory e lê o índice central.
  const assinaturaFim = 0x06054b50;
  let posFim = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === assinaturaFim) { posFim = i; break; }
  }
  assert.notEqual(posFim, -1, 'assinatura de fim do ZIP não encontrada');

  const quantidade = buffer.readUInt16LE(posFim + 10);
  const tamanhoCentral = buffer.readUInt32LE(posFim + 12);
  const deslocamentoCentral = buffer.readUInt32LE(posFim + 16);
  assert.equal(buffer.length, deslocamentoCentral + tamanhoCentral + 22, 'tamanhos do índice central inconsistentes');

  const entradas = [];
  let p = deslocamentoCentral;
  for (let i = 0; i < quantidade; i++) {
    assert.equal(buffer.readUInt32LE(p), 0x02014b50, 'cabeçalho central inválido');
    const metodo = buffer.readUInt16LE(p + 10);
    const crc = buffer.readUInt32LE(p + 16);
    const tamanho = buffer.readUInt32LE(p + 24);
    const tamanhoNome = buffer.readUInt16LE(p + 28);
    const tamanhoExtra = buffer.readUInt16LE(p + 30);
    const tamanhoComentario = buffer.readUInt16LE(p + 32);
    const offsetLocal = buffer.readUInt32LE(p + 42);
    const nome = buffer.slice(p + 46, p + 46 + tamanhoNome).toString('utf8');
    entradas.push({ nome, metodo, crc, tamanho, offsetLocal });
    p += 46 + tamanhoNome + tamanhoExtra + tamanhoComentario;
  }
  return { quantidade, entradas };
}

test('crc32 confere com o valor conhecido de "123456789"', () => {
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
});

test('escreve um ZIP válido com nomes UTF-8 e conteúdo recuperável', () => {
  const zip = new ZipWriter();
  zip
    .adicionar('cliente_x/prompt_site.txt', 'Prompt com acentuação: estética, ação, coração')
    .adicionar('cliente_x/midias/foto.png', Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    .adicionar('cliente_x/branding/logo.svg', '<svg/>');

  const buffer = zip.finalizar();
  const { quantidade, entradas } = lerEstruturaZip(buffer);

  assert.equal(quantidade, 3);
  assert.deepEqual(entradas.map((e) => e.nome).sort(), [
    'cliente_x/branding/logo.svg',
    'cliente_x/midias/foto.png',
    'cliente_x/prompt_site.txt',
  ]);
  for (const entrada of entradas) {
    assert.equal(entrada.metodo, 0, 'deve usar método store (sem compressão)');
    const nomeLen = buffer.readUInt16LE(entrada.offsetLocal + 26);
    const inicio = entrada.offsetLocal + 30 + nomeLen;
    const conteudo = buffer.slice(inicio, inicio + entrada.tamanho);
    assert.equal(crc32(conteudo), entrada.crc, `CRC divergente em ${entrada.nome}`);
  }

  const texto = entradas.find((e) => e.nome.endsWith('prompt_site.txt'));
  const inicioTexto = texto.offsetLocal + 30 + buffer.readUInt16LE(texto.offsetLocal + 26);
  assert.equal(buffer.slice(inicioTexto, inicioTexto + texto.tamanho).toString('utf8'), 'Prompt com acentuação: estética, ação, coração');
});

test('aceita nomes longos e muitos arquivos', () => {
  const zip = new ZipWriter();
  const nomes = [];
  for (let i = 0; i < 120; i++) {
    const nome = `pasta/subpasta-com-nome-bem-comprido/arquivo-${String(i).padStart(3, '0')}-com-acentuação-ção.jpg`;
    nomes.push(nome);
    zip.adicionar(nome, Buffer.alloc(64, i));
  }
  const buffer = zip.finalizar();
  const { quantidade, entradas } = lerEstruturaZip(buffer);
  assert.equal(quantidade, 120);
  assert.deepEqual(entradas.map((e) => e.nome), nomes);
});
