'use strict';

/**
 * Escritor de ZIP minimalista, sem dependências externas.
 * Usa o método "store" (sem compressão) — suficiente para empacotar prompt +
 * mídias + branding + conteúdo, e evita depender de bibliotecas de compressão.
 *
 * Referência: PKWARE APPNOTE 6.3.x (formato ZIP clássico, sem Zip64 —
 * limite de ~4 GB por arquivo e por pacote, muito acima do uso previsto).
 */

const CRC_TABELA = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i++) c = CRC_TABELA[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/** Converte Date para o formato MS-DOS usado no cabeçalho do ZIP. */
function dataDos(date = new Date()) {
  const hora = (date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f);
  const data = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { hora, data };
}

class ZipWriter {
  constructor() {
    this.partes = [];
    this.central = [];
    this.deslocamento = 0;
    this.quantidade = 0;
  }

  /**
   * @param {string} caminho  caminho dentro do zip, ex.: "cliente_x/midias/foto.jpg"
   * @param {Buffer|string} conteudo
   */
  adicionar(caminho, conteudo) {
    const dados = Buffer.isBuffer(conteudo) ? conteudo : Buffer.from(String(conteudo), 'utf8');
    const nome = Buffer.from(String(caminho).replace(/\\/g, '/'), 'utf8');
    const crc = crc32(dados);
    const { hora, data } = dataDos();

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // assinatura local file header
    local.writeUInt16LE(20, 4); // versão necessária
    local.writeUInt16LE(0x0800, 6); // flag: nomes em UTF-8
    local.writeUInt16LE(0, 8); // método: store
    local.writeUInt16LE(hora, 10);
    local.writeUInt16LE(data, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(dados.length, 18); // comprimido
    local.writeUInt32LE(dados.length, 22); // original
    local.writeUInt16LE(nome.length, 26);
    local.writeUInt16LE(0, 28); // extra

    this.partes.push(local, nome, dados);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // central directory header
    central.writeUInt16LE(20, 4); // versão do criador
    central.writeUInt16LE(20, 6); // versão necessária
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(hora, 12);
    central.writeUInt16LE(data, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(dados.length, 20);
    central.writeUInt32LE(dados.length, 24);
    central.writeUInt16LE(nome.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comentário
    central.writeUInt16LE(0, 34); // disco
    central.writeUInt16LE(0, 36); // atributos internos
    central.writeUInt32LE(0, 38); // atributos externos
    central.writeUInt32LE(this.deslocamento, 42);

    this.central.push(central, nome);

    this.deslocamento += local.length + nome.length + dados.length;
    this.quantidade += 1;
    return this;
  }

  finalizar() {
    const tamanhoCentral = this.central.reduce((soma, b) => soma + b.length, 0);
    const fim = Buffer.alloc(22);
    fim.writeUInt32LE(0x06054b50, 0); // end of central directory
    fim.writeUInt16LE(0, 4);
    fim.writeUInt16LE(0, 6);
    fim.writeUInt16LE(this.quantidade, 8);
    fim.writeUInt16LE(this.quantidade, 10);
    fim.writeUInt32LE(tamanhoCentral, 12);
    fim.writeUInt32LE(this.deslocamento, 16);
    fim.writeUInt16LE(0, 20); // sem comentário
    return Buffer.concat([...this.partes, ...this.central, fim]);
  }
}

module.exports = { ZipWriter, crc32 };
