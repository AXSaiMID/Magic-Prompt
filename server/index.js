'use strict';

/**
 * MAGIC PROMPT — servidor do sistema
 * ----------------------------------
 * API + interface web (arquivos estáticos em /public), sem dependências externas.
 *
 * Rotas principais:
 *   GET    /api/health
 *   GET    /api/segmentos                     modelos pré-definidos por segmento
 *   GET    /api/segmentos/:id/sugestoes       sugestões de preenchimento
 *   POST   /api/prompt/preview                gera o prompt sem salvar
 *   POST   /api/prompt/resumo                 gera a versão curta
 *   GET    /api/projetos                      histórico de clientes
 *   POST   /api/projetos                      cria projeto e gera o prompt
 *   GET    /api/projetos/:id                  projeto completo
 *   PUT    /api/projetos/:id                  atualiza dados e regenera
 *   DELETE /api/projetos/:id
 *   POST   /api/projetos/:id/duplicar         reutiliza estrutura para novo cliente
 *   PUT    /api/projetos/:id/prompt           salva prompt editado manualmente
 *   GET    /api/projetos/:id/arquivos         lista arquivos enviados
 *   POST   /api/projetos/:id/arquivos         upload (multipart, ?categoria=midias|branding|conteudo)
 *   GET    /api/projetos/:id/arquivos/raw     entrega o arquivo (pré-visualização)
 *   DELETE /api/projetos/:id/arquivos
 *   GET    /api/projetos/:id/download         ZIP com a pasta completa do cliente
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const store = require('./lib/store');
const { listarModelos, getModelo, sugestoesDoModelo, OBJETIVOS, ESTILOS_DESEJADOS, IDIOMAS, MODELOS } = require('./lib/segmentos');
const { gerarPrompt, gerarPromptResumo, validarDados, VERSAO } = require('./lib/prompt-engine');
const { gerarArquivosDeApoio, resumoPasta } = require('./lib/pacote');
const { ZipWriter } = require('./lib/zip');
const multipart = require('./lib/multipart');
const utils = require('./lib/utils');

const PORTA = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DIR_PUBLICO = path.join(__dirname, '..', 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/* ----------------------------- utilidades ----------------------------- */

function responderJson(res, status, dados) {
  const corpo = JSON.stringify(dados);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(corpo),
    'Cache-Control': 'no-store',
  });
  res.end(corpo);
}

function responderErro(res, status, mensagem, extra = {}) {
  responderJson(res, status, { erro: mensagem, ...extra });
}

async function lerJson(req) {
  const bruto = await multipart.lerCorpo(req, 5 * 1024 * 1024);
  if (!bruto.length) return {};
  try {
    return JSON.parse(bruto.toString('utf8'));
  } catch {
    const erro = new Error('JSON inválido no corpo da requisição.');
    erro.codigo = 'JSON_INVALIDO';
    throw erro;
  }
}

/* --------------------------- lógica de negócio --------------------------- */

/** Junta os dados do formulário com o nome da pasta e devolve tudo normalizado. */
function prepararEntrada(dados = {}) {
  const empresa = dados.empresa || {};
  const contato = utils.texto(dados.nomeContato || empresa.responsavel || '');
  const pasta = utils.texto(dados.pasta) || utils.pastaDoCliente(contato, empresa.nomeFantasia);
  return { ...dados, nomeContato: contato, pasta };
}

function gerarParaProjeto(id, dados) {
  const entrada = prepararEntrada(dados);
  const arquivos = store.listarArquivos(id);
  const resultado = gerarPrompt(entrada, arquivos);

  store.salvarPrompt(id, resultado.texto);

  // Arquivos de apoio (conteudo/, branding/) regravados a cada geração.
  const apoio = gerarArquivosDeApoio(entrada, arquivos, resultado.meta);
  for (const [caminho, conteudo] of Object.entries(apoio)) {
    if (caminho.includes('/')) {
      const [categoria, ...resto] = caminho.split('/');
      store.gravarTexto(id, categoria, resto.join('/'), conteudo);
    } else {
      store.gravarRaiz(id, caminho, conteudo);
    }
  }

  const dadosFinais = {
    ...entrada,
    meta: resultado.meta,
    promptEditadoManualmente: false,
  };
  store.atualizarResumo(
    id,
    {
      nome: entrada.empresa?.nomeFantasia || entrada.nomeContato || 'Projeto sem nome',
      segmento: entrada.segmento,
      nomePasta: entrada.pasta,
      versaoPrompt: (store.buscarProjeto(id)?.versaoPrompt || 0) + 1,
      resumo: {
        objetivo: resultado.meta.objetivoNome,
        ecommerce: resultado.meta.ecommerce,
        paginas: resultado.meta.paginas.length,
        caracteres: resultado.meta.caracteres,
        faltando: resultado.meta.faltando.length,
      },
    },
    dadosFinais
  );

  return { resultado, entrada };
}

/** Monta o ZIP com a pasta completa do cliente. */
function montarZip(id) {
  const projeto = store.carregarProjeto(id);
  if (!projeto) return null;
  const dados = projeto.dados || {};
  const pasta = dados.pasta || projeto.nomePasta || utils.slug(projeto.nome);
  const zip = new ZipWriter();

  // 1) prompt gerado (versão em disco, que pode ter sido editada manualmente)
  const prompt = store.lerPrompt(id) || '';
  zip.adicionar(`${pasta}/prompt_site.txt`, prompt);

  // 2) prompt resumo + arquivos de apoio (textos, FAQ, SEO, checklist, identidade)
  const arquivos = store.listarArquivos(id);
  const meta = dados.meta || projeto.meta;
  if (meta) {
    const apoio = gerarArquivosDeApoio(dados, arquivos, meta);
    for (const [caminho, conteudo] of Object.entries(apoio)) {
      zip.adicionar(`${pasta}/${caminho}`, conteudo);
    }
  }

  // 3) dados do cliente (permite reimportar no sistema)
  zip.adicionar(`${pasta}/dados-cliente.json`, `${JSON.stringify(dados, null, 2)}\n`);

  // 4) arquivos enviados (midias/, branding/, conteudo/)
  for (const item of store.listarTudoDoProjeto(id)) {
    if (store.ehArquivoGerado(item.relativo) || item.relativo.endsWith('.tmp')) continue;
    try {
      zip.adicionar(`${pasta}/${item.relativo}`, fs.readFileSync(item.absoluto));
    } catch {
      /* arquivo removido durante a leitura: ignora */
    }
  }

  return { buffer: zip.finalizar(), nome: `${pasta}.zip` };
}

/* ------------------------------ roteamento ------------------------------ */

async function tratarApi(req, res, url) {
  const metodo = req.method.toUpperCase();
  const partes = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const [recurso, id, acao] = partes;
  const subAcao = partes[3] || '';

  /* --------- health --------- */
  if (recurso === 'health' && metodo === 'GET') {
    return responderJson(res, 200, {
      ok: true,
      versao: VERSAO,
      segmentos: MODELOS.length,
      projetos: store.listarProjetos().length,
      dados: store.DIR_DADOS,
      limiteArquivoMB: Math.round(multipart.LIMITE_ARQUIVO / 1024 / 1024),
    });
  }

  /* --------- segmentos --------- */
  if (recurso === 'segmentos' && metodo === 'GET') {
    if (!id) {
      return responderJson(res, 200, {
        modelos: listarModelos(),
        objetivos: OBJETIVOS,
        estilos: ESTILOS_DESEJADOS,
        idiomas: IDIOMAS,
      });
    }
    const modelo = getModelo(id);
    if (!modelo) return responderErro(res, 404, 'Segmento não encontrado.');
    if (acao === 'sugestoes') return responderJson(res, 200, sugestoesDoModelo(id));
    return responderJson(res, 200, modelo);
  }

  /* --------- geração sem salvar (pré-visualização do formulário) --------- */
  if (recurso === 'prompt' && metodo === 'POST') {
    const corpo = await lerJson(req);
    const entrada = prepararEntrada(corpo.dados || corpo);
    const validacao = validarDados(entrada, {});
    if (!validacao.ok && !corpo.forcar) {
      return responderErro(res, 422, 'Preencha os campos obrigatórios antes de gerar o prompt.', { erros: validacao.erros });
    }
    if (acao === 'resumo') {
      return responderJson(res, 200, { prompt: gerarPromptResumo(entrada, {}) });
    }
    const { texto, meta } = gerarPrompt(entrada, {});
    return responderJson(res, 200, { prompt: texto, meta });
  }

  /* --------- histórico de projetos --------- */
  if (recurso === 'projetos') {
    if (metodo === 'GET' && !id) {
      const projetos = store.listarProjetos().map((p) => ({
        ...p,
        pasta: p.nomePasta,
      }));
      return responderJson(res, 200, {
        projetos,
        modelos: listarModelos(),
        total: projetos.length,
      });
    }

    if (metodo === 'POST' && !id) {
      const corpo = await lerJson(req);
      const entrada = prepararEntrada(corpo.dados || corpo);
      const validacao = validarDados(entrada, {});
      if (!validacao.ok && !corpo.forcar) {
        return responderErro(res, 422, 'Preencha os campos obrigatórios antes de gerar o prompt.', { erros: validacao.erros });
      }
      const projeto = store.criarProjeto(entrada);
      const { resultado } = gerarParaProjeto(projeto.id, entrada);
      return responderJson(res, 201, {
        projeto: store.buscarProjeto(projeto.id),
        prompt: resultado.texto,
        meta: resultado.meta,
      });
    }

    if (id) {
      const projeto = store.carregarProjeto(id);
      if (!projeto) return responderErro(res, 404, 'Projeto não encontrado.');

      if (metodo === 'GET' && !acao) {
        return responderJson(res, 200, {
          projeto,
          prompt: store.lerPrompt(id) || '',
          arquivos: store.listarArquivos(id),
          arvore: resumoPasta(projeto.meta || { pasta: projeto.nomePasta || id }),
        });
      }

      if (metodo === 'PUT' && !acao) {
        const corpo = await lerJson(req);
        const entrada = prepararEntrada({ ...(projeto.dados || {}), ...(corpo.dados || corpo) });
        if (corpo.somenteSalvar) {
          // Salvamento automático do formulário: grava os dados sem regerar o
          // prompt (a regeneração é explícita, pelo botão "Gerar prompt").
          store.salvarDados(id, entrada);
          store.atualizarResumo(id, {
            nome: entrada.empresa?.nomeFantasia || entrada.nomeContato || 'Projeto sem nome',
            segmento: entrada.segmento,
            nomePasta: entrada.pasta,
          });
          return responderJson(res, 200, { ok: true, salvoEm: new Date().toISOString() });
        }
        if (corpo.somentePrompt) {
          // Salva edição manual do prompt, sem regerar nada.
          store.salvarPrompt(id, utils.texto(corpo.prompt));
          store.atualizarResumo(id, { promptEditadoManualmente: true }, { ...(projeto.dados || {}), promptEditadoManualmente: true });
          return responderJson(res, 200, { ok: true, prompt: store.lerPrompt(id) });
        }
        const { resultado } = gerarParaProjeto(id, entrada);
        return responderJson(res, 200, {
          projeto: store.buscarProjeto(id),
          prompt: resultado.texto,
          meta: resultado.meta,
        });
      }

      if (metodo === 'DELETE' && !acao) {
        store.excluirProjeto(id);
        return responderJson(res, 200, { ok: true });
      }

      if (metodo === 'POST' && acao === 'duplicar') {
        const corpo = await lerJson(req);
        const base = projeto.dados || {};
        const novoNomeContato = utils.texto(corpo.nomeContato);
        const novoNomeEmpresa = utils.texto(corpo.nomeFantasia);
        const entrada = prepararEntrada({
          ...base,
          nomeContato: novoNomeContato || base.nomeContato,
          pasta: '',
          empresa: { ...(base.empresa || {}), nomeFantasia: novoNomeEmpresa || `${base.empresa?.nomeFantasia || 'Cliente'} (cópia)` },
          meta: undefined,
        });
        const novo = store.criarProjeto(entrada);
        const { resultado } = gerarParaProjeto(novo.id, entrada);
        return responderJson(res, 201, {
          projeto: store.buscarProjeto(novo.id),
          prompt: resultado.texto,
          meta: resultado.meta,
        });
      }

      if (metodo === 'PUT' && acao === 'prompt') {
        const corpo = await lerJson(req);
        if (!utils.temTexto(corpo.prompt)) return responderErro(res, 400, 'Nenhum conteúdo de prompt enviado.');
        store.salvarPrompt(id, corpo.prompt);
        store.atualizarResumo(id, { promptEditadoManualmente: true }, { ...(projeto.dados || {}), promptEditadoManualmente: true });
        return responderJson(res, 200, { ok: true, prompt: store.lerPrompt(id) });
      }

      if (acao === 'arquivos') {
        // Aceita tanto /arquivos/raw quanto /arquivos?raw=1
        const querBruto = subAcao === 'raw' || Boolean(url.searchParams.get('raw'));

        if (metodo === 'GET' && !querBruto) {
          return responderJson(res, 200, { arquivos: store.listarArquivos(id), meta: projeto.meta || null });
        }

        if (metodo === 'GET' && querBruto) {
          const categoria = url.searchParams.get('categoria') || 'midias';
          const nome = url.searchParams.get('nome') || '';
          const destino = store.caminhoArquivo(id, categoria, nome);
          if (!destino) return responderErro(res, 404, 'Arquivo não encontrado.');
          const ext = path.extname(destino).toLowerCase();
          const info = fs.statSync(destino);
          res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Content-Length': info.size,
            'Content-Disposition': `inline; filename="${encodeURIComponent(path.basename(destino))}"`,
            'Cache-Control': 'private, max-age=60',
          });
          return fs.createReadStream(destino).pipe(res);
        }

        if (metodo === 'POST') {
          const categoria = url.searchParams.get('categoria') || 'midias';
          if (!store.CATEGORIAS.includes(categoria)) return responderErro(res, 400, 'Categoria de arquivo inválida.');
          const { arquivos } = await multipart.processarRequisicao(req);
          if (!arquivos.length) return responderErro(res, 400, 'Nenhum arquivo recebido.');

          const salvos = [];
          for (const arquivo of arquivos) {
            const nome = utils.nomeArquivoSeguro(arquivo.nomeArquivo);
            salvos.push({
              categoria,
              nome: store.salvarArquivo(id, categoria, nome, arquivo.dados),
              tamanho: arquivo.tamanho,
            });
          }

          // Regenera o prompt para citar os novos arquivos.
          let resultado = null;
          if (projeto.dados) {
            resultado = gerarParaProjeto(id, projeto.dados).resultado;
          }
          return responderJson(res, 201, {
            ok: true,
            salvos,
            arquivos: store.listarArquivos(id),
            prompt: resultado?.texto || store.lerPrompt(id) || '',
            meta: resultado?.meta || projeto.meta || null,
          });
        }

        if (metodo === 'DELETE') {
          const categoria = url.searchParams.get('categoria') || 'midias';
          const nome = url.searchParams.get('nome') || '';
          const removido = store.excluirArquivo(id, categoria, nome);
          if (!removido) return responderErro(res, 404, 'Arquivo não encontrado.');
          let resultado = null;
          if (projeto.dados) resultado = gerarParaProjeto(id, projeto.dados).resultado;
          return responderJson(res, 200, {
            ok: true,
            arquivos: store.listarArquivos(id),
            prompt: resultado?.texto || store.lerPrompt(id) || '',
            meta: resultado?.meta || projeto.meta || null,
          });
        }
      }

      if (metodo === 'GET' && acao === 'download') {
        const pacote = montarZip(id);
        if (!pacote) return responderErro(res, 404, 'Projeto não encontrado.');
        res.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-Length': pacote.buffer.length,
          'Content-Disposition': `attachment; filename="${pacote.nome}"; filename*=UTF-8''${encodeURIComponent(pacote.nome)}`,
        });
        return res.end(pacote.buffer);
      }

      if (metodo === 'GET' && acao === 'pasta') {
        return responderJson(res, 200, {
          pasta: projeto.nomePasta || projeto.dados?.pasta || id,
          arvore: resumoPasta(projeto.meta || {}),
          arquivos: store.listarArquivos(id),
        });
      }
    }
  }

  return responderErro(res, 404, 'Rota não encontrada.');
}

/* --------------------------- arquivos estáticos --------------------------- */

function servirEstatico(req, res, url) {
  let relativo = decodeURIComponent(url.pathname);
  if (relativo === '/' || relativo === '') relativo = '/index.html';
  const destino = path.join(DIR_PUBLICO, path.normalize(relativo));
  if (!destino.startsWith(DIR_PUBLICO)) return responderErro(res, 403, 'Acesso negado.');

  fs.readFile(destino, (erro, conteudo) => {
    if (erro) {
      // SPA simples: qualquer rota desconhecida devolve o index.
      return fs.readFile(path.join(DIR_PUBLICO, 'index.html'), (erro2, html) => {
        if (erro2) return responderErro(res, 404, 'Arquivo não encontrado.');
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(html);
      });
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(destino).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(conteudo);
  });
}

/* ------------------------------- servidor ------------------------------- */

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Sem cabeçalhos restritivos de origem: o app roda atrás do proxy de preview.
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
    });
    return res.end();
  }

  try {
    if (url.pathname.startsWith('/api')) return await tratarApi(req, res, url);
    return servirEstatico(req, res, url);
  } catch (erro) {
    const status = erro.codigo === 'LIMITE_EXCEDIDO' ? 413 : erro.codigo === 'JSON_INVALIDO' ? 400 : 500;
    if (status === 500) console.error('[magic-prompt] erro:', erro);
    if (!res.headersSent) responderErro(res, status, erro.message || 'Erro interno do servidor.');
  }
});

store.garantirPastas();

if (require.main === module) {
  servidor.listen(PORTA, HOST, () => {
    console.log(`\n  ✨ Magic Prompt — gerador de prompts para sites`);
    console.log(`  Servidor em http://${HOST}:${PORTA}`);
    console.log(`  Dados em ${store.DIR_DADOS}`);
    console.log(`  Segmentos disponíveis: ${MODELOS.map((m) => m.nome).join(' | ')}\n`);
  });
}

module.exports = { servidor, montarZip, gerarParaProjeto, prepararEntrada };
