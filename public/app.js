/* =====================================================================
   Magic Prompt — interface (vanilla JS, sem build)
   ===================================================================== */
'use strict';

/* ------------------------------ estado ------------------------------ */

const estado = {
  modelos: [],
  objetivos: [],
  estilos: [],
  idiomas: [],
  projetos: [],
  projeto: null, // { id, nome, segmento, ... }
  dados: null, // dados do cliente (formulário)
  prompt: '',
  meta: null,
  arquivos: { midias: [], branding: [], conteudo: [] },
  aba: 'segmento',
  busca: '',
  salvando: false,
  timerSalvar: null,
  timerPrompt: null,
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

async function api(caminho, opcoes = {}) {
  const resposta = await fetch(`/api${caminho}`, {
    headers: opcoes.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...opcoes,
    body: opcoes.body instanceof FormData ? opcoes.body : opcoes.body ? JSON.stringify(opcoes.body) : undefined,
  });
  const texto = await resposta.text();
  let dados = null;
  try { dados = texto ? JSON.parse(texto) : null; } catch { dados = { erro: texto }; }
  if (!resposta.ok) {
    const erro = new Error((dados && dados.erro) || `Erro ${resposta.status}`);
    erro.dados = dados;
    erro.status = resposta.status;
    throw erro;
  }
  return dados;
}

function escapar(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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

function bytes(bytes) {
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

const ehImagem = (nome) => /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(nome || '');
const ehVideo = (nome) => /\.(mp4|mov|webm|m4v)$/i.test(nome || '');

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

/* ------------------------------ sidebar ------------------------------ */

function renderSidebar() {
  const lista = $('#lista-projetos');
  const termo = estado.busca.toLowerCase();
  const projetos = estado.projetos.filter((p) =>
    !termo || `${p.nome} ${p.segmento} ${p.nomePasta || ''}`.toLowerCase().includes(termo)
  );

  $('#contador-projetos').textContent = estado.projetos.length;

  if (!projetos.length) {
    lista.innerHTML = `<p class="ajuda" style="color:#8b90ae">${estado.projetos.length ? 'Nenhum resultado.' : 'Nenhum cliente cadastrado ainda.'}</p>`;
    return;
  }

  lista.innerHTML = projetos.map((p) => {
    const faltando = p.resumo?.faltando || 0;
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

function renderStepper() {
  const faltando = (estado.dados && camposPendentes()) || [];
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

/** Campos essenciais ausentes, com a aba onde ficam (usado no aviso da interface). */
function camposPendentes() {
  const d = estado.dados;
  const p = [];
  if (!d?.segmento) p.push({ aba: 'segmento', rotulo: 'Segmento de atuação' });
  if (!d?.empresa?.nomeFantasia) p.push({ aba: 'empresa', rotulo: 'Nome fantasia' });
  if (!d?.empresa?.whatsapp && !d?.empresa?.telefone && !d?.empresa?.email) p.push({ aba: 'empresa', rotulo: 'WhatsApp, telefone ou e-mail' });
  if (!d?.empresa?.endereco?.cidade) p.push({ aba: 'empresa', rotulo: 'Cidade/UF' });
  if (!d?.empresa?.horario) p.push({ aba: 'empresa', rotulo: 'Horário de atendimento' });
  if (!d?.empresa?.servicos?.length) p.push({ aba: 'empresa', rotulo: 'Serviços/produtos principais' });
  if (!d?.negocio?.descricao) p.push({ aba: 'negocio', rotulo: 'Descrição do negócio' });
  if (!d?.negocio?.publicoAlvo) p.push({ aba: 'negocio', rotulo: 'Público-alvo' });
  if (!d?.identidade?.cores?.length) p.push({ aba: 'visual', rotulo: 'Cores da identidade visual' });
  return p;
}

/* ------------------------------ formulário ------------------------------ */

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
      <div class="cartoes-segmento">
        ${estado.modelos.map((m) => `
          <button class="cartao-segmento ${m.id === d.segmento ? 'selecionado' : ''}" data-modelo="${m.id}">
            <span class="emoji">${m.emoji}</span>
            <strong>${escapar(m.nome)}</strong>
            <p>${escapar(m.resumo)}</p>
            <div class="tags">
              <span class="tag">${m.totalPaginas} páginas obrigatórias</span>
              ${m.temAgendamento ? '<span class="tag verde">agendamento</span>' : ''}
              ${m.suportaEcommerce ? '<span class="tag roxa">loja opcional</span>' : ''}
            </div>
          </button>`).join('')}
      </div>
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
        campo({ label: 'O que o cliente quer alcançar com o site', caminho: 'negocio.objetivoDetalhe', tipo: 'textarea', linhas: 2, opcional: true, placeholder: 'Ex.: receber 20 agendamentos por semana sem precisar responder no WhatsApp o dia todo.' }),
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
      <p class="ajuda">Arquivos de branding já enviados: ${
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
      <div class="card-cabecalho"><h3>Organização automática dos arquivos</h3>
        <p>Os arquivos são gravados automaticamente na pasta do cliente, dentro do sistema. Ao final, o botão <b>Baixar pasta (.zip)</b> entrega tudo pronto para usar junto com o prompt.</p></div>
      <pre class="arvore">${escapar(estado.meta?.pasta || estado.dados.pasta || 'nome_cliente_nome_empresa')}/\n├── prompt_site.txt\n├── prompt_resumo.txt\n├── LEIA-ME.txt\n├── dados-cliente.json\n├── midias/\n├── branding/\n└── conteudo/</pre>
    </div>`);

    for (const cat of categorias) {
      const arquivos = estado.arquivos[cat.id] || [];
      blocos.push(`<div class="card">
        <div class="card-cabecalho"><h3>${cat.icone} ${tituloCategoria(cat)}</h3><p>${cat.descricao}</p></div>
        <div class="zona-upload" data-upload="${cat.id}">
          <strong>Clique para escolher ou arraste os arquivos aqui</strong>
          <small>Até ${estado.limiteMB || 200} MB por arquivo • imagens, vídeos, PDF, DOCX, SVG</small>
          <input type="file" multiple hidden data-input="${cat.id}" />
        </div>
        ${arquivos.length ? `<div class="grade-arquivos">${arquivos.map((a) => miniatura(cat.id, a)).join('')}</div>` : '<p class="ajuda" style="margin-top:10px">Nenhum arquivo nesta categoria.</p>'}
      </div>`);
    }
  }

  container.innerHTML = blocos.join('');
  ligarEventosFormulario();
  renderStepper();
}

function tituloCategoria(cat) {
  return cat.titulo.replace(/\s*\(.+\)$/, '');
}

function miniatura(categoria, arquivo) {
  const url = `/api/projetos/${estado.projeto.id}/arquivos/raw?categoria=${categoria}&nome=${encodeURIComponent(arquivo.nome)}`;
  let preview = '<span>📄</span>';
  if (ehImagem(arquivo.nome)) preview = `<img src="${url}" alt="${escapar(arquivo.nome)}" loading="lazy" />`;
  else if (ehVideo(arquivo.nome)) preview = '<span>🎬</span>';
  return `<div class="arquivo">
    <div class="miniatura">${preview}</div>
    <div class="info">
      <span class="nome" title="${escapar(arquivo.nome)}">${escapar(arquivo.nome)}</span>
      <span class="meta"><span>${bytes(arquivo.bytes)}</span>
        <button class="excluir" data-excluir-arquivo="${categoria}|${escapar(arquivo.nome)}" title="Remover arquivo">🗑</button>
      </span>
    </div>
  </div>`;
}

/* ------------------------------ eventos do formulário ------------------------------ */

function ligarEventosFormulario() {
  const container = $('#formulario');

  // Inputs simples (data-path)
  $$('[data-path]', container).forEach((el) => {
    const evento = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(evento, () => {
      let valor = el.type === 'checkbox' ? el.checked : el.value;
      const caminho = el.dataset.path;
      const virtual = virtualParaReal(caminho, valor);
      if (virtual) return;
      definir(estado.dados, caminho, valor);
      agendarSalvar();
      agendarRenderPendencias();
    });
  });

  // Listas simples
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

  // Listas de objetos (campos com caminho lista.N.chave)
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

  // Cores
  const atualizarCor = (indice, campo, valor) => {
    const cores = estado.dados.identidade.cores || [];
    cores[indice] = { ...(cores[indice] || {}), [campo]: valor };
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
    toast('Paleta sugerida aplicada. Ajuste os hex se o cliente tiver cores oficiais.');
  });

  // Objetivos secundários
  $$('[data-objetivo-extra]', container).forEach((el) =>
    el.addEventListener('change', () => {
      const id = el.dataset.objetivoExtra;
      const lista = new Set(estado.dados.negocio.objetivosExtras || []);
      if (el.checked) lista.add(id); else lista.delete(id);
      estado.dados.negocio.objetivosExtras = Array.from(lista).filter((x) => x !== estado.dados.negocio.objetivo);
      agendarSalvar();
    })
  );

  // Opções de recursos
  $$('[data-opcao]', container).forEach((el) =>
    el.addEventListener('change', () => {
      estado.dados.opcoes[el.dataset.opcao] = el.checked;
      agendarSalvar();
    })
  );

  // Troca de segmento
  $$('[data-modelo]', container).forEach((el) =>
    el.addEventListener('click', () => trocarSegmento(el.dataset.modelo))
  );

  // Upload
  $$('[data-upload]', container).forEach((zona) => {
    const categoria = zona.dataset.upload;
    const input = $(`[data-input="${categoria}"]`, zona);
    zona.addEventListener('click', () => input.click());
    input.addEventListener('change', () => enviarArquivos(categoria, input.files));
    zona.addEventListener('dragover', (ev) => { ev.preventDefault(); zona.classList.add('sobre'); });
    zona.addEventListener('dragleave', () => zona.classList.remove('sobre'));
    zona.addEventListener('drop', (ev) => {
      ev.preventDefault();
      zona.classList.remove('sobre');
      if (ev.dataTransfer.files?.length) enviarArquivos(categoria, ev.dataTransfer.files);
    });
  });

  // Excluir arquivo
  $$('[data-excluir-arquivo]', container).forEach((el) =>
    el.addEventListener('click', async () => {
      const [categoria, nome] = el.dataset.excluirArquivo.split('|');
      if (!confirm(`Remover o arquivo "${nome}"? O prompt será regerado sem ele.`)) return;
      try {
        const r = await api(`/projetos/${estado.projeto.id}/arquivos?categoria=${categoria}&nome=${encodeURIComponent(nome)}`, { method: 'DELETE' });
        estado.arquivos = r.arquivos;
        if (r.prompt) atualizarPrompt(r.prompt, r.meta);
        renderFormulario();
        toast('Arquivo removido.');
      } catch (e) {
        toast(e.message, 'erro');
      }
    })
  );

  // Atalho "ir para arquivos"
  $$('[data-ir-para]', container).forEach((el) =>
    el.addEventListener('click', () => {
      estado.aba = el.dataset.irPara;
      renderFormulario();
    })
  );
}

/** Campos "virtuais" que a interface usa como texto livre e converte em listas. */
function virtualParaReal(caminho, valor) {
  const m = {
    'negocio.diferenciaisTexto': (v) => (estado.dados.negocio.diferenciais = v.split('\n').map((s) => s.trim()).filter(Boolean)),
    'conteudo.palavrasChaveTexto': (v) => (estado.dados.conteudo.palavrasChave = v.split(',').map((s) => s.trim()).filter(Boolean)),
    'conteudo.avisosTexto': (v) => (estado.dados.conteudo.avisos = v.split('\n').map((s) => s.trim()).filter(Boolean)),
  }[caminho];
  if (!m) return false;
  m(valor);
  agendarSalvar();
  return true;
}

/** Ao trocar o segmento, preenche os campos vazios com os textos do modelo. */
async function trocarSegmento(id) {
  if (estado.dados.segmento === id) return;
  const anterior = estado.dados.segmento;
  estado.dados.segmento = id;
  try {
    const modelo = await api(`/segmentos/${id}/sugestoes`);
    preencherComSugestoes(modelo, { apenasVazios: true });
    if (anterior) toast(`Modelo "${modelo.nomeSegmento}" aplicado. Campos vazios foram preenchidos com os exemplos do segmento.`);
  } catch (e) {
    toast(e.message, 'erro');
  }
  estado.dados.negocio.objetivoDetalhe = estado.dados.negocio.objetivoDetalhe || '';
  renderFormulario();
  agendarSalvar();
}

function sugerirCoresDoModelo() {
  const modelo = estado.modelos.find((m) => m.id === estado.dados.segmento);
  const paleta = modelo?.paletaSugerida;
  return (paleta || []).map((c) => ({ nome: c.nome, hex: c.hex }));
}

/** Preenche o formulário com os textos de exemplo do segmento. */
function preencherComSugestoes(sugestoes, { apenasVazios = true } = {}) {
  const d = estado.dados;
  const set = (caminho, valor) => {
    const atual = obter(d, caminho);
    const vazio = atual == null || atual === '' || (Array.isArray(atual) && atual.length === 0);
    if (apenasVazios && !vazio) return false;
    definir(d, caminho, valor);
    return true;
  };

  set('negocio.descricao', sugestoes.descricaoNegocio);
  set('negocio.publicoAlvo', sugestoes.publicoAlvo);
  set('empresa.servicos', (sugestoes.servicos || []).slice(0, 12).map((nome) => ({ nome, descricao: '', preco: '', duracao: '' })));
  set('negocio.diferenciais', sugestoes.diferenciais || []);
  set('conteudo.faq', (sugestoes.faq || []).slice(0, 8));
  set('conteudo.depoimentos', []);
  set('conteudo.palavrasChave', (sugestoes.seo?.palavrasChave || []).slice(0, 8));
  set('conteudo.seoTitulo', '');
  set('conteudo.seoDescricao', '');
  set('identidade.cores', (sugestoes.estiloVisual?.paletas?.[0]?.cores || []).map((c) => ({ nome: c.nome, hex: c.hex })));
  set('empresa.horario', '');
  if (!d.opcoes) d.opcoes = {};
  return sugestoes;
}

/* ------------------------------ salvar / gerar ------------------------------ */

function agendarSalvar() {
  const el = $('#status-salvo');
  el.textContent = 'editando…';
  el.className = 'status';
  clearTimeout(estado.timerSalvar);
  estado.timerSalvar = setTimeout(salvarSilencioso, 900);
}

async function salvarSilencioso() {
  if (!estado.projeto || estado.salvando) return;
  estado.salvando = true;
  try {
    await api(`/projetos/${estado.projeto.id}`, { method: 'PUT', body: { dados: estado.dados, somenteSalvar: true } });
    const el = $('#status-salvo');
    el.textContent = 'salvo ✓';
    el.className = 'status ok';
    const p = estado.projetos.find((x) => x.id === estado.projeto.id);
    if (p) {
      p.nome = estado.dados.empresa.nomeFantasia || estado.dados.nomeContato || 'Sem nome';
      p.nomePasta = estado.dados.pasta;
      renderSidebar();
    }
  } catch (e) {
    const el = $('#status-salvo');
    el.textContent = 'erro ao salvar';
    el.className = 'status erro';
  } finally {
    estado.salvando = false;
  }
}

/** Atualiza as pendências do stepper enquanto o usuário digita. */
function agendarRenderPendencias() {
  clearTimeout(estado.timerPrompt);
  estado.timerPrompt = setTimeout(() => renderStepper(), 500);
}

async function gerarPrompt() {
  if (!estado.projeto) return;
  const pendencias = camposPendentes().filter((p) => ['Segmento de atuação', 'Nome fantasia', 'WhatsApp, telefone ou e-mail'].includes(p.rotulo));
  if (pendencias.length) {
    toast(`Preencha antes de gerar: ${pendencias.map((p) => p.rotulo).join(', ')}.`, 'erro');
    estado.aba = pendencias[0].aba;
    renderFormulario();
    return;
  }
  const botao = $('#btn-gerar');
  botao.disabled = true;
  botao.textContent = 'gerando…';
  try {
    const r = await api(`/projetos/${estado.projeto.id}`, { method: 'PUT', body: { dados: estado.dados } });
    atualizarPrompt(r.prompt, r.meta);
    estado.projeto = r.projeto;
    estado.projetos = estado.projetos.map((p) => (p.id === r.projeto.id ? r.projeto : p));
    renderSidebar();
    renderHeader();
    renderFormulario();
    toast(`Prompt gerado: ${r.meta.palavras.toLocaleString('pt-BR')} palavras, ${r.meta.paginas.length} páginas.`);
  } catch (e) {
    if (e.status === 422 && e.dados?.erros) toast(e.dados.erros.map((x) => x.mensagem).join(' '), 'erro');
    else toast(e.message, 'erro');
  } finally {
    botao.disabled = false;
    botao.textContent = '⚡ Gerar prompt';
  }
}

/* ------------------------------ painel do prompt ------------------------------ */

function atualizarPrompt(texto, meta) {
  estado.prompt = texto;
  if (meta) {
    estado.meta = meta;
    estado.dados.pasta = meta.pasta;
  }
  renderPainelPrompt();
}

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

      ${pendencias.length ? `<div class="estatisticas"><span class="chip aviso">Pendências do formulário</span></div>` : ''}

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
      Você pode editar o texto acima antes de exportar: as alterações são salvas automaticamente.
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
      area._t = setTimeout(async () => {
        try {
          await api(`/projetos/${estado.projeto.id}/prompt`, { method: 'PUT', body: { prompt: area.value } });
          estado.prompt = area.value;
          const el = $('#status-salvo');
          el.textContent = 'prompt editado ✓';
          el.className = 'status ok';
        } catch (e) {
          toast('Não foi possível salvar o prompt editado.', 'erro');
        }
      }, 1200);
    });
  }
  const copiar = $('#btn-copiar');
  if (copiar) copiar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(estado.prompt || '');
      toast('Prompt copiado para a área de transferência.');
    } catch {
      const areaTexto = $('#prompt');
      areaTexto.select();
      document.execCommand('copy');
      toast('Prompt copiado.');
    }
  });
  const baixarTxt = $('#btn-baixar-txt');
  if (baixarTxt) baixarTxt.addEventListener('click', () => {
    const blob = new Blob([estado.prompt || ''], { type: 'text/plain;charset=utf-8' });
    baixarBlob(blob, 'prompt_site.txt');
  });
  const baixarZip = $('#btn-baixar-zip');
  if (baixarZip) baixarZip.addEventListener('click', () => {
    window.location.href = `/api/projetos/${estado.projeto.id}/download`;
    toast('Preparando o .zip com a pasta completa do cliente…');
  });
}

function baixarBlob(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------ upload ------------------------------ */

async function enviarArquivos(categoria, arquivos) {
  if (!arquivos || !arquivos.length) return;
  const form = new FormData();
  Array.from(arquivos).forEach((a) => form.append('arquivos', a, a.name));
  toast(`Enviando ${arquivos.length} arquivo(s)…`);
  try {
    const r = await api(`/projetos/${estado.projeto.id}/arquivos?categoria=${categoria}`, { method: 'POST', body: form });
    estado.arquivos = r.arquivos;
    if (r.prompt) atualizarPrompt(r.prompt, r.meta);
    renderFormulario();
    toast(`${arquivos.length} arquivo(s) salvo(s) em ${categoria}/. O prompt foi atualizado com as instruções de uso.`);
  } catch (e) {
    toast(e.message === 'Failed to fetch' ? 'Falha no envio — verifique o tamanho do arquivo.' : e.message, 'erro');
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
  const nomeEmpresa = estado.dados.empresa.nomeFantasia || '(sem nome)';
  const cidade = [estado.dados.empresa.endereco.cidade, estado.dados.empresa.endereco.estado].filter(Boolean).join('/');
  $('#titulo-projeto').textContent = nomeEmpresa;
  $('#subtitulo-projeto').textContent = [
    estado.meta?.nomeSegmento || estado.modelos.find((m) => m.id === estado.dados.segmento)?.nome || 'Segmento não definido',
    cidade,
    estado.dados.pasta,
  ].filter(Boolean).join(' • ');
  $('#btn-gerar').disabled = false;
  $('#btn-sugerir').disabled = false;
}

/* ------------------------------ abrir / criar ------------------------------ */

async function carregarProjetos() {
  const r = await api('/projetos');
  estado.projetos = r.projetos;
  renderSidebar();
}

async function abrirProjeto(id) {
  try {
    const r = await api(`/projetos/${id}`);
    estado.projeto = r.projeto;
    estado.dados = normalizarDados(r.projeto.dados || dadosVazios(r.projeto.segmento));
    estado.prompt = r.prompt || '';
    estado.meta = r.projeto.meta || null;
    estado.arquivos = r.arquivos;
    estado.aba = 'segmento';
    $('#status-salvo').textContent = '';
    $('#status-salvo').className = 'status';
    renderSidebar();
    renderHeader();
    renderFormulario();
    renderPainelPrompt();
    if (!r.prompt) toast('Projeto sem prompt gerado ainda — clique em "Gerar prompt".');
  } catch (e) {
    toast(e.message, 'erro');
  }
}

/** Garante que todas as chaves existam (compatível com dados antigos/incompletos). */
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

function abrirModalNovoProjeto() {
  const modal = $('#modal');
  const conteudo = $('#modal-conteudo');
  conteudo.innerHTML = `
    <h2>Novo projeto</h2>
    <p>Escolha o segmento do cliente. O modelo define estrutura de páginas, funcionalidades, tom de voz e estilo visual do prompt.</p>
    <div class="cartoes-segmento" id="escolha-segmento">
      ${estado.modelos.map((m) => `
        <button class="cartao-segmento" data-escolha="${m.id}">
          <span class="emoji">${m.emoji}</span>
          <strong>${escapar(m.nome)}</strong>
          <p>${escapar(m.resumo)}</p>
          <div class="tags"><span class="tag">${m.totalPaginas} páginas</span>${m.suportaEcommerce ? '<span class="tag roxa">loja opcional</span>' : ''}</div>
        </button>`).join('')}
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
  $$('[data-escolha]', conteudo).forEach((el) =>
    el.addEventListener('click', () => {
      segmentoEscolhido = el.dataset.escolha;
      $$('[data-escolha]', conteudo).forEach((b) => b.classList.toggle('selecionado', b === el));
      $('#criar-projeto').disabled = false;
    })
  );

  $('#cancelar-novo').addEventListener('click', () => { modal.hidden = true; });
  $('#criar-projeto').addEventListener('click', async () => {
    const nomeContato = $('#novo-cliente').value.trim();
    const nomeFantasia = $('#novo-empresa').value.trim();
    if (!segmentoEscolhido) return toast('Escolha um segmento.', 'erro');
    if (!nomeFantasia) return toast('Informe o nome da empresa.', 'erro');

    const dados = dadosVazios(segmentoEscolhido);
    dados.nomeContato = nomeContato;
    dados.empresa.nomeFantasia = nomeFantasia;
    dados.pasta = '';

    // Já traz os textos de exemplo do segmento para o operador não começar do zero.
    try {
      const sugestoes = await api(`/segmentos/${segmentoEscolhido}/sugestoes`);
      estado.dados = dados;
      preencherComSugestoes(sugestoes, { apenasVazios: true });
    } catch { /* segue com os dados básicos */ }

    try {
      const r = await api('/projetos', { method: 'POST', body: { dados, forcar: true } });
      modal.hidden = true;
      await carregarProjetos();
      await abrirProjeto(r.projeto.id);
      toast('Projeto criado. Complete os dados e clique em "Gerar prompt" para atualizar o texto.');
    } catch (e) {
      toast(e.message, 'erro');
    }
  });

  modal.hidden = false;
  $('#novo-cliente').focus();
}

function abrirModalSegmentos() {
  const modal = $('#modal');
  $('#modal-conteudo').innerHTML = `
    <h2>Modelos pré-definidos por segmento</h2>
    <p>Cada modelo reúne estrutura de páginas, funcionalidades típicas, tom de voz, estilo visual, conteúdos de exemplo e cuidados específicos do nicho.</p>
    <div class="cartoes-segmento">
      ${estado.modelos.map((m) => `
        <div class="cartao-segmento" style="cursor:default">
          <span class="emoji">${m.emoji}</span>
          <strong>${escapar(m.nome)}</strong>
          <p>${escapar(m.resumo)}</p>
          <div class="tags">
            ${m.paginasObrigatorias.map((p) => `<span class="tag">${escapar(p)}</span>`).join('')}
            ${m.suportaEcommerce ? '<span class="tag roxa">e-commerce opcional</span>' : ''}
          </div>
        </div>`).join('')}
    </div>
    <div class="modal-rodape"><button class="btn btn-primario" onclick="document.getElementById('modal').hidden = true">Fechar</button></div>`;
  modal.hidden = false;
}

/* ------------------------------ inicialização ------------------------------ */

async function iniciar() {
  try {
    const info = await api('/segmentos');
    estado.modelos = info.modelos;
    estado.objetivos = info.objetivos;
    estado.estilos = info.estilos;
    estado.idiomas = info.idiomas;
  } catch (e) {
    toast('Não foi possível carregar os modelos do sistema.', 'erro');
    return;
  }

  try {
    const health = await api('/health');
    estado.limiteMB = health.limiteArquivoMB;
    $('#info-versao').textContent = `v${health.versao}`;
  } catch { /* opcional */ }

  await carregarProjetos();

  $('#btn-novo').addEventListener('click', abrirModalNovoProjeto);
  $('#link-segmentos').addEventListener('click', (ev) => { ev.preventDefault(); abrirModalSegmentos(); });
  $('#btn-gerar').addEventListener('click', gerarPrompt);
  $('#busca').addEventListener('input', (ev) => { estado.busca = ev.target.value; renderSidebar(); });
  $('#modal').addEventListener('click', (ev) => { if (ev.target.id === 'modal') ev.target.hidden = true; });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') $('#modal').hidden = true; });

  $('#btn-sugerir').addEventListener('click', async () => {
    if (!estado.dados?.segmento) return toast('Escolha um segmento primeiro.', 'erro');
    const sugestoes = await api(`/segmentos/${estado.dados.segmento}/sugestoes`);
    preencherComSugestoes(sugestoes, { apenasVazios: true });
    renderFormulario();
    agendarSalvar();
    toast('Campos vazios preenchidos com os exemplos do segmento. Revise e ajuste ao cliente.');
  });

  if (estado.projetos.length) await abrirProjeto(estado.projetos[0].id);
}

document.addEventListener('DOMContentLoaded', iniciar);
