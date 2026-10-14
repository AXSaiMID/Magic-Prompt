/* =====================================================================
   Magic Prompt — versão estática (GitHub Pages)
   ---------------------------------------------------------------------
   Roda 100% no navegador: gera o prompt e monta o .zip localmente, sem
   servidor. Usa o mesmo motor do modo servidor (docs/motor.js).
   O histórico fica no localStorage; os arquivos enviados ficam apenas na
   memória da página (saem no .zip baixado).
   ===================================================================== */
'use strict';

const CHAVE_HISTORICO = 'magic-prompt:projetos';
const CHAVE_AVISO = 'magic-prompt:aviso-fechado';

/**
 * Acesso tolerante ao localStorage: em alguns contextos (arquivo aberto via
 * file://, modo privado com armazenamento bloqueado, iframe restrito) o
 * navegador lança SecurityError. Nesses casos o sistema continua funcionando
 * em memória, apenas sem manter o histórico entre recarregamentos.
 */
const armazenamento = (() => {
  try {
    const teste = '__magic_prompt_teste__';
    window.localStorage.setItem(teste, '1');
    window.localStorage.removeItem(teste);
    return {
      disponivel: true,
      ler: (chave) => window.localStorage.getItem(chave),
      gravar: (chave, valor) => window.localStorage.setItem(chave, valor),
      remover: (chave) => window.localStorage.removeItem(chave),
    };
  } catch {
    const memoria = new Map();
    return {
      disponivel: false,
      ler: (chave) => (memoria.has(chave) ? memoria.get(chave) : null),
      gravar: (chave, valor) => memoria.set(chave, valor),
      remover: (chave) => memoria.delete(chave),
    };
  }
})();

const estado = {
  modelos: [],
  objetivos: [],
  estilos: [],
  idiomas: [],
  projetos: [],
  projeto: null,
  dados: null,
  prompt: '',
  meta: null,
  arquivos: { midias: [], branding: [], conteudo: [] }, // em memória, por sessão
  aba: 'segmento',
  busca: '',
  timerSalvar: null,
};

const ABAS = [
  { id: 'segmento', rotulo: 'Segmento e objetivo', num: 1 },
  { id: 'empresa', rotulo: 'Empresa', num: 2 },
  { id: 'negocio', rotulo: 'Negócio e público', num: 3 },
  { id: 'redes', rotulo: 'Redes e links', num: 4 },
  { id: 'visual', rotulo: 'Identidade visual', num: 5 },
  { id: 'conteudo', rotulo: 'Conteúdo', num: 6 },
  { id: 'arquivos', rotulo: 'Imagens e vídeos', num: 7 },
];

const $ = (sel, escopo = document) => escopo.querySelector(sel);
const $$ = (sel, escopo = document) => Array.from(escopo.querySelectorAll(sel));

/* ------------------------------ utilidades ------------------------------ */

function toast(mensagem, tipo = '') {
  const el = $('#toast');
  el.textContent = mensagem;
  el.className = `toast ${tipo}`;
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.hidden = true; }, 3600);
}

function escapar(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* --------------------- segmentos: agrupamento e busca --------------------- */

/** Compara ignorando acentos e caixa (quem digita "imobiliaria" acha "Imobiliária"). */
function normalizarBusca(valor) {
  return String(valor == null ? '' : valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Agrupa os modelos por área de atuação, preservando a ordem de cadastro. */
function agruparPorArea(modelos) {
  const grupos = [];
  for (const modelo of modelos) {
    const area = modelo.area || 'Outros';
    let grupo = grupos.find((g) => g.area === area);
    if (!grupo) {
      grupo = { area, modelos: [] };
      grupos.push(grupo);
    }
    grupo.modelos.push(modelo);
  }
  return grupos;
}

/**
 * Cartões de segmento agrupados por área, prontos para a busca.
 * tipo: 'escolha' (modal de novo projeto) | 'selecao' (formulário) | 'catalogo' (informativo)
 */
function blocosDeSegmento(tipo, selecionado) {
  return agruparPorArea(estado.modelos)
    .map(
      (grupo) => `
      <section class="grupo-segmento" data-grupo-segmento>
        <h4><span>${escapar(grupo.area)}</span><em>${grupo.modelos.length}</em></h4>
        <div class="cartoes-segmento">
          ${grupo.modelos
            .map((m) => {
              const alvo = normalizarBusca(m.nome + ' ' + m.area + ' ' + m.resumo + ' ' + (m.termoBusca || ''));
              const tags =
                tipo === 'catalogo'
                  ? `${m.paginasObrigatorias.map((p) => `<span class="tag">${escapar(p)}</span>`).join('')}${
                      m.suportaEcommerce ? '<span class="tag roxa">e-commerce opcional</span>' : ''
                    }`
                  : `<span class="tag">${m.totalPaginas} páginas</span>${
                      m.temAgendamento ? '<span class="tag verde">agendamento</span>' : ''
                    }${m.suportaEcommerce ? '<span class="tag roxa">loja opcional</span>' : ''}`;
              const atributos =
                tipo === 'escolha' ? ` data-escolha="${m.id}"` : tipo === 'selecao' ? ` data-modelo="${m.id}"` : '';
              const marcado = selecionado === m.id ? ' selecionado' : '';
              const tag = tipo === 'catalogo' ? 'div' : 'button';
              const cursor = tipo === 'catalogo' ? ' style="cursor:default"' : '';
              return `<${tag} class="cartao-segmento${marcado}"${atributos}${cursor} data-busca="${escapar(alvo)}">
                <span class="emoji">${m.emoji}</span>
                <strong>${escapar(m.nome)}</strong>
                <p>${escapar(m.resumo)}</p>
                <div class="tags">${tags}</div>
              </${tag}>`;
            })
            .join('')}
        </div>
      </section>`
    )
    .join('');
}

/** Campo de busca dos cartões de segmento (um por contexto, para não colidir ids). */
function campoBuscaSegmento(idCampo, idContagem, placeholder) {
  return `<div class="busca-segmento">
    <input type="search" id="${idCampo}" autocomplete="off" aria-label="Buscar segmento" placeholder="${escapar(placeholder)}" />
    <span class="contagem-segmento" id="${idContagem}" hidden></span>
  </div>`;
}

/** Filtra os cartões já renderizados sem refazer a tela (mantém o foco no campo). */
function ligarBuscaSegmento(container, idCampo, idContagem) {
  const campo = document.getElementById(idCampo);
  if (!campo) return;
  campo.addEventListener('input', () => {
    const termo = normalizarBusca(campo.value.trim());
    let visiveis = 0;
    $$('[data-busca]', container).forEach((el) => {
      const combina = !termo || el.dataset.busca.includes(termo);
      el.hidden = !combina;
      if (combina) visiveis += 1;
    });
    $$('[data-grupo-segmento]', container).forEach((grupo) => {
      grupo.hidden = !$$('[data-busca]:not([hidden])', grupo).length;
    });
    const contagem = document.getElementById(idContagem);
    if (contagem) {
      contagem.hidden = !termo;
      contagem.textContent = visiveis === 1 ? '1 segmento encontrado' : visiveis + ' segmentos encontrados';
    }
  });
}

function obter(obj, caminho) {
  return caminho.split('.').reduce((acc, parte) => (acc == null ? undefined : acc[parte]), obj);
}

function definir(obj, caminho, valor) {
  const partes = caminho.split('.');
  const ultimo = partes.pop();
  let alvo = obj;
  for (const parte of partes) {
    if (typeof alvo[parte] !== 'object' || alvo[parte] === null) alvo[parte] = {};
    alvo = alvo[parte];
  }
  alvo[ultimo] = valor;
  return obj;
}

function bytesLegivel(bytes) {
  const b = Number(bytes) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function dataCurta(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function novoSeguroId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return `p-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 8)}`;
}

const ehImagem = (nome) => /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(nome || '');
const ehVideo = (nome) => /\.(mp4|mov|webm|m4v)$/i.test(nome || '');
const extensaoDe = (nome) => {
  const p = String(nome || '').lastIndexOf('.');
  return p > 0 ? nome.slice(p + 1).toLowerCase() : '';
};

/** Converte os arquivos em memória para o formato que o motor espera. */
function arquivosParaMotor() {
  const mapear = (lista) => lista.map((a) => ({ nome: a.nome, extensao: extensaoDe(a.nome) }));
  return {
    midias: mapear(estado.arquivos.midias),
    branding: mapear(estado.arquivos.branding),
    conteudo: mapear(estado.arquivos.conteudo),
  };
}

/* ------------------------------ histórico (localStorage) ------------------------------ */

function lerHistorico() {
  try {
    const bruto = armazenamento.ler(CHAVE_HISTORICO);
    const lista = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function gravarHistorico() {
  try {
    armazenamento.gravar(CHAVE_HISTORICO, JSON.stringify(estado.projetos));
    if (!armazenamento.disponivel) {
      const el = $('#status-salvo');
      el.textContent = 'só nesta sessão';
      el.className = 'status aviso-texto';
    }
    return true;
  } catch (erro) {
    toast('Armazenamento do navegador cheio. Exclua projetos antigos para continuar salvando.', 'erro');
    return false;
  }
}

function salvarProjetoAtual() {
  if (!estado.projeto || !estado.dados) return;
  const indice = estado.projetos.findIndex((p) => p.id === estado.projeto.id);
  const registro = {
    id: estado.projeto.id,
    nome: estado.dados.empresa?.nomeFantasia || estado.dados.nomeContato || 'Projeto sem nome',
    segmento: estado.dados.segmento,
    nomePasta: estado.meta?.pasta || estado.dados.pasta || '',
    criadoEm: estado.projeto.criadoEm || new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    dados: estado.dados,
    prompt: estado.prompt,
    meta: estado.meta,
  };
  if (indice >= 0) estado.projetos[indice] = { ...estado.projetos[indice], ...registro };
  else estado.projetos.push(registro);

  const ok = gravarHistorico();
  const el = $('#status-salvo');
  el.textContent = ok ? 'salvo ✓' : 'não salvou';
  el.className = ok ? 'status ok' : 'status erro';
  renderSidebar();
}

function agendarSalvar() {
  const el = $('#status-salvo');
  el.textContent = 'editando…';
  el.className = 'status';
  clearTimeout(estado.timerSalvar);
  estado.timerSalvar = setTimeout(salvarProjetoAtual, 700);
}

/* ------------------------------ dados iniciais ------------------------------ */

function dadosVazios(segmento) {
  const modelo = estado.modelos.find((m) => m.id === segmento) || {};
  return {
    segmento: segmento || '',
    nomeContato: '',
    pasta: '',
    empresa: {
      nomeFantasia: '', razaoSocial: '', cnpj: '',
      endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' },
      telefone: '', whatsapp: '', email: '', horario: '', servicos: [], idioma: 'pt-BR',
    },
    negocio: { descricao: '', publicoAlvo: '', faixaEtaria: '', diferenciais: [], objetivo: modelo.objetivoRecomendado || 'agendamento', objetivosExtras: [], objetivoDetalhe: '' },
    redes: { googleMaps: '', instagram: '', facebook: '', youtube: '', pinterest: '', tiktok: '', siteAtual: '', linksExtras: [] },
    identidade: { cores: [], estilo: '', fontes: '', referencias: [], observacoes: '' },
    conteudo: { textos: '', depoimentos: [], faq: [], palavrasChave: [], observacoes: '' },
    opcoes: { ecommerce: false, incluirBlog: true, incluirFaq: true, incluirDepoimentos: true, incluirGaleria: true, incluirEquipe: true, observacoesOperador: '' },
  };
}

function normalizarDados(d) {
  const base = dadosVazios(d.segmento);
  const merge = (alvo, fonte) => {
    for (const [k, v] of Object.entries(fonte || {})) {
      if (v && typeof v === 'object' && !Array.isArray(v)) alvo[k] = merge(alvo[k] && typeof alvo[k] === 'object' ? alvo[k] : {}, v);
      else if (v !== undefined) alvo[k] = v;
    }
    return alvo;
  };
  merge(base, d);
  base.opcoes = { ...dadosVazios(d.segmento).opcoes, ...(d.opcoes || {}) };
  return base;
}

/* ------------------------------ sidebar ------------------------------ */

function renderSidebar() {
  const lista = $('#lista-projetos');
  const termo = estado.busca.toLowerCase();
  const projetos = estado.projetos
    .slice()
    .sort((a, b) => String(b.atualizadoEm || '').localeCompare(String(a.atualizadoEm || '')))
    .filter((p) => !termo || `${p.nome} ${p.segmento} ${p.nomePasta || ''}`.toLowerCase().includes(termo));

  $('#contador-projetos').textContent = estado.projetos.length;

  if (!projetos.length) {
    lista.innerHTML = `<p class="ajuda" style="color:#8b90ae">${estado.projetos.length ? 'Nenhum resultado.' : 'Nenhum cliente cadastrado ainda.'}</p>`;
    return;
  }

  lista.innerHTML = projetos.map((p) => {
    const faltando = p.meta?.faltando?.length || 0;
    const ativo = estado.projeto && estado.projeto.id === p.id;
    return `
      <button class="item-projeto ${ativo ? 'ativo' : ''}" data-id="${p.id}">
        <strong>${escapar(p.nome || 'Sem nome')}</strong>
        <small>${escapar(p.nomePasta || '')}</small>
        <span class="linha-2">
          <span>${dataCurta(p.atualizadoEm)}</span>
          <span class="${faltando ? 'alerta' : ''}">${faltando ? `${faltando} pendência(s)` : 'completo'}</span>
        </span>
      </button>`;
  }).join('');

  $$('.item-projeto', lista).forEach((el) => el.addEventListener('click', () => abrirProjeto(el.dataset.id)));
}

/* ------------------------------ abas ------------------------------ */

function camposPendentes() {
  const d = estado.dados;
  if (!d) return [];
  const p = [];
  if (!d.segmento) p.push({ aba: 'segmento', rotulo: 'Segmento de atuação' });
  if (!d.empresa?.nomeFantasia) p.push({ aba: 'empresa', rotulo: 'Nome fantasia' });
  if (!d.empresa?.whatsapp && !d.empresa?.telefone && !d.empresa?.email) p.push({ aba: 'empresa', rotulo: 'WhatsApp, telefone ou e-mail' });
  if (!d.empresa?.endereco?.cidade) p.push({ aba: 'empresa', rotulo: 'Cidade/UF' });
  if (!d.empresa?.horario) p.push({ aba: 'empresa', rotulo: 'Horário de atendimento' });
  if (!d.empresa?.servicos?.length) p.push({ aba: 'empresa', rotulo: 'Serviços/produtos principais' });
  if (!d.negocio?.descricao) p.push({ aba: 'negocio', rotulo: 'Descrição do negócio' });
  if (!d.negocio?.publicoAlvo) p.push({ aba: 'negocio', rotulo: 'Público-alvo' });
  if (!d.identidade?.cores?.length) p.push({ aba: 'visual', rotulo: 'Cores da identidade visual' });
  return p;
}

function renderStepper() {
  const faltando = camposPendentes();
  $('#stepper').innerHTML = ABAS.map((aba) => {
    const pendencias = faltando.filter((f) => f.aba === aba.id).length;
    return `
      <button class="aba ${estado.aba === aba.id ? 'ativa' : ''}" data-aba="${aba.id}">
        <span class="num">${aba.num}</span>
        ${aba.rotulo}
        ${pendencias ? '<span class="ponto-erro" title="Campos pendentes nesta etapa"></span>' : ''}
      </button>`;
  }).join('');

  $$('.aba', $('#stepper')).forEach((el) =>
    el.addEventListener('click', () => {
      estado.aba = el.dataset.aba;
      renderStepper();
      renderFormulario();
    })
  );
}

/* ------------------------------ campos do formulário ------------------------------ */

function campo({ label, caminho, tipo = 'text', dica, placeholder, opcional, col2, linhas = 4, opcoes, valor }) {
  const atual = valor !== undefined ? valor : obter(estado.dados, caminho);
  const idc = `campo-${caminho.replace(/\./g, '-')}`;
  const obrig = opcional ? '<span class="opcional">opcional</span>' : '';
  let controle;
  if (tipo === 'textarea') {
    controle = `<textarea id="${idc}" data-path="${caminho}" rows="${linhas}" placeholder="${escapar(placeholder || '')}">${escapar(atual || '')}</textarea>`;
  } else if (tipo === 'select') {
    controle = `<select id="${idc}" data-path="${caminho}">${opcoes
      .map((o) => `<option value="${escapar(o.id)}" ${o.id === atual ? 'selected' : ''}>${escapar(o.nome)}</option>`)
      .join('')}</select>`;
  } else {
    controle = `<input id="${idc}" data-path="${caminho}" type="${tipo}" value="${escapar(atual || '')}" placeholder="${escapar(placeholder || '')}" />`;
  }
  return `<div class="campo ${col2 ? 'col-2' : ''}">
    <label for="${idc}">${escapar(label)} ${obrig}</label>
    ${controle}
    ${dica ? `<span class="dica">${dica}</span>` : ''}
  </div>`;
}

function cartao({ titulo, descricao, campos }) {
  return `<div class="card">
    ${titulo ? `<div class="card-cabecalho"><h3>${titulo}</h3>${descricao ? `<p>${descricao}</p>` : ''}</div>` : ''}
    <div class="grade">${campos.join('')}</div>
  </div>`;
}

function listaSimples({ titulo, descricao, caminho, placeholder, botao }) {
  const itens = obter(estado.dados, caminho) || [];
  const linhas = itens.map((valor, i) => `
    <div class="linha-dinamica" data-lista="${caminho}" data-indice="${i}">
      <input type="text" data-lista-input="${caminho}" data-indice="${i}" value="${escapar(valor)}" placeholder="${escapar(placeholder)}" />
      <button class="btn-remover" data-remover="${caminho}" data-indice="${i}" title="Remover">✕</button>
    </div>`).join('');
  return `<div class="card">
    <div class="card-cabecalho"><h3>${titulo}</h3><p>${descricao}</p></div>
    <div class="lista-dinamica" id="lista-${caminho.replace(/\./g, '-')}">${linhas}</div>
    <div style="margin-top:10px">
      <button class="btn btn-secundario btn-pequeno" data-adicionar="${caminho}">+ ${botao}</button>
    </div>
  </div>`;
}

function listaObjetos({ titulo, descricao, caminho, campos, botao, rotuloItem }) {
  const itens = obter(estado.dados, caminho) || [];
  const blocos = itens.map((item, i) => `
    <div class="item-composto" data-item="${caminho}" data-indice="${i}">
      <div class="topo-item"><span>${rotuloItem} ${i + 1}</span>
        <button class="btn-remover" data-remover-item="${caminho}" data-indice="${i}" title="Remover">✕</button>
      </div>
      <div class="grade">
        ${campos.map((c) => campo({
          label: c.label,
          caminho: `${caminho}.${i}.${c.chave}`,
          placeholder: c.placeholder,
          opcional: c.opcional,
          col2: c.col2,
          tipo: c.tipo,
          linhas: 2,
          opcoes: c.opcoes,
        })).join('')}
      </div>
    </div>`).join('');
  return `<div class="card">
    <div class="card-cabecalho"><h3>${titulo}</h3><p>${descricao}</p></div>
    <div class="lista-dinamica" id="lista-${caminho.replace(/\./g, '-')}">${blocos || '<p class="ajuda">Nenhum item adicionado.</p>'}</div>
    <div style="margin-top:10px">
      <button class="btn btn-secundario btn-pequeno" data-adicionar-item="${caminho}">+ ${botao}</button>
    </div>
  </div>`;
}

function listaCores() {
  const itens = estado.dados.identidade.cores || [];
  const blocos = itens.map((cor, i) => `
    <div class="linha-dinamica" data-cor="${i}">
      <input type="color" data-cor-hex="${i}" value="${escapar(cor.hex && /^#[0-9a-f]{6}$/i.test(cor.hex) ? cor.hex : '#6c4ce0')}" />
      <input type="text" data-cor-hex-texto="${i}" value="${escapar(cor.hex || '')}" placeholder="#RRGGBB" />
      <input type="text" data-cor-nome="${i}" value="${escapar(cor.nome || '')}" placeholder="Nome da cor (ex.: Rosé)" />
      <button class="btn-remover" data-remover-cor="${i}" title="Remover">✕</button>
    </div>`).join('');
  return `<div class="card">
    <div class="card-cabecalho">
      <h3>Cores principais</h3>
      <p>Informe o hex ou apenas o nome da cor (ex.: "verde-musgo"). Se não souber, deixe vazio e o modelo do segmento sugere uma paleta.</p>
    </div>
    <div class="lista-dinamica" id="lista-cores">${blocos || '<p class="ajuda">Nenhuma cor informada — o prompt usará a paleta sugerida para o segmento.</p>'}</div>
    <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap">
      <button class="btn btn-secundario btn-pequeno" data-adicionar-cor>+ Adicionar cor</button>
      <button class="btn btn-fantasma btn-pequeno" data-cores-do-modelo>Usar paleta sugerida do segmento</button>
    </div>
  </div>`;
}

/* ------------------------------ render do formulário ------------------------------ */

function renderFormulario() {
  const container = $('#formulario');
  if (!estado.dados) return;

  const d = estado.dados;
  const modelo = estado.modelos.find((m) => m.id === d.segmento);
  const blocos = [];

  if (estado.aba === 'segmento') {
    blocos.push(`<div class="card">
      <div class="card-cabecalho">
        <h3>Segmento de atuação</h3>
        <p>O modelo define a estrutura de páginas, as funcionalidades e o tom de voz usados no prompt.</p>
      </div>
      ${campoBuscaSegmento('busca-segmento', 'contagem-segmento', 'Buscar segmento (ex.: imobiliária, pet, obra, decoração)')}
      ${blocosDeSegmento('selecao', d.segmento)}
    </div>`);

    blocos.push(cartao({
      titulo: 'Objetivo do site',
      descricao: 'O objetivo principal orienta os CTAs, a hierarquia das seções e as métricas de sucesso.',
      campos: [
        campo({ label: 'Objetivo principal', caminho: 'negocio.objetivo', tipo: 'select', opcoes: estado.objetivos }),
        `<div class="campo col-2"><label>Objetivos secundários</label>
          <div class="checks">
            ${estado.objetivos.map((o) => `
              <label class="check">
                <input type="checkbox" data-objetivo-extra="${o.id}" ${(d.negocio.objetivosExtras || []).includes(o.id) ? 'checked' : ''} />
                <span>${escapar(o.nome)}<small>${escapar(o.descricao)}</small></span>
              </label>`).join('')}
          </div>
        </div>`,
        campo({ label: 'O que o cliente quer alcançar com o site', caminho: 'negocio.objetivoDetalhe', tipo: 'textarea', linhas: 2, opcional: true, placeholder: 'Ex.: receber 20 agendamentos por semana sem responder no WhatsApp o dia todo.' }),
      ],
    }));

    blocos.push(`<div class="card">
      <div class="card-cabecalho"><h3>Recursos desta versão do site</h3><p>Define quais páginas e funcionalidades entram no prompt.</p></div>
      <div class="checks">
        <label class="check"><input type="checkbox" data-opcao="ecommerce" ${d.opcoes.ecommerce ? 'checked' : ''} ${modelo && !modelo.suportaEcommerce ? 'disabled' : ''} />
          <span>Loja online (e-commerce)<small>${modelo && modelo.suportaEcommerce ? 'Carrinho, checkout, frete e produtos.' : 'Este segmento não tem modelo de loja.'}</small></span></label>
        <label class="check"><input type="checkbox" data-opcao="incluirGaleria" ${d.opcoes.incluirGaleria ? 'checked' : ''} /><span>Galeria / portfólio<small>Fotos dos trabalhos organizadas por categoria.</small></span></label>
        <label class="check"><input type="checkbox" data-opcao="incluirDepoimentos" ${d.opcoes.incluirDepoimentos ? 'checked' : ''} /><span>Depoimentos<small>Prova social com avaliações reais.</small></span></label>
        <label class="check"><input type="checkbox" data-opcao="incluirFaq" ${d.opcoes.incluirFaq ? 'checked' : ''} /><span>Perguntas frequentes<small>Reduz dúvidas no atendimento e melhora o SEO.</small></span></label>
        <label class="check"><input type="checkbox" data-opcao="incluirEquipe" ${d.opcoes.incluirEquipe ? 'checked' : ''} /><span>Equipe<small>Apresentação dos profissionais com especialidades.</small></span></label>
        <label class="check"><input type="checkbox" data-opcao="incluirBlog" ${d.opcoes.incluirBlog ? 'checked' : ''} /><span>Blog / dicas<small>Conteúdo para atrair tráfego orgânico.</small></span></label>
      </div>
    </div>`);
  }

  if (estado.aba === 'empresa') {
    blocos.push(cartao({
      titulo: 'Dados básicos da empresa',
      descricao: 'Nome fantasia, contato e endereço completo aparecem no rodapé, na página de contato e nos dados estruturados.',
      campos: [
        campo({ label: 'Nome fantasia', caminho: 'empresa.nomeFantasia', placeholder: 'Ex.: Bella Estética' }),
        campo({ label: 'Razão social', caminho: 'empresa.razaoSocial', opcional: true }),
        campo({ label: 'CNPJ', caminho: 'empresa.cnpj', opcional: true, placeholder: '00.000.000/0000-00' }),
        campo({ label: 'Telefone fixo', caminho: 'empresa.telefone', opcional: true, placeholder: '(11) 3456-7890' }),
        campo({ label: 'WhatsApp', caminho: 'empresa.whatsapp', placeholder: '(11) 98888-7777' }),
        campo({ label: 'E-mail de contato', caminho: 'empresa.email', tipo: 'email', placeholder: 'contato@suaempresa.com.br' }),
        campo({ label: 'Horário de atendimento', caminho: 'empresa.horario', placeholder: 'Seg a sex, 9h às 19h; sáb, 9h às 14h', col2: true }),
        campo({ label: 'Idioma do site', caminho: 'empresa.idioma', tipo: 'select', opcoes: estado.idiomas }),
        campo({
          label: 'Diferenciais / proposta de valor',
          caminho: 'negocio.diferenciaisTexto',
          tipo: 'textarea',
          linhas: 3,
          opcional: true,
          col2: true,
          valor: (d.negocio.diferenciais || []).join('\n'),
          placeholder: 'Uma linha por diferencial (2 a 3 frases sobre o que a empresa faz melhor que a concorrência).',
        }),
      ],
    }));

    blocos.push(cartao({
      titulo: 'Endereço completo',
      descricao: 'Usado na página de contato, no mapa e no SEO local.',
      campos: [
        campo({ label: 'Rua/Avenida', caminho: 'empresa.endereco.rua', col2: true }),
        campo({ label: 'Número', caminho: 'empresa.endereco.numero' }),
        campo({ label: 'Complemento', caminho: 'empresa.endereco.complemento', opcional: true }),
        campo({ label: 'Bairro', caminho: 'empresa.endereco.bairro' }),
        campo({ label: 'Cidade', caminho: 'empresa.endereco.cidade' }),
        campo({ label: 'Estado (UF)', caminho: 'empresa.endereco.estado', placeholder: 'SP' }),
        campo({ label: 'CEP', caminho: 'empresa.endereco.cep', placeholder: '00000-000' }),
      ],
    }));

    blocos.push(listaObjetos({
      titulo: 'Principais serviços ou produtos',
      descricao: 'Cada item vira uma seção do site. Descreva o que é, para quem serve e quanto tempo dura.',
      caminho: 'empresa.servicos',
      botao: 'Adicionar serviço',
      rotuloItem: 'Serviço',
      campos: [
        { chave: 'nome', label: 'Nome do serviço', placeholder: 'Ex.: Limpeza de pele profunda' },
        { chave: 'preco', label: 'Preço', opcional: true, placeholder: 'a partir de R$ 180' },
        { chave: 'descricao', label: 'Descrição curta', opcional: true, col2: true, placeholder: 'O que está incluso e para quem serve.' },
        { chave: 'duracao', label: 'Duração', opcional: true, placeholder: '60 min' },
      ],
    }));
  }

  if (estado.aba === 'negocio') {
    blocos.push(cartao({
      titulo: 'Descrição do negócio',
      descricao: 'Esta frase abre o prompt e é usada como base para todos os textos do site.',
      campos: [
        campo({ label: 'Descrição em uma frase', caminho: 'negocio.descricao', tipo: 'textarea', linhas: 2, col2: true, placeholder: 'Ex.: centro de estética especializado em tratamentos faciais com protocolos personalizados.' }),
      ],
    }));

    blocos.push(cartao({
      titulo: 'Público-alvo',
      descricao: 'Quanto mais específico, melhor o resultado dos textos e do design.',
      campos: [
        campo({ label: 'Perfil do público', caminho: 'negocio.publicoAlvo', tipo: 'textarea', linhas: 3, col2: true, placeholder: 'Ex.: mulheres de 30 a 50 anos, da região X, que buscam prevenção de rugas...' }),
        campo({ label: 'Faixa etária predominante', caminho: 'negocio.faixaEtaria', opcional: true, placeholder: 'Ex.: 30 a 50 anos' }),
        campo({ label: 'Sensibilidade a preço', caminho: 'negocio.poderCompra', opcional: true, placeholder: 'Ex.: valoriza custo-benefício / compra por qualidade' }),
      ],
    }));

    blocos.push(listaSimples({
      titulo: 'Diferenciais / proposta de valor',
      descricao: '2 a 3 frases curtas que expliquem por que escolher esta empresa. Se deixar vazio, o prompt usa os diferenciais típicos do segmento.',
      caminho: 'negocio.diferenciais',
      placeholder: 'Ex.: avaliação individual antes de qualquer procedimento',
      botao: 'Adicionar diferencial',
    }));

    blocos.push(cartao({
      titulo: 'Observações',
      descricao: 'Tudo o que a IA de criação precisa saber e não cabe nos outros campos.',
      campos: [
        campo({ label: 'Sazonalidade e particularidades', caminho: 'negocio.sazonalidade', tipo: 'textarea', linhas: 2, opcional: true, placeholder: 'Ex.: pico de movimento em dezembro e véspera de feriados.' }),
        campo({ label: 'Observações gerais', caminho: 'negocio.observacoes', tipo: 'textarea', linhas: 2, opcional: true }),
        campo({ label: 'Observações do operador (aparecem no fim do prompt)', caminho: 'opcoes.observacoesOperador', tipo: 'textarea', linhas: 2, opcional: true, col2: true, placeholder: 'Ex.: priorizar mobile, entrega antes do dia 15.' }),
      ],
    }));
  }

  if (estado.aba === 'redes') {
    blocos.push(cartao({
      titulo: 'Redes sociais e links',
      descricao: 'Só entram no site os canais que existirem de verdade. Links vazios são ignorados pelo prompt.',
      campos: [
        campo({ label: 'Link do Google Maps', caminho: 'redes.googleMaps', placeholder: 'https://maps.app.goo.gl/…' }),
        campo({ label: 'Instagram', caminho: 'redes.instagram', placeholder: '@suaempresa ou URL completa' }),
        campo({ label: 'Facebook', caminho: 'redes.facebook', opcional: true }),
        campo({ label: 'YouTube', caminho: 'redes.youtube', opcional: true }),
        campo({ label: 'Pinterest', caminho: 'redes.pinterest', opcional: true }),
        campo({ label: 'TikTok', caminho: 'redes.tiktok', opcional: true }),
        campo({ label: 'Site atual (se houver)', caminho: 'redes.siteAtual', opcional: true }),
      ],
    }));

    blocos.push(listaObjetos({
      titulo: 'Outros links',
      descricao: 'Adicione quantos quiser: cardápio, delivery, catálogo em PDF, link de pagamento, canal de vagas etc.',
      caminho: 'redes.linksExtras',
      botao: 'Adicionar link',
      rotuloItem: 'Link',
      campos: [
        { chave: 'rotulo', label: 'Nome do link', placeholder: 'Ex.: Cardápio, Delivery, Catálogo' },
        { chave: 'url', label: 'URL', placeholder: 'https://…' },
      ],
    }));

    blocos.push(listaSimples({
      titulo: 'Sites de referência',
      descricao: '2 a 3 URLs que o cliente gosta. Servem de inspiração de layout — a IA não deve copiar conteúdo.',
      caminho: 'identidade.referencias',
      placeholder: 'https://site-que-o-cliente-gosta.com',
      botao: 'Adicionar referência',
    }));
  }

  if (estado.aba === 'visual') {
    blocos.push(listaCores());
    blocos.push(cartao({
      titulo: 'Estilo e tipografia',
      descricao: 'Se o cliente não souber definir, escolha uma sugestão ou deixe vazio para usar o padrão do segmento.',
      campos: [
        campo({ label: 'Estilo desejado', caminho: 'identidade.estilo', tipo: 'select', opcoes: [{ id: '', nome: '— usar sugestão do segmento —' }, ...estado.estilos.map((e) => ({ id: e, nome: e }))] }),
        campo({ label: 'Fontes preferidas', caminho: 'identidade.fontes', opcional: true, placeholder: 'Ex.: títulos em serifada elegante' }),
        campo({ label: 'Observações sobre a marca', caminho: 'identidade.observacoes', tipo: 'textarea', linhas: 2, opcional: true, col2: true, placeholder: 'Ex.: o rosé deve aparecer nos botões; logo ainda provisório.' }),
      ],
    }));

    blocos.push(`<div class="card">
      <div class="card-cabecalho"><h3>Logo e identidade</h3><p>Envie o logo em PNG/SVG (idealmente vetorial) na aba "Imagens e vídeos", categoria <b>branding</b>. O prompt instrui a IA a usar o arquivo no cabeçalho, rodapé e favicon.</p></div>
      <p class="ajuda">Arquivos de branding enviados: ${
        (estado.arquivos.branding || []).length
          ? estado.arquivos.branding.map((a) => `<code>${escapar(a.nome)}</code>`).join(', ')
          : '<b>nenhum</b>'
      }</p>
      <div style="margin-top:10px"><button class="btn btn-secundario btn-pequeno" data-ir-para="arquivos">Ir para upload de arquivos →</button></div>
    </div>`);
  }

  if (estado.aba === 'conteudo') {
    blocos.push(cartao({
      titulo: 'Textos principais',
      descricao: 'Cole aqui o "sobre", a descrição dos serviços e os diferenciais. Se deixar vazio, o prompt instrui a IA a redigir tudo com base no tom de voz do segmento.',
      campos: [
        campo({ label: 'Textos enviados pelo cliente', caminho: 'conteudo.textos', tipo: 'textarea', linhas: 8, col2: true, opcional: true, placeholder: 'Cole aqui os textos que o cliente já tem...' }),
      ],
    }));

    blocos.push(listaObjetos({
      titulo: 'Depoimentos de clientes',
      descricao: 'O sistema nunca inventa depoimentos. Se deixar vazio, o prompt prepara o layout e pede a coleta de avaliações reais.',
      caminho: 'conteudo.depoimentos',
      botao: 'Adicionar depoimento',
      rotuloItem: 'Depoimento',
      campos: [
        { chave: 'texto', label: 'Depoimento', placeholder: 'Ex.: atendimento excelente e resultado que superou minha expectativa.' },
        { chave: 'nome', label: 'Autor', opcional: true, placeholder: 'Ex.: Ana Paula' },
      ],
    }));

    blocos.push(listaObjetos({
      titulo: 'FAQ — perguntas frequentes',
      descricao: 'Se deixar vazio, o prompt sugere as perguntas típicas do segmento para o cliente validar.',
      caminho: 'conteudo.faq',
      botao: 'Adicionar pergunta',
      rotuloItem: 'Pergunta',
      campos: [
        { chave: 'pergunta', label: 'Pergunta', placeholder: 'Ex.: Preciso agendar?' },
        { chave: 'resposta', label: 'Resposta', placeholder: 'Ex.: Atendemos com hora marcada para você não esperar.' },
      ],
    }));

    blocos.push(cartao({
      titulo: 'SEO e palavras-chave',
      descricao: 'Se preencher, estas palavras substituem as sugestões do modelo. O padrão usa o segmento + cidade.',
      campos: [
        campo({ label: 'Palavras-chave (separe por vírgula)', caminho: 'conteudo.palavrasChaveTexto', col2: true, opcional: true, valor: (d.conteudo.palavrasChave || []).join(', '), placeholder: 'limpeza de pele São Paulo, clínica de estética Jardim Europa' }),
        campo({ label: 'Título da home (até 60 caracteres)', caminho: 'conteudo.seoTitulo', opcional: true }),
        campo({ label: 'Descrição da home (até 155 caracteres)', caminho: 'conteudo.seoDescricao', opcional: true }),
        campo({ label: 'Assuntos que NÃO podem ser divulgados', caminho: 'conteudo.avisosTexto', tipo: 'textarea', linhas: 2, col2: true, opcional: true, valor: (d.conteudo.avisos || []).join('\n'), placeholder: 'Uma linha por restrição. Ex.: não divulgar preços antes da avaliação.' }),
      ],
    }));
  }

  if (estado.aba === 'arquivos') {
    const categorias = [
      { id: 'midias', titulo: 'Imagens e vídeos (midias/)', descricao: 'Fotos e vídeos que devem aparecer no site. Nomeie os arquivos com sentido (ex.: banner-fachada.jpg, antes-depois-01.jpg) — a IA usa os nomes para decidir onde cada mídia entra.', icone: '🖼️' },
      { id: 'branding', titulo: 'Branding (branding/)', descricao: 'Logo, manual de marca, paleta de cores, arquivos de fonte e referências visuais.', icone: '🎨' },
      { id: 'conteudo', titulo: 'Conteúdo (conteudo/)', descricao: 'Textos, depoimentos, FAQ e documentos do cliente (PDF, DOCX, TXT).', icone: '📄' },
    ];

    blocos.push(`<div class="card">
      <div class="card-cabecalho"><h3>Organização dos arquivos</h3>
        <p>Nesta versão estática os arquivos ficam <b>apenas na memória do navegador</b>: eles entram no prompt e são incluídos no .zip que você baixar. Nada é enviado para nenhum servidor.</p></div>
      <pre class="arvore">${escapar(estado.meta?.pasta || estado.dados.pasta || 'nome_cliente_nome_empresa')}/\n├── prompt_site.txt\n├── prompt_resumo.txt\n├── LEIA-ME.txt\n├── dados-cliente.json\n├── midias/\n├── branding/\n└── conteudo/</pre>
      <p class="campo-arquivo-memoria">⚠️ Se recarregar a página, os arquivos precisam ser adicionados novamente (o cadastro e o prompt continuam salvos).</p>
    </div>`);

    for (const cat of categorias) {
      const arquivos = estado.arquivos[cat.id] || [];
      blocos.push(`<div class="card">
        <div class="card-cabecalho"><h3>${cat.icone} ${cat.titulo.replace(/\s*\(.+\)$/, '')}</h3><p>${cat.descricao}</p></div>
        <div class="zona-upload" data-upload="${cat.id}">
          <strong>Clique para escolher ou arraste os arquivos aqui</strong>
          <small>Imagens, vídeos, PDF, DOCX, SVG — ficam só neste navegador</small>
          <input type="file" multiple hidden data-input="${cat.id}" />
        </div>
        ${arquivos.length
          ? `<div class="lista-arquivos-memoria">${arquivos.map((a) => `
              <div class="item">
                <span class="icone">${ehImagem(a.nome) ? '🖼️' : ehVideo(a.nome) ? '🎬' : '📄'}</span>
                <span class="nome" title="${escapar(a.nome)}">${escapar(a.nome)}</span>
                <span class="meta">${bytesLegivel(a.tamanho)}</span>
                <button data-remover-arquivo="${cat.id}|${escapar(a.nome)}" title="Remover">🗑</button>
              </div>`).join('')}</div>
            <div class="progresso-envio">${arquivos.length} arquivo(s) em ${cat.id}/ · serão incluídos no .zip</div>`
          : '<p class="ajuda" style="margin-top:10px">Nenhum arquivo nesta categoria.</p>'}
      </div>`);
    }
  }

  container.innerHTML = blocos.join('');
  ligarEventosFormulario();
  renderStepper();
}

/* ------------------------------ eventos do formulário ------------------------------ */

function ligarEventosFormulario() {
  const container = $('#formulario');

  // Busca de segmento (filtra os cartões já renderizados, sem refazer a tela)
  ligarBuscaSegmento(container, 'busca-segmento', 'contagem-segmento');

  $$('[data-path]', container).forEach((el) => {
    const evento = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(evento, () => {
      const caminho = el.dataset.path;
      if (virtualParaReal(caminho, el.value)) return;
      definir(estado.dados, caminho, el.value);
      agendarSalvar();
    });
  });

  $$('[data-lista-input]', container).forEach((el) => {
    el.addEventListener('input', () => {
      const lista = obter(estado.dados, el.dataset.listaInput) || [];
      lista[Number(el.dataset.indice)] = el.value;
      agendarSalvar();
    });
  });

  $$('[data-adicionar]', container).forEach((el) =>
    el.addEventListener('click', () => {
      const caminho = el.dataset.adicionar;
      const lista = obter(estado.dados, caminho) || [];
      lista.push('');
      definir(estado.dados, caminho, lista);
      renderFormulario();
      const inputs = $$(`[data-lista-input="${caminho}"]`, container);
      if (inputs.length) inputs[inputs.length - 1].focus();
      agendarSalvar();
    })
  );

  $$('[data-remover]', container).forEach((el) =>
    el.addEventListener('click', () => {
      const caminho = el.dataset.remover;
      const lista = obter(estado.dados, caminho) || [];
      lista.splice(Number(el.dataset.indice), 1);
      definir(estado.dados, caminho, lista);
      renderFormulario();
      agendarSalvar();
    })
  );

  $$('[data-remover-item]', container).forEach((el) =>
    el.addEventListener('click', () => {
      const caminho = el.dataset.removerItem;
      const lista = obter(estado.dados, caminho) || [];
      lista.splice(Number(el.dataset.indice), 1);
      definir(estado.dados, caminho, lista);
      renderFormulario();
      agendarSalvar();
    })
  );

  $$('[data-adicionar-item]', container).forEach((el) =>
    el.addEventListener('click', () => {
      const caminho = el.dataset.adicionarItem;
      const lista = obter(estado.dados, caminho) || [];
      const modeloItem = {
        'empresa.servicos': { nome: '', descricao: '', preco: '', duracao: '' },
        'conteudo.depoimentos': { nome: '', texto: '' },
        'conteudo.faq': { pergunta: '', resposta: '' },
        'redes.linksExtras': { rotulo: '', url: '' },
      }[caminho] || {};
      lista.push(modeloItem);
      definir(estado.dados, caminho, lista);
      renderFormulario();
      agendarSalvar();
    })
  );

  const atualizarCor = (indice, chave, valor) => {
    const cores = estado.dados.identidade.cores || [];
    cores[indice] = { ...(cores[indice] || {}), [chave]: valor };
    definir(estado.dados, 'identidade.cores', cores);
    agendarSalvar();
  };
  $$('[data-cor-hex]', container).forEach((el) => el.addEventListener('input', () => atualizarCor(Number(el.dataset.corHex), 'hex', el.value.toUpperCase())));
  $$('[data-cor-hex-texto]', container).forEach((el) => el.addEventListener('input', () => atualizarCor(Number(el.dataset.corHexTexto), 'hex', el.value)));
  $$('[data-cor-nome]', container).forEach((el) => el.addEventListener('input', () => atualizarCor(Number(el.dataset.corNome), 'nome', el.value)));
  $$('[data-remover-cor]', container).forEach((el) =>
    el.addEventListener('click', () => {
      estado.dados.identidade.cores.splice(Number(el.dataset.removerCor), 1);
      renderFormulario();
      agendarSalvar();
    })
  );

  const botaoAddCor = $('[data-adicionar-cor]', container);
  if (botaoAddCor) botaoAddCor.addEventListener('click', () => {
    estado.dados.identidade.cores = [...(estado.dados.identidade.cores || []), { hex: '', nome: '' }];
    renderFormulario();
    agendarSalvar();
  });

  const botaoCoresModelo = $('[data-cores-do-modelo]', container);
  if (botaoCoresModelo) botaoCoresModelo.addEventListener('click', () => {
    const paleta = sugerirCoresDoModelo();
    if (!paleta.length) return toast('Este segmento não tem paleta sugerida.', 'erro');
    estado.dados.identidade.cores = paleta;
    renderFormulario();
    agendarSalvar();
    toast('Paleta sugerida aplicada.');
  });

  $$('[data-objetivo-extra]', container).forEach((el) =>
    el.addEventListener('change', () => {
      const id = el.dataset.objetivoExtra;
      const lista = new Set(estado.dados.negocio.objetivosExtras || []);
      if (el.checked) lista.add(id); else lista.delete(id);
      estado.dados.negocio.objetivosExtras = Array.from(lista).filter((x) => x !== estado.dados.negocio.objetivo);
      agendarSalvar();
    })
  );

  $$('[data-opcao]', container).forEach((el) =>
    el.addEventListener('change', () => {
      estado.dados.opcoes[el.dataset.opcao] = el.checked;
      agendarSalvar();
    })
  );

  $$('[data-modelo]', container).forEach((el) => el.addEventListener('click', () => trocarSegmento(el.dataset.modelo)));

  $$('[data-upload]', container).forEach((zona) => {
    const categoria = zona.dataset.upload;
    const input = $(`[data-input="${categoria}"]`, zona);
    zona.addEventListener('click', () => input.click());
    input.addEventListener('change', () => adicionarArquivos(categoria, input.files));
    zona.addEventListener('dragover', (ev) => { ev.preventDefault(); zona.classList.add('sobre'); });
    zona.addEventListener('dragleave', () => zona.classList.remove('sobre'));
    zona.addEventListener('drop', (ev) => {
      ev.preventDefault();
      zona.classList.remove('sobre');
      if (ev.dataTransfer.files?.length) adicionarArquivos(categoria, ev.dataTransfer.files);
    });
  });

  $$('[data-remover-arquivo]', container).forEach((el) =>
    el.addEventListener('click', () => {
      const [categoria, nome] = el.dataset.removerArquivo.split('|');
      estado.arquivos[categoria] = estado.arquivos[categoria].filter((a) => a.nome !== nome);
      gerar();
      renderFormulario();
      toast('Arquivo removido. O prompt foi atualizado.');
    })
  );

  $$('[data-ir-para]', container).forEach((el) =>
    el.addEventListener('click', () => {
      estado.aba = el.dataset.irPara;
      renderFormulario();
    })
  );
}

function virtualParaReal(caminho, valor) {
  const conversores = {
    'negocio.diferenciaisTexto': (v) => (estado.dados.negocio.diferenciais = v.split('\n').map((s) => s.trim()).filter(Boolean)),
    'conteudo.palavrasChaveTexto': (v) => (estado.dados.conteudo.palavrasChave = v.split(',').map((s) => s.trim()).filter(Boolean)),
    'conteudo.avisosTexto': (v) => (estado.dados.conteudo.avisos = v.split('\n').map((s) => s.trim()).filter(Boolean)),
  }[caminho];
  if (!conversores) return false;
  conversores(valor);
  agendarSalvar();
  return true;
}

async function trocarSegmento(id) {
  if (estado.dados.segmento === id) return;
  const anterior = estado.dados.segmento;
  estado.dados.segmento = id;
  const modelo = MagicPromptMotor.sugestoesDoModelo(id);
  if (modelo) preencherComSugestoes(modelo, { apenasVazios: true });
  if (anterior) toast(`Modelo "${modelo.nomeSegmento}" aplicado. Campos vazios foram preenchidos com os exemplos do segmento.`);
  renderFormulario();
  agendarSalvar();
}

function sugerirCoresDoModelo() {
  const modelo = MagicPromptMotor.getModelo(estado.dados.segmento);
  return (modelo?.estiloVisual?.paletas?.[0]?.cores || []).map((c) => ({ nome: c.nome, hex: c.hex }));
}

function preencherComSugestoes(sugestoes, { apenasVazios = true } = {}) {
  const d = estado.dados;
  const set = (caminho, valor) => {
    const atual = obter(d, caminho);
    const vazio = atual == null || atual === '' || (Array.isArray(atual) && atual.length === 0);
    if (apenasVazios && !vazio) return;
    definir(d, caminho, valor);
  };
  set('negocio.descricao', sugestoes.descricaoNegocio);
  set('negocio.publicoAlvo', sugestoes.publicoAlvo);
  set('empresa.servicos', (sugestoes.servicos || []).slice(0, 12).map((nome) => ({ nome, descricao: '', preco: '', duracao: '' })));
  set('negocio.diferenciais', sugestoes.diferenciais || []);
  set('conteudo.faq', (sugestoes.faq || []).slice(0, 8));
  set('conteudo.palavrasChave', (sugestoes.seo?.palavrasChave || []).slice(0, 8));
  set('identidade.cores', (sugestoes.estiloVisual?.paletas?.[0]?.cores || []).map((c) => ({ nome: c.nome, hex: c.hex })));
}

/* ------------------------------ arquivos (memória) ------------------------------ */

async function adicionarArquivos(categoria, listaArquivos) {
  if (!listaArquivos || !listaArquivos.length) return;
  const adicionados = [];
  for (const arquivo of Array.from(listaArquivos)) {
    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    adicionados.push({ nome: arquivo.name, tamanho: arquivo.size, tipo: arquivo.type, bytes });
  }
  estado.arquivos[categoria] = [...(estado.arquivos[categoria] || []), ...adicionados];
  gerar();
  renderFormulario();
  toast(`${adicionados.length} arquivo(s) adicionado(s) em ${categoria}/. O prompt foi atualizado.`);
}

/* ------------------------------ geração ------------------------------ */

function gerar() {
  if (!estado.dados) return;

  // Mesma regra do servidor: a pasta segue o padrão nome_cliente_nome_empresa
  // enquanto o operador não definir um nome manualmente.
  if (!estado.dados.pasta) {
    estado.dados.pasta = MagicPromptMotor.utils.pastaDoCliente(
      estado.dados.nomeContato,
      estado.dados.empresa?.nomeFantasia
    );
  }

  const validacao = MagicPromptMotor.validarDados(estado.dados, arquivosParaMotor());
  if (!validacao.ok) {
    const el = $('#status-salvo');
    el.textContent = 'faltam dados';
    el.className = 'status erro';
    return;
  }
  const { texto, meta } = MagicPromptMotor.gerarPrompt(estado.dados, arquivosParaMotor());
  atualizarPrompt(texto, meta);
}

function atualizarPrompt(texto, meta) {
  estado.prompt = texto;
  if (meta) {
    estado.meta = meta;
    estado.dados.pasta = meta.pasta;
  }
  renderPainelPrompt();
  renderHeader();
}

function gerarComAviso() {
  if (!estado.projeto) return;
  const erros = MagicPromptMotor.validarDados(estado.dados, arquivosParaMotor()).erros;
  if (erros.length) {
    toast(erros.map((e) => e.mensagem).join(' '), 'erro');
    const aba = erros[0].campo.startsWith('segmento') ? 'segmento' : 'empresa';
    estado.aba = aba;
    renderFormulario();
    return;
  }
  gerar();
  salvarProjetoAtual();
  const palavras = estado.meta ? estado.meta.palavras.toLocaleString('pt-BR') : '—';
  toast(`Prompt gerado: ${palavras} palavras, ${estado.meta ? estado.meta.paginas.length : 0} páginas.`);
}

/* ------------------------------ painel do prompt ------------------------------ */

function renderPainelPrompt() {
  const painel = $('#painel-prompt');
  if (!estado.projeto) {
    painel.innerHTML = '';
    return;
  }
  const meta = estado.meta;
  const pendencias = camposPendentes();

  painel.innerHTML = `
    <div class="painel">
      <div class="painel-topo">
        <h3>Prompt do site</h3>
        <div class="painel-acoes">
          <button class="btn btn-pequeno" id="btn-copiar">📋 Copiar</button>
          <button class="btn btn-pequeno" id="btn-baixar-txt">⬇ .txt</button>
          <button class="btn btn-pequeno btn-primario" id="btn-baixar-zip">⬇ Baixar pasta (.zip)</button>
        </div>
      </div>

      ${meta ? `<div class="estatisticas">
        <span class="chip">${Number(meta.palavras).toLocaleString('pt-BR')} palavras</span>
        <span class="chip">~${Number(meta.tokensAproximados).toLocaleString('pt-BR')} tokens</span>
        <span class="chip">${meta.paginas.length} páginas</span>
        <span class="chip">${meta.totalSecoes} seções</span>
        ${meta.ecommerce ? '<span class="chip roxa">com loja online</span>' : ''}
        <span class="chip ${meta.faltando.length ? 'aviso' : 'ok'}">${meta.faltando.length ? `${meta.faltando.length} campo(s) via modelo` : 'todos os dados preenchidos'}</span>
        <span class="chip">${meta.arquivos.midias + meta.arquivos.branding + meta.arquivos.conteudo} arquivo(s) anexado(s)</span>
      </div>` : ''}

      ${meta?.avisos?.length ? `<div class="estatisticas">${meta.avisos.map((a) => `<span class="chip aviso">${escapar(a)}</span>`).join('')}</div>` : ''}

      <textarea id="prompt" spellcheck="false" aria-label="Prompt gerado">${escapar(estado.prompt || 'Clique em "Gerar prompt" para produzir o texto.')}</textarea>

      ${meta ? `<pre class="arvore">${escapar(arvorePasta(meta))}</pre>` : ''}
    </div>

    ${pendencias.length ? `<div class="pendencia">
      <b>Complete o cadastro para melhorar o prompt:</b>
      <ul>${pendencias.map((p) => `<li>${p.rotulo}</li>`).join('')}</ul>
    </div>` : ''}

    <div class="dica-uso">
      <b>Como usar:</b> copie o prompt e cole na ferramenta de IA de criação de sites.
      Depois anexe os arquivos das pastas <code>midias/</code>, <code>branding/</code> e <code>conteudo/</code> — ou baixe tudo de uma vez no <b>.zip</b>.
      Você pode editar o texto acima antes de exportar.
    </div>

    <div class="rodape-pagina">
      Magic Prompt v${MagicPromptMotor.versao} · modo estático (GitHub Pages) —
      tudo é processado no seu navegador. Para o modo multiusuário com pastas no servidor,
      rode <code>npm start</code> na raiz do projeto.
    </div>
  `;

  ligarEventosPainel();
  renderStepper();
}

function arvorePasta(meta) {
  return [
    `${meta.pasta}/`,
    '├── prompt_site.txt',
    '├── prompt_resumo.txt',
    '├── LEIA-ME.txt',
    '├── dados-cliente.json',
    `├── midias/  (${meta.arquivos.midias} arquivo(s))`,
    `├── branding/  (${meta.arquivos.branding} arquivo(s))`,
    `└── conteudo/  (${meta.arquivos.conteudo + 5} arquivo(s))`,
  ].join('\n');
}

function ligarEventosPainel() {
  const area = $('#prompt');
  if (area) {
    area.addEventListener('input', () => {
      clearTimeout(area._t);
      area._t = setTimeout(() => {
        estado.prompt = area.value;
        salvarProjetoAtual();
      }, 900);
    });
  }

  const copiar = $('#btn-copiar');
  if (copiar) copiar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(estado.prompt || '');
      toast('Prompt copiado para a área de transferência.');
    } catch {
      $('#prompt').select();
      document.execCommand('copy');
      toast('Prompt copiado.');
    }
  });

  const baixarTxt = $('#btn-baixar-txt');
  if (baixarTxt) baixarTxt.addEventListener('click', () => {
    baixarBlob(new Blob([estado.prompt || ''], { type: 'text/plain;charset=utf-8' }), 'prompt_site.txt');
  });

  const baixarZip = $('#btn-baixar-zip');
  if (baixarZip) baixarZip.addEventListener('click', baixarPasta);
}

function baixarBlob(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Monta o .zip da pasta do cliente inteiramente no navegador. */
function baixarPasta() {
  if (!estado.prompt || !estado.meta) return toast('Gere o prompt antes de baixar a pasta.', 'erro');
  try {
    const { ZipWriter, gerarArquivosDeApoio, Buffer } = MagicPromptMotor;
    const pasta = estado.meta.pasta;
    const zip = new ZipWriter();

    zip.adicionar(`${pasta}/prompt_site.txt`, estado.prompt);
    zip.adicionar(`${pasta}/dados-cliente.json`, `${JSON.stringify(estado.dados, null, 2)}\n`);

    const apoio = gerarArquivosDeApoio(estado.dados, arquivosParaMotor(), estado.meta);
    for (const [caminho, conteudo] of Object.entries(apoio)) zip.adicionar(`${pasta}/${caminho}`, conteudo);

    for (const categoria of ['midias', 'branding', 'conteudo']) {
      for (const arquivo of estado.arquivos[categoria] || []) {
        zip.adicionar(`${pasta}/${categoria}/${arquivo.nome}`, Buffer.from(arquivo.bytes));
      }
    }

    const buffer = zip.finalizar();
    baixarBlob(new Blob([buffer], { type: 'application/zip' }), `${pasta}.zip`);
    const total = (estado.arquivos.midias.length + estado.arquivos.branding.length + estado.arquivos.conteudo.length);
    toast(`Pasta ${pasta}.zip baixada com o prompt e ${total} arquivo(s).`);
  } catch (erro) {
    toast(`Não foi possível montar o .zip: ${erro.message}`, 'erro');
  }
}

/* ------------------------------ cabeçalho ------------------------------ */

function renderHeader() {
  const p = estado.projeto;
  if (!p) {
    $('#titulo-projeto').textContent = 'Nenhum projeto aberto';
    $('#subtitulo-projeto').textContent = 'Crie um projeto escolhendo o segmento do cliente para começar.';
    $('#btn-gerar').disabled = true;
    $('#btn-sugerir').disabled = true;
    return;
  }
  const cidade = [estado.dados.empresa.endereco.cidade, estado.dados.empresa.endereco.estado].filter(Boolean).join('/');
  $('#titulo-projeto').textContent = estado.dados.empresa.nomeFantasia || '(sem nome)';
  $('#subtitulo-projeto').textContent = [
    estado.meta?.nomeSegmento || estado.modelos.find((m) => m.id === estado.dados.segmento)?.nome || 'Segmento não definido',
    cidade,
    estado.meta?.pasta || '',
  ].filter(Boolean).join(' • ');
  $('#btn-gerar').disabled = false;
  $('#btn-sugerir').disabled = false;
}

/* ------------------------------ abrir / criar ------------------------------ */

function abrirPorId(id) {
  const registro = estado.projetos.find((p) => p.id === id);
  if (!registro) return;
  estado.projeto = registro;
  estado.dados = normalizarDados(registro.dados || dadosVazios(registro.segmento));
  estado.prompt = registro.prompt || '';
  estado.meta = registro.meta || null;
  estado.arquivos = { midias: [], branding: [], conteudo: [] };
  estado.aba = 'segmento';
  $('#status-salvo').textContent = '';
  $('#status-salvo').className = 'status';
  renderSidebar();
  renderHeader();
  renderFormulario();
  renderPainelPrompt();
  if (!registro.prompt) gerar();
}

function novoProjeto(segmento, nomeContato, nomeFantasia) {
  const dados = dadosVazios(segmento);
  dados.nomeContato = nomeContato;
  dados.empresa.nomeFantasia = nomeFantasia;
  const sugestoes = MagicPromptMotor.sugestoesDoModelo(segmento);
  const id = novoSeguroId();
  estado.projeto = { id, criadoEm: new Date().toISOString() };
  estado.dados = dados;
  estado.prompt = '';
  estado.meta = null;
  estado.arquivos = { midias: [], branding: [], conteudo: [] };
  if (sugestoes) preencherComSugestoes(sugestoes, { apenasVazios: true });
  gerar();
  salvarProjetoAtual();
  estado.aba = 'empresa';
  renderHeader();
  renderFormulario();
  renderPainelPrompt();
}

function excluirProjeto(id) {
  estado.projetos = estado.projetos.filter((p) => p.id !== id);
  gravarHistorico();
  if (estado.projeto && estado.projeto.id === id) {
    estado.projeto = null;
    estado.dados = null;
    estado.prompt = '';
    estado.meta = null;
    estado.arquivos = { midias: [], branding: [], conteudo: [] };
    $('#painel-prompt').innerHTML = '';
    $('#formulario').innerHTML = '<div class="vazio"><h2>Projeto excluído</h2><p>Crie um novo projeto ou abra outro do histórico.</p></div>';
    renderHeader();
  }
  renderSidebar();
}

function duplicarProjeto(id) {
  const original = estado.projetos.find((p) => p.id === id);
  if (!original) return;
  const copia = JSON.parse(JSON.stringify(original));
  copia.id = novoSeguroId();
  copia.criadoEm = new Date().toISOString();
  copia.atualizadoEm = copia.criadoEm;
  copia.nome = `${original.nome} (cópia)`;
  copia.dados.empresa.nomeFantasia = `${original.dados.empresa?.nomeFantasia || 'Cliente'} (cópia)`;
  copia.dados.pasta = '';
  copia.prompt = '';
  copia.meta = null;
  estado.projetos.push(copia);
  gravarHistorico();
  renderSidebar();
  abrirPorId(copia.id);
  toast('Projeto duplicado. Ajuste os dados do novo cliente e gere o prompt.');
}

/* ------------------------------ modais ------------------------------ */

function abrirModalNovoProjeto() {
  const modal = $('#modal');
  const conteudo = $('#modal-conteudo');
  conteudo.innerHTML = `
    <h2>Novo projeto</h2>
    <p>Escolha o segmento do cliente. O modelo define estrutura de páginas, funcionalidades, tom de voz e estilo visual do prompt.</p>
    <div id="escolha-segmento">
      ${campoBuscaSegmento('busca-novo-segmento', 'contagem-novo-segmento', 'Buscar segmento')}
      ${blocosDeSegmento('escolha', '')}
    </div>
    <div class="grade" style="margin-top:18px">
      <div class="campo"><label for="novo-cliente">Nome do contato/cliente <span class="opcional">usado no nome da pasta</span></label>
        <input id="novo-cliente" type="text" placeholder="Ex.: Maria Souza" /></div>
      <div class="campo"><label for="novo-empresa">Nome da empresa</label>
        <input id="novo-empresa" type="text" placeholder="Ex.: Bella Estética" /></div>
    </div>
    <div class="modal-rodape">
      <button class="btn" id="cancelar-novo">Cancelar</button>
      <button class="btn btn-primario" id="criar-projeto" disabled>Criar projeto e gerar prompt</button>
    </div>`;

  let segmentoEscolhido = '';
  ligarBuscaSegmento(conteudo, 'busca-novo-segmento', 'contagem-novo-segmento');
  $$('[data-escolha]', conteudo).forEach((el) =>
    el.addEventListener('click', () => {
      segmentoEscolhido = el.dataset.escolha;
      $$('[data-escolha]', conteudo).forEach((b) => b.classList.toggle('selecionado', b === el));
      $('#criar-projeto').disabled = false;
    })
  );

  $('#cancelar-novo').addEventListener('click', () => { modal.hidden = true; });
  $('#criar-projeto').addEventListener('click', () => {
    const nomeContato = $('#novo-cliente').value.trim();
    const nomeFantasia = $('#novo-empresa').value.trim();
    if (!segmentoEscolhido) return toast('Escolha um segmento.', 'erro');
    if (!nomeFantasia) return toast('Informe o nome da empresa.', 'erro');
    modal.hidden = true;
    novoProjeto(segmentoEscolhido, nomeContato, nomeFantasia);
    toast('Projeto criado com os exemplos do segmento. Ajuste os dados e clique em "Gerar prompt".');
  });

  modal.hidden = false;
  $('#novo-cliente').focus();
}

function abrirModalSegmentos() {
  const modal = $('#modal');
  $('#modal-conteudo').innerHTML = `
    <h2>Modelos pré-definidos por segmento</h2>
    <p>Cada modelo reúne estrutura de páginas, funcionalidades típicas, tom de voz, estilo visual, conteúdos de exemplo e cuidados específicos do nicho.</p>
    <div id="catalogo-segmentos">
      ${campoBuscaSegmento('busca-catalogo', 'contagem-catalogo', 'Buscar segmento')}
      ${blocosDeSegmento('catalogo', '')}
    </div>
    <div class="modal-rodape"><button class="btn btn-primario" onclick="document.getElementById('modal').hidden = true">Fechar</button></div>`;
  ligarBuscaSegmento($('#modal-conteudo'), 'busca-catalogo', 'contagem-catalogo');
  modal.hidden = false;
}

function abrirModalProjeto(id) {
  const p = estado.projetos.find((x) => x.id === id);
  if (!p) return;
  const modal = $('#modal');
  $('#modal-conteudo').innerHTML = `
    <h2>${escapar(p.nome)}</h2>
    <p>${escapar(p.meta?.nomeSegmento || p.segmento)} • pasta <code>${escapar(p.nomePasta || '—')}</code> • atualizado em ${dataCurta(p.atualizadoEm)}</p>
    <div class="grade">
      <div class="campo"><span class="dica">Palavras do prompt</span><strong>${p.meta ? Number(p.meta.palavras).toLocaleString('pt-BR') : '—'}</strong></div>
      <div class="campo"><span class="dica">Páginas</span><strong>${p.meta ? p.meta.paginas.length : '—'}</strong></div>
      <div class="campo"><span class="dica">Pendências de cadastro</span><strong>${p.meta ? p.meta.faltando.length : '—'}</strong></div>
    </div>
    <div class="modal-rodape">
      <button class="btn btn-perigo" id="acao-excluir">Excluir</button>
      <button class="btn" id="acao-duplicar">Duplicar para outro cliente</button>
      <button class="btn btn-primario" id="acao-abrir">Abrir projeto</button>
    </div>`;

  $('#acao-abrir').addEventListener('click', () => { modal.hidden = true; abrirPorId(id); });
  $('#acao-duplicar').addEventListener('click', () => { modal.hidden = true; duplicarProjeto(id); });
  $('#acao-excluir').addEventListener('click', () => {
    if (confirm(`Excluir "${p.nome}" do histórico deste navegador?`)) {
      modal.hidden = true;
      excluirProjeto(id);
      toast('Projeto excluído do histórico.');
    }
  });
  modal.hidden = false;
}

/* ------------------------------ aviso do modo estático ------------------------------ */

function montarAviso() {
  if (armazenamento.ler(CHAVE_AVISO) === '1') return;
  const aviso = document.createElement('div');
  aviso.className = 'aviso-modo';
  aviso.innerHTML = `
    <span>ℹ️</span>
    <span>
      <b>Modo estático (GitHub Pages).</b> O prompt e o .zip são gerados no seu navegador, e o histórico
      fica salvo aqui${armazenamento.disponivel ? ' (localStorage)' : ' <b>apenas nesta sessão</b> — o navegador bloqueou o armazenamento local'}. Os arquivos enviados não saem do navegador e precisam ser
      re-adicionados se você recarregar a página. Para o modo completo com pastas no servidor, rode
      <code>npm start</code> localmente.
    </span>
    <button class="fechar" title="Fechar aviso">✕</button>`;
  const formulario = $('#formulario');
  formulario.parentNode.insertBefore(aviso, formulario);
  $('.fechar', aviso).addEventListener('click', () => {
    aviso.remove();
    armazenamento.gravar(CHAVE_AVISO, '1');
  });
}

/* ------------------------------ inicialização ------------------------------ */

function iniciar() {
  if (typeof MagicPromptMotor === 'undefined') {
    toast('Não foi possível carregar o motor (motor.js). Recarregue a página.', 'erro');
    return;
  }

  estado.modelos = MagicPromptMotor.listarModelos();
  estado.objetivos = MagicPromptMotor.OBJETIVOS;
  estado.estilos = MagicPromptMotor.ESTILOS_DESEJADOS;
  estado.idiomas = MagicPromptMotor.IDIOMAS;
  estado.projetos = lerHistorico();

  $('#info-versao').textContent = `v${MagicPromptMotor.versao}`;
  montarAviso();
  renderSidebar();

  $('#btn-novo').addEventListener('click', abrirModalNovoProjeto);
  $('#link-segmentos').addEventListener('click', (ev) => { ev.preventDefault(); abrirModalSegmentos(); });
  $('#btn-gerar').addEventListener('click', gerarComAviso);
  $('#busca').addEventListener('input', (ev) => { estado.busca = ev.target.value; renderSidebar(); });
  $('#modal').addEventListener('click', (ev) => { if (ev.target.id === 'modal') ev.target.hidden = true; });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') $('#modal').hidden = true; });

  $('#btn-sugerir').addEventListener('click', () => {
    if (!estado.dados?.segmento) return toast('Escolha um segmento primeiro.', 'erro');
    const sugestoes = MagicPromptMotor.sugestoesDoModelo(estado.dados.segmento);
    preencherComSugestoes(sugestoes, { apenasVazios: true });
    renderFormulario();
    agendarSalvar();
    toast('Campos vazios preenchidos com os exemplos do segmento.');
  });

  // clique com o botão direito / longo no item do histórico: menu rápido
  $('#lista-projetos').addEventListener('contextmenu', (ev) => {
    const item = ev.target.closest('.item-projeto');
    if (!item) return;
    ev.preventDefault();
    abrirModalProjeto(item.dataset.id);
  });

  if (estado.projetos.length) {
    const maisRecente = estado.projetos.slice().sort((a, b) => String(b.atualizadoEm || '').localeCompare(String(a.atualizadoEm || '')))[0];
    abrirPorId(maisRecente.id);
  }
}

document.addEventListener('DOMContentLoaded', iniciar);
