'use strict';

/**
 * Persistência simples em arquivos JSON (sem banco de dados).
 *
 * Estrutura em disco:
 *   data/
 *     projetos.json              -> índice com todos os clientes
 *     clientes/<id>/             -> pasta de trabalho do cliente
 *        prompt_site.txt
 *        dados.json
 *        midias/  branding/  conteudo/
 *
 * Observação: dados de clientes ficam em data/ e não são versionados no Git.
 */

const fs = require('fs');
const path = require('path');
const { novoId, agora } = require('./utils');

const RAIZ = path.resolve(__dirname, '..', '..');
const DIR_DADOS = process.env.MAGIC_PROMPT_DATA
  ? path.resolve(process.env.MAGIC_PROMPT_DATA)
  : path.join(RAIZ, 'data');
const DIR_CLIENTES = path.join(DIR_DADOS, 'clientes');
const ARQ_INDICE = path.join(DIR_DADOS, 'projetos.json');

function garantirPastas() {
  fs.mkdirSync(DIR_CLIENTES, { recursive: true });
  if (!fs.existsSync(ARQ_INDICE)) fs.writeFileSync(ARQ_INDICE, '[]\n', 'utf8');
}

const CATEGORIAS = ['midias', 'branding', 'conteudo'];

/**
 * Arquivos que o próprio sistema gera dentro da pasta do cliente.
 * Ficam fora da listagem de uploads para não poluir o formulário nem o prompt,
 * e não são recopiados no .zip (já são escritos a partir do gerador).
 */
const ARQUIVOS_GERADOS = new Set([
  'prompt_site.txt',
  'prompt_resumo.txt',
  'LEIA-ME.txt',
  'dados.json',
  'conteudo/textos.md',
  'conteudo/depoimentos.md',
  'conteudo/faq.md',
  'conteudo/seo-palavras-chave.md',
  'conteudo/checklist-entrega.md',
  'branding/identidade-visual.md',
]);

function ehArquivoGerado(relativo) {
  return ARQUIVOS_GERADOS.has(String(relativo).split(path.sep).join('/'));
}

function lerIndice() {
  garantirPastas();
  try {
    const bruto = fs.readFileSync(ARQ_INDICE, 'utf8');
    const json = JSON.parse(bruto);
    return Array.isArray(json) ? json : [];
  } catch (erro) {
    // Índice corrompido: preserva o arquivo para inspeção e recomeça.
    if (fs.existsSync(ARQ_INDICE)) {
      fs.renameSync(ARQ_INDICE, `${ARQ_INDICE}.corrompido-${Date.now()}`);
    }
    fs.writeFileSync(ARQ_INDICE, '[]\n', 'utf8');
    return [];
  }
}

function gravarIndice(projetos) {
  garantirPastas();
  const temporario = `${ARQ_INDICE}.tmp`;
  fs.writeFileSync(temporario, `${JSON.stringify(projetos, null, 2)}\n`, 'utf8');
  fs.renameSync(temporario, ARQ_INDICE); // escrita atômica
}

function dirProjeto(id) {
  return path.join(DIR_CLIENTES, id);
}

/** Resolve um id "seguro": impede path traversal em parâmetros de URL. */
function validarId(id) {
  const limpo = String(id || '').trim();
  if (!/^[a-zA-Z0-9-]{6,64}$/.test(limpo)) return null;
  return limpo;
}

/* --------------------------- Projetos --------------------------- */

function listarProjetos() {
  return lerIndice()
    .slice()
    .sort((a, b) => String(b.atualizadoEm || '').localeCompare(String(a.atualizadoEm || '')));
}

function buscarProjeto(id) {
  const limpo = validarId(id);
  if (!limpo) return null;
  return lerIndice().find((p) => p.id === limpo) || null;
}

/** Projeto + dados completos salvos em disco. */
function carregarProjeto(id) {
  const resumo = buscarProjeto(id);
  if (!resumo) return null;
  const arquivo = path.join(dirProjeto(resumo.id), 'dados.json');
  let dados = null;
  try {
    dados = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch {
    dados = null;
  }
  return { ...resumo, dados };
}

function criarProjeto(dados) {
  const id = novoId();
  const criado = agora();
  const projeto = {
    id,
    nome: dados?.empresa?.nomeFantasia || dados?.contato?.nome || 'Novo projeto',
    segmento: dados?.segmento || '',
    nomePasta: dados?.pasta || '',
    criadoEm: criado,
    atualizadoEm: criado,
    versaoPrompt: 0,
  };
  const projetos = lerIndice();
  projetos.push(projeto);
  gravarIndice(projetos);
  salvarDados(id, { ...dados, id, criadoEm: criado, atualizadoEm: criado });
  return projeto;
}

function salvarDados(id, dados) {
  const limpo = validarId(id);
  if (!limpo) throw new Error('Identificador de projeto inválido.');
  const dir = dirProjeto(limpo);
  fs.mkdirSync(dir, { recursive: true });
  for (const categoria of CATEGORIAS) fs.mkdirSync(path.join(dir, categoria), { recursive: true });
  const dadosFinais = { ...dados, id: limpo, atualizadoEm: agora() };
  const temporario = path.join(dir, 'dados.json.tmp');
  fs.writeFileSync(temporario, `${JSON.stringify(dadosFinais, null, 2)}\n`, 'utf8');
  fs.renameSync(temporario, path.join(dir, 'dados.json'));
  return dadosFinais;
}

function atualizarResumo(id, campos, dados) {
  const limpo = validarId(id);
  const projetos = lerIndice();
  const indice = projetos.findIndex((p) => p.id === limpo);
  if (indice < 0) return null;
  projetos[indice] = { ...projetos[indice], ...campos, atualizadoEm: agora() };
  gravarIndice(projetos);
  if (dados) salvarDados(limpo, dados);
  return projetos[indice];
}

function excluirProjeto(id) {
  const limpo = validarId(id);
  const projetos = lerIndice();
  const restantes = projetos.filter((p) => p.id !== limpo);
  if (restantes.length === projetos.length) return false;
  gravarIndice(restantes);
  const dir = dirProjeto(limpo);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  return true;
}

/* ---------------------------- Arquivos ---------------------------- */

function dirCategoria(id, categoria) {
  if (!CATEGORIAS.includes(categoria)) throw new Error(`Categoria inválida: ${categoria}`);
  return path.join(dirProjeto(id), categoria);
}

function salvarArquivo(id, categoria, nome, buffer) {
  const dir = dirCategoria(id, categoria);
  fs.mkdirSync(dir, { recursive: true });
  let destino = path.join(dir, nome);
  let contador = 1;
  const ponto = nome.lastIndexOf('.');
  const raiz = ponto > 0 ? nome.slice(0, ponto) : nome;
  const ext = ponto > 0 ? nome.slice(ponto) : '';
  while (fs.existsSync(destino)) {
    destino = path.join(dir, `${raiz}-${contador}${ext}`);
    contador += 1;
  }
  fs.writeFileSync(destino, buffer);
  return path.basename(destino);
}

function listarArquivos(id) {
  const resultado = {};
  for (const categoria of CATEGORIAS) {
    const dir = dirCategoria(id, categoria);
    let arquivos = [];
    try {
      arquivos = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isFile() && !ehArquivoGerado(`${categoria}/${e.name}`))
        .map((e) => {
          const info = fs.statSync(path.join(dir, e.name));
          return {
            nome: e.name,
            bytes: info.size,
            modificadoEm: info.mtime.toISOString(),
            categoria,
            extensao: path.extname(e.name).replace('.', '').toLowerCase(),
          };
        })
        .sort((a, b) => a.nome.localeCompare(b.nome));
    } catch {
      arquivos = [];
    }
    resultado[categoria] = arquivos;
  }
  return resultado;
}

function caminhoArquivo(id, categoria, nome) {
  if (!validarId(id)) return null;
  const dir = dirCategoria(id, categoria);
  const destino = path.join(dir, path.basename(nome));
  if (!destino.startsWith(dir)) return null; // proteção contra path traversal
  return fs.existsSync(destino) ? destino : null;
}

function excluirArquivo(id, categoria, nome) {
  const destino = caminhoArquivo(id, categoria, nome);
  if (!destino) return false;
  fs.rmSync(destino, { force: true });
  return true;
}

/* ----------------------------- Prompt ----------------------------- */

function salvarPrompt(id, conteudo) {
  const dir = dirProjeto(id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'prompt_site.txt'), String(conteudo), 'utf8');
  return lerPrompt(id);
}

function lerPrompt(id) {
  const arquivo = path.join(dirProjeto(id), 'prompt_site.txt');
  if (!fs.existsSync(arquivo)) return null;
  return fs.readFileSync(arquivo, 'utf8');
}

/**
 * Grava um arquivo de texto dentro de uma categoria (conteudo/, branding/...).
 * Aceita subpastas — usado para os documentos de apoio gerados pelo sistema.
 */
function gravarTexto(id, categoria, caminhoRelativo, conteudo) {
  const raiz = dirCategoria(id, categoria);
  const destino = path.join(raiz, caminhoRelativo);
  if (!destino.startsWith(raiz)) return null;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, String(conteudo), 'utf8');
  return destino;
}

/** Grava um arquivo de texto na raiz da pasta do cliente (LEIA-ME, resumo…). */
function gravarRaiz(id, caminhoRelativo, conteudo) {
  const raiz = dirProjeto(id);
  const destino = path.join(raiz, path.basename(caminhoRelativo));
  if (!destino.startsWith(raiz)) return null;
  fs.mkdirSync(raiz, { recursive: true });
  fs.writeFileSync(destino, String(conteudo), 'utf8');
  return destino;
}

/** Percorre recursivamente a pasta do cliente devolvendo caminhos relativos. */
function listarTudoDoProjeto(id) {
  const raiz = dirProjeto(id);
  const itens = [];
  const percorrer = (dir) => {
    let entradas = [];
    try {
      entradas = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entrada of entradas) {
      const absoluto = path.join(dir, entrada.name);
      const relativo = path.relative(raiz, absoluto).split(path.sep).join('/');
      if (ehArquivoGerado(relativo)) continue;
      if (entrada.isDirectory()) {
        percorrer(absoluto);
      } else if (!entrada.name.endsWith('.tmp')) {
        itens.push({ relativo, absoluto, bytes: fs.statSync(absoluto).size });
      }
    }
  };
  if (fs.existsSync(raiz)) percorrer(raiz);
  return itens;
}

module.exports = {
  RAIZ,
  DIR_DADOS,
  DIR_CLIENTES,
  CATEGORIAS,
  garantirPastas,
  listarProjetos,
  buscarProjeto,
  carregarProjeto,
  criarProjeto,
  salvarDados,
  atualizarResumo,
  excluirProjeto,
  salvarArquivo,
  listarArquivos,
  caminhoArquivo,
  excluirArquivo,
  salvarPrompt,
  lerPrompt,
  gravarTexto,
  gravarRaiz,
  ehArquivoGerado,
  ARQUIVOS_GERADOS,
  listarTudoDoProjeto,
  validarId,
};
