'use strict';

/**
 * Parser mínimo de `multipart/form-data` (RFC 7578), sem dependências.
 *
 * Estratégia: acumula o corpo da requisição em memória (com limite configurável)
 * e localiza as partes pelos delimitadores do boundary. Suficiente para o
 * upload de imagens, vídeos e documentos deste sistema.
 *
 * Limite padrão: 200 MB por arquivo e 500 MB por requisição (ajustável pelas
 * variáveis MAGIC_PROMPT_MAX_ARQUIVO e MAGIC_PROMPT_MAX_UPLOAD).
 */

const LIMITE_ARQUIVO = Number(process.env.MAGIC_PROMPT_MAX_ARQUIVO) || 200 * 1024 * 1024;
const LIMITE_UPLOAD = Number(process.env.MAGIC_PROMPT_MAX_UPLOAD) || 500 * 1024 * 1024;

/** Lê o corpo da requisição respeitando o limite. */
function lerCorpo(req, limite = LIMITE_UPLOAD) {
  return new Promise((resolve, reject) => {
    const pedacos = [];
    let total = 0;
    req.on('data', (pedaco) => {
      total += pedaco.length;
      if (total > limite) {
        reject(Object.assign(new Error('Arquivo(s) acima do limite permitido.'), { codigo: 'LIMITE_EXCEDIDO' }));
        req.destroy();
        return;
      }
      pedacos.push(pedaco);
    });
    req.on('end', () => resolve(Buffer.concat(pedacos)));
    req.on('error', reject);
  });
}

function extrairBoundary(contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  return m ? (m[1] || m[2] || '').trim() : null;
}

function parseCabecalhoParte(cabecalho) {
  const linhas = cabecalho.split('\r\n');
  const info = { nome: '', nomeArquivo: '', tipo: 'application/octet-stream' };
  for (const linha of linhas) {
    const disp = /^content-disposition:\s*form-data;\s*(.+)$/i.exec(linha);
    if (disp) {
      const nome = /name="([^"]*)"/i.exec(disp[1]);
      const arquivo = /filename="([^"]*)"/i.exec(disp[1]);
      if (nome) info.nome = nome[1];
      if (arquivo) info.nomeArquivo = arquivo[1];
    }
    const tipo = /^content-type:\s*(.+)$/i.exec(linha);
    if (tipo) info.tipo = tipo[1].trim();
  }
  return info;
}

/**
 * @returns {{campos: Object<string,string>, arquivos: Array<{campo,nomeArquivo,tipo,dados,tamanho}>}}
 */
function parseMultipart(buffer, boundary) {
  const campos = {};
  const arquivos = [];
  if (!boundary) return { campos, arquivos };

  const delimitador = Buffer.from(`--${boundary}`);
  let posicao = buffer.indexOf(delimitador);

  while (posicao !== -1) {
    let inicio = posicao + delimitador.length;

    // "--" significa fim do corpo multipart.
    if (buffer.slice(inicio, inicio + 2).toString() === '--') break;

    // pula o CRLF que segue o boundary
    inicio += 2;
    const proximo = buffer.indexOf(delimitador, inicio);
    if (proximo === -1) break;

    // remove o CRLF anterior ao próximo delimitador
    const fim = buffer.slice(proximo - 2, proximo).toString() === '\r\n' ? proximo - 2 : proximo;
    const parte = buffer.slice(inicio, fim);

    const separadorCabecalho = parte.indexOf('\r\n\r\n');
    if (separadorCabecalho !== -1) {
      const cabecalho = parte.slice(0, separadorCabecalho).toString('utf8');
      const dados = parte.slice(separadorCabecalho + 4);
      const info = parseCabecalhoParte(cabecalho);

      if (info.nomeArquivo) {
        if (dados.length > LIMITE_ARQUIVO) {
          const erro = new Error(`O arquivo "${info.nomeArquivo}" excede o limite de ${Math.round(LIMITE_ARQUIVO / 1024 / 1024)} MB.`);
          erro.codigo = 'LIMITE_EXCEDIDO';
          throw erro;
        }
        arquivos.push({
          campo: info.nome,
          nomeArquivo: info.nomeArquivo,
          tipo: info.tipo,
          dados,
          tamanho: dados.length,
        });
      } else if (info.nome) {
        campos[info.nome] = dados.toString('utf8');
      }
    }

    posicao = proximo;
  }

  return { campos, arquivos };
}

async function processarRequisicao(req, limite = LIMITE_UPLOAD) {
  const boundary = extrairBoundary(req.headers['content-type']);
  if (!boundary) {
    const erro = new Error('Envie os arquivos como multipart/form-data.');
    erro.codigo = 'FORMATO_INVALIDO';
    throw erro;
  }
  const corpo = await lerCorpo(req, limite);
  return parseMultipart(corpo, boundary);
}

module.exports = { processarRequisicao, lerCorpo, parseMultipart, extrairBoundary, LIMITE_ARQUIVO, LIMITE_UPLOAD };
