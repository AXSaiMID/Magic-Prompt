/* =====================================================================
   Buffer mínimo para navegador
   ---------------------------------------------------------------------
   O escritor de ZIP (server/lib/zip.js) foi escrito para Node e usa a API
   Buffer. Esta é uma implementação mínima sobre Uint8Array com exatamente
   os métodos usados pelo gerador, para que o mesmo código rode no navegador
   sem alterações — garantindo que o .zip baixado pela página seja idêntico
   ao gerado pelo servidor.
   ===================================================================== */
(function (global) {
  'use strict';

  const codificador = new TextEncoder();
  const decodificador = new TextDecoder('utf-8');

  class BufferShim extends Uint8Array {
    static alloc(tamanho, preenchimento) {
      const buffer = new BufferShim(tamanho);
      if (preenchimento !== undefined) buffer.fill(preenchimento);
      return buffer;
    }

    static from(entrada, codificacao) {
      if (typeof entrada === 'string') {
        const bytes = codificador.encode(entrada);
        const buffer = new BufferShim(bytes.length);
        buffer.set(bytes);
        return buffer;
      }
      if (entrada instanceof ArrayBuffer) {
        const buffer = new BufferShim(entrada.byteLength);
        buffer.set(new Uint8Array(entrada));
        return buffer;
      }
      if (ArrayBuffer.isView(entrada)) {
        const buffer = new BufferShim(entrada.byteLength);
        buffer.set(new Uint8Array(entrada.buffer, entrada.byteOffset, entrada.byteLength));
        return buffer;
      }
      if (Array.isArray(entrada)) {
        const buffer = new BufferShim(entrada.length);
        buffer.set(entrada);
        return buffer;
      }
      if (entrada && typeof entrada.length === 'number') {
        const buffer = new BufferShim(entrada.length);
        for (let i = 0; i < entrada.length; i++) buffer[i] = entrada[i] & 0xff;
        return buffer;
      }
      throw new TypeError('Buffer.from: tipo de entrada não suportado' + (codificacao ? ` (${codificacao})` : ''));
    }

    static isBuffer(valor) {
      return valor instanceof BufferShim;
    }

    static concat(lista) {
      const total = lista.reduce((soma, item) => soma + item.length, 0);
      const saida = new BufferShim(total);
      let deslocamento = 0;
      for (const item of lista) {
        saida.set(item, deslocamento);
        deslocamento += item.length;
      }
      return saida;
    }

    get _visao() {
      return new DataView(this.buffer, this.byteOffset, this.byteLength);
    }

    writeUInt32LE(valor, deslocamento) {
      this._visao.setUint32(deslocamento, valor >>> 0, true);
      return deslocamento + 4;
    }

    writeUInt16LE(valor, deslocamento) {
      this._visao.setUint16(deslocamento, valor & 0xffff, true);
      return deslocamento + 2;
    }

    readUInt32LE(deslocamento) {
      return this._visao.getUint32(deslocamento, true);
    }

    readUInt16LE(deslocamento) {
      return this._visao.getUint16(deslocamento, true);
    }

    indexOf(alvo, inicio = 0) {
      const busca = typeof alvo === 'number' ? BufferShim.from([alvo]) : alvo;
      if (!busca.length) return -1;
      for (let i = inicio; i <= this.length - busca.length; i++) {
        let igual = true;
        for (let j = 0; j < busca.length; j++) {
          if (this[i + j] !== busca[j]) { igual = false; break; }
        }
        if (igual) return i;
      }
      return -1;
    }

    slice(inicio = 0, fim = this.length) {
      const de = inicio < 0 ? Math.max(this.length + inicio, 0) : Math.min(inicio, this.length);
      const ate = fim < 0 ? Math.max(this.length + fim, 0) : Math.min(fim, this.length);
      const copia = new BufferShim(Math.max(ate - de, 0));
      copia.set(this.subarray(de, ate));
      return copia;
    }

    toString() {
      return decodificador.decode(this);
    }

    toArrayBuffer() {
      return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength);
    }
  }

  global.BufferShim = BufferShim;
  // Só define global.Buffer se o ambiente não fornecer um (Node tem o nativo).
  if (!global.Buffer) global.Buffer = BufferShim;
})(typeof globalThis !== 'undefined' ? globalThis : window);
