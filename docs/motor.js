/* =====================================================================
   MOTOR DO MAGIC PROMPT — bundle para navegador
   ---------------------------------------------------------------------
   ARQUIVO GERADO AUTOMATICAMENTE por scripts/build-pagina.js.
   Não edite aqui: altere server/lib/*.js e rode `npm run pagina`.

   Contém os mesmos módulos usados pelo servidor (modelos por segmento,
   motor de geração de prompt, arquivos de apoio e escritor de ZIP), com um
   carregador CommonJS e um Buffer mínimo para rodar no navegador.
   ===================================================================== */


(function (global) {
  'use strict';

  /* ------------------------- Buffer para navegador ------------------------- */
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

  /* --------------------- Shims de módulos do Node --------------------- */
  var MODULOS_NATIVOS = {
    crypto: function (module) {
      // Usado apenas por utils.novoId(): gera identificadores locais.
      module.exports = {
        randomUUID: function () {
          if (global.crypto && typeof global.crypto.randomUUID === 'function') return global.crypto.randomUUID();
          if (global.crypto && typeof global.crypto.getRandomValues === 'function') {
            var b = new Uint8Array(16);
            global.crypto.getRandomValues(b);
            b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
            var hex = [];
            for (var i = 0; i < 16; i++) hex.push((b[i] + 0x100).toString(16).slice(1));
            return hex.slice(0, 4).join('') + '-' + hex.slice(4, 6).join('') + '-' + hex.slice(6, 8).join('') + '-' + hex.slice(8, 10).join('') + '-' + hex.slice(10, 16).join('');
          }
          return 'id-' + Date.now().toString(16) + Math.random().toString(16).slice(2, 10);
        },
      };
    },
  };

  /* ------------------------ Módulos do motor ------------------------ */
  var REGISTRO = {};

  REGISTRO['utils'] = function (module, exports, require) {
'use strict';

const crypto = require('crypto');

/** Remove acentos, espaços e caracteres inválidos para nome de pasta/arquivo. */
function slug(texto, opcoes = {}) {
  const { separador = '-', minusculo = true, vazio = 'cliente' } = opcoes;
  let s = String(texto == null ? '' : texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, separador)
    .replace(new RegExp(`\\${separador}{2,}`, 'g'), separador)
    .replace(new RegExp(`^\\${separador}|\\${separador}$`, 'g'), '');
  if (minusculo) s = s.toLowerCase();
  return s || vazio;
}

/** Nome de arquivo seguro, preservando a extensão. */
function nomeArquivoSeguro(nome) {
  const base = String(nome || 'arquivo');
  const ponto = base.lastIndexOf('.');
  const ext = ponto > 0 ? base.slice(ponto) : '';
  const raiz = ponto > 0 ? base.slice(0, ponto) : base;
  return slug(raiz, { separador: '-', vazio: 'arquivo' }) + ext.toLowerCase().replace(/[^a-z0-9.]/g, '');
}

/**
 * Nome da pasta do cliente no padrão pedido: nome_cliente_nome_empresa
 * Ex.: "maria-souza_bella-estetica"
 */
function pastaDoCliente(nomeContato, nomeEmpresa) {
  const empresa = slug(nomeEmpresa, { separador: '-', vazio: 'empresa' });
  const contato = nomeContato ? slug(nomeContato, { separador: '-', vazio: '' }) : '';
  return contato ? `${contato}_${empresa}` : empresa;
}

function novoId() {
  return crypto.randomUUID();
}

function agora() {
  return new Date().toISOString();
}

/** Data legível pt-BR: 29/09/2026 às 14h30 */
function dataLegivel(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} às ${p(d.getHours())}h${p(d.getMinutes())}`;
}

function dataCurta(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Junta apenas as partes não vazias com um separador. */
function juntar(partes, separador = ' • ') {
  return (partes || []).map((p) => (p == null ? '' : String(p).trim())).filter(Boolean).join(separador);
}

/** Lista em linguagem natural: "a, b e c" */
function listarTexto(itens, ultimo = ' e ') {
  const lista = (itens || []).filter(Boolean);
  if (lista.length === 0) return '';
  if (lista.length === 1) return lista[0];
  return lista.slice(0, -1).join(', ') + ultimo + lista[lista.length - 1];
}

function texto(v) {
  return v == null ? '' : String(v).trim();
}

function temTexto(v) {
  return texto(v).length > 0;
}

/** Só dígitos — usado para montar links de WhatsApp/telefone. */
function apenasDigitos(v) {
  return String(v == null ? '' : v).replace(/\D/g, '');
}

/** Converte "11 98888-7777" em valor E.164 brasileiro (5511988887777). */
function telefoneInternacional(v) {
  const d = apenasDigitos(v);
  if (!d) return '';
  if (d.startsWith('55') && d.length >= 12) return d;
  if (d.length >= 10) return `55${d}`;
  return d;
}

function formatarTelefone(v) {
  const d = apenasDigitos(v).replace(/^55/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return texto(v);
}

function normalizarUrl(url) {
  const u = texto(url);
  if (!u) return '';
  if (/^(https?:)?\/\//i.test(u)) return u.startsWith('//') ? `https:${u}` : u;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(u)) return `https://${u}`;
  return u;
}

/** Valida hex de cor (#RGB ou #RRGGBB). */
function hexValido(hex) {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(texto(hex));
}

function tamanhoLegivel(bytes) {
  const b = Number(bytes) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

module.exports = {
  slug,
  nomeArquivoSeguro,
  pastaDoCliente,
  novoId,
  agora,
  dataLegivel,
  dataCurta,
  juntar,
  listarTexto,
  texto,
  temTexto,
  apenasDigitos,
  telefoneInternacional,
  formatarTelefone,
  normalizarUrl,
  hexValido,
  tamanhoLegivel,
};
  };

  REGISTRO['segmentos'] = function (module, exports, require) {
'use strict';

/**
 * MODELOS PRÉ-DEFINIDOS POR SEGMENTO DE ATUAÇÃO
 * --------------------------------------------
 * Cada modelo é a "especificação básica" reutilizável de um nicho: estrutura de
 * páginas, funcionalidades típicas, tom de voz, estilo visual, conteúdos de
 * exemplo, SEO e cuidados específicos.
 *
 * O gerador de prompt (server/lib/prompt-engine.js) combina este modelo com os
 * dados preenchidos para cada cliente e produz o prompt final.
 *
 * Para criar um novo nicho: copie um objeto e ajuste os campos. Nada mais.
 */

/* ------------------------------------------------------------------ *
 * Blocos reutilizáveis de página
 * ------------------------------------------------------------------ */

const paginaSobre = (extras = [], dica = '') => ({
  nome: 'Sobre',
  obrigatoria: true,
  objetivo:
    'Gerar confiança e mostrar quem está por trás da empresa, desde quando atua e o que a torna diferente.',
  secoes: [
    'História da empresa (ano de fundação, trajetória, missão) em 2 a 3 parágrafos',
    'Apresentação do(a) responsável / fundadores com foto',
    'Missão, visão e valores em cards curtos',
    'Números de credibilidade (anos de mercado, clientes atendidos, profissionais)',
    'Estrutura física / ambiente em fotos',
    'Selos e certificações relevantes do segmento',
    ...extras,
  ],
  dica:
    dica ||
    'Use linguagem humana em primeira pessoa do plural ("nós cuidamos"). Evite texto genérico de "empresa que preza pela qualidade".',
});

const paginaDepoimentos = (extras = []) => ({
  nome: 'Depoimentos',
  obrigatoria: false,
  objetivo: 'Prova social: reduzir a hesitação de quem está decidindo.',
  secoes: [
    'Grade de depoimentos com nome, foto (opcional), nota e texto curto',
    'Avaliações do Google (embed/prints)',
    'Nota média em destaque e link "Avaliar no Google"',
    'Carrossel de prints de conversas do WhatsApp (com autorização)',
    ...extras,
  ],
  dica: 'Depoimento sem nome próprio e sem contexto perde força. Prefira poucos e verdadeiros.',
});

const paginaFaq = (extras = []) => ({
  nome: 'Perguntas Frequentes (FAQ)',
  obrigatoria: false,
  objetivo: 'Reduzir o volume de dúvidas repetidas no atendimento e melhorar o SEO.',
  secoes: [
    'Acordeão com 8 a 12 perguntas mais comuns',
    'Cada resposta em até 3 frases, com CTA quando fizer sentido',
    'Marcação de dados estruturados FAQPage (schema.org)',
    ...extras,
  ],
  dica: 'Escreva as perguntas como o cliente perguntaria no WhatsApp: "quanto custa?", "dói?".',
});

const paginaContato = (extras = [], dica = '') => ({
  nome: 'Contato',
  obrigatoria: true,
  objetivo: 'Transformar visita em conversa, com o menor atrito possível.',
  secoes: [
    'Telefone e WhatsApp com links clicáveis (wa.me e tel:)',
    'Formulário de contato curto (nome, telefone/e-mail, mensagem) com aviso de privacidade (LGPD)',
    'Endereço completo com Google Maps incorporado',
    'Horário de atendimento por dia da semana (destacando feriados e plantões)',
    'E-mail e redes sociais',
    'Bloco "como chegar" com referências de pontos conhecidos e opções de transporte/estacionamento',
    ...extras,
  ],
  dica: dica || 'O formulário deve enviar e-mail e/ou WhatsApp automaticamente e ter proteção anti-spam.',
});

const paginaPolitica = () => ({
  nome: 'Política de Privacidade',
  obrigatoria: true,
  objetivo: 'Conformidade com a LGPD e com políticas de anúncios/análise.',
  secoes: [
    'Quais dados são coletados (formulários, cookies, analytics)',
    'Finalidade do tratamento e base legal',
    'Compartilhamento com terceiros (WhatsApp, Google, ferramentas de agendamento)',
    'Direitos do titular e canal de contato do encarregado',
    'Política de cookies com banner de consentimento',
  ],
  dica: 'Incluir link no rodapé de todas as páginas e no rodapé do formulário.',
});

const paginaBlog = (extras = [], dica = '') => ({
  nome: 'Blog / Dicas',
  obrigatoria: false,
  objetivo: 'Atrair tráfego orgânico de longo prazo e educar o público.',
  secoes: [
    'Listagem de posts com imagem, título, resumo e data',
    'Página de artigo com índice, imagens e CTA ao final',
    'Categorias ligadas aos serviços principais',
    'Bloco "posts relacionados" e compartilhamento social',
    ...extras,
  ],
  dica:
    dica ||
    'Sugerir 6 pautas iniciais já otimizadas para busca local. Ex.: "quanto custa [serviço] em [cidade]".',
});

const paginaGaleria = (extras = [], dica = '') => ({
  nome: 'Galeria',
  obrigatoria: true,
  objetivo: 'Mostrar trabalhos reais — o principal fator de decisão do segmento.',
  secoes: [
    'Grade de fotos em alta resolução com filtro por categoria',
    'Lightbox com navegação e legenda',
    'Vídeos curtos (Reels/YouTube) incorporados',
    'CTA fixo ao final da galeria ("agende seu horário")',
    ...extras,
  ],
  dica:
    dica ||
    'Usar somente imagens próprias e nítidas. Otimizar para WebP e incluir texto alternativo descritivo para SEO.',
});

const paginaEquipe = (extras = [], dica = '') => ({
  nome: 'Equipe',
  obrigatoria: false,
  objetivo: 'Humanizar a marca e valorizar a qualificação técnica dos profissionais.',
  secoes: [
    'Cards com foto, nome, cargo, especialidades e tempo de experiência',
    'Formação, cursos e certificações de cada profissional',
    'Botão "agendar com [profissional]"',
    'Link para o Instagram profissional, quando houver',
    ...extras,
  ],
  dica: dica || 'Se o cliente não tiver fotos, orientar sessão fotográfica ou usar imagens em tratamento neutro.',
});

const paginaAgendamento = (extras = [], dica = '') => ({
  nome: 'Agendamento',
  obrigatoria: true,
  objetivo: 'Permitir que o cliente marque horário sozinho, 24 horas por dia.',
  secoes: [
    'Seleção de serviço (com duração e valor)',
    'Seleção de profissional (quando o cliente exigir)',
    'Calendário com horários disponíveis em tempo real',
    'Formulário com nome, WhatsApp e observações',
    'Resumo antes de confirmar e confirmação imediata por WhatsApp/e-mail',
    'Instruções de preparo/chegada e política de cancelamento',
    ...extras,
  ],
  dica:
    dica ||
    'Deixar always-visible um botão "Agendar agora" no topo e um botão flutuante de WhatsApp em todas as páginas.',
});

const paginaLoja = (segmento, extras = []) => ({
  nome: 'Loja',
  obrigatoria: true,
  objetivo: 'Vender produtos online com o mínimo de fricção, integrado ao restante do site.',
  secoes: [
    'Home da loja com vitrines: mais vendidos, lançamentos, kits e promoções',
    'Listagem com filtros (categoria, preço, marca, porte/tamanho) e ordenação',
    'Página de produto com galeria, variações, avaliações, descrição e frete calculado',
    'Carrinho lateral e página de checkout com Pix, cartão e boleto',
    'Página de obrigado / pedido confirmado, com próximos passos e link de rastreio',
    'Central de ajuda: entregas, prazos, trocas, devoluções e formas de pagamento',
    ...(extras || []),
  ],
  dica: `${segmento}: cadastrar de 20 a 40 produtos-semente para a loja não nascer vazia, com fotos em fundo neutro.`,
});

/* ------------------------------------------------------------------ *
 * Blocos reutilizáveis — construção, imóveis e decoração
 * ------------------------------------------------------------------ */

const paginaOrcamento = (extras = [], dica = '') => ({
  nome: 'Orçamento',
  obrigatoria: true,
  objetivo: 'Transformar a visita em um pedido de orçamento qualificado, com o mínimo de idas e vindas.',
  secoes: [
    'Formulário em etapas curtas (3 a 5 campos por tela): escopo, prazo, faixa de investimento e dados de contato',
    'Upload de arquivos de apoio (planta, matrícula, fotos, briefing) com formatos e limite de tamanho informados',
    'Explicação do que acontece depois do envio: quem responde, em quanto tempo e quais são os próximos passos',
    'Alternativa "falar agora no WhatsApp" com mensagem pré-preenchida',
    'Prova de credibilidade ao lado do formulário (obras entregues, tempo de mercado, avaliações)',
    'Confirmação de recebimento por e-mail/WhatsApp com o resumo do que foi enviado',
    ...extras,
  ],
  dica: dica || 'Peça apenas o que é decisivo para orçar: cada campo a mais derruba a taxa de envio.',
});

const paginaProjetos = (extras = [], dica = '', nome = 'Projetos') => ({
  nome,
  obrigatoria: true,
  objetivo: 'Provar competência com trabalhos reais — é o que decide a escolha neste mercado.',
  secoes: [
    'Grade de trabalhos com foto de capa, tipo, local e ano',
    'Filtros por categoria (tipo de obra/serviço, porte, região)',
    'Página de cada trabalho: contexto, desafio, solução, imagens, ficha técnica e depoimento do cliente',
    'Antes/depois com a mesma angulação de câmera nas reformas e intervenções',
    'Detalhes técnicos e números do trabalho (metragem, prazo, materiais ou equipamentos)',
    ...extras,
  ],
  dica: dica || 'Poucos trabalhos bem documentados valem mais que muitos com uma foto só. Mostre o antes.',
});

const paginaProcesso = (extras = [], dica = '') => ({
  nome: 'Como Funciona',
  obrigatoria: true,
  objetivo: 'Reduzir o medo de contratar: deixar claro o que acontece em cada etapa, o prazo e o que se espera do cliente.',
  secoes: [
    'Linha do tempo com todas as etapas, do primeiro contato à entrega',
    'O que o cliente precisa decidir ou entregar em cada etapa',
    'Prazos médios por etapa e o que pode alterá-los',
    'Como funcionam orçamento, formas de pagamento e medições',
    'Documentação e responsabilidade técnica (contrato, ART/RRT, laudos, garantias)',
    'Canais de acompanhamento do andamento durante o trabalho',
    ...extras,
  ],
  dica: dica || 'Transparência de processo é o principal argumento contra "o amigo que faz mais barato".',
});

const paginaAmbientes = (extras = [], dica = '') => ({
  nome: 'Ambientes',
  obrigatoria: true,
  objetivo: 'Mostrar combinações prontas que inspiram o cliente e vendem vários itens de uma vez.',
  secoes: [
    'Grade de ambientes (sala, quarto, cozinha, varanda, escritório) com o estilo identificado',
    'Cada ambiente ligado aos itens usados na composição, com preço e botão "comprar o ambiente"',
    'Filtros por estilo, cor predominante, ambiente e faixa de preço',
    'Bloco antes/depois do mesmo espaço com a legenda do que mudou',
    'CTA para o cliente enviar a foto do ambiente dele e receber uma sugestão',
    ...extras,
  ],
  dica: dica || 'O "ambiente completo com um clique" é o maior gerador de ticket médio em decoração.',
});

const paginaImoveis = (extras = []) => ({
  nome: 'Buscar Imóveis',
  obrigatoria: true,
  objetivo: 'Busca sem atrito: o visitante encontra o imóvel certo em poucos filtros e no celular.',
  secoes: [
    'Busca com filtros: tipo, bairro, faixa de preço, quartos, suítes, vagas, área, aceita pet, mobiliado',
    'Cards com foto principal, preço, condomínio, IPTU, metragem, bairro e selos (lançamento, exclusivo, aluguel)',
    'Ordenação (mais recentes, menor preço, maior área) e alternância entre grade e lista',
    'Mapa com os imóveis agrupados, desenho de área de interesse e busca "perto de mim"',
    'Favoritos, comparação lado a lado e compartilhamento por WhatsApp',
    'Estado vazio útil quando não houver resultado: alerta de novos imóveis com os filtros salvos',
    ...extras,
  ],
  dica: 'Fotos na ordem em que o cliente entra (fachada, sala, dormitórios, banheiros, cozinha, área externa) aumentam os contatos.',
});

const paginaFichaImovel = (extras = []) => ({
  nome: 'Ficha do Imóvel',
  obrigatoria: true,
  noMenu: true,
  objetivo: 'Página individual de cada imóvel: dar tudo o que o cliente precisa para decidir a visita.',
  secoes: [
    'Galeria em alta resolução, vídeo e tour virtual quando houver',
    'Dados completos: área útil e total, quartos, suítes, banheiros, vagas, andar, condomínio, IPTU, matrícula e situação de ocupação',
    'Descrição do imóvel e do entorno (comércio, escolas, transporte, lazer)',
    'Mapa do entorno com localização aproximada — sem expor o endereço exato em imóvel vazio',
    'Calculadora estimada de custos: entrada, parcela do financiamento, ITBI, escritura e condomínio',
    'Botões fixos no celular: WhatsApp do corretor, ligar e agendar visita',
    'Bloco de imóveis semelhantes e opção de receber novas opções por e-mail/WhatsApp',
    ...extras,
  ],
  dica: 'Página acessada pela busca, não pelo menu. Cuidado com dados sensíveis: nenhum dado do proprietário aparece publicamente.',
});

const paginaAnuncie = (extras = []) => ({
  nome: 'Anuncie seu Imóvel',
  obrigatoria: true,
  objetivo: 'Captar imóveis de proprietários — a outra metade do negócio imobiliário.',
  secoes: [
    'Formulário de cadastro do imóvel: tipo, endereço, características, ocupação atual e intenção (venda ou locação)',
    'Upload de fotos e documentos (matrícula, IPTU, planta) com orientação de privacidade',
    'Como funciona a avaliação: método, dados usados, prazo de resposta e quem analisa',
    'Argumentos de confiança: autorização formal, sigilo dos dados, histórico de vendas na região e anúncio nos portais',
    'Alternativa "quero uma avaliação por WhatsApp" com mensagem pronta',
    ...extras,
  ],
  dica: 'Dizer quem verá os dados e o que acontece depois do envio reduz a desconfiança do proprietário.',
});

const paginaAgendarVisita = (extras = [], dica = '') => ({
  nome: 'Agendar Visita',
  obrigatoria: true,
  objetivo: 'Marcar a visita ao imóvel, decorado ou plantão de vendas com o corretor certo, sem troca de mensagens.',
  secoes: [
    'Escolha do imóvel/empreendimento e do corretor responsável',
    'Calendário com horários disponíveis, incluindo sábados e horários fora do comercial',
    'Formulário curto: nome, WhatsApp, e-mail, melhor período e observações',
    'Confirmação imediata com endereço, ponto de encontro, documentos necessários e link do mapa',
    'Orientações rápidas: chegada, estacionamento, duração da visita e acompanhamento de familiares',
    'Opção "ainda não sei o dia — quero receber novidades sobre este imóvel"',
    ...extras,
  ],
  dica: dica || 'Confirmação por WhatsApp com lembrete no dia anterior derruba muito o índice de faltas.',
});

const paginaEmpreendimento = (extras = []) => ({
  nome: 'O Empreendimento',
  obrigatoria: true,
  objetivo: 'Apresentar conceito, diferenciais e tipologias do lançamento de forma clara e rápida.',
  secoes: [
    'Conceito e assinatura (incorporadora e arquiteto responsável) em texto curto e visual',
    'Diferenciais em cards: localização, lazer, tipologias, tecnologia e sustentabilidade',
    'Resumo do projeto: torres, pavimentos, unidades por andar, vagas e previsão de entrega',
    'Ficha técnica: endereço, área do terreno, metragens, tipologias e número de unidades',
    'Memorial resumido de acabamentos e itens de série',
    'Comparativo de tipologias (metragem, dormitórios, suítes, vagas e condição "a partir de")',
    ...extras,
  ],
  dica: 'A ficha técnica também alimenta o SEO: o cliente busca por metragem e bairro, não pelo nome do empreendimento.',
});

const paginaLazer = (extras = []) => ({
  nome: 'Lazer e Áreas Comuns',
  obrigatoria: true,
  objetivo: 'Vender o estilo de vida — o argumento que mais pesa na compra de um lançamento.',
  secoes: [
    'Galeria de imagens das áreas comuns com legenda do que é cada espaço',
    'Blocos por categoria: lazer, esporte, bem-estar, trabalho, pet e social',
    'Pranchas descritivas com metragem e capacidade de cada espaço',
    'Serviços e conveniências opcionais (coworking, lavanderia compartilhada, delivery, pet place)',
    'Vídeo ou tour 360 do decorado, quando existir',
    ...extras,
  ],
  dica: 'Deixar claro que as imagens são ilustrativas é exigência legal e evita conflito na entrega.',
});

const paginaLocalizacao = (extras = []) => ({
  nome: 'Localização',
  obrigatoria: true,
  objetivo: 'Provar o valor da região com fatos e deslocamentos reais, não com adjetivos.',
  secoes: [
    'Mapa interativo com o ponto do imóvel/empreendimento',
    'Lista de comércio, escolas, hospitais, parques e transporte com distância e tempo de deslocamento (a pé e de carro)',
    'Fotos do entorno em horários diferentes (manhã, tarde, noite)',
    'Obras e melhorias de infraestrutura previstas na região, sempre com a fonte do dado',
    'Texto sobre o bairro: perfil dos moradores, serviços, segurança e tendência de valorização',
    ...extras,
  ],
  dica: 'Distância "a pé" convence mais que "a poucos minutos de carro". Todo dado precisa de fonte.',
});

const paginaUnidades = (extras = []) => ({
  nome: 'Unidades Disponíveis',
  obrigatoria: false,
  objetivo: 'Mostrar o que ainda está disponível e direcionar a visita à unidade certa.',
  secoes: [
    'Tabela de unidades: tipologia, andar, posição solar, metragem, vagas, valor e condição de pagamento',
    'Filtros por tipologia, andar, posição e faixa de preço',
    'Indicação visual do que está disponível, reservado e vendido',
    'Botão "falar com consultor" em cada unidade',
    'Aviso de que valores e disponibilidade são atualizados com frequência e podem mudar sem aviso',
    ...extras,
  ],
  dica: 'Com CRM ou espelho de vendas integrado, o site deixa de anunciar unidade já vendida.',
});

const paginaTourVirtual = (extras = [], dica = '') => ({
  nome: 'Tour Virtual',
  obrigatoria: false,
  objetivo: 'Deixar o cliente caminhar pelo espaço sem sair de casa — e chegar na visita já decidido.',
  secoes: [
    'Tour 360 incorporado (decorado, obra ou imóvel pronto), com opção de tela cheia',
    'Pontos de interesse marcados com etiquetas e explicações curtas',
    'Planta baixa interativa ligada ao tour',
    'Alternativa em vídeo para quem não consegue carregar o 360',
    'CTA de agendamento da visita presencial ao final do tour',
    ...extras,
  ],
  dica: dica || 'O tour não substitui a visita: ele serve para o cliente chegar querendo negociar.',
});

const paginaFinanciamento = (extras = [], dica = '') => ({
  nome: 'Financiamento e Simulação',
  obrigatoria: true,
  objetivo: 'Tirar a dúvida financeira antes do contato — é ela que trava a maioria das decisões.',
  secoes: [
    'Simulador com valor do imóvel, entrada, prazo, juros e sistema de amortização (SAC/Price)',
    'Resultado com parcela inicial, parcela final, total de juros e renda mínima sugerida',
    'Passo a passo do financiamento: análise de crédito, documentação, avaliação do imóvel e assinatura',
    'Documentos necessários por perfil (assalariado, autônomo, MEI, empresário)',
    'Custos além do imóvel: ITBI, escritura, registro, avaliação e condomínio/IPTU',
    'Formas de pagamento alternativas: fluxo de obra, permuta, consórcio e financiamento direto',
    'Aviso de que a simulação é uma estimativa e não representa aprovação de crédito',
    ...extras,
  ],
  dica: dica || 'Taxas e condições devem indicar a data de referência ("simulação com juros de julho/2026").',
});

const paginaDocumentos = (extras = []) => ({
  nome: 'Documentos e Transparência',
  obrigatoria: true,
  objetivo: 'Dar segurança jurídica ao comprador e reduzir objeções antes da conversa com o corretor.',
  secoes: [
    'Registro de incorporação, memorial descritivo e quadro de áreas (download em PDF)',
    'Documentação da construtora/incorporadora e certidões relevantes',
    'Tabela de pagamento, reajustes, juros de obra e regras de repasse',
    'Regras de compra: reserva, proposta, contrato, prazo de entrega e tolerâncias legais',
    'Perguntas jurídicas frequentes com respostas curtas',
    ...extras,
  ],
  dica: 'Com documentos públicos no site, o corretor deixa de responder dúvidas jurídicas por WhatsApp.',
});

/* ------------------------------------------------------------------ *
 * MODELOS
 * ------------------------------------------------------------------ */

const MODELOS = [
  /* ============================== 1. ESTÉTICA ============================== */
  {
    id: 'estetica',
    nome: 'Centro de Estética e Beleza',
    emoji: '✨',
    area: 'Beleza',
    setor: 'estética e beleza',
    genero: 'f',
    termoBusca: 'clínica de estética',
    schemaOrg: 'BeautySalon',
    resumo: 'Clínicas e centros de estética com procedimentos faciais e corporais.',
    suportaEcommerce: true,
    temAgendamento: true,
    objetivoRecomendado: 'agendamento',
    descricaoNegocioPadrao:
      'centro de estética especializado em procedimentos faciais e corporais, com atendimento personalizado e protocolos conduzidos por profissionais qualificados',
    publicoAlvoPadrao:
      'Mulheres de 25 a 55 anos, das classes A/B, que buscam autocuidado, prevenção de rugas e tratamentos corporais; tomam decisão pelo Instagram e por indicação, valorizam segurança, ambiente agradável e resultado visível.',
    tomDeVoz: {
      personalidade: ['Sofisticado, mas acessível', 'Seguro e técnico sem ser frio', 'Acolhedor e empático', 'Focado em resultado'],
      regras: [
        'Explicar o benefício antes de citar a técnica ("pele uniforme" antes de "peeling de diamante")',
        'Evitar promessas absolutas de resultado e comparações com concorrentes',
        'Usar "você" e linguagem de cuidado; nunca infantilizar',
        'Sempre sinalizar avaliação profissional prévia quando o procedimento exigir',
        'Preferir frases curtas e respiros de leitura em vez de blocos densos',
      ],
      evitar: [
        'Termos alarmistas ("rejuvenesça 20 anos")',
        'Promessa de resultado garantido (risco ético/legal)',
        'Jargão clínico sem explicação',
        'Excesso de emojis e caps lock',
      ],
      exemplos: [
        'Título de home: "Estética que respeita o seu tempo e a sua pele"',
        'Subtítulo: "Protocolos personalizados para pele, corpo e autoestima — em [CIDADE]."',
        'CTA: "Agendar avaliação" / "Falar com uma especialista"',
      ],
    },
    estiloVisual: {
      estilos: ['Sofisticado', 'Minimalista clean', 'Clean-clínico com toques quentes'],
      paletas: [
        {
          nome: 'Nude & Rosé',
          descricao: 'Elegância atemporal, combina com fotos de pele',
          cores: [
            { nome: 'Areia', hex: '#EFE6DD' },
            { nome: 'Nude', hex: '#D9C3B0' },
            { nome: 'Rosé', hex: '#C98B8B' },
            { nome: 'Grafite', hex: '#3B3B3B' },
            { nome: 'Branco', hex: '#FFFFFF' },
          ],
        },
        {
          nome: 'Verde Spa',
          descricao: 'Sensação de calma, cuidado e natureza',
          cores: [
            { nome: 'Verde suave', hex: '#8FA68E' },
            { nome: 'Verde profundo', hex: '#2F4F4F' },
            { nome: 'Off-white', hex: '#F7F6F2' },
            { nome: 'Dourado', hex: '#C6A87C' },
            { nome: 'Grafite', hex: '#2B2B2B' },
          ],
        },
      ],
      tipografia: {
        titulos: 'Serifada elegante (Cormorant Garamond, Playfair Display) ou sans humanista (Poppins)',
        corpo: 'Sans-serif leve e legível (Inter, Lato, Montserrat) em 16–18px com bom espaçamento',
      },
      diretrizes: [
        'Muito espaço em branco — o layout não pode parecer "cheio"',
        'Fotos de pele e rostos em luz natural suave, sem filtros pesados',
        'Ícones de linha fina, nunca ícones infantis',
        'Botões com cantos suavemente arredondados e sombra discreta',
        'Nada de cores saturadas de fundo que atrapalhem a percepção da pele',
      ],
      imagensIdeais: [
        'Antes/depois autorizados (com aviso de que os resultados variam)',
        'Close de pele, aplicação de produto, ambiente de sala',
        'Retrato da especialista em contexto de atendimento',
        'Detalhes: toalhas, ativos, equipamentos, aroma',
      ],
      evitar: ['Estoque com imagens genéricas de banco de imagens', 'Montagens exageradas', 'Fundo preto pesado'],
    },
    paginas: [
      {
        nome: 'Home',
        obrigatoria: true,
        objetivo: 'Gerar desejo e encaminhar para o agendamento em poucos segundos.',
        secoes: [
          'Banner principal (hero) com foto de pele/ambiente + título de benefício + CTA "Agendar avaliação"',
          'Faixa de prova social: nota no Google, nº de clientes, anos de atuação',
          'Procedimentos em destaque (6 cards com ícone/foto, nome, duração e "saiba mais")',
          'Como funciona: avaliação → protocolo personalizado → acompanhamento (3 passos)',
          'Diferenciais / por que escolher (4 a 6 itens curtos)',
          'Antes e depois (carrossel com comparador de arrastar)',
          'Depoimentos em carrossel',
          'Profissionais em destaque',
          'Perguntas frequentes resumidas (6 itens)',
          'Bloco final de CTA com WhatsApp + mapa + horários',
          'Rodapé com NAP completo, redes sociais e política de privacidade',
        ],
        dica: 'CTA principal no primeiro scroll; botão de WhatsApp flutuante fixo em todas as telas.',
      },
      {
        nome: 'Procedimentos',
        obrigatoria: true,
        objetivo: 'Detalhar cada serviço e qualificar o agendamento.',
        secoes: [
          'Cabeçalho com categorias: Facial, Corporal, Depilação, Injetáveis, Sobrancelhas',
          'Cards de procedimento com nome, indicação, duração, nº de sessões e valor "a partir de"',
          'Página/seção individual por procedimento: o que é, para quem é, como é a sessão, cuidados pós, retorno',
          'Aviso de que a indicação depende de avaliação profissional',
          'CTA de agendamento em cada bloco',
        ],
        dica: 'Se preço não for divulgado, usar "consulte valores" e manter o CTA de avaliação gratuita.',
      },
      {
        nome: 'Resultados',
        obrigatoria: true,
        objetivo: 'Prova visual — o conteúdo mais consultado nesse segmento.',
        secoes: [
          'Grade de antes/depois com filtro por procedimento',
          'Comparador interativo (arrastar para revelar)',
          'Legenda com procedimento, nº de sessões e intervalo',
          'Selo "resultados variam conforme cada organismo"',
          'Depoimento textual associado a cada caso',
        ],
        dica: 'Só publicar imagens com termo de autorização de uso de imagem assinado.',
      },
      paginaSobre([], 'Mencionar formação/registro dos profissionais e protocolos exclusivos.'),
      paginaEquipe([
        'Especialidades por profissional (ex.: estética facial, corporal, laser)',
        'Registro profissional quando aplicável (ex.: biomédica esteta, farmacêutica)',
      ]),
      paginaDepoimentos(['Vídeos curtos de clientes (opcional)']),
      {
        nome: 'Agendamento',
        obrigatoria: true,
        objetivo: 'Coletar a marcação com os dados mínimos para confirmar.',
        secoes: [
          'Escolha do procedimento (com duração estimada)',
          'Escolha de profissional (opcional) e unidade',
          'Calendário com horários livres',
          'Campos: nome, WhatsApp, e-mail, observações, como conheceu a clínica',
          'Checkbox de consentimento LGPD e política de cancelamento (24h)',
          'Confirmação imediata por WhatsApp com instruções de preparo',
          'Formulário de anamnese pré-atendimento (desejável): alergias, gestação, medicamentos, procedimentos recentes',
        ],
        dica: 'Enviar lembrete automático 24h antes para reduzir faltas (no-show).',
      },
      paginaFaq([
        'As sessões doem?',
        'Preciso de avaliação antes de fechar?',
        'Quantas sessões vou precisar?',
        'Posso fazer em qualquer época do ano?',
      ]),
      paginaGaleria(['Fotos de ambiente, recepção e cabines']),
      paginaBlog([
        'Pautas: "como preparar a pele antes de um evento", "mitos sobre peeling", "o que é microagulhamento"',
      ]),
      paginaContato(['WhatsApp com resposta automática de horário de atendimento']),
      paginaPolitica(),
      paginaLoja('Estética', [
        'Categorias: skincare, kits de tratamento, suplementos, cartão-presente (voucher de sessão)',
      ]),
    ],
    funcionalidades: {
      essenciais: [
        'Agendamento online com integração de calendário e confirmação automática',
        'Botão flutuante de WhatsApp com mensagem pré-preenchida por página',
        'Formulário de captação com consentimento LGPD',
        'Google Maps incorporado + botão "traçar rota"',
        'Galeria de antes/depois com comparador',
        'Feed do Instagram (últimas 6 a 9 publicações)',
        'Painel simples de horários e bloqueio de agenda',
        'SEO local + dados estruturados LocalBusiness',
      ],
      desejaveis: [
        'Pré-anamnese digital salva por cliente',
        'Pacotes e assinaturas (ex.: 4 sessões de drenagem por mês)',
        'Programa de indicação ("indique uma amiga e ganhe")',
        'Cartão-presente / voucher digital',
        'Lembretes automáticos por WhatsApp 24h antes',
        'Blog com conteúdo de autocuidado',
      ],
      integracoes: ['Google Analytics 4 + Google Ads', 'Meta Pixel', 'Google Calendar', 'Ferramenta de agendamento (ex.: Cielo/Beleza na Web/Booki/Calendly)', 'Gateway de pagamento para sinal'],
    },
    conteudoPronto: {
      servicos: [
        'Limpeza de pele profunda',
        'Peeling de diamante',
        'Microagulhamento',
        'Toxina botulínica',
        'Preenchimento labial',
        'Harmonização facial',
        'Drenagem linfática',
        'Massagem modeladora',
        'Criolipólise',
        'Depilação a laser',
        'Design de sobrancelhas',
        'Extensão de cílios',
        'LED terapia',
        'Radiofrequência',
      ],
      diferenciais: [
        'Protocolos personalizados após avaliação detalhada, sem pacote pronto',
        'Equipe com formação e atualização constantes em técnicas certificadas',
        'Ambiente reservado, com atendimento individual e horário marcado',
        'Acompanhamento de evolução com registro fotográfico e ajuste de protocolo',
      ],
      faq: [
        { pergunta: 'Como funciona a primeira visita?', resposta: 'Fazemos uma avaliação da pele e do histórico de saúde, definimos o protocolo adequado e apresentamos o orçamento antes de qualquer aplicação.' },
        { pergunta: 'Os procedimentos doem?', resposta: 'A maior parte dos tratamentos é bem tolerada. Quando há desconforto, usamos anestésico tópico e ajustamos a intensidade durante a sessão.' },
        { pergunta: 'Quanto tempo dura cada sessão?', resposta: 'Entre 40 e 90 minutos, dependendo do procedimento. O tempo exato é informado no agendamento.' },
        { pergunta: 'Preciso de quantas sessões?', resposta: 'Varia conforme o objetivo e a resposta individual. Na avaliação indicamos a estimativa mínima e a frequência recomendada.' },
        { pergunta: 'Existe contraindicação?', resposta: 'Sim. Gestantes, lactantes, pessoas com algumas condições de saúde ou em uso de certos medicamentos precisam de liberação médica prévia.' },
        { pergunta: 'Que cuidados devo ter depois?', resposta: 'Evitar sol direto e usar protetor solar são as recomendações básicas. Cada protocolo tem orientações específicas entregues por escrito.' },
      ],
      depoimentos: [
        { nome: 'Cliente atendida', texto: 'Fui muito bem atendida desde a avaliação. Explicaram cada etapa e o resultado da minha pele melhorou visivelmente depois de três sessões.' },
        { nome: 'Cliente de massagem', texto: 'Ambiente impecável e pontualidade absoluta. Saio de cada sessão me sentindo renovada.' },
      ],
      seo: {
        palavrasChave: [
          'clínica de estética em [CIDADE]',
          'limpeza de pele [CIDADE]',
          'harmonização facial [CIDADE]',
          'botox [CIDADE]',
          'depilação a laser [CIDADE]',
          'drenagem linfática [BAIRRO]',
        ],
        tituloHome: '[NOME] | Clínica de Estética em [CIDADE] — Agende sua Avaliação',
        descricaoHome:
          'Tratamentos faciais e corporais com protocolos personalizados em [CIDADE]. Agende sua avaliação e conheça o plano ideal para você.',
      },
    },
    ecommerce: {
      categorias: ['Skincare', 'Kits e protocolos', 'Cartão-presente', 'Suplementos', 'Acessórios'],
      recursos: [
        'Venda de vouchers/cartões-presente com validade e resgate na unidade',
        'Kits de tratamento com desconto progressivo',
        'Seleção de produtos recomendados pelo profissional após a avaliação',
        'Assinatura mensal de dermocosméticos',
      ],
      observacoes: [
        'Produtos com restrição (injetáveis) não devem ser vendidos na loja online',
        'Mostrar composição e recomendação de uso em cada produto',
      ],
    },
    cuidados: [
      'Não prometer resultados garantidos nem prazos exatos — risco de propaganda enganosa (CDC/CONAR)',
      'Sinalizar sempre a necessidade de avaliação prévia e contraindicações',
      'Uso de imagem de clientes somente com termo de autorização assinado',
      'Publicar registro dos profissionais que exercem profissões regulamentadas',
    ],
  },

  /* ============================== 2. SALÃO DE BELEZA ============================== */
  {
    id: 'salao',
    nome: 'Salão de Beleza',
    emoji: '💇‍♀️',
    area: 'Beleza',
    setor: 'beleza e bem-estar',
    genero: 'm',
    termoBusca: 'salão de beleza',
    schemaOrg: 'HairSalon',
    resumo: 'Salões de cabelo, unhas, maquiagem e beleza em geral.',
    suportaEcommerce: true,
    temAgendamento: true,
    objetivoRecomendado: 'agendamento',
    descricaoNegocioPadrao:
      'salão de beleza completo com serviços de cabelo, unhas, maquiagem e tratamentos capilares, com profissionais especializados por área',
    publicoAlvoPadrao:
      'Mulheres de 20 a 50 anos, moradoras do bairro e região, que mudam de visual com frequência, acompanham tendências no Instagram e valorizam atendimento próximo, preço justo e agilidade no agendamento. Inclui noivas e clientes de eventos.',
    tomDeVoz: {
      personalidade: ['Descontraído e próximo', 'Moderno e antenado em tendências', 'Leve e positivo', 'Educador sobre cuidados'],
      regras: [
        'Falar como quem conversa com uma amiga, sem perder o profissionalismo',
        'Usar referências visuais: "loiro iluminado", "corte na altura do ombro"',
        'Destacar transformação e sentimento, não só o nome técnico do serviço',
        'Ser transparente sobre tempo de cadeira e variação de valor por comprimento/volume',
        'Chamar o cliente pelo pelo benefício: "chegue pronta para a festa"',
      ],
      evitar: ['Textos corporativos e formais', 'Excesso de termos técnicos de coloração sem tradução', 'Promoções com letras miúdas'],
      exemplos: [
        'Título: "Seu próximo visual começa com um bom café e um horário marcado"',
        'CTA: "Agendar meu horário" / "Ver tabela de serviços"',
        'Bloco: "Não sabe o que fazer no cabelo? Manda uma foto no WhatsApp que a gente te ajuda."',
      ],
    },
    estiloVisual: {
      estilos: ['Moderno e vibrante', 'Elegante minimalista', 'Boho & natural'],
      paletas: [
        {
          nome: 'Moderno Quente',
          descricao: 'Energia e alegria, boa com fotos de transformação',
          cores: [
            { nome: 'Terracota', hex: '#C96A4B' },
            { nome: 'Mostarda', hex: '#E0A33E' },
            { nome: 'Creme', hex: '#FBF6F0' },
            { nome: 'Grafite', hex: '#33302E' },
            { nome: 'Verde-musgo', hex: '#5C6B49' },
          ],
        },
        {
          nome: 'Rosa & Preto',
          descricao: 'Forte apelo feminino e fashion',
          cores: [
            { nome: 'Rosa', hex: '#E8A0B4' },
            { nome: 'Preto', hex: '#111111' },
            { nome: 'Off-white', hex: '#F8F8F8' },
            { nome: 'Dourado', hex: '#C9A227' },
            { nome: 'Cinza', hex: '#5A5A5A' },
          ],
        },
      ],
      tipografia: {
        titulos: 'Serifada moderna para títulos (Fraunces, DM Serif) e sans arredondada para destaques',
        corpo: 'Sans-serif simples e legível (Inter, Nunito Sans)',
      },
      diretrizes: [
        'Portfólio visual em primeiro plano: galeria grande, sem poluição',
        'Cores de destaque para CTAs de agendamento',
        'Blocos com cantos arredondados e microanimações suaves',
        'Tabela de serviços legível no celular (evitar tabelas largas)',
        'Atenção ao contraste do texto sobre fotos coloridas',
      ],
      imagensIdeais: [
        'Antes e depois de coloração e cortes',
        'Detalhes de unhas, maquiagem e finalização',
        'Ambiente do salão em horário cheio (movimento e vida)',
        'Retratos das profissionais trabalhando',
      ],
      evitar: ['Fotos com filtro pesado que enganam a cor real', 'Estoque genérico de banco de imagens'],
    },
    paginas: [
      {
        nome: 'Home',
        obrigatoria: true,
        objetivo: 'Encantar pela transformação e levar direto ao agendamento.',
        secoes: [
          'Hero com foto de resultado marcante + "Agende seu horário"',
          'Especialidades em cards: Cabelo, Coloração, Tratamentos, Unhas, Maquiagem, Noivas',
          'Galeria de destaques (6 a 8 imagens) com link para portfólio completo',
          'Tabela resumida de serviços e valores "a partir de"',
          'Profissionais em destaque com link de agendamento direto',
          'Depoimentos e nota do Google',
          'Promoções e combos do mês (com validade)',
          'Instagram feed',
          'Mapa, horários e WhatsApp',
        ],
        dica: 'O visitante precisa saber em 5 segundos: onde fica, quanto custa e como marcar.',
      },
      {
        nome: 'Serviços e Preços',
        obrigatoria: true,
        objetivo: 'Tirar dúvida de preço e tempo e facilitar a escolha.',
        secoes: [
          'Categorias: corte, coloração, tratamentos, escova/finalização, unhas, maquiagem, dia da noiva',
          'Cada serviço: descrição curta, duração média, valor "a partir de" e observação de variação',
          'Combos e pacotes (corte + escova, progressiva + corte)',
          'Seção "não sabe o que escolher?" com CTA para consultoria pelo WhatsApp',
          'Política de remarcação e cancelamento',
        ],
        dica: 'Se os valores variam muito, explicar o motivo (comprimento, volume, marca do produto).',
      },
      paginaGaleria([
        'Filtros por categoria: cortes, loiros, ruivos, morenos, unhas, maquiagem',
        'Vídeos curtos verticais de transformações',
      ]),
      paginaSobre(['História do salão, prêmios e parcerias com marcas de produto']),
      paginaEquipe([
        'Especialidade por profissional (colorista, especialista em cachos, nail designer)',
        'Dias e horários de cada profissional',
        'Link de agendamento por profissional',
      ]),
      paginaAgendamento([
        'Escolha combinada de profissional + serviço',
        'Cálculo automático da duração total quando houver mais de um serviço',
        'Campo para referência de cor/comprimento (upload de foto, opcional)',
      ]),
      paginaDepoimentos([]),
      paginaFaq(['Quanto tempo demora uma coloração?', 'Aceita cartão?', 'Precisa agendar ou atende por ordem de chegada?', 'Usam produtos veganos?']),
      paginaBlog(['Pautas: "como manter o loiro sem amarelar", "cronograma capilar em 4 passos", "corte ideal para cada formato de rosto"']),
      paginaContato(['Link direto para cada canal: WhatsApp do salão e Instagram em destaque']),
      paginaPolitica(),
      paginaLoja('Salão', ['Categorias: produtos capilares, presilhas/acessórios, cartão-presente, combos de serviços']),
    ],
    funcionalidades: {
      essenciais: [
        'Agendamento online por serviço e por profissional',
        'Botão de WhatsApp flutuante com mensagem pré-preenchida',
        'Galeria/portfólio com filtro e lightbox',
        'Tabela de preços responsiva',
        'Feed do Instagram',
        'Google Maps + horários de funcionamento',
        'Depoimentos com avaliação do Google',
      ],
      desejaveis: [
        'Programa de fidelidade (a cada 10 serviços, 1 brinde)',
        'Venda de combos e pacotes online',
        'Lista de espera para horários cheios',
        'Enquete de preferência de tendência no Instagram integrada',
        'Cadastro de aniversariantes com promoção automática',
      ],
      integracoes: ['Google Analytics 4', 'Meta Pixel', 'Agenda (Google Calendar / sistema do salão)', 'Gateway de pagamento para sinal de noivas'],
    },
    conteudoPronto: {
      servicos: [
        'Corte feminino',
        'Corte masculino',
        'Escova e finalização',
        'Coloração',
        'Mechas / balayage',
        'Loiros e descoloração',
        'Progressiva / alisamento',
        'Botox capilar e hidratação profunda',
        'Cronograma capilar',
        'Tratamento para cachos',
        'Manicure e pedicure',
        'Alongamento de unhas',
        'Maquiagem social',
        'Penteado para noivas e madrinhas',
      ],
      diferenciais: [
        'Profissionais especializados por técnica, não "faz de tudo"',
        'Consulta de visagismo antes do corte ou coloração',
        'Produtos profissionais de marcas reconhecidas e sem teste em animais',
        'Ambiente confortável com café, wi-fi e estacionamento próximo',
      ],
      faq: [
        { pergunta: 'Preciso agendar ou posso chegar?', resposta: 'Atendemos com agendamento para garantir o tempo necessário para cada serviço, mas recebemos encaixes conforme a disponibilidade do dia.' },
        { pergunta: 'Qual o valor da coloração?', resposta: 'Depende do comprimento, da quantidade de cabelo e da técnica. Envie uma foto no WhatsApp para receber uma estimativa antes de agendar.' },
        { pergunta: 'Quanto tempo fico no salão?', resposta: 'A duração varia de 45 minutos (corte) a 3 horas (descoloração). O tempo estimado aparece no momento do agendamento.' },
        { pergunta: 'Vocês usam produtos veganos?', resposta: 'Trabalhamos com linhas veganas e solicitamos, ao agendar, avisos sobre alergias ou restrições.' },
        { pergunta: 'Aceitam cartão e Pix?', resposta: 'Sim: Pix, dinheiro, débito e crédito (com parcelamento a partir de determinado valor).' },
        { pergunta: 'Qual a política de cancelamento?', resposta: 'Pedimos aviso com 24 horas de antecedência para liberar o horário para outra cliente.' },
      ],
      depoimentos: [
        { nome: 'Cliente de coloração', texto: 'Cheguei com o cabelo danificado e saí com o loiro que sempre quis. A colorista explicou cada etapa do processo.' },
        { nome: 'Cliente de noiva', texto: 'Fiz o dia da noiva completo: cabelo, maquiagem e unhas. Chegou tudo impecável até o fim da festa.' },
      ],
      seo: {
        palavrasChave: [
          'salão de beleza em [CIDADE]',
          'salão de beleza [BAIRRO]',
          'corte de cabelo feminino [CIDADE]',
          'coloração e mechas [CIDADE]',
          'maquiagem para festa [CIDADE]',
          'dia da noiva [CIDADE]',
        ],
        tituloHome: '[NOME] | Salão de Beleza em [CIDADE] — Agende seu Horário',
        descricaoHome:
          'Corte, coloração, tratamentos, unhas e maquiagem em [CIDADE]. Profissionais especializados e agendamento online rápido.',
      },
    },
    ecommerce: {
      categorias: ['Produtos capilares', 'Acessórios', 'Cartão-presente', 'Combos de serviços'],
      recursos: [
        'Venda de cartão-presente e vale-serviço',
        'Produtos recomendados pelo profissional com link "usar em casa"',
        'Combos com pagamento antecipado e desconto',
      ],
      observacoes: ['Deixar claro se a retirada é no salão ou se há entrega', 'Estoque baixo por produto, com aviso de esgotado'],
    },
    cuidados: [
      'Divulgar preços apenas como "a partir de" quando variam — evitar propaganda enganosa',
      'Pedir autorização de uso de imagem das clientes nas fotos de resultado',
      'Avisar sobre alergias e teste de mechas em descoloração',
      'Política de cancelamento visível para reduzir no-show',
    ],
  },

  /* ============================== 3. BARBEARIA ============================== */
  {
    id: 'barbearia',
    nome: 'Barbearia',
    emoji: '💈',
    area: 'Beleza',
    setor: 'barbearia e cuidados masculinos',
    genero: 'f',
    termoBusca: 'barbearia',
    schemaOrg: 'HairSalon',
    resumo: 'Barbearias clássicas e modernas, com serviços masculinos e clube de assinatura.',
    suportaEcommerce: true,
    temAgendamento: true,
    objetivoRecomendado: 'agendamento',
    descricaoNegocioPadrao:
      'barbearia com atendimento por hora marcada, especializada em cortes masculinos, barba, navalhado e cuidados com o cabelo e a pele do homem',
    publicoAlvoPadrao:
      'Homens de 18 a 45 anos que cuidam da aparência e valorizam ambiente agradável, atendimento por hora marcada e recorrência de visita (a cada 15–30 dias). Perfis: profissional urbano, universitário e pais que levam os filhos.',
    tomDeVoz: {
      personalidade: ['Direto e confiante', 'Descontraído, com humor leve', 'Comunidade e tradição de barbearia', 'Sem frescura'],
      regras: [
        'Frases curtas e objetivas, com verbos no imperativo no CTA ("chegue", "marque")',
        'Usar o vocabulário do segmento: "navalhado", "degradê", "toalha quente"',
        'Falar de pertencimento ("a melhor hora do seu dia", "vem pro time")',
        'Zero corporativês e nada de "nossos prezados clientes"',
        'Humor leve permitido, mas sem piadas com aparência de clientes',
      ],
      evitar: ['Linguagem agressiva ou estereotipada de "machão"', 'Textos formais longos', 'Emojis em excesso'],
      exemplos: [
        'Título: "Corte, barba e a melhor conversa da semana"',
        'CTA: "Marcar horário" / "Ver planos do clube"',
        'Bloco: "Sem fila, sem espera. Você marca, chega e senta na cadeira."',
      ],
    },
    estiloVisual: {
      estilos: ['Dark clássico (barbershop)', 'Industrial moderno', 'Rústico vintage'],
      paletas: [
        {
          nome: 'Dark & Dourado',
          descricao: 'Vibe premium masculina',
          cores: [
            { nome: 'Preto carvão', hex: '#111111' },
            { nome: 'Grafite', hex: '#232323' },
            { nome: 'Dourado', hex: '#C8A24A' },
            { nome: 'Off-white', hex: '#F5F1E8' },
            { nome: 'Madeira', hex: '#6B4A2B' },
          ],
        },
        {
          nome: 'Azul Navalha',
          descricao: 'Moderno e limpo',
          cores: [
            { nome: 'Azul-noite', hex: '#12233A' },
            { nome: 'Azul médio', hex: '#2E5AAC' },
            { nome: 'Cinza claro', hex: '#E6E9EF' },
            { nome: 'Cobre', hex: '#B87333' },
            { nome: 'Branco', hex: '#FFFFFF' },
          ],
        },
      ],
      tipografia: {
        titulos: 'Condensada/serifada máscula (Oswald, Bebas Neue, Playfair Display)',
        corpo: 'Sans neutra (Roboto, Inter, Barlow)',
      },
      diretrizes: [
        'Fundo escuro como padrão, com contraste alto em amarelo/dourado nos CTAs',
        'Ícones lineares de navalha, tesoura, pente e toalha',
        'Fotos P&B ou com tratamento de contraste para reforçar o estilo',
        'Layout de portfólio em grade quadrada',
        'Animações discretas: hover com leve zoom nas fotos',
      ],
      imagensIdeais: ['Detalhes de degradê e barba feita', 'Ambiente com cadeiras e espelhos', 'Barbeiro em ação', 'Produtos (pomadas, óleos, loção)'],
      evitar: ['Imagens com aparência de estúdio artificial', 'Cores pastel e layouts fofos (quebra a identidade)'],
    },
    paginas: [
      {
        nome: 'Home',
        obrigatoria: true,
        objetivo: 'Vender a experiência da barbearia e converter em agendamento.',
        secoes: [
          'Hero com foto forte + "Marque seu horário" e link de WhatsApp',
          'Barra de destaque: "Atendimento por hora marcada • Sem fila"',
          'Serviços em cards com preço (corte, barba, combo, sobrancelha, kids)',
          'Clube de assinatura em destaque (planos mensais)',
          'Galeria de cortes em grade',
          'Equipe/barbeiros com agenda individual',
          'Depoimentos e nota do Google',
          'Localização com mapa, estacionamento e horários',
          'Loja de produtos em destaque',
        ],
        dica: 'Preço visível na home aumenta a taxa de agendamento nesse segmento.',
      },
      {
        nome: 'Serviços e Preços',
        obrigatoria: true,
        objetivo: 'Deixar custo e tempo claros para o cliente decidir antes de agendar.',
        secoes: [
          'Tabela: corte, corte + barba, barba, navalhado, sobrancelha, pigmentação, hidratação, corte infantil',
          'Duração média de cada serviço',
          'Combos com desconto e "primeira visita"',
          'Explicação do que está incluso (toalha quente, massagem, finalização, bebida)',
          'CTA de agendamento em cada linha',
        ],
        dica: 'Mostrar "tempo de cadeira" evita reclamação de atraso no dia cheio.',
      },
      {
        nome: 'Clube de Assinatura',
        obrigatoria: false,
        objetivo: 'Gerar receita recorrente e previsibilidade de agenda.',
        secoes: [
          'Comparativo de planos (ex.: 2 cortes/mês, 4 cortes/mês, ilimitado)',
          'Benefícios: desconto em produtos, reserva prioritária, brinde',
          'Como funciona o pagamento recorrente e o cancelamento',
          'Botão de assinatura online com cartão/Pix recorrente',
        ],
        dica: 'Explicar a economia mensal em reais para o cliente — converte muito mais.',
      },
      {
        nome: 'Barbeiros',
        obrigatoria: true,
        objetivo: 'Permitir a escolha do profissional e valorizar o time.',
        secoes: [
          'Cards com foto, apelido, especialidade, tempo de casa e horários',
          'Galeria de trabalhos por barbeiro',
          'Botão "agendar com [nome]" apontando para a agenda individual',
          'Link do Instagram de cada profissional',
        ],
        dica: 'Se o cliente não tiver fotos do time, orientar sessão fotográfica com uniforme da casa.',
      },
      paginaGaleria(['Antes/depois de transformações mais fortes', 'Vídeos de barba feita com navalha']),
      paginaSobre(['História da barbearia, inspirações e cultura da casa', 'Maisons e tradições seguidas']),
      paginaAgendamento([
        'Seleção de barbeiro + serviço',
        'Bloqueio automático de horários já ocupados',
        'Confirmação por WhatsApp e lembrete 2h antes',
        'Fila de espera para sábados lotados',
      ]),
      paginaDepoimentos([]),
      paginaFaq(['Posso chegar sem agendar?', 'Quanto tempo leva o corte?', 'Vocês atendem crianças?', 'Aceitam cartão?']),
      paginaBlog(['Pautas: "como manter a barba alinhada em casa", "diferença entre degradê e social", "como escolher a pomada certa"']),
      paginaContato(['Estacionamento e referências de referência do bairro']),
      paginaPolitica(),
      paginaLoja('Barbearia', ['Categorias: pomadas, óleos de barba, shampoo, acessórios, gift card']),
    ],
    funcionalidades: {
      essenciais: [
        'Agendamento online por barbeiro e serviço',
        'Botão de WhatsApp flutuante e "ligar agora"',
        'Tabela de preços e combos',
        'Galeria de trabalhos',
        'Google Maps com horários por dia',
        'Dados estruturados LocalBusiness/HairSalon',
        'Loja simples para produtos',
      ],
      desejaveis: [
        'Clube de assinatura com cobrança recorrente',
        'Clube de fidelidade com pontos',
        'Gift card digital',
        'Painel de fila/lotação em tempo real ("agora: 15 min de espera")',
        'Perfil do cliente com histórico de cortes',
        'Lista de espera para sábado',
      ],
      integracoes: ['Google Analytics 4 + Google Ads', 'Meta Pixel', 'Instagram (agendamento pelo perfil)', 'Pagamento recorrente (assinatura)'],
    },
    conteudoPronto: {
      servicos: [
        'Corte social',
        'Degradê / fade',
        'Corte navalhado',
        'Barba na navalha',
        'Corte + barba (combo)',
        'Sobrancelha masculina',
        'Pigmentação de barba',
        'Platinado / descoloração masculina',
        'Hidratação e tratamento capilar masculino',
        'Limpeza de pele masculina',
        'Corte infantil',
        'Depilação de orelha e nariz',
      ],
      diferenciais: [
        'Atendimento exclusivamente por hora marcada — zero fila',
        'Toalha quente, navalha e finalização inclusos nos serviços de barba',
        'Barbeiros com formação contínua e especialidades definidas',
        'Clube de assinatura com economia e prioridade na agenda',
      ],
      faq: [
        { pergunta: 'Precisa agendar ou atende por ordem de chegada?', resposta: 'Trabalhamos com hora marcada para você não esperar. Se surgir um horário livre no dia, avisamos no WhatsApp.' },
        { pergunta: 'Quanto tempo demora um corte?', resposta: 'De 30 a 45 minutos, e corte com barba leva cerca de 1 hora. Esse tempo já aparece na hora de marcar.' },
        { pergunta: 'Quanto custa?', resposta: 'A tabela completa está na página de serviços. Trabalhamos com combos de corte + barba e planos mensais com desconto.' },
        { pergunta: 'Vocês atendem crianças?', resposta: 'Sim, temos horários específicos para o corte infantil, com paciência e cadeira apropriada.' },
        { pergunta: 'Como funciona o clube de assinatura?', resposta: 'Você escolhe um plano mensal, paga por assinatura e usa os cortes quantas vezes o plano permitir. O cancelamento pode ser feito a qualquer momento.' },
      ],
      depoimentos: [
        { nome: 'Cliente do clube', texto: 'Assino o plano de dois cortes por mês e nunca mais fiquei esperando. Chego, sento e em 40 minutos estou pronto.' },
        { nome: 'Cliente de barba', texto: 'A barba na navalha com toalha quente é outro nível. Atendimento pontual e ambiente muito bom.' },
      ],
      seo: {
        palavrasChave: [
          'barbearia em [CIDADE]',
          'barbearia [BAIRRO]',
          'corte masculino [CIDADE]',
          'barba na navalha [CIDADE]',
          'barbearia com agendamento online [CIDADE]',
          'barbeiro perto de mim',
        ],
        tituloHome: '[NOME] | Barbearia em [CIDADE] — Agende seu Horário Online',
        descricaoHome:
          'Corte masculino, barba e navalhado com hora marcada em [CIDADE]. Tabela de preços, clube de assinatura e agendamento online em segundos.',
      },
    },
    ecommerce: {
      categorias: ['Pomadas e ceras', 'Óleos de barba', 'Shampoo e cuidados', 'Acessórios (pentes, escovas, navalhas)', 'Gift card'],
      recursos: [
        'Kit "rotina de barba" com desconto',
        'Assinatura de produto (repõe a cada 30/60 dias)',
        'Gift card com valor livre',
        'Retirada no balcão com desconto',
      ],
      observacoes: ['Produtos de baixo ticket: sugerir combos para aumentar o valor do pedido'],
    },
    cuidados: [
      'Não usar fotos de clientes sem autorização (mesmo em stories repostados)',
      'Higienização e descarte de lâminas: mencionar no site como diferencial sanitário',
      'Assinatura recorrente exige termos claros de cancelamento e reembolso (CDC)',
      'Evitar linguagem que exclua público (pais levando filhos, público LGBTQIA+)',
    ],
  },

  /* ============================== 4. PET SHOP ============================== */
  {
    id: 'petshop',
    nome: 'Pet Shop',
    emoji: '🐶',
    area: 'Pet',
    setor: 'pet shop',
    genero: 'm',
    termoBusca: 'pet shop',
    schemaOrg: 'PetStore',
    resumo: 'Pet shops com venda de produtos, ração e acessórios.',
    suportaEcommerce: true,
    temAgendamento: false,
    objetivoRecomendado: 'venda',
    descricaoNegocioPadrao:
      'pet shop com variedade de rações, petiscos, brinquedos, medicamentos e acessórios, com entrega no mesmo dia na região',
    publicoAlvoPadrao:
      'Tutores de cães e gatos de 25 a 45 anos, que tratam o pet como família, compram ração de forma recorrente e valorizam preço, pronta-entrega e atendimento atencioso. Inclui tutores que preferem comprar pelo celular e receber em casa.',
    tomDeVoz: {
      personalidade: ['Amigável e afetivo', 'Divertido sem ser infantil', 'Confiável e prestativo', 'Especialista em cuidado animal'],
      regras: [
        'Nomear cães e gatos como "pets" e os donos como "tutores" (nunca "donos")',
        'Falar dos benefícios para o pet e para o tutor',
        'Explicar composição/nutrição em linguagem simples',
        'Usar carinho no texto, mas manter dados técnicos visíveis (peso, faixa etária, porte)',
        'Emojis de patinhas e pets são bem-vindos com moderação',
      ],
      evitar: ['Tratar animal como "coisa"', 'Termos clínicos sem orientação veterinária', 'Imagens de animais em situação de sofrimento'],
      exemplos: [
        'Título: "Tudo o que seu melhor amigo precisa, entregue no mesmo dia"',
        'CTA: "Comprar agora" / "Pedir pelo WhatsApp" / "Quero receber em casa"',
        'Bloco: "Ração preferida chegando ao fim? Assine e receba todo mês sem lembrar de comprar."',
      ],
    },
    estiloVisual: {
      estilos: ['Alegre e acolhedor', 'Moderno com ilustrações', 'Clean comercial'],
      paletas: [
        {
          nome: 'Azul Pet',
          descricao: 'Confiança com energia',
          cores: [
            { nome: 'Azul', hex: '#2E7DD1' },
            { nome: 'Azul claro', hex: '#A8D3F5' },
            { nome: 'Laranja', hex: '#F2994A' },
            { nome: 'Cinza claro', hex: '#F3F4F6' },
            { nome: 'Verde', hex: '#3FA34D' },
          ],
        },
        {
          nome: 'Verde & Areia',
          descricao: 'Natural e pet-friendly',
          cores: [
            { nome: 'Verde oliva', hex: '#6B8E5A' },
            { nome: 'Areia', hex: '#EBDCC4' },
            { nome: 'Marrom', hex: '#7A5A3A' },
            { nome: 'Off-white', hex: '#FBF8F3' },
            { nome: 'Mostarda', hex: '#D9A62E' },
          ],
        },
      ],
      tipografia: {
        titulos: 'Sans arredondada (Baloo 2, Quicksand, Poppins)',
        corpo: 'Sans legível (Nunito, Inter)',
      },
      diretrizes: [
        'Cards de produto grandes, com foto do pet usando o item',
        'Botões arredondados e cores quentes para "comprar"',
        'Ícones de patinha, coleira, ração e banho',
        'Nunca poluir: o cliente precisa achar a ração dele em 2 cliques',
        'Avisos de frete e prazo visíveis na vitrine',
      ],
      imagensIdeais: ['Pets reais de clientes usando produtos', 'Prateleira/vitrine da loja', 'Fotos de produto em fundo branco para a loja', 'Equipe atendendo com pet no colo'],
      evitar: ['Fotos de banco com pets genéricos em excesso', 'Excesso de texto sobre a foto'],
    },
    paginas: [
      {
        nome: 'Home',
        obrigatoria: true,
        objetivo: 'Vender rápido e mostrar conveniência (entrega, retirada, preço).',
        secoes: [
          'Hero com chamada de venda + "Comprar agora" e "Pedir pelo WhatsApp"',
          'Barra de vantagens: entrega no mesmo dia, retirada na loja, parcelamento, assinatura de ração',
          'Vitrine "mais vendidos" (8 a 12 produtos com preço)',
          'Categorias em destaque: cães, gatos, ração, petiscos, brinquedos, higiene',
          'Ofertas da semana com contador de tempo',
          'Assinatura de ração (recorrência)',
          'Serviços agregados (banho e tosa, entrega, farmácia)',
          'Depoimentos de tutores e avaliações',
          'Mapa, horários e formas de contato',
        ],
        dica: 'Mostrar preço na vitrine e o prazo de entrega por bairro aumenta a conversão.',
      },
      {
        nome: 'Loja / Produtos',
        obrigatoria: true,
        objetivo: 'Catálogo navegável e direto para compra ou pedido pelo WhatsApp.',
        secoes: [
          'Filtros: espécie (cão/gato), porte, faixa etária, marca, categoria e preço',
          'Card com foto, nome, peso/embalagem, preço e selo de oferta',
          'Página de produto: galeria, descrição, composição, modo de uso, avaliações e "frequentemente comprado junto"',
          'Compra por WhatsApp como alternativa ao carrinho',
          'Aviso de disponibilidade em estoque',
        ],
        dica: 'Cadastrar 30 a 60 itens essenciais no lançamento (rações de marcas populares, areia, tapete higiênico).',
      },
      {
        nome: 'Assinatura de Ração',
        obrigatoria: false,
        objetivo: 'Criar receita recorrente e fidelizar o tutor.',
        secoes: [
          'Escolha do produto, frequência (30/45/60 dias) e endereço',
          'Desconto progressivo por permanência',
          'Frete grátis a partir de determinado valor',
          'Área do tutor para pausar, trocar ou cancelar',
        ],
        dica: 'Deixar claro quanto o tutor economiza por ano em relação à compra avulsa.',
      },
      paginaSobre(['História da loja, valores e compromisso com bem-estar animal', 'Marcas parceiras e política de procedência']),
      paginaGaleria(['Fotos de pets de clientes (Pet do mês) e da loja por dentro']),
      paginaDepoimentos(['Depoimentos focados em entrega rápida e atendimento']),
      paginaFaq([
        'Vocês entregam no mesmo dia?',
        'Qual o valor mínimo para entrega grátis?',
        'Posso trocar a ração se meu pet não se adaptar?',
        'Vendem medicamento? (explicar exigência de receita)',
        'Têm cartão fidelidade?',
      ]),
      paginaBlog(['Pautas: "quanto de ração oferecer por dia", "como introduzir alimentação úmida", "primeiros itens para um filhote"']),
      paginaContato(['Informar bairros atendidos pela entrega e prazo por região']),
      paginaPolitica(),
      {
        nome: 'Serviços',
        obrigatoria: false,
        objetivo: 'Divulgar serviços agregados que aumentam ticket e frequência.',
        secoes: [
          'Banho e tosa (quando houver), entrega em domicílio, farmácia veterinária, taxi dog',
          'Tabela de valores por porte/raça',
          'Fluxo de agendamento e políticas (vacinas exigidas, tolerância de atraso)',
        ],
        dica: 'Se o pet shop não tiver clínica, não sugerir conteúdo veterinário — evita problema com conselho regional.',
      },
    ],
    funcionalidades: {
      essenciais: [
        'Catálogo com busca, filtros e carrinho',
        'Checkout com Pix, cartão e boleto + cálculo de frete por CEP',
        'Opção "finalizar pelo WhatsApp"',
        'Cadastro de cliente com histórico de pedidos',
        'Gestão de estoque simples (avisar esgotado / última unidade)',
        'Google Maps, horários e formas de pagamento',
        'Dados estruturados Product + LocalBusiness',
      ],
      desejaveis: [
        'Assinatura de ração com cobrança recorrente',
        'Clube de fidelidade com pontos por compra',
        'Cupom de primeira compra',
        'Lista de desejos e "comprar novamente"',
        'Aviso de reposição por e-mail (voltei ao estoque)',
        'Integração com marketplaces e com o PDV da loja',
      ],
      integracoes: ['Mercado Pago / PagSeguro / Stripe', 'Correios e transportadoras para frete', 'WhatsApp Business API', 'Google Merchant Center / Meta Catálogo', 'ERP/PDV (Bling, Tiny)'],
    },
    conteudoPronto: {
      servicos: [
        'Ração seca e úmida (cães e gatos)',
        'Petiscos e ossinhos',
        'Brinquedos e mordedores',
        'Coleiras, peitorais e guias',
        'Camas, casinhas e cobertores',
        'Comedouros e bebedouros automáticos',
        'Tapete higiênico e areia sanitária',
        'Shampoos e itens de higiene',
        'Farmácia veterinária (mediante receita)',
        'Antipulgas e vermífugos',
        'Roupinhas e acessórios de moda',
        'Caminhas de transporte e caixas',
      ],
      diferenciais: [
        'Entrega no mesmo dia para a região, com acompanhamento por WhatsApp',
        'Curadoria de produtos testados e marcas com boa procedência',
        'Assinatura de ração com desconto e entrega automática',
        'Atendimento por tutores apaixonados por animais, que conhecem cada produto',
      ],
      faq: [
        { pergunta: 'Vocês entregam no mesmo dia?', resposta: 'Sim, para os bairros atendidos, com pedidos feitos até o meio-dia. Você acompanha a entrega pelo WhatsApp.' },
        { pergunta: 'A ração não serviu. Posso trocar?', resposta: 'Sim, trocamos produtos lacrados em até 7 dias, conforme o Código de Defesa do Consumidor.' },
        { pergunta: 'Como funciona a assinatura de ração?', resposta: 'Você escolhe o produto e a frequência; cobramos automaticamente e entregamos na data combinada, com desconto em cada entrega.' },
        { pergunta: 'Vendem medicamentos?', resposta: 'Vendemos produtos de venda livre e também medicamentos que exigem receita, sempre com apresentação da prescrição do médico-veterinário.' },
        { pergunta: 'Quais formas de pagamento?', resposta: 'Pix, dinheiro, débito e crédito em até 3x sem juros (acima de determinado valor), pelo site ou na loja.' },
        { pergunta: 'Tem cartão fidelidade?', resposta: 'Sim: cada compra gera pontos que podem ser trocados por descontos e brindes.' },
      ],
      depoimentos: [
        { nome: 'Tutora da Mel', texto: 'Pedi ração às 10h e chegou antes das 15h. Já virei assinante e não preciso mais lembrar de comprar.' },
        { nome: 'Tutor do Thor', texto: 'Preço justo e a equipe sempre orienta o melhor produto para a idade do meu cachorro.' },
      ],
      seo: {
        palavrasChave: [
          'pet shop em [CIDADE]',
          'pet shop [BAIRRO]',
          'ração com entrega em [CIDADE]',
          'racao para cachorro [CIDADE]',
          'areia sanitária gato [CIDADE]',
          'antipulgas [CIDADE]',
        ],
        tituloHome: '[NOME] | Pet Shop em [CIDADE] com Entrega no Mesmo Dia',
        descricaoHome:
          'Ração, petiscos, brinquedos, higiene e acessórios para cães e gatos em [CIDADE]. Pague online, pelo WhatsApp ou retire na loja.',
      },
    },
    ecommerce: {
      categorias: ['Ração cães', 'Ração gatos', 'Petiscos', 'Brinquedos', 'Higiene e limpeza', 'Acessórios', 'Farmácia', 'Roupas e camas'],
      recursos: [
        'Filtro por porte e faixa etária',
        'Compra recorrente / assinatura',
        'Frete calculado por CEP + opção de retirada na loja',
        'Cupom de primeira compra e cupom de aniversário do pet',
        'Carrinho abandonado com recuperação por e-mail/WhatsApp',
      ],
      observacoes: [
        'Peso/volume não pode deixar o frete inviável: definir faixas de frete grátis',
        'Informar claramente o estoque e o prazo estimado de entrega',
      ],
    },
    cuidados: [
      'Não prescrever tratamento nem indicar medicamento — apenas orientar a procurar um médico-veterinário',
      'Respeitar regras de venda de produtos controlados (com receita)',
      'Imagens de pets de clientes somente com autorização',
    ],
  },

  /* ====================== 5. PET SHOP COM BANHO E TOSA ====================== */
  {
    id: 'petshop_banho_tosa',
    nome: 'Pet Shop com Banho e Tosa',
    emoji: '🛁',
    area: 'Pet',
    setor: 'pet shop e banho e tosa',
    genero: 'm',
    termoBusca: 'pet shop com banho e tosa',
    schemaOrg: 'PetStore',
    resumo: 'Pet shops com serviços de banho, tosa, hidratação e leva-e-traz.',
    suportaEcommerce: true,
    temAgendamento: true,
    objetivoRecomendado: 'agendamento',
    descricaoNegocioPadrao:
      'pet shop com banho e tosa, com atendimento por hora marcada, produtos de cuidados e serviço de leva e traz',
    publicoAlvoPadrao:
      'Tutores de cães e gatos de 25 a 50 anos, que trabalham fora e precisam de praticidade (leva e traz, agendamento rápido), têm receio de deixar o pet em um lugar com muitos animais e valorizam transparência, fotos do atendimento e cuidado no manejo.',
    tomDeVoz: {
      personalidade: ['Amigável e afetivo', 'Tranquilizador (o pet está bem)', 'Organizado e prático', 'Divertido com leveza'],
      regras: [
        'Antecipar as preocupações do tutor ("seu pet não fica em caixa esperando")',
        'Descrever o passo a passo do atendimento — reduz ansiedade e constrói confiança',
        'Informar duração do serviço e horário de buscar com precisão',
        'Falar em "tutores" e "pets", nunca "donos" e "animais"',
        'Toda promessa de manejo deve ser realista (se o pet é agressivo, dizer o que é feito)',
      ],
      evitar: ['Tom clínico ou de emergência veterinária', 'Expressões que ridicularizem o pet ("ficou feio")'],
      exemplos: [
        'Título: "Banho e tosa com hora marcada, carinho e foto no final"',
        'CTA: "Agendar banho" / "Quero leva e traz"',
        'Bloco: "Agende, receba a foto depois do banho e busque seu pet cheiroso no horário combinado."',
      ],
    },
    estiloVisual: {
      estilos: ['Divertido e colorido', 'Clean e fofinho', 'Moderno pet-friendly'],
      paletas: [
        {
          nome: 'Água & Patinha',
          descricao: 'Limpeza e frescor com energia',
          cores: [
            { nome: 'Turquesa', hex: '#28B0AE' },
            { nome: 'Azul claro', hex: '#BFE9F2' },
            { nome: 'Amarelo', hex: '#FFCB3D' },
            { nome: 'Branco', hex: '#FFFFFF' },
            { nome: 'Roxo', hex: '#7A5AA6' },
          ],
        },
        {
          nome: 'Lavanda & Menta',
          descricao: 'Suave e acolhedor',
          cores: [
            { nome: 'Lavanda', hex: '#B9A6D9' },
            { nome: 'Menta', hex: '#8FD6B4' },
            { nome: 'Off-white', hex: '#FBF9F6' },
            { nome: 'Cinza', hex: '#5C6470' },
            { nome: 'Coral', hex: '#F98B7B' },
          ],
        },
      ],
      tipografia: {
        titulos: 'Sans arredondada e simpática (Baloo 2, Fredoka, Poppins)',
        corpo: 'Sans legível (Nunito, Inter)',
      },
      diretrizes: [
        'Blocos de "antes e depois" do banho sempre que possível',
        'Tabela de preços por porte/raça muito clara, em cards em vez de tabela larga',
        'Fluxo visual de 4 passos ilustrando o atendimento',
        'Ícones de banheira, secador, tesoura e patinha',
        'Cores claras passando sensação de limpeza e frescor',
      ],
      imagensIdeais: ['Cães e gatos após o banho, sorrindo', 'Antes/depois de tosa na tesoura', 'Ambiente de banho e secagem', 'Equipe segurando o pet com cuidado'],
      evitar: ['Fotos de pets molhados e assustados', 'Ambiente sujo ou desorganizado nas fotos'],
    },
    paginas: [
      {
        nome: 'Home',
        obrigatoria: true,
        objetivo: 'Converter em agendamento de banho/tosa mostrando cuidado e praticidade.',
        secoes: [
          'Hero com foto de pet limpo + "Agendar banho e tosa" e WhatsApp',
          'Barra de confiança: hora marcada, leva e traz, ambiente monitorado, equipe treinada',
          'Serviços com preço por porte: banho, tosa higiênica, tosa na máquina, tosa na tesoura, hidratação, corte de unhas',
          'Passo a passo do atendimento (recepção → banho → secagem → tosa → foto → busca)',
          'Pacotes mensais e plano de fidelidade',
          'Galeria antes/depois',
          'Depoimentos de tutores com foto dos pets',
          'Produtos à venda (vitrine rápida)',
          'Mapa, horários e agendamento',
        ],
        dica: 'Deixar explícito o tempo médio de atendimento (ex.: 1h30 a 2h30) e o horário de retirada.',
      },
      {
        nome: 'Banho e Tosa',
        obrigatoria: true,
        objetivo: 'Detalhar serviços, valores por porte e regras de atendimento.',
        secoes: [
          'Cards por serviço com descrição, tempo e valor por porte (P/M/G/GG)',
          'Tabela de taxa por raça/pelagem (ex.: poodle, shih tzu, spitz, husky)',
          'Adicionais: hidratação, perfumaria, escovação de dentes, desembolo, corte de unhas',
          'Serviço de leva e traz: bairros atendidos, taxa e janelas de horário',
          'Regras: vacinas em dia, entregar com coleira/guia, tolerância de atraso, política de no-show',
          'Cuidados especiais: filhotes, idosos, pets com ansiedade, pets sem raça definida com pelagem difícil',
        ],
        dica: 'Explicar como é feito o manejo de pets nervosos e o que o tutor deve avisar no agendamento.',
      },
      {
        nome: 'Agendamento',
        obrigatoria: true,
        objetivo: 'Fechar o horário coletando as informações necessárias do pet.',
        secoes: [
          'Ficha do pet: nome, espécie, raça, porte, peso, idade, castrado, vacinas em dia',
          'Serviço desejado, adicionais e serviço de leva e traz',
          'Data e horário com bloqueio de agenda por box/profissional',
          'Observações: alergias, problemas de pele, comportamento, medo de secador',
          'Termo de autorização para atendimento e para uso de imagem',
          'Confirmação e lembrete por WhatsApp',
        ],
        dica: 'Pedir foto do pet no agendamento ajuda o profissional a se preparar e evita surpresa no dia.',
      },
      {
        nome: 'Planos e Pacotes',
        obrigatoria: false,
        objetivo: 'Fidelizar e tornar previsível o fluxo de banhos.',
        secoes: [
          'Pacotes mensais (2 ou 4 banhos), trimestrais e semestrais',
          'Assinatura pet com desconto e prioridade de agenda',
          'Benefícios: leva e traz grátis, hidratação inclusa, brinde no aniversário',
          'Comparativo de economia mensal',
        ],
        dica: 'Um pacote mensal reduz a sazonalidade e trava o tutor em uma recorrência saudável.',
      },
      paginaGaleria(['Antes/depois de tosa na tesoura', 'Pets finalizados por porte e raça']),
      paginaSobre(['História, capacidade de atendimento e cuidados sanitários', 'Equipe treinada e certificações de banho e tosa']),
      paginaEquipe(['Groomers com certificação e especialidade (tosadores de raça, gatos)', 'Quem faz leva e traz']),
      paginaDepoimentos(['Depoimentos sobre pontualidade, cuidado com pets nervosos e foto pós-banho']),
      paginaFaq([
        'Meu pet precisa de vacina em dia?',
        'Quanto tempo demora o banho e tosa?',
        'Vocês buscam em casa?',
        'Meu pet é nervoso, vocês atendem?',
        'E se meu pet tiver pulga ou problema de pele?',
      ]),
      paginaBlog(['Pautas: "de quanto em quanto tempo dar banho no cachorro", "como pentear pelos que embolam", "tosa no verão: mitos"']),
      paginaContato(['Bairros do leva e traz e horários de coleta']),
      paginaPolitica(),
      paginaLoja('Pet shop com banho e tosa', [
        'Categorias: shampoo e condicionador, perfumaria, escovas, ração, petiscos, tapete higiênico',
        'Vender pacotes e vouchers de banho como produto',
      ]),
    ],
    funcionalidades: {
      essenciais: [
        'Agendamento online com ficha do pet e bloqueio de agenda',
        'Tabela de preços por porte/raça interativa (calculadora de valor)',
        'Confirmação e lembretes automáticos por WhatsApp',
        'Galeria de antes/depois',
        'Google Maps e horários',
        'Envio de foto do pet após o atendimento ("já está pronto!")',
        'Checkout para produtos e pacotes',
      ],
      desejaveis: [
        'Pacotes e assinatura com cobrança recorrente',
        'Ficha de histórico do pet (fotos, alergias, comportamento, preferências)',
        'Leva e traz com agendamento de janela de coleta',
        'Programa de fidelidade (a cada 10 banhos, 1 grátis)',
        'Aviso automático quando o serviço terminar',
        'Avaliação do atendimento por link no WhatsApp',
      ],
      integracoes: ['WhatsApp Business API', 'Sistema de agenda/PDV pet', 'Gateway de pagamento recorrente', 'Google Analytics 4 + Meta Pixel'],
    },
    conteudoPronto: {
      servicos: [
        'Banho simples',
        'Banho com hidratação',
        'Tosa higiênica',
        'Tosa na máquina',
        'Tosa na tesoura',
        'Tosa bebê / filhote',
        'Desembolo (nós)',
        'Escovação de dentes',
        'Corte de unhas',
        'Limpeza de ouvido',
        'Perfumaria',
        'Leva e traz em domicílio',
        'Atendimento a gatos',
      ],
      diferenciais: [
        'Atendimento individual por box, sem deixar o pet esperando em gaiola',
        'Agendamento com hora marcada e aviso por WhatsApp quando o pet está pronto',
        'Groomers certificados, com manejo gentil e paciência com pets nervosos',
        'Serviço de leva e traz para quem não consegue sair de casa ou do trabalho',
        'Foto do pet após o banho enviada ao tutor',
      ],
      faq: [
        { pergunta: 'Meu pet precisa estar com a vacinação em dia?', resposta: 'Sim. Pedimos a carteira de vacinação atualizada (V8/V10 e antirrábica) e antipulgas em dia para proteger todos os pets que atendemos.' },
        { pergunta: 'Quanto tempo dura o banho e tosa?', resposta: 'Entre 1h30 e 2h30, dependendo do porte, da pelagem e do serviço escolhido. Indicamos o horário de retirada no agendamento.' },
        { pergunta: 'Vocês buscam o pet em casa?', resposta: 'Sim, temos leva e traz em bairros selecionados. A taxa e a janela de coleta aparecem no momento de agendar.' },
        { pergunta: 'Meu pet é nervoso. Vocês atendem?', resposta: 'Atendemos, com manejo gentil e horários mais tranquilos. Se houver risco para o pet ou para o profissional, informamos o tutor antes de começar.' },
        { pergunta: 'O que preciso levar?', resposta: 'Apenas o pet com coleira ou guia. Avisamos no agendamento sobre itens específicos, como medicação ou comida em caso de estadia.' },
        { pergunta: 'Tem pacote mensal?', resposta: 'Sim, temos pacotes de 2 e 4 banhos por mês com desconto, hidratação inclusa e prioridade na agenda.' },
      ],
      depoimentos: [
        { nome: 'Tutora do Pug', texto: 'Levo minha pug desde filhote. Eles mandam foto no final e ela volta sempre alegre e cheirosa.' },
        { nome: 'Tutor do Spitz', texto: 'O leva e traz salvou minha rotina de trabalho. Nunca mais precisei me preocupar com horário.' },
      ],
      seo: {
        palavrasChave: [
          'banho e tosa [CIDADE]',
          'pet shop com banho e tosa [BAIRRO]',
          'banho e tosa perto de mim',
          'tosa de cachorro [CIDADE]',
          'leva e traz banho e tosa [CIDADE]',
        ],
        tituloHome: '[NOME] | Banho e Tosa em [CIDADE] com Hora Marcada',
        descricaoHome:
          'Banho, tosa, hidratação e leva e traz para cães e gatos em [CIDADE]. Agende online, sem fila e com foto do pet ao final do atendimento.',
      },
    },
    ecommerce: {
      categorias: ['Shampoos e condicionadores', 'Perfumaria', 'Escovas e acessórios de tosa', 'Ração e petiscos', 'Higiene', 'Vouchers de banho'],
      recursos: [
        'Vouchers e pacotes de banho como produto',
        'Assinatura mensal com cobrança recorrente',
        'Cupom para primeiro banho',
        'Sugestão cruzada: contratou tosa, recebe oferta de hidratação',
      ],
      observacoes: ['Se o e-commerce for só de produtos, manter o agendamento de serviços como destaque principal da home'],
    },
    cuidados: [
      'Não divulgar serviços veterinários se o estabelecimento não tiver responsável técnico',
      'Exigir vacinação e informar no site (proteção de todos os animais)',
      'Manejo e bem-estar animal: nada de imagens de pets contidos de forma inadequada',
      'Termo de autorização para uso de imagem do pet e do tutor',
    ],
  },

  /* ============== 6. PET SHOP COM CLÍNICA VETERINÁRIA ============== */
  {
    id: 'petshop_veterinaria',
    nome: 'Pet Shop com Clínica Veterinária',
    emoji: '🩺',
    area: 'Pet',
    setor: 'pet shop e medicina veterinária',
    genero: 'm',
    termoBusca: 'pet shop com clínica veterinária',
    schemaOrg: 'VeterinaryCare',
    resumo: 'Pet shop com clínica veterinária integrada: consultas, vacinas, exames e produtos.',
    suportaEcommerce: true,
    temAgendamento: true,
    objetivoRecomendado: 'agendamento',
    descricaoNegocioPadrao:
      'pet shop com clínica veterinária, oferecendo consultas, vacinação, exames e venda de produtos no mesmo endereço',
    publicoAlvoPadrao:
      'Tutores de cães e gatos de 25 a 55 anos que buscam resolver saúde e compras em um só lugar, valorizam atendimento veterinário de confiança, planos de saúde pet e rapidez no atendimento, inclusive em urgências.',
    tomDeVoz: {
      personalidade: ['Confiável e técnico com tom acessível', 'Acolhedor e empático', 'Ágil em urgências', 'Prático no dia a dia'],
      regras: [
        'Traduzir o termo técnico: "otite (infecção no ouvido)"',
        'Sempre usar "médico-veterinário" e "tutor" — nunca "doutor de bicho"',
        'Nunca prometer diagnóstico ou tratamento pelo site; orientar a agendar consulta',
        'Ser claro em emergências: o que fazer agora e qual telefone chamar',
        'Destacar integração: consulta, exame, medicamento e ração no mesmo lugar',
      ],
      evitar: [
        'Sugerir diagnóstico, dose de medicamento ou interpretação de exames',
        'Tom publicitário exagerado em saúde',
        'Comparar preços com outros serviços de saúde',
      ],
      exemplos: [
        'Título: "Saúde completa e produtos para o seu pet, no mesmo endereço"',
        'CTA: "Agendar consulta" / "Falar com a clínica"',
        'Bloco de urgência: "Se seu pet está passando mal agora, ligue para [TELEFONE] antes de sair de casa."',
      ],
    },
    estiloVisual: {
      estilos: ['Clínico acolhedor', 'Moderno e limpo', 'Clean veterinário'],
      paletas: [
        {
          nome: 'Azul Clínico',
          descricao: 'Confiança e limpeza',
          cores: [
            { nome: 'Azul', hex: '#1E6FBA' },
            { nome: 'Azul claro', hex: '#D6E8F7' },
            { nome: 'Verde', hex: '#4CAF7D' },
            { nome: 'Branco', hex: '#FFFFFF' },
            { nome: 'Cinza', hex: '#4A5568' },
          ],
        },
        {
          nome: 'Verde Vida',
          descricao: 'Cuidado e natureza',
          cores: [
            { nome: 'Verde', hex: '#2E8B72' },
            { nome: 'Verde-lima', hex: '#A9D18E' },
            { nome: 'Areia', hex: '#F0EBE1' },
            { nome: 'Grafite', hex: '#333A40' },
            { nome: 'Laranja', hex: '#EE8A4E' },
          ],
        },
      ],
      tipografia: {
        titulos: 'Sans humanista (Poppins, Montserrat)',
        corpo: 'Sans legível (Inter, Nunito)',
      },
      diretrizes: [
        'Layout limpo e organizado, com hierarquia clara entre clínica e loja',
        'Ícones de seringa, estetoscópio, pata e coração em estilo linear',
        'Bloco de emergência com cor de alerta sempre visível no topo',
        'Fotos com ambiente claro, profissional com jaleco e pets calmos',
        'Nada de imagens de animais feridos ou procedimentos invasivos',
      ],
      imagensIdeais: ['Médico-veterinário atendendo com carinho', 'Consultório, laboratório e sala de exames', 'Vacinação de filhote', 'Equipe completa com jalecos'],
      evitar: ['Estética infantilizada que compromete a percepção de qualidade clínica', 'Fotos de material cirúrgico exposto'],
    },
    paginas: [
      {
        nome: 'Home',
        obrigatoria: true,
        objetivo: 'Mostrar que é possível resolver saúde e compras no mesmo lugar e agilizar o agendamento.',
        secoes: [
          'Faixa de urgência com telefone e horário de funcionamento',
          'Hero com "Agendar consulta" + link de WhatsApp',
          'Serviços clínicos em cards (consultas, vacinas, exames, cirurgias, odontologia)',
          'Diferenciais da estrutura (laboratório próprio, ultrassom, internação, farmácia)',
          'Profissionais em destaque com CRMV',
          'Convênios e planos de saúde pet aceitos',
          'Vitrine de produtos em destaque (ração, antipulgas, medicamentos de venda livre)',
          'Depoimentos de tutores',
          'Mapa, estacionamento, horários e formas de contato',
        ],
        dica: 'Separar visualmente "Clínica" e "Loja" no menu para não confundir o tutor em urgência.',
      },
      {
        nome: 'Serviços Veterinários',
        obrigatoria: true,
        objetivo: 'Explicar os serviços clínicos disponíveis e o que esperar de cada um.',
        secoes: [
          'Consultas (rotina, retorno, especializada) e atendimento de urgência',
          'Vacinação: protocolo para filhotes e adultos, V8/V10, antirrábica, gripe felina',
          'Exames: laboratoriais, ultrassonografia, raio-x, eletrocardiograma, testes rápidos',
          'Cirurgias: castração, tecidos moles, ortopedia (o que é feito na unidade e o que é encaminhado)',
          'Odontologia veterinária e profilaxia',
          'Internação/sem; observação com visitação',
          'Atendimento domiciliar quando houver (visita ou busca e retorno)',
          'Vermifugação, antipulgas e controle de ectoparasitas',
        ],
        dica: 'Em cada serviço, informar o que o tutor precisa levar (carteira de vacinas, exames anteriores, cartão do convênio).',
      },
      paginaAgendamento([
        'Escolha do serviço (consulta, vacina, exame, banho e tosa quando houver)',
        'Ficha do pet: nome, espécie, raça, idade, peso, castrado, histórico e medicamentos em uso',
        'Motivo da consulta em campo livre e upload de exames anteriores (opcional)',
        'Aviso claro: agendamento não é atendimento de urgência — em emergência ligar para [TELEFONE]',
      ]),
      {
        nome: 'Estrutura e Unidades',
        obrigatoria: true,
        objetivo: 'Gerar confiança na qualidade da estrutura física e dos equipamentos.',
        secoes: [
          'Fotos e descrição de recepção, consultórios, laboratório, sala de exames, centro cirúrgico e internação',
          'Equipamentos disponíveis e o que eles permitem diagnosticar',
          'Endereço(s) com mapa, estacionamento e acessibilidade',
          'Horários por unidade e plantão',
        ],
        dica: 'Para clínicas com mais de uma unidade, criar uma página/seção por unidade com dados locais e Google Maps individual.',
      },
      paginaEquipe([
        'Médicos-veterinários com CRMV visível e especialidades',
        'Responsável técnico destacado (exigência do CRMV)',
        'Equipe de apoio: enfermagem, laboratório, tosa técnica',
      ]),
      {
        nome: 'Planos e Convênios',
        obrigatoria: false,
        objetivo: 'Aumentar recorrência e captar tutores por convênio.',
        secoes: [
          'Planos de saúde pet próprios: cobertura, tabela, carência e rede',
          'Convênios aceitos e forma de conferência da cobertura',
          'Botão "quero simular/contratar plano"',
        ],
        dica: 'Deixar explícito o que NÃO está incluso no plano para evitar reembolso/atrito depois.',
      },
      paginaFaq([
        'Preciso agendar para consulta?',
        'Vocês atendem emergência?',
        'Quais vacinas meu filhote precisa?',
        'Aceitam plano de saúde pet?',
        'Vocês entregam medicamento em casa?',
        'Como funciona a castração?',
      ]),
      paginaDepoimentos(['Depoimentos focados em confiança, transparência de orçamento e atendimento em urgência']),
      paginaBlog(['Pautas: "calendário de vacinação de filhotes", "sinais de que seu gato precisa de veterinário", "castração: quando fazer"'], 'Conteúdo educativo revisado por médico-veterinário, com assinatura e CRMV do autor.'),
      paginaContato(['Telefone de urgência separado do telefone de agendamento']),
      paginaPolitica(),
      paginaLoja('Pet shop com clínica veterinária', [
        'Categorias: ração e dietas terapêuticas, medicamentos de venda livre, antiparasitários, higiene, acessórios',
        'Regra de venda de medicamentos com receita controlada, com upload de receita no checkout',
      ]),
    ],
    funcionalidades: {
      essenciais: [
        'Agendamento online (consulta, vacina, exame) com ficha do pet',
        'Botão de WhatsApp flutuante + botão de urgência com telefone com discagem direta',
        'Página/seção por serviço com orientações ao tutor',
        'Equipe com CRMV visível',
        'Catálogo de produtos com carrinho e checkout',
        'Convênios aceitos e planos próprios',
        'Google Maps com rota e estacionamento',
        'Dados estruturados VeterinaryCare + LocalBusiness',
      ],
      desejaveis: [
        'Área do tutor com histórico do pet, exames e carteira de vacinação digital',
        'Lembretes automáticos de vacina, antipulgas e retorno',
        'Telemedicina/veterinário online para triagem',
        'Upload de exame anterior e de receita no checkout de medicamentos',
        'Orçamento prévio online para procedimentos eletivos',
        'Integração com sistema de gestão veterinária',
      ],
      integracoes: ['Sistema de gestão veterinária (prontuário/agenda)', 'WhatsApp Business API', 'Laboratório para entrega de laudos', 'Gateway de pagamento', 'Google Analytics 4 + Meta Pixel'],
    },
    conteudoPronto: {
      servicos: [
        'Consulta veterinária geral',
        'Consulta especializada',
        'Vacinação (V8/V10, antirrábica, felina)',
        'Exames de sangue e laboratoriais',
        'Ultrassonografia',
        'Raio-x',
        'Eletrocardiograma',
        'Castração',
        'Cirurgias gerais',
        'Odontologia veterinária',
        'Internação e observação',
        'Atendimento de urgência',
        'Vermifugação e antipulgas',
        'Farmácia veterinária',
        'Nutrição e dietas terapêuticas',
      ],
      diferenciais: [
        'Clínica e pet shop no mesmo endereço: consulta, exame e produto sem deslocamento',
        'Laboratório próprio com resultados rápidos',
        'Médicos-veterinários com especialidades e CRMV visível',
        'Orçamento transparente apresentado antes da realização de procedimentos',
        'Planos de saúde pet que cabem no bolso e cobrem prevenção',
      ],
      faq: [
        { pergunta: 'Preciso agendar consulta ou posso chegar?', resposta: 'Atendemos por agendamento para reduzir a espera, mas recebemos casos de urgência conforme a gravidade, avaliada na chegada.' },
        { pergunta: 'Vocês atendem emergência?', resposta: 'Atendemos em nosso horário de funcionamento, com prioridade para casos graves. Fora do horário, informe-se pelo telefone [TELEFONE] sobre o plantão de referência.' },
        { pergunta: 'Quanto custa a consulta?', resposta: 'Os valores de consulta e de procedimentos estão disponíveis na recepção e no orçamento entregue antes de qualquer exame ou cirurgia.' },
        { pergunta: 'Aceitam plano de saúde pet?', resposta: 'Sim, trabalhamos com convênios e também com planos próprios. Traga os dados do seu plano no atendimento para conferirmos a cobertura.' },
        { pergunta: 'Quais vacinas meu filhote precisa?', resposta: 'Depende da espécie e da idade. Na primeira consulta montamos o calendário completo, com datas de reforço e lembretes automáticos.' },
        { pergunta: 'Vocês vendem medicamento sem receita?', resposta: 'Somos obrigados a exigir receita para medicamentos controlados. Produtos de venda livre podem ser comprados direto na loja ou no site.' },
      ],
      depoimentos: [
        { nome: 'Tutora da Nina', texto: 'Cheguei com a minha gata passando mal, foram super atenciosos e explicaram tudo com calma. Orçamento claro antes de cada exame.' },
        { nome: 'Tutor do Bidu', texto: 'Resolvo tudo no mesmo lugar: vacina, ração e antipulgas. Muito prático e a equipe conhece o histórico dele.' },
      ],
      seo: {
        palavrasChave: [
          'clínica veterinária em [CIDADE]',
          'veterinário 24 horas [CIDADE]',
          'pet shop com veterinário [BAIRRO]',
          'vacinação de cães [CIDADE]',
          'castração de gatos [CIDADE]',
          'consulta veterinária preço [CIDADE]',
        ],
        tituloHome: '[NOME] | Clínica Veterinária e Pet Shop em [CIDADE]',
        descricaoHome:
          'Consultas, vacinas, exames, cirurgias e produtos para pets em [CIDADE]. Agende online e receba orçamento transparente antes de cada procedimento.',
      },
    },
    ecommerce: {
      categorias: ['Ração e dietas especiais', 'Medicamentos de venda livre', 'Antiparasitários', 'Higiene', 'Acessórios', 'Suplementos'],
      recursos: [
        'Upload de receita no checkout para produtos controlados',
        'Assinatura de ração e de antiparasitário com lembrete de reaplicação',
        'Sugestão de produtos conforme histórico clínico do pet (manual, com curadoria)',
        'Retirada na clínica e entrega local',
      ],
      observacoes: [
        'Nunca vender medicamento controlado sem validação da receita',
        'Descrições de medicamento devem ser técnicas e neutras, sem promessa de cura',
      ],
    },
    cuidados: [
      'Publicar o responsável técnico e o CRMV (exigência do Conselho)',
      'Não oferecer diagnóstico, prescrição ou interpretação de exames pelo site',
      'Deixar claro o horário de funcionamento e o que fazer em emergência fora do horário',
      'Dados de saúde do tutor e do pet são dados sensíveis: consentimento e sigilo (LGPD)',
      'Guardar imagens de procedimentos apenas com autorização formal do tutor',
    ],
  },

  /* ===================== 7. CLÍNICA VETERINÁRIA ===================== */
  {
    id: 'veterinaria',
    nome: 'Clínica Veterinária',
    emoji: '🐾',
    area: 'Pet',
    setor: 'medicina veterinária',
    genero: 'f',
    termoBusca: 'clínica veterinária',
    schemaOrg: 'VeterinaryCare',
    resumo: 'Clínicas e hospitais veterinários com foco em saúde e urgência.',
    suportaEcommerce: true,
    temAgendamento: true,
    objetivoRecomendado: 'agendamento',
    descricaoNegocioPadrao:
      'clínica veterinária com atendimento clínico e cirúrgico, exames de imagem e laboratório, com foco em atendimento por hora marcada e suporte a urgências',
    publicoAlvoPadrao:
      'Tutores de cães e gatos de 25 a 60 anos que consideram o pet parte da família, buscam atendimento de confiança e preço justo, e pesquisam avaliações no Google antes de escolher. Inclui tutores de animais idosos e com doenças crônicas, que valorizam acompanhamento contínuo.',
    tomDeVoz: {
      personalidade: ['Acolhedor e humano', 'Profissional e confiável', 'Claro na comunicação sobre preço e conduta', 'Disponível em urgência'],
      regras: [
        'Explicar condutas em linguagem simples e sempre reforçar que a avaliação presencial é necessária',
        'Nomear corretamente: médico-veterinário, tutor, paciente',
        'Informar com transparência sobre orçamento prévio e formas de pagamento',
        'Tratar temas sensíveis (eutanásia, oncologia) com cuidado e empatia',
        'Destacar canais de urgência e horários de forma inequívoca',
      ],
      evitar: ['Prometer cura ou resultado', 'Indicar medicamentos na web', 'Tom comercial agressivo em saúde'],
      exemplos: [
        'Título: "Cuidado veterinário de confiança para quem é da família"',
        'CTA: "Agendar consulta" / "Falar com a equipe" / "Estou em uma urgência"',
        'Bloco: "Orçamento transparente: você aprova antes de cada exame ou procedimento."',
      ],
    },
    estiloVisual: {
      estilos: ['Clínico moderno', 'Acolhedor e humano', 'Premium com foco em confiança'],
      paletas: [
        {
          nome: 'Azul Hospital',
          descricao: 'Confiabilidade e higiene',
          cores: [
            { nome: 'Azul profundo', hex: '#14395C' },
            { nome: 'Azul', hex: '#2E7BB8' },
            { nome: 'Ciano claro', hex: '#DCEEF7' },
            { nome: 'Branco', hex: '#FFFFFF' },
            { nome: 'Verde', hex: '#3E9E7C' },
          ],
        },
        {
          nome: 'Terracota Acolhedor',
          descricao: 'Empatia e calor humano com profissionalismo',
          cores: [
            { nome: 'Terracota', hex: '#C4694A' },
            { nome: 'Creme', hex: '#F7F1E8' },
            { nome: 'Verde-sálvia', hex: '#6E8B74' },
            { nome: 'Azul-petróleo', hex: '#2A5C6B' },
            { nome: 'Grafite', hex: '#333333' },
          ],
        },
      ],
      tipografia: {
        titulos: 'Sans humanista séria (Poppins, Source Sans) ou serifada suave para o acolhimento',
        corpo: 'Sans legível (Inter, Roboto) em 17px+ para leitura fácil',
      },
      diretrizes: [
        'Informação de urgência sempre no topo, com telefone clicável',
        'Cards de especialidade com ícones claros em vez de fotos genéricas',
        'Blocos de preço/convênio com fundo destacado',
        'Fotos claras, humanas, com tutores e pets interagindo com a equipe',
        'Acessibilidade: contraste alto e textos grandes (público mais velho também acessa)',
      ],
      imagensIdeais: ['Médico-veterinário examinando com o tutor presente', 'Recepção e consultórios organizados', 'Equipamentos de imagem e laboratório', 'Retrato individual de cada veterinário'],
      evitar: ['Imagens de animais doentes ou em sofrimento', 'Estética de pet shop infantilizada'],
    },
    paginas: [
      {
        nome: 'Home',
        obrigatoria: true,
        objetivo: 'Estabelecer confiança imediata e rotear o visitante (rotina x urgência).',
        secoes: [
          'Faixa superior com horários e telefone de urgência clicável',
          'Hero com "Agendar consulta" e segundo CTA "Estou com uma urgência"',
          'Especialidades em cards (clínica geral, cirurgia, dermatologia, oftalmo, ortopedia, cardiologia)',
          'Estrutura e equipamentos (laboratório, ultrassom, raio-x, internação)',
          'Equipe com foto, especialidade e CRMV',
          'Planos, convênios e formas de pagamento',
          'Como chegar: mapa, estacionamento, acessibilidade',
          'Depoimentos e avaliação do Google',
          'Orientações rápidas: o que fazer em emergência, primeiros cuidados, calendário de vacinas',
        ],
        dica: 'Separar visualmente "atendimento agendado" de "urgência" reduz ansiedade e melhora a experiência.',
      },
      {
        nome: 'Especialidades',
        obrigatoria: true,
        objetivo: 'Mostrar a profundidade clínica e direcionar para o agendamento correto.',
        secoes: [
          'Card por especialidade com: o que trata, quando procurar, como é a consulta e profissional responsável',
          'Clínica geral, vacinação, dermatologia, cardiologia, ortopedia, neurologia, oftalmologia, oncologia (com muito cuidado de linguagem), geriatria',
          'Odontologia veterinária e procedimentos cirúrgicos',
          'Diagnóstico por imagem e laboratório',
          'Internação e cuidados intensivos',
          'Atendimento domiciliar (quando existir) e telemedicina para triagem',
          'Dúvidas comuns em cada especialidade (mini-FAQ)',
        ],
        dica: 'Em oncologia e casos paliativos, incluir linguagem de cuidado, sigilo e apoio ao tutor.',
      },
      paginaAgendamento([
        'Fluxo separado: "Agendar consulta" x "Urgência agora"',
        'Escolha de especialidade e profissional',
        'Ficha do paciente: nome, espécie, raça, idade, peso, castrado, histórico, medicamentos',
        'Motivo da consulta e descrição de sintomas com data de início',
        'Upload de exames anteriores (PDF/imagem)',
        'Instruções: jejum quando necessário, trazer carteira de vacinação e exames',
      ]),
      paginaEquipe([
        'Médicos-veterinários com CRMV, formação, especialização e tempo de atuação',
        'Responsável técnico em destaque',
        'Equipe de enfermagem, laboratório e imagem',
        'Vídeos curtos de apresentação (cria conexão)',
      ]),
      {
        nome: 'Estrutura e Serviços Complementares',
        obrigatoria: true,
        objetivo: 'Provar capacidade técnica e cobertura de atendimento.',
        secoes: [
          'Fotos: recepção, consultório, laboratório, sala de imagem, centro cirúrgico, internação',
          'Equipamentos e para que servem em linguagem acessível',
          'Farmácia veterinária e loja (com link para o e-commerce)',
          'Rede de parceiros para serviços não realizados na clínica (encaminhamento)',
          'Acessibilidade física, estacionamento e localização',
        ],
        dica: 'Se houver mais de uma unidade, criar uma página por unidade com horários, equipe e mapa próprios (bom para SEO local).',
      },
      {
        nome: 'Urgência e Emergência',
        obrigatoria: false,
        objetivo: 'Ser a página mais rápida de achar quando alguém está desesperado.',
        secoes: [
          'Checklist de sinais de emergência em destaque (dificuldade para respirar, sangramento, convulsão, ingestão de tóxicos, trauma, distensão abdominal)',
          'O que fazer (e o que não fazer) antes de sair de casa: transporte seguro, não medicar por conta própria, manter o pet aquecido',
          'Telefone de contato direto e horário de plantão',
          'Tempo médio de chegada e instruções de priorização por gravidade',
          'Endereço com botão de rota e estacionamento de emergência',
        ],
        dica: 'Página extremamente enxuta, com botão de ligar fixo e texto grande — normalmente usada no celular.',
      },
      {
        nome: 'Planos e Convênios',
        obrigatoria: false,
        objetivo: 'Tornar a prevenção acessível e aumentar retenção.',
        secoes: [
          'Planos por faixa de idade do pet, com o que cobre e o que não cobre',
          'Tabela comparativa de planos',
          'Convênios e reembolso: passo a passo para o tutor',
          'Formas de pagamento, parcelamento de procedimentos eletivos',
        ],
        dica: 'Transparência sobre cobertura reduz cancelamentos e reclamações futuras.',
      },
      paginaFaq([
        'Como funciona o atendimento de urgência?',
        'Vocês parcelam exames e cirurgias?',
        'Qual o valor da consulta?',
        'Preciso de agenda para vacinação?',
        'Atendem animais silvestres ou exóticos?',
        'Fazem atendimento domiciliar?',
        'Como vocês passam o orçamento?',
      ]),
      paginaDepoimentos(['Depoimentos de casos de urgência e de acompanhamento contínuo (com autorização)']),
      paginaBlog(['Pautas: "primeiros socorros para cães", "sinais de dor em gatos", "calendário de vacinação", "cuidados com pets idosos"', 'Cada artigo assinado por um médico-veterinário com CRMV']),
      paginaContato(['Telefone de urgência e de agendamento separados e destacados', 'WhatsApp com resposta automática sobre horários']),
      paginaPolitica(),
      paginaLoja('Clínica veterinária', [
        'Categorias: ração, dietas prescritas, antiparasitários, higiene, suplementos, acessórios',
        'Venda de medicamento controlado apenas com validação de receita',
      ]),
    ],
    funcionalidades: {
      essenciais: [
        'Agendamento online por especialidade e profissional',
        'Página de urgência otimizada para celular com botão de ligar',
        'Formulário de contato com upload de exames',
        'Equipe com CRMV visível e responsável técnico',
        'Catálogo de produtos (loja) com carrinho e checkout',
        'Google Maps na home e na página de contato',
        'Dados estruturados VeterinaryCare + LocalBusiness + FAQPage',
        'Blog com artigos assinados por veterinários',
      ],
      desejaveis: [
        'Área do tutor: histórico do pet, carteira de vacinação digital, resultados de exames',
        'Lembretes automáticos de vacinas, antiparasitários e retornos',
        'Telemedicina / triagem online com veterinário',
        'Orçamento online para procedimentos eletivos (castração, odontologia)',
        'Assinatura de plano de saúde pet e cobrança recorrente',
        'Integração com prontuário eletrônico e laboratório',
        'Chat com triagem automática e encaminhamento para urgência',
      ],
      integracoes: [
        'Sistema de gestão veterinário (prontuário, agenda, financeiro)',
        'WhatsApp Business API',
        'Laboratórios parceiros para resultados online',
        'Gateway de pagamento e link de pagamento no orçamento',
        'Google Analytics 4 + Google Ads + Meta Pixel',
      ],
    },
    conteudoPronto: {
      servicos: [
        'Consulta clínica geral',
        'Consulta com especialista',
        'Vacinação e protocolo de filhotes',
        'Exames laboratoriais',
        'Ultrassonografia',
        'Radiografia digital',
        'Eletrocardiograma e ecocardiograma',
        'Castração e cirurgias gerais',
        'Cirurgia ortopédica',
        'Odontologia veterinária',
        'Internação e observação',
        'Atendimento de urgência',
        'Atendimento domiciliar',
        'Nutrição clínica e dietas terapêuticas',
        'Acupuntura e fisioterapia (quando houver)',
      ],
      diferenciais: [
        'Equipe com especialistas e estrutura para diagnóstico no mesmo dia',
        'Orçamento apresentado e aprovado pelo tutor antes de cada procedimento',
        'Acompanhamento contínuo: o mesmo veterinário acompanha o histórico do paciente',
        'Planos de saúde pet e parcelamento para tornar o tratamento viável',
        'Canais claros de urgência com orientação pelo telefone antes da chegada',
      ],
      faq: [
        { pergunta: 'Como funciona o atendimento de urgência?', resposta: 'Ligue para [TELEFONE] informando o que aconteceu; orientamos o transporte e preparamos o atendimento para a chegada. Casos graves têm prioridade sobre consultas agendadas.' },
        { pergunta: 'Qual o valor da consulta e dos exames?', resposta: 'Os valores são informados no agendamento e no orçamento antes de qualquer exame. Trabalhamos com transparência total — nada é feito sem a sua aprovação.' },
        { pergunta: 'Vocês parcelam tratamentos e cirurgias?', resposta: 'Sim, procedimentos eletivos podem ser parcelados no cartão, e temos planos próprios e convênios. Fale com a recepção para simular seu caso.' },
        { pergunta: 'Atendem animais exóticos ou silvestres?', resposta: 'Atendemos [ESPÉCIES]. Para outras espécies, indicamos colegas especializados parceiros.' },
        { pergunta: 'Fazem atendimento domiciliar?', resposta: 'Sim, em casos selecionados e para regiões específicas, com agendamento prévio e taxa de deslocamento informada antes.' },
        { pergunta: 'Meu pet precisa de jejum para os exames?', resposta: 'Depende do exame. As orientações de preparo são enviadas por WhatsApp na confirmação do agendamento.' },
        { pergunta: 'Como recebo os resultados?', resposta: 'Os laudos ficam disponíveis na área do tutor e também são enviados pelo WhatsApp da clínica no prazo informado no atendimento.' },
      ],
      depoimentos: [
        { nome: 'Tutora do Apollo', texto: 'Meu cachorro chegou com um quadro grave e a equipe foi rápida e honesta sobre as chances e os custos. Salvou a vida dele.' },
        { nome: 'Tutor da Luna', texto: 'Faço o acompanhamento dela desde filhote. Sempre explicam tudo e nunca empurram exame desnecessário.' },
      ],
      seo: {
        palavrasChave: [
          'clínica veterinária [CIDADE]',
          'veterinário perto de mim',
          'veterinário 24 horas [CIDADE]',
          'consulta veterinária [BAIRRO]',
          'ultrassom veterinário [CIDADE]',
          'castração [CIDADE] preço',
          'vacina para cachorro [CIDADE]',
        ],
        tituloHome: '[NOME] | Clínica Veterinária em [CIDADE] — Consultas, Exames e Urgência',
        descricaoHome:
          'Consultas, vacinas, exames, cirurgias e urgência veterinária em [CIDADE]. Especialistas, orçamento transparente e agendamento online.',
      },
    },
    ecommerce: {
      categorias: ['Ração e dietas prescritas', 'Antiparasitários', 'Medicamentos de venda livre', 'Suplementos', 'Higiene', 'Acessórios e caminhas'],
      recursos: [
        'Assinatura de ração e antiparasitário com lembrete de reaplicação',
        'Upload de receita para produtos controlados com validação da equipe',
        'Retirada na clínica (com desconto) e entrega local',
        'Recompra rápida a partir do histórico do pet na área do tutor',
      ],
      observacoes: [
        'Texto de produto sem promessa terapêutica e com aviso "medicamento de uso veterinário"',
        'Integrar pedidos ao prontuário para registro do que foi vendido ao pet',
      ],
    },
    cuidados: [
      'Divulgar responsável técnico e CRMV; conteúdo clínico deve ter assinatura profissional',
      'Nunca prescrever, diagnosticar ou dosar medicamento pelo site ou WhatsApp',
      'Dados de saúde do pet e do tutor são sensíveis: consentimento, sigilo e retenção mínima (LGPD)',
      'Em emergência, orientar ligação telefônica e nunca instruir ações que possam agravar o quadro',
      'Comunicação de planos deve descrever cobertura, carência e exclusões com clareza (CDC)',
    ],
  },

  /* ==================== 8. EMPRESAS EM GERAL (MODELO CORINGA) ==================== */
  {
    id: 'empresas_gerais',
    nome: 'Empresas em Geral',
    emoji: '🏢',
    area: 'Geral',
    setor: 'negócios e prestação de serviços em geral',
    genero: 'f',
    termoBusca: 'empresa',
    schemaOrg: 'LocalBusiness',
    resumo: 'Modelo coringa para qualquer empresa, comércio ou prestador de serviços fora dos nichos específicos.',
    suportaEcommerce: true,
    temAgendamento: false,
    objetivoRecomendado: 'orcamento',
    descricaoNegocioPadrao:
      'empresa que vende produtos e/ou presta serviços para clientes da própria cidade e região, com equipe enxuta, atendimento próprio e um responsável direto pelas decisões comerciais',
    publicoAlvoPadrao:
      'Clientes da cidade e do entorno que chegam por indicação, por busca no Google (o que preciso + a cidade) e pelas redes sociais; comparam de duas a três opções antes de entrar em contato e decidem pela confiança que o site transmite nos primeiros segundos.',
    tomDeVoz: {
      personalidade: ['Direto e claro', 'Próximo e humano', 'Confiável sem exagero', 'Focado em resolver o problema do cliente'],
      regras: [
        'Começar pelo problema do cliente, não pela história da empresa',
        'Frases curtas, com verbos no imperativo nos CTAs ("peça seu orçamento", "fale com a gente")',
        'Trocar jargão interno por palavras que o cliente realmente digita na busca',
        'Usar números concretos (anos de mercado, atendimentos, prazo de resposta) em vez de adjetivos',
        'Nunca prometer resultado, preço ou prazo que a empresa não tenha confirmado',
      ],
      evitar: [
        'Textos institucionais genéricos ("empresa que preza pela qualidade e pelo compromisso")',
        'Superlativos sem comprovação ("líder de mercado", "melhor da cidade")',
        'Excesso de emojis e de exclamações',
      ],
      exemplos: [
        'Título: "Problema resolvido, sem enrolação"',
        'CTA: "Pedir orçamento" / "Falar no WhatsApp"',
        'Bloco: "Respondemos em até 1 dia útil com o valor e o prazo do seu caso."',
      ],
    },
    estiloVisual: {
      estilos: ['Moderno e corporativo', 'Clean e minimalista', 'Próximo e acolhedor'],
      paletas: [
        {
          nome: 'Azul Confiança',
          descricao: 'Clássica e segura, funciona para quase todo serviço',
          cores: [
            { nome: 'Azul profundo', hex: '#12395B' },
            { nome: 'Azul vivo', hex: '#2E6FB7' },
            { nome: 'Cinza claro', hex: '#EEF1F5' },
            { nome: 'Laranja de ação', hex: '#F0821E' },
            { nome: 'Branco', hex: '#FFFFFF' },
          ],
        },
        {
          nome: 'Verde Resolutivo',
          descricao: 'Próxima e sustentável',
          cores: [
            { nome: 'Verde escuro', hex: '#1F3D2B' },
            { nome: 'Verde médio', hex: '#3E8E5A' },
            { nome: 'Areia', hex: '#F3EDE3' },
            { nome: 'Terracota', hex: '#C4663C' },
            { nome: 'Grafite', hex: '#2B2B2B' },
          ],
        },
      ],
      tipografia: {
        titulos: 'Sans com boa leitura (Inter, Poppins, Manrope)',
        corpo: 'Sans neutra (Inter, Roboto, Source Sans)',
      },
      diretrizes: [
        'Uma seção por dúvida do cliente: o que fazemos, para quem, quanto custa, onde estamos',
        'Botão de contato visível em todas as seções, sem depender do menu',
        'Ícones simples (linha) e fotos reais da equipe e do espaço',
        'Blocos de "prova": tempo de mercado, clientes atendidos, avaliações e parceiros',
        'Página leve: imagens comprimidas e sem carrossel pesado na primeira dobra',
      ],
      imagensIdeais: ['Equipe trabalhando', 'Ambiente e estrutura da empresa', 'Antes/depois ou resultado do serviço', 'Produtos em uso'],
      evitar: ['Banco de imagens genérico com apertos de mão', 'Fotos de baixa resolução esticadas', 'Excesso de efeitos e animações'],
    },
    paginas: [
      {
        nome: 'Home',
        obrigatoria: true,
        objetivo: 'Dizer em 5 segundos o que a empresa faz, para quem e como pedir orçamento.',
        secoes: [
          'Hero com o que a empresa faz + cidade + botão "Pedir orçamento" e WhatsApp',
          'Barra de confiança: anos de mercado, número de clientes, nota no Google, selos',
          'Principais serviços/produtos em cards com ícone, descrição curta e link',
          'Diferenciais reais em 3 a 5 blocos curtos',
          'Prova social: 3 depoimentos com nome e nota',
          'Como funciona: 3 a 4 passos do primeiro contato à entrega',
          'Sobre resumido com foto da equipe',
          'FAQ com as 5 dúvidas mais comuns',
          'Bloco final "fale com a gente" com formulário curto, telefone, endereço e horário',
        ],
        dica: 'Se a empresa atende mais de um tipo de cliente, deixe isso claro na primeira dobra (dois botões, dois caminhos).',
      },
      {
        nome: 'Produtos e Serviços',
        obrigatoria: true,
        objetivo: 'Explicar cada oferta em detalhe e responder "quanto custa" sem prometer preço errado.',
        secoes: [
          'Lista de serviços/produtos com nome claro, para quem serve, o que resolve e o que está incluso',
          'Faixa de preço ou "a partir de", quando o cliente autorizar divulgar',
          'Perguntas frequentes específicas de cada item',
          'Tempo médio de entrega/execução e o que depende do cliente',
          'Formas de pagamento aceitas',
          'CTA de orçamento no fim de cada bloco',
        ],
        dica: 'Quando não houver preço público, explique o que determina o valor — isso qualifica o contato e reduz a negociação.',
      },
      paginaProjetos(['Trabalhos, entregas ou atendimentos documentados com foto e resultado'], '', 'Casos e Resultados'),
      paginaProcesso(),
      paginaSobre([
        'História da empresa, motivo de existir e o que mudou desde a fundação',
        'Equipe com nome, função e tempo de casa',
        'Estrutura: endereço, veículos, equipamentos, certificações e alvarás',
      ]),
      paginaGaleria(['Fotos da estrutura, do atendimento e das entregas', 'Vídeos curtos de bastidores e do dia a dia']),
      paginaDepoimentos(['Depoimentos com nome, empresa do cliente e o serviço contratado', 'Avaliações do Google com nota média em destaque']),
      paginaFaq([
        'Quanto custa?',
        'Qual o prazo de entrega?',
        'Vocês atendem em toda a cidade?',
        'Como funcionam o pagamento e o parcelamento?',
        'Emitem nota fiscal e garantem o serviço?',
        'Preciso agendar ou posso passar aí?',
      ]),
      paginaBlog(['Pautas: dúvidas frequentes dos clientes, comparações de opções, erros comuns e novidades do setor']),
      paginaContato(['Telefone, WhatsApp, e-mail e horário de atendimento', 'Mapa com ponto de referência e estacionamento']),
      paginaPolitica(),
      paginaLoja('Empresas em geral', [
        'Categorias conforme o mix real do cliente (produtos, kits, assinaturas, serviços com valor fixo)',
        'Venda de serviço com valor fixo e agendamento opcional no checkout',
      ]),
    ],
    funcionalidades: {
      essenciais: [
        'Formulário de contato/orçamento que chega no e-mail e no WhatsApp do responsável',
        'Botão de WhatsApp flutuante com mensagem pré-preenchida por página',
        'Mapa, endereço e horário de atendimento em todas as páginas relevantes',
        'Página de serviços com descrição, aplicações e perguntas frequentes por item',
        'Prova social: depoimentos, avaliações do Google e clientes atendidos',
        'SEO local com dados estruturados e Google Meu Negócio configurado',
        'Blog simples para publicar dúvidas e novidades (quando o cliente aceitar manter)',
      ],
      desejaveis: [
        'Orçamento em etapas com upload de arquivos e fotos',
        'Área do cliente com histórico de pedidos, orçamentos e documentos',
        'Chat/atendimento automático com respostas prontas e horário de funcionamento',
        'Integração com CRM para acompanhar leads e proposta',
        'Painel simples de conteúdo para o cliente editar textos e fotos',
        'Versão em mais de um idioma, quando atender estrangeiros',
      ],
      integracoes: [
        'Google Analytics 4 + Google Ads + Google Meu Negócio',
        'Meta Pixel e Instagram',
        'WhatsApp Business (link wa.me ou API oficial)',
        'Gateway de pagamento (Pix, cartão, boleto e link de pagamento)',
      ],
    },
    conteudoPronto: {
      servicos: [
        'Prestação de serviços',
        'Atendimento consultivo e diagnóstico da necessidade',
        'Execução do serviço principal da empresa',
        'Serviços complementares de manutenção',
        'Venda de produtos relacionados',
        'Atendimento comercial (empresas e órgãos públicos)',
        'Atendimento residencial',
        'Orçamento sem compromisso',
        'Visita técnica ou avaliação no local',
        'Entrega e instalação',
        'Suporte pós-venda',
        'Contratos de manutenção periódica',
        'Assessoria e consultoria pontual',
      ],
      diferenciais: [
        'Atendimento direto com quem executa — sem central de atendimento',
        'Prazo e valor combinados por escrito antes de começar',
        'Equipe própria, com nota fiscal e garantia formal do serviço',
        'Resposta em até 1 dia útil pelos canais de contato',
        'Cobertura em toda a cidade e cidades vizinhas',
      ],
      faq: [
        { pergunta: 'Como peço um orçamento?', resposta: 'Preencha o formulário do site ou chame no WhatsApp informando o que precisa, o endereço e a data desejada. Respondemos em até 1 dia útil.' },
        { pergunta: 'Quanto custa?', resposta: 'Depende do escopo, do material e do deslocamento. Depois de entender o caso, enviamos o valor e o prazo por escrito, sem compromisso.' },
        { pergunta: 'Vocês emitem nota fiscal?', resposta: 'Sim. Emitimos nota fiscal de serviço e de produto e trabalhamos com garantia formal do que foi executado.' },
        { pergunta: 'Quais as formas de pagamento?', resposta: 'Pix, dinheiro, cartão de débito e crédito (com parcelamento nas condições informadas no orçamento). Para empresas, faturamos conforme combinado.' },
        { pergunta: 'Atendem fora da cidade?', resposta: 'Sim, atendemos a região. Para localidades mais distantes, o deslocamento é informado no orçamento antes do agendamento.' },
        { pergunta: 'Em quanto tempo conseguem atender?', resposta: 'Para serviços simples, em geral na mesma semana. O prazo real é confirmado junto com o orçamento, conforme a agenda.' },
      ],
      depoimentos: [
        { nome: 'Cliente residencial', texto: 'Pedi orçamento pelo site e no dia seguinte já tinha valor e prazo na mão. Serviço feito no combinado, sem surpresa no final.' },
        { nome: 'Cliente empresarial', texto: 'Atendimento direto com o responsável, o que agiliza tudo. Fechamos um contrato de manutenção depois do primeiro serviço.' },
      ],
      seo: {
        palavrasChave: [
          'empresa de [SERVIÇO] em [CIDADE]',
          '[SERVIÇO] perto de mim',
          'orçamento de [SERVIÇO] em [CIDADE]',
          '[SERVIÇO] em [BAIRRO]',
          'quanto custa [SERVIÇO] em [CIDADE]',
          'melhor empresa de [SERVIÇO] em [CIDADE]',
        ],
        tituloHome: '[NOME] | [SERVIÇO] em [CIDADE]',
        descricaoHome:
          '[NOME]: [SERVIÇO] em [CIDADE] com atendimento direto, orçamento sem compromisso e resposta em até 1 dia útil. Fale com a gente pelo WhatsApp.',
      },
    },
    ecommerce: {
      categorias: ['Produtos', 'Kits e combos', 'Serviços com valor fixo', 'Gift card / vale-presente'],
      recursos: [
        'Carrinho com cálculo de frete por CEP e opção de retirada no balcão',
        'Pagamento por Pix, cartão e boleto com link de pagamento',
        'Cupom de primeira compra para captar e-mail',
        'Venda de serviço com agendamento escolhido no checkout',
      ],
      observacoes: [
        'Definir no início se o e-commerce será o foco do site ou um anexo do institucional',
        'Cadastrar de 15 a 30 itens antes de publicar para a loja não nascer vazia',
      ],
    },
    cuidados: [
      'Sem superlativos e comparações diretas com concorrentes (CDC, art. 37 — publicidade enganosa)',
      'Nunca publicar preço, prazo ou condição sem confirmação do cliente',
      'Toda promessa exibida no site precisa ser cumprida no atendimento — alinhar com o cliente antes de publicar',
      'Formulário com checkbox de consentimento LGPD, finalidade do dado e canal para solicitar exclusão',
      'Usar apenas fotos próprias ou de banco de imagens com licença; registrar a origem das imagens',
      'Dados de clientes (fotos, nomes, avaliações) só com autorização expressa',
    ],
  },

  /* ============================== 9. ARQUITETURA ============================== */
  {
    id: 'arquitetura',
    nome: 'Arquitetura',
    emoji: '📐',
    area: 'Construção e Imóveis',
    setor: 'arquitetura e design de interiores',
    genero: 'm',
    termoBusca: 'escritório de arquitetura',
    schemaOrg: 'ProfessionalService',
    resumo: 'Escritórios de arquitetura e design de interiores, projetos residenciais e comerciais.',
    suportaEcommerce: true,
    temAgendamento: true,
    objetivoRecomendado: 'orcamento',
    descricaoNegocioPadrao:
      'escritório de arquitetura que desenvolve projetos residenciais e comerciais, do estudo preliminar ao acompanhamento de obra, com desenho autoral e atendimento próximo ao cliente',
    publicoAlvoPadrao:
      'Famílias que vão construir ou reformar o próprio imóvel, casais comprando o primeiro apartamento e empresas que precisam adequar ponto comercial; chegam por indicação e pelo Instagram, decidem pela qualidade do portfólio e pelo cuidado no atendimento, e temem contratar alguém que não escute o que eles querem.',
    tomDeVoz: {
      personalidade: ['Sensível ao jeito de viver do cliente', 'Técnico com linguagem acessível', 'Elegante e autoral', 'Tranquilizador quanto a prazos e processos'],
      regras: [
        'Explicar a decisão de projeto pelo efeito na vida do cliente (luz, circulação, espaço, custo)',
        'Traduzir termos técnicos na primeira menção ("estudo preliminar — o rascunho do projeto")',
        'Falar de processo e etapas, porque é o que reduz o medo de contratar arquiteto',
        'Usar o vocabulário do cliente: "planta", "reforma", "orcamento da obra", "metragem"',
        'Evitar autopromoção vazia: mostrar projeto, foto e número vale mais que adjetivo',
      ],
      evitar: [
        'Texto inflado sobre "transformar sonhos em realidade" sem nada concreto',
        'Jargão de prancha técnica jogado no texto (NBR, corte, elevação) sem tradução',
        'Prometer prazo de aprovação em prefeitura ou condomínio',
      ],
      exemplos: [
        'Título: "Projetamos a partir de como você vive — não de um estilo pronto"',
        'CTA: "Agendar uma conversa" / "Solicitar proposta"',
        'Bloco: "Você recebe o estudo preliminar em até 20 dias, com plantas, imagens e estimativa de custo."',
      ],
    },
    estiloVisual: {
      estilos: ['Minimalista autoral', 'Contemporâneo com madeira e concreto', 'Clássico contemporâneo'],
      paletas: [
        {
          nome: 'Concreto e Madeira',
          descricao: 'Atemporal e sofisticada',
          cores: [
            { nome: 'Grafite', hex: '#2E2E2E' },
            { nome: 'Concreto', hex: '#B9B5AE' },
            { nome: 'Madeira', hex: '#A9743F' },
            { nome: 'Off-white', hex: '#F4F1EC' },
            { nome: 'Verde-oliva', hex: '#6B7345' },
          ],
        },
        {
          nome: 'Branco Galeria',
          descricao: 'Deixa o projeto ser o protagonista',
          cores: [
            { nome: 'Branco', hex: '#FFFFFF' },
            { nome: 'Cinza claro', hex: '#E7E7E7' },
            { nome: 'Preto', hex: '#141414' },
            { nome: 'Areia', hex: '#E3D5C3' },
            { nome: 'Terracota', hex: '#B5623C' },
          ],
        },
      ],
      tipografia: {
        titulos: 'Serifada elegante ou sans geométrica (Playfair Display, Canela, Montserrat)',
        corpo: 'Sans neutra com boa entrelinha (Inter, Lato, Work Sans)',
      },
      diretrizes: [
        'Portfólio como protagonista: imagens grandes, fundo neutro e nenhum elemento competindo com a foto',
        'Grid disciplinado e muito espaço em branco — o layout também comunica o desenho do escritório',
        'Cada projeto com ficha técnica curta (tipo, metragem, local, ano, escopo)',
        'Transições suaves ao rolar e zoom discreto no hover das fotos',
        'Evitar carrossel automático: o visitante decide o ritmo de ver os projetos',
      ],
      imagensIdeais: ['Projeto finalizado com luz natural', 'Planta humanizada e imagens 3D', 'Detalhes de materiais e marcenaria', 'Antes/depois de reformas'],
      evitar: ['Fotos de banco de imagens com aparência de catálogo', 'Renders genéricos de terceiros, sem crédito', 'Portfólio com imagens tremidas ou mal iluminadas'],
    },
    paginas: [
      {
        nome: 'Home',
        obrigatoria: true,
        objetivo: 'Apresentar o escritório pelo trabalho e levar o visitante ao portfólio ou ao contato.',
        secoes: [
          'Hero com um projeto marcante em tela cheia e assinatura curta do escritório',
          'Faixa com tipos de projeto atendidos (residencial, interiores, comercial, reforma)',
          'Seleção de 4 a 6 projetos com foto, local, tipo e ano',
          'Como trabalhamos, em 4 etapas resumidas',
          'Sobre resumido, com o responsável e o registro no CAU',
          'Depoimentos e publicações em que o escritório apareceu',
          'Formulário curto de contato com upload de referências e plantas',
        ],
        dica: 'Se o escritório atende tanto pessoa física quanto empresa, ofereça dois caminhos claros logo na primeira dobra.',
      },
      paginaProjetos(
        [
          'Organização por categoria (residencial, interiores, comercial, institucional) e por fase (projeto, obra em andamento, entregue)',
          'Ficha técnica completa em cada projeto e créditos de fotografia',
        ],
        'Portfólio pequeno não é problema — sem processo e resultado documentado, sim. Projeto sem foto finalizada pode ser apresentado com planta e imagens 3D.',
        'Projetos'
      ),
      {
        nome: 'Serviços',
        obrigatoria: true,
        objetivo: 'Explicar o que o escritório entrega em cada tipo de contratação e o que esperar do serviço.',
        secoes: [
          'Projeto arquitetônico completo (estudo preliminar, anteprojeto, executivo e detalhamento)',
          'Design de interiores, com marcenaria, iluminação e especificação de acabamentos',
          'Reforma e retrofit, com diagnóstico do imóvel existente',
          'Regularização e aprovação em prefeitura, condomínio e corpos de bombeiros',
          'Acompanhamento de obra, medições e conferência de materiais',
          'Consultoria pontual por hora (cores, layout, iluminação, compra de móveis)',
          'O que está incluso, o que é cobrado à parte e como é feita a cobrança por etapa',
        ],
        dica: 'Explicar o que NÃO está incluso evita conflito no meio da obra e economiza reuniões.',
      },
      paginaProcesso([
        'Etapas do projeto com o que o cliente recebe em cada uma (pranchas, imagens, memoriais, planilhas)',
        'Prazos médios de cada etapa e o que depende de decisão do cliente',
        'Como funciona o acompanhamento de obra: visitas, relatórios e registro fotográfico',
      ]),
      paginaSobre([
        'História do escritório, formação do responsável e registro no CAU',
        'Time e papéis (arquiteto, projetista, estagiário, parceiros de engenharia)',
        'Prêmios, concursos, publicações e participação em feiras',
        'Escritório físico, endereço e canal de atendimento',
      ]),
      paginaDepoimentos(['Depoimentos com nome do cliente, tipo de projeto e foto da obra entregue']),
      paginaFaq([
        'Quanto custa um projeto de arquitetura?',
        'Quanto tempo demora para ficar pronto?',
        'Vocês acompanham a obra?',
        'Preciso ter o terreno ou o imóvel comprado?',
        'Fazem projeto de interiores de um ambiente só?',
        'Vocês aprovam o projeto na prefeitura e no condomínio?',
        'Como funciona o pagamento?',
      ]),
      paginaBlog(['Pautas: "quanto custa construir em [CIDADE]", "reforma de apartamento antigo", "erros comuns ao contratar um arquiteto", "iluminação que valoriza o ambiente"', 'Cada post com imagens próprias e link para um projeto relacionado']),
      paginaContato(['Formulário com upload de planta, matrícula ou referências', 'Localização do escritório com estacionamento e horário de atendimento']),
      paginaPolitica(),
      paginaLoja('Escritório de arquitetura', [
        'Categorias: consultoria online, plantas de projetos prontos, e-books e cursos, gift card de consultoria',
        'Consultoria por vídeo com duração e escopo definidos (ex.: 60 minutos sobre layout)',
      ]),
    ],
    funcionalidades: {
      essenciais: [
        'Portfólio com filtros por tipo e fase, página individual por projeto',
        'Galeria de imagens com zoom, legendas e créditos de fotografia',
        'Formulário de contato/orçamento com upload de planta e referências',
        'Botão de WhatsApp com mensagem pré-preenchida por tipo de projeto',
        'Página de processo explicando etapas, entregas e prazos',
        'Dados estruturados ProfessionalService/Architect com endereço e serviços',
        'Blog/inspirações para SEO com pautas ligadas a "quanto custa" e "como fazer"',
      ],
      desejaveis: [
        'Agendamento online de conversa inicial (30 minutos) com horários disponíveis',
        'Tour 360 ou vídeo de apresentação dos projetos entregues',
        'Área do cliente com pranchas, cronograma e histórico de aprovações',
        'Estimador de custo de obra por metragem e padrão de acabamento',
        'Lista de desejos de produtos e parceiros indicados (curadoria)',
        'Painel para o cliente publicar novos projetos sem apoio técnico',
      ],
      integracoes: [
        'Instagram (feed de projetos no site) e Pinterest',
        'Google Analytics 4 + Google Ads',
        'WhatsApp Business e e-mail marketing',
        'Ferramentas de assinatura e envio de proposta (contrato digital)',
      ],
    },
    conteudoPronto: {
      servicos: [
        'Projeto arquitetônico residencial',
        'Projeto arquitetônico comercial',
        'Design de interiores residencial',
        'Projeto de interiores comercial',
        'Reforma e retrofit',
        'Regularização de imóvel',
        'Aprovação em prefeitura e condomínio',
        'Projeto luminotécnico',
        'Projeto de marcenaria e mobiliário',
        'Acompanhamento de obra',
        'Consultoria e assessoria pontual',
        'Arquitetura paisagística (quando houver)',
        'Projeto de acessibilidade',
        'Levantamento e as built do imóvel',
      ],
      diferenciais: [
        'Projeto desenhado a partir da rotina da família, com reuniões de briefing estruturadas',
        'Estimativa de custo apresentada junto com o estudo preliminar',
        'Pranchetas organizadas para o cliente e para a equipe de obra, sem ruído de comunicação',
        'Acompanhamento de obra com relatório fotográfico e conferência de medidas',
        'Rede de fornecedores testados para marcenaria, iluminação e acabamentos',
      ],
      faq: [
        { pergunta: 'Quanto custa um projeto de arquitetura?', resposta: 'Depende da metragem, do escopo (projeto, interiores, acompanhamento) e do nível de detalhamento. Enviamos uma proposta com valores por etapa e o que está incluso em cada uma.' },
        { pergunta: 'Quanto tempo demora o projeto?', resposta: 'Um projeto residencial completo costuma levar de 2 a 4 meses, conforme o escopo e a velocidade das decisões. Você recebe o cronograma junto com a proposta.' },
        { pergunta: 'Vocês acompanham a obra?', resposta: 'Sim, o acompanhamento é contratado à parte e inclui visitas periódicas, relatório fotográfico e conferência do que está sendo executado.' },
        { pergunta: 'Preciso já ter o terreno ou o apartamento?', resposta: 'Não, o projeto pode começar antes. No caso de reforma, fazemos o levantamento do imóvel existente para trabalhar com as medidas reais.' },
        { pergunta: 'Fazem projeto para um ambiente só?', resposta: 'Sim, atendemos escopos pontuais como sala, cozinha ou dormitório, com escopo e valor proporcionais ao tamanho do projeto.' },
        { pergunta: 'Como funciona o pagamento?', resposta: 'Por etapas entregues, em parcelas combinadas na proposta, com percentual inicial na assinatura do contrato.' },
      ],
      depoimentos: [
        { nome: 'Cliente de reforma residencial', texto: 'O escritório entendeu exatamente como a gente vive e resolveu problemas que eu nem sabia que existiam. A obra andou com as medidas certas, sem retrabalho.' },
        { nome: 'Cliente de projeto comercial', texto: 'Prazo cumprido e pranchetas impecáveis. O arquiteto sentou com nossos fornecedores e destravou a execução.' },
      ],
      seo: {
        palavrasChave: [
          'arquiteto em [CIDADE]',
          'escritório de arquitetura em [CIDADE]',
          'projeto de arquitetura [CIDADE] preço',
          'design de interiores em [CIDADE]',
          'arquiteto para reforma em [CIDADE]',
          'projeto de apartamento [BAIRRO]',
          'quanto custa um projeto de arquitetura em [CIDADE]',
        ],
        tituloHome: '[NOME] | Escritório de Arquitetura e Interiores em [CIDADE]',
        descricaoHome:
          'Projetos residenciais, comerciais e de interiores em [CIDADE]. Do estudo preliminar ao acompanhamento de obra, com proposta e cronograma claros.',
      },
    },
    ecommerce: {
      categorias: ['Consultoria online', 'Projetos prontos e plantas', 'E-books e cursos', 'Gift card de consultoria'],
      recursos: [
        'Consultoria por vídeo com duração definida e envio de material antes da sessão',
        'Download imediato de e-books, planilhas e materiais de apoio',
        'Gift card de consultoria para presentear',
        'Agendamento do horário da consultoria direto no checkout',
      ],
      observacoes: [
        'Vender produto digital exige página de entrega automática e termos de uso claros (direito autoral do projeto)',
        'Deixar explícito que projeto vendido é de uso único e não pode ser revendido',
      ],
    },
    cuidados: [
      'Informar o registro no CAU e o número de RRT dos projetos divulgados',
      'Direito autoral: renders, plantas e fotos de terceiros só com autorização e crédito devidos',
      'Nunca prometer prazo de aprovação em prefeitura, condomínio ou órgão público',
      'Não publicar imagens de projetos de outros escritórios nem "inspirações" apresentadas como autorais',
      'Dados de clientes e plantas de imóveis particulares são confidenciais (LGPD): pedir autorização antes de mostrar o endereço',
      'Estimar custo é diferente de orçar: usar "estimativa" e sempre indicar a data de referência dos valores',
    ],
  },

  /* =============================== 10. ENGENHARIA =============================== */
  {
    id: 'engenharia',
    nome: 'Engenharia',
    emoji: '📊',
    area: 'Construção e Imóveis',
    setor: 'engenharia civil',
    genero: 'f',
    termoBusca: 'empresa de engenharia',
    schemaOrg: 'ProfessionalService',
    resumo: 'Engenharia civil: laudos, projetos estruturais, regularização, vistorias e execução.',
    suportaEcommerce: false,
    temAgendamento: false,
    objetivoRecomendado: 'orcamento',
    descricaoNegocioPadrao:
      'empresa de engenharia civil que atende construtoras, condomínios, indústrias e proprietários com laudos técnicos, projetos, regularizações e execução de obras, sempre com responsabilidade técnica registrada no CREA',
    publicoAlvoPadrao:
      'Síndicos e administradoras de condomínio, construtoras, indústrias, lojistas e proprietários que precisam de laudo, regularização ou solução técnica com respaldo legal. Chegam pelo Google e por indicação de advogados, contadores e corretores, e decidem pela credibilidade técnica, pelo prazo e pela clareza do escopo.',
    tomDeVoz: {
      personalidade: ['Técnico e objetivo', 'Confiável e formal na medida', 'Preventivo (evita problema antes que aconteça)', 'Explicativo com quem não é da área'],
      regras: [
        'Explicar o problema, o risco e a solução, nessa ordem, com linguagem simples',
        'Citar norma, laudo ou ART apenas quando sustenta o argumento, com o nome correto',
        'Nunca prometer resultado de análise de órgão público, aprovação de projeto ou isenção de multa',
        'Dar prazo em dias úteis e deixar claro de quem depende o prazo (cliente, prefeitura, laboratório)',
        'Preferir "laudo", "vistoria", "regularização", "ART", "NBR" — termos que o cliente digita na busca',
      ],
      evitar: [
        'Textos de efeito sobre "excelência e inovação" sem informação técnica',
        'Termos em inglês e siglas não explicadas',
        'Promessa de "aprovação garantida" ou de prazo que depende de terceiros',
      ],
      exemplos: [
        'Título: "Laudo técnico com ART, pronto para o processo"',
        'CTA: "Solicitar orçamento" / "Enviar documentos"',
        'Bloco: "Vistoria agendada em até 3 dias úteis e laudo entregue em até 7 dias após a visita."',
      ],
    },
    estiloVisual: {
      estilos: ['Técnico e sóbrio', 'Corporativo moderno', 'Industrial objetivo'],
      paletas: [
        {
          nome: 'Aço e Segurança',
          descricao: 'Transmite solidez e precisão',
          cores: [
            { nome: 'Azul-petróleo', hex: '#12303F' },
            { nome: 'Azul técnico', hex: '#2B6C8F' },
            { nome: 'Cinza concreto', hex: '#C9CDD2' },
            { nome: 'Amarelo segurança', hex: '#F2B705' },
            { nome: 'Branco', hex: '#FFFFFF' },
          ],
        },
        {
          nome: 'Obra Limpa',
          descricao: 'Técnica com toque contemporâneo',
          cores: [
            { nome: 'Grafite', hex: '#232B33' },
            { nome: 'Cinza médio', hex: '#6B7684' },
            { nome: 'Areia', hex: '#EFE9DE' },
            { nome: 'Laranja sinal', hex: '#E2673A' },
            { nome: 'Verde técnico', hex: '#2F7D5C' },
          ],
        },
      ],
      tipografia: {
        titulos: 'Sans forte e legível (Barlow, Archivo, IBM Plex Sans)',
        corpo: 'Sans neutra (Inter, Roboto, Source Sans 3)',
      },
      diretrizes: [
        'Layout sóbrio: cabeçalho fixo com telefone e botão de orçamento sempre visíveis',
        'Blocos de normas e documentos com ícones lineares e nomenclatura correta',
        'Fotos de obra e equipamentos com pessoas usando EPI, sem improviso',
        'Tabelas e listas para escopo, prazos e documentos exigidos',
        'Sem animações chamativas: o público compra segurança, não efeito visual',
      ],
      imagensIdeais: ['Vistoria técnica em campo com equipamentos', 'Ensaios e medições', 'Obra executada com equipe uniformizada', 'Documentos e relatórios em tela'],
      evitar: ['Fotos de banco de imagens com capacete de prancha em escritório', 'Imagens sem EPI em obra', 'Estilo lúdico, cores pastel e emojis'],
    },
    paginas: [
      {
        nome: 'Home',
        obrigatoria: true,
        objetivo: 'Dizer em segundos quais serviços técnicos a empresa entrega e como pedir orçamento.',
        secoes: [
          'Hero com o serviço principal, cidade de atuação e botão "Solicitar orçamento"',
          'Bloco de credenciais: registro no CREA, responsável técnico, anos de atuação, normas atendidas',
          'Serviços em cards (laudos, projetos, regularização, execução, vistorias)',
          'Para quem atendemos: condomínios, construtoras, indústrias, comércios, proprietários',
          'Casos e obras entregues com números reais',
          'Depoimentos institucionais (síndico, construtora, advogado)',
          'Como funciona o atendimento, do documento ao laudo',
          'Formulário de orçamento com upload de documentos',
        ],
        dica: 'Síndico e advogado são quem mais busca: destaque "laudo com ART" e "documentação para processo" já na primeira dobra.',
      },
      {
        nome: 'Serviços Técnicos',
        obrigatoria: true,
        objetivo: 'Detalhar cada serviço com escopo, prazo e documentação entregue — é o que vira orçamento.',
        secoes: [
          'Laudos e vistorias: inspeção predial, patologias, infiltração, estrutura, vizinhança, RRT/ART',
          'Projetos: estrutural, fundações, hidrossanitário, elétrico, incêndio (PPCI) e terraplenagem',
          'Regularização: averbação, habite-se, adequação a bombeiros e acessibilidade',
          'Obras e reforços estruturais: execução, recuperação de estruturas e impermeabilização',
          'Gerenciamento e fiscalização de obras, medições e cronograma físico-financeiro',
          'Para cada serviço: quando é necessário, o que você recebe, prazo médio, documentos exigidos e norma aplicável',
        ],
        dica: 'Em cada serviço, informe o que o cliente precisa enviar (matrícula, planta, fotos, ata de condomínio) — isso evita troca de mensagens antes do orçamento.',
      },
      paginaProjetos(
        ['Laudos e obras com identificação do tipo de edificação, área, ano e serviço executado', 'Antes/depois de reforço estrutural, impermeabilização e recuperação de fachada'],
        'Respeite o sigilo: em laudos e obras particulares, omitir o nome do condomínio ou do proprietário.',
        'Obras e Laudos'
      ),
      paginaProcesso([
        'Etapas do serviço: solicitação, visita técnica, escopo, proposta, execução e entrega do documento',
        'O que depende de terceiros (prefeitura, laboratório, síndico) e como isso afeta o prazo',
        'Formas de contratação: serviço pontual, contrato de vistoria periódica e consultoria mensal',
      ]),
      paginaSobre([
        'História da empresa e áreas de especialização',
        'Responsável técnico com registro no CREA e áreas de atuação',
        'Equipe técnica, laboratórios e equipamentos próprios ou parceiros',
        'Certificações, treinamentos e conformidade com as normas aplicáveis',
      ]),
      paginaDepoimentos([
        'Depoimentos de síndicos, administradoras, construtoras e advogados (com cargo e escritório quando possível)',
        'Resultados concretos: prazo cumprido, decisão judicial favorável, obra recuperada',
      ]),
      paginaFaq([
        'Quanto custa um laudo técnico?',
        'Qual a validade do laudo?',
        'Vocês emitem ART/RRT?',
        'Conseguem regularizar um imóvel sem habite-se?',
        'Atendem emergência de obra?',
        'Fazem vistoria de vizinhança para quem vai construir?',
        'Quais documentos devo enviar para começar?',
      ]),
      paginaBlog(['Pautas técnicas com tradução para o dia a dia: "rachaduras: quando é caso de laudo", "habite-se: por que tanto imóvel irregular", "inspeção predial obrigatória", "sinais de infiltração que viram processo"', 'Cada artigo assinado por um engenheiro com CREA']),
      paginaContato(['Formulário com upload de documentos (matrícula, planta, ata, relatórios)', 'Telefone de plantão para emergência de obra, quando houver']),
      paginaPolitica(),
      paginaOrcamento([
        'Campo de upload para matrícula, planta, ata de reunião, relatórios e fotos do problema',
        'Perguntas de qualificação: tipo de edificação, área aproximada, urgência e quem solicita (proprietário, síndico, advogado)',
      ]),
    ],
    funcionalidades: {
      essenciais: [
        'Formulário de orçamento com upload de documentos e fotos',
        'Página por serviço com escopo, prazo médio, documentos exigidos e norma aplicável',
        'Credenciais visíveis: registro no CREA, responsável técnico e ART/RRT',
        'Portfólio de laudos e obras com sigilo dos clientes preservado',
        'Botão de WhatsApp e telefone de contato fixos no topo',
        'Dados estruturados ProfessionalService com serviços, área de atuação e endereço',
        'Blog técnico com artigos assinados para SEO e autoridade',
      ],
      desejaveis: [
        'Área do cliente com documentos, laudos e histórico de serviços em PDF',
        'Agendamento online de vistoria com escolha de data e tipo de serviço',
        'Consulta de andamento do serviço por protocolo',
        'Calculadora de estimativa (m² de projeto, tipo de laudo, área para inspeção)',
        'Integração com assinatura digital de propostas e contratos',
        'Conteúdo restrito com laudos anteriores e normas internas para a equipe',
      ],
      integracoes: [
        'Google Analytics 4 + Google Ads (palavras de laudo e regularização)',
        'Google Meu Negócio com serviços cadastrados',
        'WhatsApp Business e e-mail com anexos',
        'Sistemas de gestão de obras e assinatura digital de documentos',
      ],
    },
    conteudoPronto: {
      servicos: [
        'Laudo de inspeção predial',
        'Laudo de vistoria de vizinhança (cautelar)',
        'Laudo de patologias e infiltrações',
        'Laudo de estabilidade estrutural',
        'Projeto estrutural em concreto, aço e madeira',
        'Projeto de fundações',
        'Projeto hidrossanitário',
        'Projeto elétrico e de SPDA',
        'Projeto de prevenção e combate a incêndio (PPCI)',
        'Regularização de imóvel e habite-se',
        'Averbação de construção',
        'Reforço e recuperação estrutural',
        'Impermeabilização',
        'Gerenciamento e fiscalização de obras',
        'Acompanhamento de medições e cronograma',
        'Consultoria técnica e assistência em processos judiciais',
      ],
      diferenciais: [
        'Todos os documentos entregues com ART/RRT e responsável técnico identificado',
        'Vistoria agendada em até 3 dias úteis e laudo entregue em até 7 dias após a visita',
        'Explicação técnica acessível: o cliente entende o que está vendo antes de decidir',
        'Atendimento a condomínios, construtoras, indústrias e proprietários com escopo sob medida',
        'Apoio documental a processos judiciais, com linguagem adequada ao meio jurídico',
      ],
      faq: [
        { pergunta: 'Quanto custa um laudo técnico?', resposta: 'Depende do tipo de laudo, da área construída e do deslocamento. Informe o tipo de edificação e a área pelo formulário e enviamos o valor com o prazo, sem compromisso.' },
        { pergunta: 'Vocês emitem ART/RRT?', resposta: 'Sim, todo serviço é acompanhado de Anotação/Registro de Responsabilidade Técnica, com o nome do responsável técnico e o número do registro.' },
        { pergunta: 'Qual a validade do laudo?', resposta: 'O laudo vale para o momento da vistoria. Para processos e recebimento de obra, a recomendação é que seja feito com no máximo 6 a 12 meses, conforme o caso.' },
        { pergunta: 'É possível regularizar um imóvel sem habite-se?', resposta: 'Em muitos casos sim, por meio de regularização junto à prefeitura, com levantamento, projeto de adequação e taxas. A viabilidade é confirmada após análise dos documentos.' },
        { pergunta: 'Atendem emergência de obra?', resposta: 'Atendemos casos de risco iminente com visita prioritária. O contato é telefônico, com orientação de isolamento e segurança até a chegada do responsável técnico.' },
        { pergunta: 'Quais documentos preciso enviar?', resposta: 'Matrícula do imóvel, projeto aprovado (se houver), IPTU, fotos do problema e, no caso de condomínios, a ata da assembleia que autorizou a contratação.' },
      ],
      depoimentos: [
        { nome: 'Síndico profissional', texto: 'O laudo de inspeção predial orientou o plano de manutenção dos próximos anos e ajudou na prestação de contas em assembleia. Documentação impecável.' },
        { nome: 'Advogado', texto: 'Laudo de vizinhança entregue no prazo, com linguagem técnica clara e registro de responsabilidade. Usado como prova no processo.' },
      ],
      seo: {
        palavrasChave: [
          'engenheiro civil em [CIDADE]',
          'empresa de engenharia em [CIDADE]',
          'laudo técnico [CIDADE]',
          'laudo de inspeção predial em [CIDADE]',
          'regularização de imóvel em [CIDADE]',
          'projeto estrutural [CIDADE] preço',
          'empresa de engenharia [BAIRRO]',
          'laudo de vistoria de vizinhança [CIDADE]',
        ],
        tituloHome: '[NOME] | Engenharia Civil em [CIDADE] — Laudos, Projetos e Regularização',
        descricaoHome:
          'Laudos técnicos, projetos, regularização e obras em [CIDADE] com responsabilidade técnica no CREA. Vistoria agendada em até 3 dias úteis e orçamento sem compromisso.',
      },
    },
    ecommerce: null,
    cuidados: [
      'Divulgar o registro no CREA e o responsável técnico; todo laudo precisa de ART/RRT',
      'Nunca prometer aprovação em prefeitura, isenção de multa ou resultado de processo judicial',
      'Prazos de terceiros (órgãos públicos, laboratórios, síndicos) devem aparecer como dependência, não como prazo próprio',
      'Fotos de obra: pessoas sempre de EPI; não publicar imagens que sugiram risco ou descumprimento de norma',
      'Documentos de clientes, plantas e laudos são confidenciais (LGPD) — upload apenas por canal seguro e com aviso de uso',
      'Em emergência estrutural, orientar isolamento e acionamento da defesa civil — nunca instruir o cliente a intervir por conta própria',
      'Se a empresa também vende materiais ou equipamentos, avaliar o modelo "Empresas em Geral" para aproveitar a loja online',
    ],
  },

  /* ================================ 11. DECORAÇÃO ================================ */
  {
    id: 'decoracao',
    nome: 'Decoração',
    emoji: '🛋️',
    area: 'Casa e Decoração',
    setor: 'decoração e design de interiores',
    genero: 'f',
    termoBusca: 'loja de decoração',
    schemaOrg: 'HomeGoodsStore',
    resumo: 'Lojas, showrooms e estúdios de decoração: objetos, mobiliário, ambientação e consultoria.',
    suportaEcommerce: true,
    temAgendamento: true,
    objetivoRecomendado: 'orcamento',
    descricaoNegocioPadrao:
      'loja e estúdio de decoração que trabalha com objetos, mobiliário e têxteis, oferecendo ambientação completa, consultoria de estilo e projeto de interiores para quem quer deixar a casa com a cara de quem mora nela',
    publicoAlvoPadrao:
      'Mulheres de 28 a 55 anos, das classes B/C, que estão decorando a casa nova ou dando cara nova a um ambiente; descobrem pelas redes sociais e pelo Google, salvam referências, comparam preço e prazo de entrega e valorizam atendimento que ajude a montar a combinação certa em vez de empurrar produto.',
    tomDeVoz: {
      personalidade: ['Inspirador e próximo', 'Caloroso e acolhedor', 'Prático na hora de orientar a combinação', 'Leve, sem ser infantil'],
      regras: [
        'Falar de sensação e uso antes de falar de produto ("uma sala para conversar até tarde" antes de "sofá 3 lugares")',
        'Ajudar a decidir: sugerir combinações, medidas e o que precisa combinar com o que já existe na casa',
        'Usar "você" e convidar para o showroom, mostrando que ver ao vivo muda a escolha',
        'Ser honesto sobre prazos de entrega e disponibilidade de estoque',
        'Descrever medidas e material de forma objetiva: o cliente mede a parede antes de decidir',
      ],
      evitar: [
        'Discurso de "luxo inalcançável" — decoração boa é acessível e pessoal',
        'Descrições de produto copiadas do fornecedor, cheias de adjetivos',
        'Fotos de catálogo sem contexto de ambiente real',
      ],
      exemplos: [
        'Título: "Sua casa, do jeito que você vive"',
        'CTA: "Montar meu ambiente" / "Falar com uma consultora"',
        'Bloco: "Manda a foto da sua sala: indicamos tapete, cortina e almofadas que combinam com o que você já tem."',
      ],
    },
    estiloVisual: {
      estilos: ['Acolhedor contemporâneo', 'Natural e orgânico', 'Clássico requintado', 'Moderno colorido'],
      paletas: [
        {
          nome: 'Areia e Verde Oliva',
          descricao: 'Calorosa e natural, deixa os produtos brilharem',
          cores: [
            { nome: 'Areia', hex: '#E6D9C6' },
            { nome: 'Off-white', hex: '#F7F4EE' },
            { nome: 'Verde oliva', hex: '#6E7B4B' },
            { nome: 'Madeira', hex: '#A9713F' },
            { nome: 'Terracota', hex: '#C0673E' },
          ],
        },
        {
          nome: 'Rosé e Grafite',
          descricao: 'Contemporânea e feminina',
          cores: [
            { nome: 'Rosé', hex: '#E2B7AE' },
            { nome: 'Grafite', hex: '#33313A' },
            { nome: 'Creme', hex: '#F6EFE9' },
            { nome: 'Dourado suave', hex: '#C9A227' },
            { nome: 'Verde sálvia', hex: '#9DAF95' },
          ],
        },
      ],
      tipografia: {
        titulos: 'Serifada leve ou arredondada (Cormorant, Fraunces, Nunito)',
        corpo: 'Sans humanista (Inter, Karla, Rubik)',
      },
      diretrizes: [
        'Fotos em ambientes reais montados, nunca produto isolado em fundo branco como imagem principal',
        'Bloco "ambiente completo" com os itens da composição e o valor total',
        'Filtros por ambiente, estilo e cor com contagem de itens em cada opção',
        'Página de produto com medidas, material, cuidados de limpeza, prazo de entrega e política de troca',
        'CTA de WhatsApp para tirar dúvida de combinação antes de comprar',
      ],
      imagensIdeais: ['Ambientes montados com luz natural', 'Detalhes de textura, tecido e acabamento', 'Produto em uso na casa de um cliente', 'Antes/depois de ambientação'],
      evitar: ['Imagens de catálogo com fundo infinito como foto principal', 'Fotos com iluminação amarelada ou desfocadas', 'Ambientes que não existem na realidade (montagem exagerada)'],
    },
    paginas: [
      {
        nome: 'Home',
        obrigatoria: true,
        objetivo: 'Inspirar e levar direto para a compra ou para a consultoria.',
        secoes: [
          'Hero com ambiente montado e dois caminhos: "comprar objetos" e "projeto/consultoria"',
          'Categorias em destaque com foto (sala, quarto, cozinha, varanda, presentes)',
          'Novidades, mais vendidos e peças em promoção em vitrines curtas',
          'Bloco "mande a foto do seu ambiente" com retorno de sugestão',
          'Serviços: projeto de interiores, ambientação, consultoria por hora e lista de presentes',
          'Depoimentos com foto do ambiente entregue',
          'Visite o showroom: endereço, horário, agendamento e estacionamento',
          'Instagram incorporado com os últimos ambientes publicados',
        ],
        dica: 'Ambiente montado vende mais que produto solto: coloque a composição como imagem principal sempre que possível.',
      },
      paginaAmbientes(),
      {
        nome: 'Serviços de Decoração',
        obrigatoria: true,
        objetivo: 'Explicar os serviços que aumentam o ticket e fidelizam o cliente.',
        secoes: [
          'Projeto de interiores: escopo, etapas, pranchas entregues e prazo',
          'Ambientação pronta: compra assistida com desconto e montagem no local',
          'Consultoria por hora (presencial ou por vídeo): como funciona e o que o cliente recebe',
          'Lista de presentes e enxoval de casa nova',
          'Atendimento para arquitetos, decoradores e empresas (revenda e parceria)',
          'Montagem, instalação e pequenos reparos inclusos ou contratados à parte',
        ],
        dica: 'Deixe explícito o que está incluso em cada serviço — é a dúvida que mais trava a contratação de decoração.',
      },
      {
        nome: 'Produtos',
        obrigatoria: true,
        objetivo: 'Ajudar o cliente a encontrar a peça certa com filtro e medida na mão.',
        secoes: [
          'Categorias: mobiliário, têxteis, iluminação, objetos, quadros, espelhos e plantas',
          'Filtros por ambiente, estilo, cor, material, medida e faixa de preço',
          'Cards com foto em ambiente, nome, medida principal, preço e prazo de entrega',
          'Página de produto com galeria, medidas, material, cuidados, avaliações e itens que combinam',
          'Selo de disponibilidade: pronta entrega, sob encomenda ou encomenda de fábrica',
          'Alternativa "comprar pelo WhatsApp" para quem prefere atendimento',
        ],
        dica: 'Prazo e medida são mais decisivos que preço em decoração: mostre os dois no card, não só na página de produto.',
      },
      {
        nome: 'Showroom',
        obrigatoria: true,
        objetivo: 'Levar o visitante à loja física, onde a conversão é maior.',
        secoes: [
          'Endereço com mapa, horário de funcionamento e estacionamento',
          'Fotos reais do espaço e do que está exposto agora',
          'Agendamento de visita (evita espera e garante atendimento dedicado)',
          'Serviços disponíveis na loja (consultoria, montagem, troca de itens)',
          'Como chegar de transporte público e referências próximas',
        ],
        dica: 'Publicar "novo ambiente montado no showroom" a cada mês dá motivo para o cliente voltar.',
      },
      paginaDepoimentos(['Depoimentos com foto do ambiente entregue e nome do cliente', 'Avaliações do Google com nota média destacada']),
      paginaFaq([
        'Vocês entregam e montam?',
        'Qual o prazo de entrega dos móveis?',
        'Dá para comprar só uma peça?',
        'Fazem projeto de um ambiente só?',
        'Como funciona a lista de presentes?',
        'Posso trocar se não couber na minha casa?',
        'Atendem arquitetos e empresas?',
      ]),
      paginaBlog(['Pautas: "como escolher o tapete certo", "medidas de cortina sem erro", "5 combinações de cores para sala pequena", "o que combina com madeira clara"', 'Publicar com foto dos produtos disponíveis na loja, ligadas às pautas']),
      paginaSobre([
        'História da loja/estúdio e quem está à frente do atendimento',
        'Curadoria: de onde vêm as peças e por que essas e não outras',
        'Parcerias com marceneiros, tapeceiros e ateliers locais',
        'Sustentabilidade e compra de produtores locais, quando for o caso',
      ]),
      paginaContato(['Formulário com campo de foto do ambiente e medidas', 'WhatsApp para dúvidas rápidas de combinação e prazo']),
      paginaPolitica(),
      paginaLoja('Loja de decoração', [
        'Categorias: mobiliário, tapetes e têxteis, iluminação, quadros e espelhos, objetos de mesa, vasos e plantas',
        'Filtros por ambiente, estilo, cor e medida — essenciais nesse mercado',
        'Selo de pronta entrega, sob encomenda e encomenda de fábrica com prazo estimado',
      ]),
    ],
    funcionalidades: {
      essenciais: [
        'Catálogo navegável por ambiente, estilo e cor, com foto em ambiente',
        'Medidas, material e prazo de entrega em cada peça',
        'Carrinho e checkout com Pix, cartão e boleto, ou fechamento pelo WhatsApp',
        'Cálculo de frete por CEP com opção de retirada no showroom',
        'Lista de presentes / enxoval de casa nova com link compartilhável',
        'Instagram incorporado e prova social com foto do ambiente do cliente',
        'Dados estruturados Product/Offer e HomeGoodsStore com endereço e horário',
      ],
      desejaveis: [
        'Filtro por medida máxima disponível no espaço do cliente',
        'Favoritos e "avise-me quando chegar" para peças sob encomenda',
        'Simulador "veja na sua parede" com foto enviada pelo cliente (realidade aumentada)',
        'Lista de combinações prontas com desconto progressivo (comprou 3 itens, ganha desconto)',
        'Agendamento online de visita ao showroom com consultor',
        'Programa de pontos para arquitetos e decoradores parceiros',
      ],
      integracoes: [
        'Instagram Shopping e Pinterest',
        'Google Analytics 4 + Google Shopping + Meta Pixel',
        'WhatsApp Business com catálogo',
        'ERP/PDV da loja para estoque, preço e prazo de fábrica',
      ],
    },
    conteudoPronto: {
      servicos: [
        'Projeto de interiores residencial',
        'Ambientação de um ambiente (sala, quarto, varanda)',
        'Consultoria de decoração por hora',
        'Compra assistida com curadoria de peças',
        'Lista de presentes e enxoval de casa nova',
        'Montagem e instalação no local',
        'Troca de estofado e reforma de móveis',
        'Confecção de cortinas e almofadas sob medida',
        'Paisagismo de varanda e apartamento',
        'Atendimento a arquitetos e escritórios (revenda)',
        'Decoração de eventos e vitrines de lojas',
        'Certificado de presente com valor livre',
      ],
      diferenciais: [
        'Curadoria com peças de marceneiros e ateliês locais, feitas sob medida',
        'Atendimento consultivo: combinamos as peças para você, com medidas conferidas antes da compra',
        'Ambiente montado no showroom, para ver tecido, cor e acabamento ao vivo',
        'Entrega e montagem próprias na cidade, com agendamento de horário',
        'Troca facilitada em caso de tamanho ou cor diferentes do esperado',
      ],
      faq: [
        { pergunta: 'Vocês entregam e montam?', resposta: 'Sim. A entrega é feita na cidade e região, e a montagem pode ser contratada junto com a compra. Você escolhe o dia e a janela de horário na confirmação do pedido.' },
        { pergunta: 'Qual o prazo de entrega?', resposta: 'Peças de pronta entrega saem em até 3 dias úteis. Móveis sob encomenda levam em média de 25 a 45 dias, e esse prazo aparece em cada peça antes de comprar.' },
        { pergunta: 'Dá para comprar só uma peça?', resposta: 'Claro. Atendemos desde a compra de uma almofada até a ambientação completa. No showroom, a peça pequena também rende uma consultoria rápida de combinação.' },
        { pergunta: 'Fazem projeto de um ambiente só?', resposta: 'Sim, é o nosso serviço mais pedido: sala, quarto, varanda ou home office com escopo e valor proporcionais ao tamanho do ambiente.' },
        { pergunta: 'Como funciona a lista de presentes?', resposta: 'Você monta a lista com as peças que quer, divulgamos o link para os convidados e cada um compra direto pelo site. O valor não usado fica como crédito na loja.' },
        { pergunta: 'Posso trocar se não couber na minha casa?', resposta: 'Sim, peças de pronta entrega podem ser trocadas em até 7 dias, conforme o Código de Defesa do Consumidor, com a embalagem original. Itens sob medida são produzidos sob encomenda e seguem regra própria descrita no orçamento.' },
      ],
      depoimentos: [
        { nome: 'Cliente de ambientação', texto: 'Mandei a foto da minha sala pelo WhatsApp e voltaram com três combinações, com valor e prazo. Ficou exatamente como eu queria e sem sair de casa.' },
        { nome: 'Cliente de casa nova', texto: 'Montaram o quarto e a sala inteiros, com entrega no prazo. A equipe revisou todas as medidas antes de fechar o pedido.' },
      ],
      seo: {
        palavrasChave: [
          'loja de decoração em [CIDADE]',
          'decoração de interiores [CIDADE]',
          'consultoria de decoração em [CIDADE]',
          'objetos de decoração [BAIRRO]',
          'móveis sob medida [CIDADE]',
          'decoração de sala em [CIDADE] preço',
          'presentes de casa nova [CIDADE]',
        ],
        tituloHome: '[NOME] | Decoração e Interiores em [CIDADE]',
        descricaoHome:
          'Objetos, mobiliário e ambientação completa em [CIDADE]. Curadoria de peças, projeto de interiores e consultoria para montar o ambiente com a sua cara.',
      },
    },
    ecommerce: {
      categorias: ['Mobiliário', 'Tapetes e têxteis', 'Iluminação', 'Quadros, espelhos e objetos', 'Vasos e plantas', 'Presentes e gift card'],
      recursos: [
        'Filtro por ambiente, estilo, cor e medida — decisivo para converter em decoração',
        'Ambiente completo com "comprar todos os itens" e desconto de conjunto',
        'Lista de presentes compartilhável para casa nova e chá de casa nova',
        'Agendamento da entrega e da montagem escolhido no checkout',
      ],
      observacoes: [
        'Prazo de entrega por peça é informação obrigatória no card: evita reclamação e cancelamento',
        'Itens sob encomenda precisam de política própria de troca e cancelamento, descrita antes da compra',
        'Fotos de produto devem ser próprias — peças de catálogo do fornecedor exigem autorização de uso',
      ],
    },
    cuidados: [
      'Informar prazo de entrega e política de troca com clareza (CDC, art. 49 — compra online tem 7 dias de arrependimento)',
      'Não usar fotos de catálogo do fornecedor sem autorização e sem conferir se a peça está realmente disponível',
      'Mostrar medidas reais e material de cada item: erro de medida é a principal causa de devolução em decoração',
      'Não publicar ambientes fotografados na casa de clientes sem autorização por escrito',
      'Estoque e prazo devem ser atualizados: prometer pronta entrega de item sob encomenda gera cancelamento e reclamação',
      'Cuidado com peças de réplica e com o uso indevido de marcas e estampas registradas',
    ],
  },

  /* ================================ 12. CONSTRUÇÃO ================================ */
  {
    id: 'construcao',
    nome: 'Construção',
    emoji: '🧱',
    area: 'Construção e Imóveis',
    setor: 'construção civil',
    genero: 'f',
    termoBusca: 'construtora',
    schemaOrg: 'GeneralContractor',
    resumo: 'Construtoras e empreiteiras: construção, reforma, ampliação e acabamento de obras.',
    suportaEcommerce: false,
    temAgendamento: false,
    objetivoRecomendado: 'orcamento',
    descricaoNegocioPadrao:
      'construtora que executa obras residenciais e comerciais, reformas, ampliações e acabamentos, com equipe própria, cronograma definido e responsabilidade técnica registrada no CREA',
    publicoAlvoPadrao:
      'Proprietários que vão construir, reformar ou ampliar, síndicos contratando obras em condomínio, investidores e pequenas empresas que precisam adequar o ponto comercial. A decisão é de alto valor: o cliente compara duas ou três empresas, pede orçamento detalhado e teme atraso, custo extra no meio da obra e acabamento malfeito.',
    tomDeVoz: {
      personalidade: ['Direto e responsável', 'Confiável, sem promessa vazia', 'Organizado e transparente com prazos', 'Próximo do cliente durante toda a obra'],
      regras: [
        'Falar de método: etapas, cronograma, medições e garantia contratual',
        'Explicar o que faz o orçamento variar, em vez de dar número solto',
        'Dar prazos em semanas ou meses, com o que pode alterá-los',
        'Usar o vocabulário do cliente: "obra", "reforma", "ampliação", "acabamento", "medição"',
        'Nunca prometer preço fechado sem escopo detalhado nem prazo que dependa de terceiros',
      ],
      evitar: [
        '"Obra sem dor de cabeça" e outras frases feitas',
        'Números redondos de "anos de mercado" sem mostrar obra entregue',
        'Texto que esconde o processo e só fala em orçamento por WhatsApp',
      ],
      exemplos: [
        'Título: "Obra com cronograma, medição e acabamento conferido"',
        'CTA: "Pedir orçamento" / "Agendar visita técnica"',
        'Bloco: "Enviamos o orçamento com planilha por etapa e cronograma previsto — e você acompanha tudo pelo WhatsApp da obra."',
      ],
    },
    estiloVisual: {
      estilos: ['Robusto e contemporâneo', 'Corporativo claro', 'Industrial com personalidade'],
      paletas: [
        {
          nome: 'Concreto e Sinal',
          descricao: 'Sólida, com cor de destaque para os CTAs',
          cores: [
            { nome: 'Grafite', hex: '#22272B' },
            { nome: 'Cinza concreto', hex: '#B7BDC2' },
            { nome: 'Branco', hex: '#FFFFFF' },
            { nome: 'Amarelo sinal', hex: '#F5B301' },
            { nome: 'Azul-laje', hex: '#2E4B6B' },
          ],
        },
        {
          nome: 'Terracota e Areia',
          descricao: 'Aquece a imagem da obra e da equipe',
          cores: [
            { nome: 'Terracota', hex: '#B4562F' },
            { nome: 'Areia', hex: '#EFE3D3' },
            { nome: 'Grafite', hex: '#2B2B2B' },
            { nome: 'Verde-oliva', hex: '#6B7248' },
            { nome: 'Branco', hex: '#FBF9F6' },
          ],
        },
      ],
      tipografia: {
        titulos: 'Sans condensada forte (Oswald, Archivo, Barlow Condensed)',
        corpo: 'Sans neutra (Inter, Roboto, Barlow)',
      },
      diretrizes: [
        'Fotos de obra real, com equipe uniformizada e EPI, em vez de banco de imagens',
        'Blocos de números: obras entregues, m² construídos, anos de atuação',
        'Cronograma da obra apresentado como linha do tempo visual',
        'Botão de orçamento fixo, com telefone visível (este cliente liga mais que escreve)',
        'Antes/depois de reformas como principal prova visual',
      ],
      imagensIdeais: ['Obra em execução com equipe e EPI', 'Antes/depois de reforma ou ampliação', 'Detalhes de acabamento entregue', 'Plantas e projeto 3D do que será construído'],
      evitar: ['Fotos de banco de imagens de "obra genérica"', 'Imagens sem EPI e sem organização do canteiro', 'Renders apresentados como obra realizada'],
    },
    paginas: [
      {
        nome: 'Home',
        obrigatoria: true,
        objetivo: 'Mostrar capacidade de execução e levar ao pedido de orçamento.',
        secoes: [
          'Hero com obra em execução ou obra entregue + "Pedir orçamento" e telefone',
          'Números de credibilidade: obras entregues, m² construídos, anos de atuação, equipe própria',
          'Serviços: construção, reforma, ampliação, acabamento e obras comerciais',
          'Obras entregues em destaque, com tipo, metragem e prazo',
          'Como trabalhamos: orçamento, contrato, cronograma, medições e entrega',
          'Garantias: responsabilidade técnica, prazo de garantia e assistência após a entrega',
          'Depoimentos de clientes com o tipo de obra contratada',
          'Formulário de orçamento com upload de planta e fotos do imóvel',
        ],
        dica: 'Síndico e investidor decidem por prova de execução: destaque obras com números (m², prazo, valor por m² quando autorizado).',
      },
      {
        nome: 'Serviços de Obra',
        obrigatoria: true,
        objetivo: 'Deixar claro o tipo de obra que a empresa executa e o que está incluso.',
        secoes: [
          'Construção residencial: casa, sobrado e edícula, do alicerce ao acabamento',
          'Reforma e retrofit: residencial, comercial e de fachada',
          'Ampliação e segundo pavimento',
          'Obras em condomínio (com exigências de horário, elevador de serviço e ART)',
          'Obras comerciais e adequação de ponto (loja, clínica, restaurante)',
          'Acabamento, revestimento, gesso, pintura e marcenaria estrutural',
          'Instalações complementares: hidráulica, elétrica, impermeabilização e cobertura',
          'O que está incluso, o que é à parte e como funciona o fornecimento de material',
        ],
        dica: 'Deixe claro se o material é comprado pela construtora (melhor controle) ou pelo cliente (mais barato) — essa dúvida trava o orçamento.',
      },
      paginaProjetos(
        ['Cada obra com tipo, metragem, duração real, escopo executado e valor por m² quando autorizado', 'Antes/durante/depois da mesma obra em três imagens de mesma angulação'],
        'Obra em andamento também vende: mostre canteiro organizado, cronograma na parede e equipe uniformizada.',
        'Obras Entregues'
      ),
      paginaProcesso([
        'Etapas: visita técnica, levantamento, orçamento detalhado, contrato, execução, medições e entrega',
        'Como funciona o cronograma físico-financeiro e a liberação por medição',
        'Fiscalização, diário de obra, relatório fotográfico e canal de comunicação',
        'O que o cliente precisa decidir e quando (materiais, acabamentos, fornecedores)',
      ]),
      {
        nome: 'Garantias e Pós-obra',
        obrigatoria: true,
        objetivo: 'Reduzir o medo de problema depois da entrega — argumento decisivo contra o "mais barato".',
        secoes: [
          'Prazo de garantia por tipo de serviço (estrutura, instalações, acabamento) e o que cobre',
          'Como acionar a garantia e o prazo de resposta para cada tipo de chamado',
          'Manutenções recomendadas e a periodicidade de cada uma',
          'Assistência pós-entrega e o que é considerado mau uso',
          'Documentação entregue ao final: ART, notas fiscais de material, projeto executado e manual do proprietário',
        ],
        dica: 'Garantia escrita no site é o que faz o cliente pagar um pouco mais pela obra.',
      },
      paginaSobre([
        'História da construtora e obras que fizeram o nome da empresa',
        'Equipe técnica: engenheiro responsável com CREA, mestre de obras, encarregados e equipe própria',
        'Equipamentos próprios, canteiro padrão e segurança do trabalho',
        'Certidões, alvarás e conformidade legal da empresa',
      ]),
      paginaDepoimentos([
        'Depoimentos por tipo de obra, com nome do cliente e metragem executada',
        'Depoimentos de síndicos e administradoras, quando a empresa atua em condomínios',
      ]),
      paginaFaq([
        'Quanto custa o metro quadrado para construir?',
        'Vocês fazem orçamento de obra completa ou por etapa?',
        'Em quanto tempo a obra fica pronta?',
        'Quem compra o material, eu ou vocês?',
        'Como funciona o pagamento e a medição?',
        'Vocês dão garantia? Por quanto tempo?',
        'Fazem obras em condomínio com restrição de horário?',
        'Preciso ter o projeto pronto para pedir orçamento?',
      ]),
      paginaBlog(['Pautas: "quanto custa construir em [CIDADE] em 2026", "erros que encarecem a reforma", "como escolher construtora sem cair em armadilha", "documentos que você precisa antes de começar a obra"', 'Usar os posts para responder dúvidas que travam o orçamento']),
      paginaContato(['Telefone com atendimento comercial em horário útil e plantão de obra para clientes', 'Endereço do escritório e visita técnica agendada']),
      paginaPolitica(),
      paginaOrcamento([
        'Upload de planta, projeto arquitetônico, fotos do imóvel e matrícula',
        'Perguntas de qualificação: tipo de obra, metragem estimada, estágio atual, prazo desejado e faixa de investimento',
        'Explicação do prazo para retorno e do que será entregue (orçamento com planilha por etapa)',
      ]),
    ],
    funcionalidades: {
      essenciais: [
        'Formulário de orçamento com upload de planta e fotos do imóvel',
        'Portfólio de obras com tipo, metragem, prazo e antes/durante/depois',
        'Página de serviços por tipo de obra, com o que está incluso',
        'Página de garantias e pós-obra com prazos e como acionar',
        'Telefone e WhatsApp visíveis em todas as páginas, com atendimento comercial identificado',
        'Dados estruturados GeneralContractor com área de atuação e serviços',
        'Blog com pautas de "quanto custa" para atrair quem está pesquisando',
      ],
      desejaveis: [
        'Simulador de custo de obra por metragem, padrão de acabamento e etapa',
        'Área do cliente com cronograma, medições, relatório fotográfico e documentos da obra',
        'Diário de obra público (atualizações e fotos) para obras em andamento',
        'Agendamento online de visita técnica com escolha de data',
        'Depoimentos em vídeo de clientes com a obra entregue',
        'Integração com sistema de gestão de obras e financeiro',
      ],
      integracoes: [
        'Google Analytics 4 + Google Ads (palavras de "quanto custa construir")',
        'Google Meu Negócio com fotos de obras e avaliações',
        'WhatsApp Business com resposta automática de horário',
        'Sistemas de gestão de obra, medição e assinatura digital de contrato',
      ],
    },
    conteudoPronto: {
      servicos: [
        'Construção de casa térrea',
        'Construção de sobrado',
        'Reforma residencial completa',
        'Reforma de apartamento',
        'Ampliação e segundo pavimento',
        'Reforma de fachada',
        'Obras em condomínio (com ART e plano de segurança)',
        'Adequação de ponto comercial',
        'Construção de edícula, área gourmet e piscina',
        'Muros, calçadas e contenções',
        'Impermeabilização e cobertura',
        'Instalações elétricas e hidráulicas',
        'Gesso, forro e iluminação',
        'Pintura e revestimento',
        'Gerenciamento de obra com equipe do cliente',
        'Regularização de obra executada por terceiros',
      ],
      diferenciais: [
        'Orçamento com planilha por etapa e cronograma previsto, apresentado antes do contrato',
        'Equipe própria e canteiro organizado, com mestre de obras dedicado ao serviço',
        'Medições conferidas com o cliente e liberação por etapa executada',
        'Relatório fotográfico e diário de obra atualizados durante todo o serviço',
        'Garantia contratual por escrito com canal direto de assistência após a entrega',
      ],
      faq: [
        { pergunta: 'Quanto custa o metro quadrado para construir?', resposta: 'O valor varia com o padrão de acabamento, o terreno e as instalações. Enviamos uma estimativa por m² depois da visita técnica e o orçamento detalhado por etapa com a planta em mãos.' },
        { pergunta: 'Em quanto tempo a obra fica pronta?', resposta: 'Depende do escopo: reformas de apartamento costumam levar de 2 a 4 meses e construções residenciais de 8 a 14 meses. O cronograma vai junto com o contrato, com as etapas e os marcos de entrega.' },
        { pergunta: 'Quem compra o material?', resposta: 'Você escolhe: podemos comprar tudo e repassar com nota fiscal e controle de obra, ou você compra e nós executamos com mão de obra. Nos dois casos o orçamento informa o que está incluso.' },
        { pergunta: 'Como funciona o pagamento?', resposta: 'Por medição de etapa executada, conforme o cronograma do contrato. O primeiro pagamento é a mobilização, e as parcelas seguintes acompanham o avanço físico da obra.' },
        { pergunta: 'Vocês dão garantia?', resposta: 'Sim. A garantia é por escrito, separada por tipo de serviço: estrutura, instalações e acabamento. Você recebe também as notas fiscais, a ART e o manual de manutenção na entrega.' },
        { pergunta: 'Fazem obras em condomínio?', resposta: 'Sim, com ART, equipe uniformizada e cumprimento do regulamento interno (horário, elevador de serviço, caçamba e limpeza). Fornecemos a documentação exigida pela administração.' },
        { pergunta: 'Preciso ter o projeto pronto?', resposta: 'Ajuda muito, mas não é obrigatório. Podemos fazer a visita, levantar medidas e indicar um projetista parceiro. Com o projeto em mãos, o orçamento fica mais preciso e o cronograma mais confiável.' },
      ],
      depoimentos: [
        { nome: 'Proprietária de casa em obras', texto: 'Cronograma cumprido quase à risca e nenhuma surpresa no valor. Toda semana recebíamos fotos e a medição foi conferida junto com a gente.' },
        { nome: 'Síndico de condomínio', texto: 'Contratamos a reforma da fachada com obra em andamento no prédio. Equipe organizada, documentação em ordem e zero reclamação de morador.' },
      ],
      seo: {
        palavrasChave: [
          'construtora em [CIDADE]',
          'empresa de construção civil em [CIDADE]',
          'orçamento de obra em [CIDADE]',
          'construtora [BAIRRO]',
          'reforma de apartamento em [CIDADE]',
          'quanto custa construir uma casa em [CIDADE]',
          'construtora com garantia em [CIDADE]',
        ],
        tituloHome: '[NOME] | Construtora em [CIDADE] — Obra, Reforma e Ampliação',
        descricaoHome:
          'Construção, reforma e ampliação em [CIDADE] com cronograma, orçamento por etapa e garantia por escrito. Peça seu orçamento sem compromisso.',
      },
    },
    ecommerce: null,
    cuidados: [
      'Divulgar o registro no CREA e o responsável técnico de cada obra; toda execução precisa de ART/RRT',
      'Não prometer prazo fechado nem valor por m² sem visita técnica e escopo definido',
      'Cronograma depende de fatores externos (chuva, aprovação de terceiros, material): trate como previsão, com marcos',
      'Fotos de obra: equipe sempre de EPI e canteiro organizado — imagens que sugiram risco expõem a empresa (NR-18, NR-35)',
      'Renders e imagens 3D devem ser identificados como ilustrativos e nunca apresentados como obra entregue',
      'Garantia legal de solidez e segurança da obra é de 5 anos (CDC, art. 618 e CC): a comunicação não pode sugerir prazo menor',
      'Obras em condomínio exigem cumprimento do regulamento interno: informar horários, ART e documentação antes de anunciar o serviço',
      'Se a empresa também vende material de construção, avaliar o modelo "Empresas em Geral" ou "Decoração" para aproveitar a loja online',
    ],
  },

  /* =============================== 13. IMOBILIÁRIA =============================== */
  {
    id: 'imobiliaria',
    nome: 'Imobiliária',
    emoji: '🏠',
    area: 'Construção e Imóveis',
    setor: 'mercado imobiliário',
    genero: 'f',
    termoBusca: 'imobiliária',
    schemaOrg: 'RealEstateAgent',
    resumo: 'Compra, venda e locação de imóveis, com captação de proprietários e gestão de aluguéis.',
    suportaEcommerce: false,
    temAgendamento: true,
    objetivoRecomendado: 'orcamento',
    descricaoNegocioPadrao:
      'imobiliária que atua na venda e na locação de imóveis residenciais e comerciais na cidade e região, com atendimento de corretores próprios, captação de imóveis de proprietários e administração de aluguéis',
    publicoAlvoPadrao:
      'Dois públicos com buscas diferentes: quem procura imóvel (chega pelo Google e pelos portais, filtra por bairro e preço, quer ver fotos reais e agendar visita) e quem quer vender ou alugar (proprietário que quer avaliação, segurança no contrato e retorno rápido). Ambos decidem pela confiança, pela qualidade da informação do anúncio e pela agilidade do corretor.',
    tomDeVoz: {
      personalidade: ['Confiável e profissional', 'Ágil e resolutivo', 'Transparente com valores e taxas', 'Próximo, sem pressão de venda'],
      regras: [
        'Informar sempre os dados do imóvel: metragem, quartos, vagas, condomínio, IPTU e o que está incluso',
        'Explicar as etapas e os custos de cada tipo de negócio (compra, venda, locação, administração)',
        'Nunca pressionar com "é só até hoje" ou escassez artificial',
        'Responder a dúvida do proprietário e a do inquilino em páginas separadas',
        'Citar CRECI e o número do corretor em toda comunicação que envolva intermediação',
      ],
      evitar: [
        'Fotos de anúncio antigas ou de outro imóvel',
        'Texto com "oportunidade única" e exclamações sem informação',
        'Esconder taxa, condomínio ou valor real de aluguel',
      ],
      exemplos: [
        'Título: "Apartamento 2 quartos no [BAIRRO] — R$ X/mês + condomínio"',
        'CTA: "Agendar visita" / "Falar com o corretor" / "Quero avaliação do meu imóvel"',
        'Bloco: "Visitamos o imóvel com você, conferimos a documentação e acompanhamos a proposta até a assinatura."',
      ],
    },
    estiloVisual: {
      estilos: ['Corporativo confiável', 'Contemporâneo com fotos grandes', 'Clássico e sóbrio'],
      paletas: [
        {
          nome: 'Azul Imóvel',
          descricao: 'Padrão do mercado, transmite confiança',
          cores: [
            { nome: 'Azul-marinho', hex: '#132B45' },
            { nome: 'Azul médio', hex: '#2C6E9B' },
            { nome: 'Cinza claro', hex: '#EDF0F4' },
            { nome: 'Dourado', hex: '#C8A24A' },
            { nome: 'Branco', hex: '#FFFFFF' },
          ],
        },
        {
          nome: 'Verde Moradia',
          descricao: 'Próxima e acolhedora',
          cores: [
            { nome: 'Verde profundo', hex: '#1E3A31' },
            { nome: 'Verde folha', hex: '#4F8A63' },
            { nome: 'Areia', hex: '#EFE7DA' },
            { nome: 'Telha', hex: '#B65A3C' },
            { nome: 'Grafite', hex: '#2B2F33' },
          ],
        },
      ],
      tipografia: {
        titulos: 'Sans forte e legível (Montserrat, Poppins, Archivo)',
        corpo: 'Sans neutra (Inter, Open Sans, Roboto)',
      },
      diretrizes: [
        'Busca em destaque logo na primeira dobra, com filtros visíveis no celular',
        'Card de imóvel com foto grande, preço legível, metragem e bairro — sem promessas no texto',
        'Fotos na ordem em que o cliente entra: fachada, sala, quartos, banheiros, cozinha, área externa',
        'Selo de destaque para imóvel exclusivo, novo no mercado ou com preço reduzido',
        'Mapa com pins agrupados e link "ver no mapa" em cada ficha',
      ],
      imagensIdeais: ['Fotos reais bem iluminadas de cada ambiente', 'Fachada e área externa', 'Vista do entorno e do bairro', 'Vídeo curto e tour virtual quando houver'],
      evitar: ['Fotos de anúncio antigo, emprestadas de outro imóvel ou com marca d\'água de portal', 'Descrições copiadas de outro anúncio', 'Card com preço escondido ou "consulte"'],
    },
    paginas: [
      {
        nome: 'Home',
        obrigatoria: true,
        objetivo: 'Fazer o visitante buscar em menos de 10 segundos e captar o proprietário no caminho.',
        secoes: [
          'Busca em destaque: tipo, bairro, faixa de preço e finalidade (comprar ou alugar)',
          'Vitrines: imóveis em destaque, lançamentos, redução de preço e prontos para morar',
          'Atalhos por bairro e por tipo (apartamento, casa, terreno, comercial, rural)',
          'Serviços para quem compra e para quem vende/loca, em dois blocos separados',
          'Avaliação do imóvel: "quanto vale o seu imóvel?" com formulário curto',
          'Depoimentos, CRECI e tempo de mercado',
          'Blog com conteúdo de bairro e de mercado',
          'Contato com corretores, endereço e horário',
        ],
        dica: 'A busca é o produto principal: precisa carregar rápido e funcionar bem no celular, onde está a maioria das visitas.',
      },
      paginaImoveis(),
      paginaFichaImovel(),
      paginaAnuncie([
        'Bloco "quanto vale meu imóvel" com resultado imediato por metragem e bairro',
        'Explicação das taxas de administração e comissão, com honestidade',
      ]),
      {
        nome: 'Serviços',
        obrigatoria: true,
        objetivo: 'Explicar tudo o que a imobiliária faz — muita gente só conhece a parte de aluguel.',
        secoes: [
          'Compra e venda: avaliação, anúncio, visitas, proposta, documentação e escritura',
          'Locação: análise de crédito, garantias (fiador, seguro-fiança, caução, título de capitalização) e contrato',
          'Administração de aluguel: repasse, inadimplência, manutenção e reajuste anual',
          'Assessoria jurídica e regularização de documentação, com parceiros',
          'Consultoria para investidor: rentabilidade de aluguel e potencial de valorização',
          'Condomínios e parcerias com construtoras e incorporadoras',
          'Quem paga o quê: comissão, taxas, ITBI, escritura, registro e vistoria',
        ],
        dica: 'Explicar as garantias de locação em linguagem simples reduz drasticamente a insegurança de proprietário e inquilino.',
      },
      {
        nome: 'Proprietários e Locação',
        obrigatoria: true,
        objetivo: 'Página dedicada a quem tem imóvel para alugar ou vender — outro funil, outras dúvidas.',
        secoes: [
          'Vantagens de administrar o imóvel pela imobiliária: repasse em dia, vistoria, manutenção e contrato',
          'Como funciona a avaliação de valor de aluguel e de venda do imóvel',
          'Garantias de locação explicadas uma por uma, com exemplos',
          'O que acontece em caso de inadimplência e qual é o seguro disponível',
          'Reajuste, tabela de taxas e prazo de repasse',
          'Formulário de cadastro do imóvel com upload de fotos e documentos',
        ],
        dica: 'Proprietário inseguro não anuncia: mostre o processo todo, do cadastro do inquilino ao repasse.',
      },
      paginaDepoimentos([
        'Depoimentos de quem comprou, de quem vendeu e de proprietários que recebem aluguel em dia',
        'Nota e avaliações do Google com média em destaque',
      ]),
      paginaFaq([
        'Quanto custa a comissão de venda e de locação?',
        'Quais são as garantias de aluguel aceitas?',
        'Em quanto tempo recebo o repasse do aluguel?',
        'Quanto de renda preciso comprovar para alugar?',
        'Posso visitar o imóvel antes de decidir?',
        'Vocês cobram para avaliar meu imóvel?',
        'Que documentos preciso para vender ou alugar?',
        'Aceitam pet no imóvel?',
      ]),
      paginaBlog(['Bairros de [CIDADE]: onde morar e quanto custa', 'O que avaliar antes de alugar um apartamento', 'Documentos para comprar um imóvel sem dor de cabeça', 'Vale mais comprar ou alugar em [CIDADE]?', 'Como funciona o reajuste do aluguel']),
      paginaSobre([
        'História da imobiliária, número de CRECI e responsável técnico',
        'Equipe de corretores com CRECI, foto e especialidade (residencial, comercial, locação, lançamentos)',
        'Área de atuação: bairros e cidades atendidos',
        'Parcerias com construtoras, incorporadoras, cartórios e bancos',
      ]),
      paginaContato(['Telefone e WhatsApp por setor (locação, venda, administração)', 'Endereço do escritório, horário e plantão para emergências de locação']),
      paginaPolitica(),
    ],
    funcionalidades: {
      essenciais: [
        'Busca avançada com filtros de tipo, bairro, preço, quartos, vagas, área e aceita pet',
        'Página de imóvel com galeria, vídeo, dados completos, mapa e corretor responsável',
        'Agendamento de visita com escolha de dia, horário e corretor',
        'Formulário "anuncie seu imóvel" com upload de fotos e documentos',
        'Botões fixos no celular: WhatsApp, ligar e agendar visita',
        'Dados estruturados RealEstateAgent e RealEstateListing por imóvel',
        'Blog com conteúdo de bairro e de mercado para atrair busca local',
      ],
      desejaveis: [
        'Mapa com todos os imóveis, desenho de área de interesse e busca "perto de mim"',
        'Favoritos, comparação de imóveis e alerta por e-mail/WhatsApp de novos resultados',
        'Simulador de financiamento e calculadora de custos (ITBI, escritura, condomínio, IPTU)',
        'Área do proprietário com extrato de repasses, recibos e histórico de manutenção',
        'Área do inquilino com contrato, boletos e pedido de manutenção',
        'Integração com portais (ZAP, Viva Real, OLX) e com o CRM da imobiliária',
        'Tour virtual 360 em imóveis de maior valor',
      ],
      integracoes: [
        'CRM imobiliário e espelho de imóveis (sincronização automática do que está disponível)',
        'Portais de imóveis e sites de parceiros (feed XML)',
        'Google Analytics 4 + Google Ads + Google Meu Negócio',
        'WhatsApp Business com atendimento por corretor',
        'Sistemas de análise de crédito e emissão de contrato de locação',
      ],
    },
    conteudoPronto: {
      servicos: [
        'Compra e venda de imóveis residenciais',
        'Compra e venda de imóveis comerciais',
        'Locação residencial',
        'Locação comercial',
        'Administração de aluguéis',
        'Avaliação de imóvel (valor de venda e de aluguel)',
        'Consultoria para investidores',
        'Assessoria em documentação e regularização',
        'Intermediação de terrenos e áreas',
        'Lançamentos e imóveis na planta',
        'Locação por temporada (quando houver)',
        'Vistoria de entrada e saída de imóvel',
        'Assessoria em financiamento bancário',
        'Administração de condomínios (quando houver)',
      ],
      diferenciais: [
        'Corretores com CRECI ativo e especialização por tipo de imóvel e por bairro',
        'Anúncios com fotos atualizadas, dados completos e visita agendada em até 24 horas',
        'Documentação conferida antes do anúncio: matrícula, IPTU, condomínio e ônus',
        'Repasse do aluguel em dia e acompanhamento de manutenção para o proprietário',
        'Transparência total de taxas e comissões, informadas por escrito antes da contratação',
      ],
      faq: [
        { pergunta: 'Quanto custa a comissão?', resposta: 'A comissão de venda é percentual sobre o valor negociado e a de locação equivale ao primeiro aluguel, conforme a tabela do CRECI. Todos os valores são informados por escrito antes de você contratar.' },
        { pergunta: 'Quais garantias de locação vocês aceitam?', resposta: 'Fiador, seguro-fiança, caução em dinheiro e título de capitalização. Explicamos as diferenças de custo e agilidade de cada uma para escolher a melhor para o seu caso.' },
        { pergunta: 'Em quanto tempo recebo o repasse?', resposta: 'Para contratos administrados, o repasse é feito até o quinto dia útil após o recebimento, com extrato discriminando aluguel, taxas e eventuais despesas.' },
        { pergunta: 'Vocês cobram para avaliar meu imóvel?', resposta: 'A avaliação para venda ou locação é gratuita e sem compromisso. Um corretor visita o imóvel, confere metragem e documentação e apresenta uma faixa de valor com base em imóveis semelhantes da região.' },
        { pergunta: 'Posso visitar o imóvel antes de decidir?', resposta: 'Sim, e recomendamos. Agende pela ficha do imóvel escolhendo dia e horário; o corretor responsável confirma e acompanha a visita.' },
        { pergunta: 'Que documentos preciso para alugar?', resposta: 'Documento com foto, CPF, comprovante de renda (três últimos) e comprovante de residência atual, além dos documentos do fiador ou da garantia escolhida. A análise costuma levar até 2 dias úteis.' },
        { pergunta: 'Aceitam pet?', resposta: 'Isso é definido pelo proprietário e aparece marcado na ficha de cada imóvel, no filtro "aceita pet". Quando o condomínio tem regra específica, informamos na descrição.' },
      ],
      depoimentos: [
        { nome: 'Compradora de apartamento', texto: 'Visitamos três imóveis no mesmo sábado, sem enrolação. A documentação estava toda em ordem e a escritura saiu antes do prazo que eu esperava.' },
        { nome: 'Proprietário de dois imóveis alugados', texto: 'Recebo o repasse em dia há quatro anos. Quando precisou trocar a bomba da água, resolveram sem eu precisar ir à cidade.' },
      ],
      seo: {
        palavrasChave: [
          'imobiliária em [CIDADE]',
          'apartamento à venda em [BAIRRO]',
          'casa para alugar em [CIDADE]',
          'imóveis em [CIDADE]',
          'quanto vale meu imóvel em [CIDADE]',
          'apartamento 2 quartos [BAIRRO]',
          'aluguel de casa em [CIDADE] com garantia',
        ],
        tituloHome: '[NOME] | Imobiliária em [CIDADE] — Venda e Locação de Imóveis',
        descricaoHome:
          'Imóveis para comprar e alugar em [CIDADE], com fotos reais, dados completos e visita agendada em até 24 horas. Avaliação gratuita para proprietários.',
      },
    },
    ecommerce: null,
    cuidados: [
      'Informar o número do CRECI da imobiliária e dos corretores; intermediação sem registro é irregular',
      'Anunciar apenas imóveis com autorização escrita do proprietário e dados conferidos (matrícula, ônus, IPTU, condomínio)',
      'Nunca expor o endereço exato e dados do proprietário ou do inquilino em imóvel desocupado ou ocupado (LGPD e segurança)',
      'Fotos, valores e disponibilidade precisam ser atualizados: anúncio desatualizado gera reclamação e perde confiança',
      'Valores de IPTU, condomínio e taxas devem indicar a data de referência e a fonte',
      'Simuladores de financiamento são estimativas: exibir aviso de que não representam aprovação de crédito e informar as taxas usadas',
      'Comissão, taxa de administração e encargos devem ser informados por escrito antes da contratação (CDC e tabela do CRECI)',
      'Dados de leads e de análise de crédito são sensíveis (LGPD): consentimento explícito, finalidade informada e exclusão sob solicitação',
      'Se a imobiliária também comercializa lançamentos de terceiros, avaliar o modelo "Empreendimentos Imobiliários" para uma página dedicada',
    ],
  },

  /* ====================== 14. EMPREENDIMENTOS IMOBILIÁRIOS ====================== */
  {
    id: 'empreendimentos',
    nome: 'Empreendimentos Imobiliários',
    emoji: '🏙️',
    area: 'Construção e Imóveis',
    setor: 'incorporação e lançamentos imobiliários',
    genero: 'f',
    termoBusca: 'incorporadora',
    schemaOrg: 'RealEstateAgent',
    resumo: 'Lançamentos e incorporações: página de vendas do empreendimento, unidades e decorado.',
    suportaEcommerce: false,
    temAgendamento: true,
    objetivoRecomendado: 'orcamento',
    descricaoNegocioPadrao:
      'incorporadora que desenvolve e comercializa empreendimentos residenciais e comerciais, com site de lançamento por empreendimento, plantão de vendas, decorado para visita e equipe própria de corretores',
    publicoAlvoPadrao:
      'Famílias e casais de 28 a 50 anos comprando o primeiro ou o segundo imóvel, investidores buscando renda de aluguel e pais comprando para os filhos. Pesquisam por bairro, metragem e tipologia, comparam dois ou três lançamentos da mesma região, querem entender o valor total e a parcela durante a obra antes de falar com o corretor, e visitam o decorado antes de decidir.',
    tomDeVoz: {
      personalidade: ['Aspiracional sem exagero', 'Claro com números e condições', 'Seguro sobre prazos e documentação', 'Consultivo, sem pressão de venda'],
      regras: [
        'Informar sempre metragem, tipologia, número de vagas e previsão de entrega em cada empreendimento',
        'Explicar as condições de pagamento (entrada, parcelas na obra, repasse na entrega, financiamento) com exemplo numérico',
        'Descrever o entorno com fatos e distâncias reais, não com adjetivos de valorização',
        'Deixar explícito o que é imagem ilustrativa e o que é foto real',
        'Convidar para a visita ao decorado como próximo passo natural, sem escassez artificial',
      ],
      evitar: [
        '"Oportunidade imperdível, últimas unidades" sem comprovação',
        'Prometer valorização do imóvel ou rentabilidade garantida de aluguel',
        'Esconder o valor "a partir de" ou a data prevista de entrega',
      ],
      exemplos: [
        'Título: "Apartamentos de 68 a 89 m² no [BAIRRO] — entrega em 2028"',
        'CTA: "Agendar visita ao decorado" / "Baixar a tabela de unidades"',
        'Bloco: "A 900 m do metrô [ESTAÇÃO] e a 400 m do [MERCADO]: a pé, em 12 e 5 minutos."',
      ],
    },
    estiloVisual: {
      estilos: ['Premium contemporâneo', 'Minimalista aspiracional', 'Urbano moderno'],
      paletas: [
        {
          nome: 'Nobre Noturno',
          descricao: 'Padrão de empreendimento de alto padrão',
          cores: [
            { nome: 'Azul-noite', hex: '#101B2D' },
            { nome: 'Grafite', hex: '#2C333B' },
            { nome: 'Champagne', hex: '#C8A96B' },
            { nome: 'Off-white', hex: '#F5F2ED' },
            { nome: 'Verde profundo', hex: '#1F453C' },
          ],
        },
        {
          nome: 'Urbano Claro',
          descricao: 'Contemporâneo e luminoso',
          cores: [
            { nome: 'Branco', hex: '#FFFFFF' },
            { nome: 'Cinza claro', hex: '#E9EBEE' },
            { nome: 'Azul-petróleo', hex: '#1C4E5C' },
            { nome: 'Cobre', hex: '#B87333' },
            { nome: 'Verde-musgo', hex: '#5D6B4A' },
          ],
        },
      ],
      tipografia: {
        titulos: 'Serifada elegante ou sans geométrica de peso alto (Playfair Display, Canela, Montserrat)',
        corpo: 'Sans neutra legível (Inter, Lato, Open Sans)',
      },
      diretrizes: [
        'Hero em tela cheia com imagem do empreendimento e o essencial: bairro, metragens e previsão de entrega',
        'Blocos de imagem ampla intercalados com informação objetiva — sem excesso de texto corrido',
        'Pranchas e plantas com zoom e download em PDF',
        'Aviso "imagens ilustrativas" visível em todas as galerias de imagens geradas',
        'Formulário curto de interesse sempre a um clique, com escolha de tipologia',
      ],
      imagensIdeais: ['Imagens da fachada e da implantação', 'Renders de áreas comuns e lazer', 'Decorado montado e plantas humanizadas', 'Fotos reais do entorno e do bairro'],
      evitar: ['Renders genéricos sem relação com o projeto real', 'Imagens de banco de imagens apresentadas como o empreendimento', 'Layout poluído com muitos CTAs concorrentes'],
    },
    paginas: [
      {
        nome: 'Home',
        obrigatoria: true,
        objetivo: 'Vender o empreendimento em uma tela e captar o lead qualificado.',
        secoes: [
          'Hero com imagem do empreendimento, bairro, metragens e previsão de entrega',
          'Bloco de tipologias em cards (metragem, dormitórios, suítes, vagas e "a partir de")',
          'Diferenciais do projeto em 4 a 6 itens com ícone',
          'Localização resumida com mapa e proximidades principais',
          'Lazer e áreas comuns em prévia visual',
          'Decorado e tour virtual com convite para agendar visita',
          'Sobre a incorporadora e outros empreendimentos entregues',
          'Formulário de interesse curto (nome, WhatsApp, tipologia de interesse)',
          'FAQ com as dúvidas que travam a decisão',
        ],
        dica: 'O cliente quer saber metragem, bairro e entrega antes de qualquer coisa: isso precisa estar na primeira dobra, não no fim da página.',
      },
      paginaEmpreendimento(),
      {
        nome: 'Plantas e Tipologias',
        obrigatoria: true,
        objetivo: 'Comparar tipologias com informação suficiente para o cliente se decidir.',
        secoes: [
          'Cards de tipologia com metragem, dormitórios, suítes, vagas e posição solar',
          'Planta humanizada com zoom, medidas e mobiliário de referência',
          'Planta técnica com quadro de áreas em download',
          'Comparativo lado a lado das tipologias disponíveis',
          'Opções de personalização e itens de série de cada tipologia',
          'Como escolher: orientação, andar e vista, com o que isso muda no valor',
        ],
        dica: 'Planta com medidas legíveis evita visita ao decorado só para tirar dúvida de metragem.',
      },
      paginaLazer(),
      paginaLocalizacao(),
      paginaUnidades(),
      paginaTourVirtual(),
      paginaFinanciamento([
        'Simulação considerando entrada, parcelas durante a obra e saldo financiado na entrega',
        'Exemplos numéricos com data de referência (nunca percentuais soltos)',
      ]),
      {
        nome: 'A Incorporadora',
        obrigatoria: true,
        objetivo: 'Dar segurança sobre quem está construindo e entregando o empreendimento.',
        secoes: [
          'História da incorporadora, tempo de mercado e número de empreendimentos entregues',
          'Obras entregues com foto, ano e endereço (quando autorizado)',
          'Estrutura da empresa: engenharia própria, equipe de vendas e pós-venda',
          'Parcerias com construtoras, arquitetos e instituições financeiras',
          'Compromissos: prazo de entrega, garantia e assistência técnica após a entrega',
        ],
        dica: 'Empreendimento entregue é o argumento mais forte: mostre foto da entrega e depoimento de quem mora.',
      },
      paginaDocumentos(),
      paginaDepoimentos([
        'Depoimentos de moradores e investidores, com nome e unidade comprada',
        'Depoimentos em vídeo gravados no decorado ou na entrega das chaves',
      ]),
      paginaFaq([
        'Qual o valor e como funciona o pagamento?',
        'Qual a previsão de entrega?',
        'Quais as metragens e tipologias disponíveis?',
        'O empreendimento aceita financiamento e qual banco?',
        'Posso visitar o decorado? Precisa agendar?',
        'Como funciona o reajuste das parcelas durante a obra?',
        'Aceita pet? Quantas vagas por unidade?',
        'O que é imagem ilustrativa e o que já está definido no projeto?',
      ]),
      paginaAgendarVisita([
        'Escolha do dia e horário para visita ao decorado, com plantão de vendas aos sábados',
        'Confirmação por WhatsApp com endereço, corretor responsável e orientações de chegada',
        'Opção de visita por vídeo chamada para quem está fora da cidade',
      ]),
      paginaContato(['Telefone do plantão de vendas, WhatsApp e horário de atendimento', 'Endereço do decorado e do terreno com mapa']),
      paginaPolitica(),
    ],
    funcionalidades: {
      essenciais: [
        'Página de vendas do empreendimento com hero, tipologias, lazer, localização e documentos',
        'Formulário de interesse com escolha de tipologia e opção de baixar a tabela de unidades',
        'Agendamento de visita ao decorado com dia, horário e corretor',
        'Galeria de imagens com zoom e plantas em PDF para download',
        'Localização com mapa, distâncias a pé e lista de serviços próximos',
        'Aviso legal de imagens ilustrativas e registro de incorporação em destaque',
        'Dados estruturados RealEstateAgent + Residence/ApartmentComplex por empreendimento',
      ],
      desejaveis: [
        'Tour virtual 360 do decorado e das áreas comuns',
        'Tabela de unidades disponíveis integrada ao espelho de vendas/CRM',
        'Simulador de financiamento e de fluxo de pagamento durante a obra',
        'Área do comprador com cronograma da obra, boletos, documentos e status da unidade',
        'Captação com UTM e integração direta ao CRM (lead cai no corretor mais próximo)',
        'Retargeting com pixels para quem visitou páginas de tipologia',
        'Vídeo de apresentação do empreendimento e do decorado',
      ],
      integracoes: [
        'CRM de vendas imobiliárias com distribuição de lead por equipe',
        'Portais de lançamentos e feed XML',
        'Google Analytics 4 + Google Ads + Meta Ads com público personalizado',
        'WhatsApp Business com atendimento e agendamento',
        'Bancos e correspondentes para simulação de financiamento',
      ],
    },
    conteudoPronto: {
      servicos: [
        'Apartamentos de 2 dormitórios',
        'Apartamentos de 3 dormitórios com suíte',
        'Coberturas e unidades duplex',
        'Studios e unidades compactas',
        'Casas em condomínio fechado',
        'Salas e conjuntos comerciais',
        'Lojas de rua do empreendimento',
        'Garden e unidades com acesso privativo',
        'Implantação e paisagismo do condomínio',
        'Áreas comuns e lazer completo',
        'Personalização de acabamentos (quando houver)',
        'Assessoria em financiamento e documentação',
        'Plantão de vendas e decorado para visita',
        'Assistência técnica pós-entrega',
      ],
      diferenciais: [
        'Engenharia própria com controle de prazo e de qualidade da obra',
        'Localização com deslocamento a pé até transporte, escolas e comércio',
        'Lazer completo com itens de bem-estar, trabalho e pet place',
        'Tabela de pagamento transparente: entrada, parcelas na obra e saldo na entrega',
        'Assistência técnica após a entrega e cronograma público da obra para os compradores',
      ],
      faq: [
        { pergunta: 'Qual o valor e como funciona o pagamento?', resposta: 'O valor varia por tipologia e andar. O pagamento costuma ser dividido em entrada, parcelas mensais durante a obra e o saldo na entrega, que pode ser financiado. Enviamos a tabela completa com a simulação do seu caso.' },
        { pergunta: 'Qual a previsão de entrega?', resposta: 'A previsão está no memorial e no quadro de áreas do empreendimento, com a tolerância legal prevista no contrato. O cronograma da obra é atualizado periodicamente para os compradores.' },
        { pergunta: 'Quais tipologias estão disponíveis?', resposta: 'A página de unidades mostra o que está disponível, reservado e vendido, com metragem, andar e condição. A disponibilidade muda rápido: confirme com o corretor antes de decidir.' },
        { pergunta: 'O empreendimento aceita financiamento?', resposta: 'Sim, o saldo pode ser financiado por bancos parceiros, com aprovação de crédito do comprador. Ajudamos na simulação e na organização da documentação.' },
        { pergunta: 'Posso visitar o decorado?', resposta: 'Sim, agende pela página de agendamento escolhendo dia e horário, inclusive aos sábados. Se você estiver fora da cidade, fazemos a visita por vídeo chamada com o corretor.' },
        { pergunta: 'Como funciona o reajuste durante a obra?', resposta: 'As parcelas têm reajuste periódico conforme o índice previsto no contrato (em geral INCC ou IGPM), aplicado sobre o saldo. O simulador mostra o efeito do reajuste na parcela.' },
        { pergunta: 'Aceita pet e quantas vagas tem?', resposta: 'O empreendimento é pet friendly e conta com pet place. Cada tipologia tem o número de vagas indicado na planta; unidades com vaga dupla estão sinalizadas na tabela.' },
        { pergunta: 'As imagens representam exatamente o que vou receber?', resposta: 'As imagens de áreas comuns, decoração e paisagismo são ilustrativas e não fazem parte do contrato. Acabamentos, metragens e itens de série estão no memorial descritivo disponível para download.' },
      ],
      depoimentos: [
        { nome: 'Moradora da primeira torre', texto: 'Acompanhamos a obra pelo site e recebemos as chaves no prazo anunciado. O apartamento ficou muito próximo do decorado que visitamos.' },
        { nome: 'Investidor', texto: 'Comprei duas unidades na planta. A tabela de pagamento era clara, sem taxa escondida, e o repasse do financiamento na entrega funcionou como explicado.' },
      ],
      seo: {
        palavrasChave: [
          'apartamentos na planta em [CIDADE]',
          'lançamento imobiliário em [CIDADE]',
          'apartamento 3 quartos em [BAIRRO]',
          'empreendimento em [BAIRRO]',
          'incorporadora em [CIDADE]',
          'apartamento novo em [CIDADE] preço',
          'comprar apartamento na planta em [CIDADE]',
        ],
        tituloHome: '[NOME] | Apartamentos em [CIDADE] — Lançamento no [BAIRRO]',
        descricaoHome:
          'Apartamentos de [METRAGEM] em [BAIRRO], [CIDADE], com lazer completo e previsão de entrega em [ANO]. Agende sua visita ao decorado e baixe a tabela de unidades.',
      },
    },
    ecommerce: null,
    cuidados: [
      'Registro de incorporação, memorial descritivo e quadro de áreas devem estar publicados e acessíveis (Lei 4.591/64)',
      'Toda imagem de áreas comuns, decoração e paisagismo precisa de aviso visível "imagem ilustrativa"',
      'Não prometer valorização, rentabilidade de aluguel, prazo de entrega absolutamente certo nem "aprovação garantida" de financiamento',
      'Valores, condições e disponibilidade mudam com frequência: informar a data de referência em toda tabela e simulador',
      'Simulador de financiamento deve exibir taxas, sistema de amortização e o aviso de que é estimativa, não aprovação de crédito',
      'Reajuste das parcelas na obra precisa estar explicado com o índice contratual (INCC/IGP-M) e data-base',
      'Corretores devem ter CRECI ativo; anunciar empreendimento próprio dispensa a figura da imobiliária, mas não a regularidade profissional',
      'Leads de compradores são dados pessoais sensíveis: consentimento explícito para contato, finalidade informada e opção de descadastro (LGPD)',
      'Imagens de arquitetura e renders de terceiros exigem contrato de uso e crédito ao autor',
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Índice e utilidades
 * ------------------------------------------------------------------ */

const POR_ID = new Map(MODELOS.map((m) => [m.id, m]));

/** Versão enxuta para listagens e cards. */
function listarModelos() {
  return MODELOS.map((m) => ({
    id: m.id,
    nome: m.nome,
    emoji: m.emoji,
    area: m.area,
    resumo: m.resumo,
    suportaEcommerce: !!m.suportaEcommerce,
    temAgendamento: !!m.temAgendamento,
    objetivoRecomendado: m.objetivoRecomendado,
    totalPaginas: m.paginas.filter((p) => p.obrigatoria && p.noMenu !== true).length,
    paginasObrigatorias: m.paginas.filter((p) => p.obrigatoria && p.noMenu !== true).map((p) => p.nome),
  }));
}

function getModelo(id) {
  return POR_ID.get(id) || null;
}

/**
 * Sugestões para preencher o formulário automaticamente (botão "sugerir preenchimento").
 */
function sugestoesDoModelo(id) {
  const m = getModelo(id);
  if (!m) return null;
  return {
    segmento: m.id,
    nomeSegmento: m.nome,
    objetivoRecomendado: m.objetivoRecomendado,
    descricaoNegocio: m.descricaoNegocioPadrao,
    publicoAlvo: m.publicoAlvoPadrao,
    servicos: m.conteudoPronto.servicos,
    diferenciais: m.conteudoPronto.diferenciais,
    faq: m.conteudoPronto.faq,
    depoimentos: m.conteudoPronto.depoimentos,
    seo: m.conteudoPronto.seo,
    tomDeVoz: m.tomDeVoz,
    estiloVisual: m.estiloVisual,
    paginas: m.paginas.map((p) => ({ nome: p.nome, obrigatoria: p.obrigatoria, objetivo: p.objetivo })),
    funcionalidades: m.funcionalidades,
    ecommerce: m.ecommerce || null,
    cuidados: m.cuidados || [],
  };
}

/**
 * Todos os objetivos de site suportados (o primeiro é o recomendado por segmento).
 */
const OBJETIVOS = [
  { id: 'agendamento', nome: 'Agendamento online', descricao: 'O cliente marca horário/serviço sozinho pelo site.' },
  { id: 'venda', nome: 'Venda / e-commerce', descricao: 'O site vende produtos com carrinho e checkout.' },
  { id: 'orcamento', nome: 'Captação de orçamentos e leads', descricao: 'Formulários e WhatsApp para gerar contatos comerciais.' },
  { id: 'informativo', nome: 'Institucional / informativo', descricao: 'Apresentar a empresa, serviços e localização.' },
  { id: 'autoridade', nome: 'Autoridade e conteúdo', descricao: 'Blog, SEO e prova de especialização técnica.' },
  { id: 'relacionamento', nome: 'Relacionamento e fidelização', descricao: 'Planos, assinaturas, área do cliente e lembretes.' },
];

const ESTILOS_DESEJADOS = [
  'Moderno',
  'Minimalista',
  'Sofisticado / premium',
  'Divertido e colorido',
  'Clássico e atemporal',
  'Clean e clínico',
  'Rústico / artesanal',
  'Dark e chamativo',
];

const IDIOMAS = [
  { id: 'pt-BR', nome: 'Português (Brasil)' },
  { id: 'es', nome: 'Espanhol' },
  { id: 'en', nome: 'Inglês' },
  { id: 'pt-BR+en', nome: 'Português + Inglês (bilíngue)' },
  { id: 'pt-BR+es', nome: 'Português + Espanhol (bilíngue)' },
];

module.exports = {
  MODELOS,
  OBJETIVOS,
  ESTILOS_DESEJADOS,
  IDIOMAS,
  listarModelos,
  getModelo,
  sugestoesDoModelo,
};
  };

  REGISTRO['prompt-engine'] = function (module, exports, require) {
'use strict';

/**
 * MOTOR DE GERAÇÃO DO PROMPT
 * --------------------------
 * Recebe (a) os dados preenchidos do cliente, (b) o modelo do segmento e
 * (c) a lista real de arquivos enviados — e devolve um prompt estruturado,
 * específico e sem instruções genéricas, pronto para ser usado por uma IA de
 * criação de sites.
 *
 * Regras respeitadas aqui (ver README, seção "Regras de geração"):
 *   - nada de seção vazia ou placeholder do tipo "[preencher]";
 *   - nome, segmento, cidade e serviços sempre presentes;
 *   - objetivo do site declarado de forma explícita;
 *   - arquitetura de páginas e seções vinda do modelo do segmento;
 *   - funcionalidades marcadas como obrigatórias x desejáveis;
 *   - tom de voz e estilo visual sempre entregues (com fallback do segmento);
 *   - instruções explícitas de uso das mídias anexadas, citando os arquivos;
 *   - SEO local com título, descrição, palavras-chave e dados estruturados.
 */

const {
  texto,
  temTexto,
  juntar,
  listarTexto,
  slug,
  telefoneInternacional,
  formatarTelefone,
  normalizarUrl,
  hexValido,
  dataLegivel,
} = require('./utils');
const { getModelo, OBJETIVOS } = require('./segmentos');

const VERSAO = '1.0';

/* ------------------------------------------------------------------ *
 * Normalização dos dados de entrada
 * ------------------------------------------------------------------ */

const vazio = () => '';

function normalizarServicos(entrada) {
  const lista = Array.isArray(entrada) ? entrada : String(entrada || '').split('\n');
  return lista
    .map((item) => {
      if (item == null) return null;
      if (typeof item === 'string') {
        const nome = item.replace(/^[-*•\d.\s]+/, '').trim();
        return nome ? { nome, descricao: '', preco: '', duracao: '' } : null;
      }
      const nome = texto(item.nome || item.servico || item.titulo);
      if (!nome) return null;
      return {
        nome,
        descricao: texto(item.descricao || item.detalhe),
        preco: texto(item.preco || item.valor),
        duracao: texto(item.duracao || item.tempo),
      };
    })
    .filter(Boolean);
}

function normalizarFaq(entrada) {
  const lista = Array.isArray(entrada) ? entrada : [];
  return lista
    .map((item) => {
      if (typeof item === 'string') {
        const [pergunta, resposta] = item.split('|');
        return temTexto(pergunta) ? { pergunta: texto(pergunta), resposta: texto(resposta) } : null;
      }
      const pergunta = texto(item?.pergunta || item?.q);
      const resposta = texto(item?.resposta || item?.a);
      return pergunta ? { pergunta, resposta } : null;
    })
    .filter(Boolean);
}

function normalizarDepoimentos(entrada) {
  const lista = Array.isArray(entrada) ? entrada : String(entrada || '').split('\n');
  return lista
    .map((item) => {
      if (typeof item === 'string') {
        const t = item.replace(/^[-*•\s]+/, '').trim();
        return t ? { nome: '', texto: t } : null;
      }
      const conteudo = texto(item?.texto || item?.depoimento);
      return conteudo ? { nome: texto(item?.nome || item?.autor), texto: conteudo, nota: texto(item?.nota) } : null;
    })
    .filter(Boolean);
}

function normalizarCores(entrada) {
  const lista = Array.isArray(entrada) ? entrada : String(entrada || '').split(/[,;\n]/);
  return lista
    .map((item) => {
      if (item == null) return null;
      if (typeof item === 'string') {
        const valor = item.trim();
        if (!valor) return null;
        return hexValido(valor) ? { nome: '', hex: valor.toUpperCase() } : { nome: valor, hex: '' };
      }
      const hex = texto(item.hex || item.cor);
      const nome = texto(item.nome || item.rotulo);
      if (!hex && !nome) return null;
      return { nome, hex: hex ? (hex.startsWith('#') ? hex.toUpperCase() : `#${hex.toUpperCase()}`) : '' };
    })
    .filter(Boolean);
}

function normalizarLinks(entrada) {
  const lista = Array.isArray(entrada) ? entrada : [];
  return lista
    .map((item) => {
      const url = normalizarUrl(item?.url || item);
      const rotulo = texto(item?.rotulo || item?.nome) || url;
      return url ? { rotulo, url } : null;
    })
    .filter(Boolean);
}

/** Junta dados do formulário + defaults do modelo. */
function prepararContexto(entrada = {}, arquivos = {}) {
  const modelo = getModelo(entrada.segmento);
  if (!modelo) {
    const erro = new Error(`Segmento desconhecido: ${entrada.segmento || '(vazio)'}`);
    erro.codigo = 'SEGMENTO_INVALIDO';
    throw erro;
  }

  const empresa = entrada.empresa || {};
  const endereco = empresa.endereco || {};
  const negocio = entrada.negocio || {};
  const redes = entrada.redes || {};
  const identidade = entrada.identidade || {};
  const conteudo = entrada.conteudo || {};
  const opcoes = entrada.opcoes || {};

  const servicos = normalizarServicos(empresa.servicos || negocio.servicos);
  const listaServicos = servicos.length ? servicos : normalizarServicos(modelo.conteudoPronto.servicos);

  const diferenciaisInformados = Array.isArray(negocio.diferenciais)
    ? negocio.diferenciais.map(texto).filter(Boolean)
    : texto(negocio.diferenciais)
        .split(/\n|;/)
        .map((d) => d.trim())
        .filter(Boolean);

  const faq = normalizarFaq(conteudo.faq);
  const depoimentos = normalizarDepoimentos(conteudo.depoimentos);
  const cores = normalizarCores(identidade.cores);
  const linksExtras = normalizarLinks(redes.linksExtras);

  const temEcommerce = !!opcoes.ecommerce && !!modelo.suportaEcommerce;
  const objetivoIds = [opcoes.objetivo, ...(opcoes.objetivosExtras || [])]
    .map(texto)
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const objetivoPrincipal = (objetivoIds[0] || modelo.objetivoRecomendado || 'informativo').toLowerCase();

  const arquivosMidias = arquivos.midias || [];
  const arquivosBranding = arquivos.branding || [];
  const arquivosConteudo = arquivos.conteudo || [];

  const faltando = [];
  if (!temTexto(empresa.nomeFantasia)) faltando.push('Nome fantasia');
  if (!temTexto(empresa.telefone) && !temTexto(empresa.whatsapp) && !temTexto(empresa.email)) {
    faltando.push('Telefone/WhatsApp ou e-mail de contato');
  }
  if (!temTexto(endereco.cidade)) faltando.push('Cidade/UF');
  if (!temTexto(negocio.descricao)) faltando.push('Descrição do negócio');
  if (!temTexto(negocio.publicoAlvo)) faltando.push('Público-alvo');
  if (!servicos.length) faltando.push('Serviços/produtos principais');
  if (!temTexto(empresa.horario)) faltando.push('Horário de atendimento');
  if (!cores.length) faltando.push('Cores da identidade visual');
  if (!temTexto(identidade.estilo)) faltando.push('Estilo visual desejado');
  if (!arquivosBranding.some((a) => /logo/i.test(a.nome))) faltando.push('Arquivo do logo');
  if (!arquivosMidias.length) faltando.push('Imagens/vídeos do site');

  return {
    entrada,
    modelo,
    empresa,
    endereco,
    negocio,
    redes,
    identidade,
    conteudo,
    opcoes,
    servicos,
    listaServicos,
    diferenciais: diferenciaisInformados,
    faq,
    depoimentos,
    cores,
    linksExtras,
    temEcommerce,
    objetivoPrincipal,
    objetivoIds,
    arquivosMidias,
    arquivosBranding,
    arquivosConteudo,
    faltando,
  };
}

/* ------------------------------------------------------------------ *
 * Helpers de escrita
 * ------------------------------------------------------------------ */

const NOME_PASTA = (ctx) => ctx.entrada.pasta || slug(ctx.empresa.nomeFantasia || 'cliente');

function local(ctx) {
  return juntar([ctx.endereco.cidade, ctx.endereco.estado], '/');
}

function enderecoCompleto(ctx) {
  const e = ctx.endereco;
  const linha1 = juntar([juntar([e.rua, e.numero], ', '), e.complemento], ' — ');
  const linha2 = juntar([e.bairro, local(ctx), e.cep ? `CEP ${e.cep}` : ''], ' • ');
  return listarTexto([linha1, linha2].filter(Boolean), ', ');
}

/**
 * Substitui os marcadores dos textos do modelo pelos dados reais do cliente.
 * Evita que um "[CIDADE]" da biblioteca de exemplos vaze para o prompt final.
 */
function substituirTokens(valor, ctx) {
  const cidade = texto(ctx.endereco.cidade) || 'sua cidade';
  const bairro = texto(ctx.endereco.bairro) || cidade;
  const nome = texto(ctx.empresa.nomeFantasia) || 'a empresa';
  const servico = ctx.listaServicos[0]?.nome || 'nossos serviços';
  const servicos = ctx.listaServicos.map((s) => s.nome).join(', ') || 'nossos serviços';
  return String(valor == null ? '' : valor)
    .replace(/\[CIDADE\]/g, cidade)
    .replace(/\[BAIRRO\]/g, bairro)
    .replace(/\[NOME\]/g, nome)
    .replace(/\[SERVIÇOS\]/g, servicos)
    .replace(/\[SERVIÇO\]/g, servico);
}

function campusTitulo(t) {
  return `## ${t}`;
}

/** Bloco de texto recuado em bullets, com fallback quando a lista está vazia. */
function bullets(itens, fallback = '- (nada informado pelo cliente — usar a sugestão do modelo para este segmento)') {
  const lista = (itens || []).filter((i) => temTexto(i));
  if (!lista.length) return fallback;
  return lista.map((i) => `- ${i}`).join('\n');
}

function bulletsNumerados(itens) {
  const lista = (itens || []).filter((i) => temTexto(i));
  if (!lista.length) return '';
  return lista.map((i, idx) => `${idx + 1}. ${i}`).join('\n');
}

/* ------------------------------------------------------------------ *
 * Seções do prompt
 * ------------------------------------------------------------------ */

function seccaoFicha(ctx) {
  const { empresa, endereco, modelo } = ctx;
  const linhas = [
    `**Cliente:** ${texto(ctx.entrada.nomeContato) || empresa.nomeFantasia}`,
    `**Empresa:** ${empresa.nomeFantasia}`,
    empresa.razaoSocial ? `**Razão social:** ${empresa.razaoSocial}` : '',
    empresa.cnpj ? `**CNPJ:** ${empresa.cnpj}` : '',
    `**Segmento:** ${modelo.nome}${ctx.temEcommerce ? ' (com loja online)' : ''}`,
    local(ctx) ? `**Localização:** ${enderecoCompleto(ctx)}` : '',
    '',
    `**Projeto:** ${NOME_PASTA(ctx)}`,
    `**Modelo base:** ${modelo.id} v${VERSAO}`,
    `**Gerado em:** ${dataLegivel(new Date().toISOString())}`,
  ];
  return linhas.filter((l) => l !== undefined && l !== null && !(l === '' && false)).join('\n');
}

function seccaoArquivos(ctx, opcoes = {}) {
  const pasta = NOME_PASTA(ctx);
  const m = ctx.arquivosMidias.filter((a) => a.extensao !== 'mp4' && a.extensao !== 'mov' && a.extensao !== 'webm');
  const v = ctx.arquivosMidias.filter((a) => ['mp4', 'mov', 'webm'].includes(a.extensao));

  const linhas = [
    'Este projeto acompanha uma pasta com todos os materiais do cliente. Considere os arquivos abaixo como a **fonte oficial** de conteúdo — não invente produtos, endereços, telefones ou imagens.',
    '',
    `${pasta}/`,
    '├── prompt_site.txt        (este documento)',
    '├── midias/                (imagens e vídeos para o site)',
    '├── branding/              (logo, paleta de cores, fontes e referências)',
    '└── conteudo/              (textos, depoimentos, FAQ e demais documentos)',
  ];

  if (opcoes.incluirListaArquivos !== false) {
    linhas.push('', '**Arquivos disponíveis**');
    const descrever = (lista, rotulo) => {
      if (!lista.length) return;
      linhas.push(`- ${rotulo}: ${lista.map((a) => a.nome).join(', ')}`);
    };
    descrever(ctx.arquivosMidias, 'Mídias (midias/)');
    descrever(ctx.arquivosBranding, 'Branding (branding/)');
    descrever(ctx.arquivosConteudo, 'Conteúdo (conteudo/)');
    if (!ctx.arquivosMidias.length && !ctx.arquivosBranding.length && !ctx.arquivosConteudo.length) {
      linhas.push('- Nenhum arquivo foi enviado ainda. Trabalhe com placeholders elegantes e mantenha a estrutura pronta para receber as mídias.');
    }
    if (m.length) linhas.push(`- Total de imagens: ${m.length}`);
    if (v.length) linhas.push(`- Total de vídeos: ${v.length}`);
  }
  return linhas.join('\n');
}

function seccaoNegocio(ctx) {
  const { empresa, negocio, modelo } = ctx;
  const descricao = texto(negocio.descricao) || modelo.descricaoNegocioPadrao;
  const l = [
    `**${empresa.nomeFantasia}** é ${descricao}.`,
    '',
  ];
  if (local(ctx)) l.push(`Atua em **${local(ctx)}**${ctx.endereco.bairro ? ` (bairro ${ctx.endereco.bairro})` : ''}, atendendo presencialmente${texto(empresa.horario) ? ` com o seguinte horário de funcionamento: ${empresa.horario}` : ''}.`, '');
  if (ctx.listaServicos.length) {
    l.push('**Principais serviços/produtos**');
    l.push(
      bullets(
        ctx.listaServicos.map((s) =>
          juntar([s.nome, s.descricao ? `— ${s.descricao}` : '', s.duracao ? `(${s.duracao})` : '', s.preco ? `Valor: ${s.preco}` : ''], ' ')
        )
      ),
      ''
    );
  }
  l.push('**Diferenciais / proposta de valor**');
  l.push(
    bullets(
      ctx.diferenciais.length ? ctx.diferenciais : modelo.conteudoPronto.diferenciais,
      '- (não informado — destacar os diferenciais típicos do segmento sem exageros)'
    ),
    ''
  );
  if (temTexto(negocio.sazonalidade) || temTexto(negocio.observacoes)) {
    l.push('**Observações do negócio**');
    l.push(bullets([negocio.sazonalidade, negocio.observacoes]));
    l.push('');
  }
  return l.join('\n').trim();
}

function seccaoPublico(ctx) {
  const publico = texto(ctx.negocio.publicoAlvo) || ctx.modelo.publicoAlvoPadrao;
  const l = [
    publico,
    '',
    'Considere este público em todas as decisões de conteúdo e design:',
    '- **Dispositivo principal:** celular. Projete mobile-first e teste em telas pequenas antes da versão desktop.',
    `- **Região de influência:** ${local(ctx) ? `${local(ctx)} e cidades vizinhas` : 'a cidade e o entorno imediato'}. Priorize buscas com intenção local ("perto de mim", "em [cidade]").`,
  ];
  if (temTexto(ctx.negocio.faixaEtaria)) l.push(`- **Faixa etária predominante:** ${ctx.negocio.faixaEtaria}`);
  if (temTexto(ctx.negocio.poderCompra)) l.push(`- **Sensibilidade a preço:** ${ctx.negocio.poderCompra}`);
  if (Array.isArray(ctx.negocio.objecoes) && ctx.negocio.objecoes.length) {
    l.push('', '**Objeções que o site precisa derrubar**');
    l.push(bullets(ctx.negocio.objecoes.filter(Boolean).map(texto)));
  }
  return l.join('\n');
}

function seccaoObjetivo(ctx) {
  const objs = [ctx.objetivoPrincipal, ...ctx.objetivoIds.slice(1)]
    .map((id) => OBJETIVOS.find((o) => o.id === id))
    .filter(Boolean);

  const principal = objs[0] || OBJETIVOS.find((o) => o.id === ctx.modelo.objetivoRecomendado);
  const secundarios = objs.slice(1);

  const indicadores = {
    agendamento: [
      'Cliques no botão "Agendar" (eventos de conversão configurados)',
      'Agendamentos concluídos por semana',
      'Origem dos agendamentos (orgânico, anúncio, Instagram, Google Meu Negócio)',
      'Taxa de no-show em relação aos agendamentos feitos pelo site',
    ],
    venda: [
      'Carrinhos criados e pedidos finalizados',
      'Ticket médio e produtos mais vendidos',
      'Taxa de abandono de carrinho',
      'Receita por canal de aquisição',
    ],
    orcamento: [
      'Formulários e cliques em WhatsApp (com origem registrada)',
      'Tempo médio de resposta ao lead',
      'Taxa de conversão de lead em cliente',
    ],
    informativo: [
      'Visitas e tempo na página',
      'Cliques em rota/mapa e em telefone',
      'Visualizações da página de serviços',
    ],
    autoridade: [
      'Tráfego orgânico e posição média das palavras-chave',
      'Leituras de artigos e inscrições na newsletter',
      'Links recebidos e compartilhamentos',
    ],
    relacionamento: [
      'Assinantes de planos e recorrência',
      'Recompra e retenção por período',
      'Uso das áreas de autoatendimento do site',
    ],
  };

  const l = [
    `**Objetivo principal do site:** ${principal.nome} — ${principal.descricao}`,
  ];
  if (secundarios.length) {
    l.push('', '**Objetivos secundários (em ordem de prioridade)**');
    l.push(bulletsNumerados(secundarios.map((o) => `${o.nome} — ${o.descricao}`)));
  }
  if (temTexto(ctx.negocio.objetivoDetalhe)) {
    l.push('', `**Como o cliente descreveu a meta:** ${ctx.negocio.objetivoDetalhe}`);
  }
  if (!ctx.temEcommerce && principal.id === 'venda') {
    l.push(
      '',
      '> **Atenção de escopo:** o objetivo indicado é venda, mas a loja online não foi habilitada nesta versão. Trate a conversão como **pedido por WhatsApp/catálogo** (com preços, fotos e botão de pedido) e sinalize ao cliente a possibilidade de ativar o e-commerce em uma fase 2, reaproveitando o mesmo catálogo.'
    );
  }
  if (ctx.temEcommerce) {
    l.push(
      '',
      '**Diretriz de conversão da loja**',
      '- O caminho até o "pagamento concluído" deve ter no máximo 3 passos a partir da home.',
      '- Ofereça sempre duas rotas: finalizar a compra no site **ou** enviar o pedido pelo WhatsApp (muito usado por este público).',
      '- Exiba o prazo de entrega estimado por região antes do checkout, não depois.'
    );
  }
  l.push(
    '',
    '**O que conta como sucesso (métricas a instrumentar já no lançamento)**',
    bullets(indicadores[principal.id] || indicadores.informativo),
    '',
    'Configure as conversões no Google Analytics 4 e no Meta Pixel desde a publicação da primeira versão. Sem medição, nenhuma otimização posterior é possível.'
  );
  return l.join('\n');
}

/**
 * Aplica as escolhas do operador (loja, blog, FAQ, depoimentos, galeria, equipe,
 * assinaturas) à lista de páginas do modelo. Fonte única da verdade — usada pelo
 * prompt completo, pela versão curta, pelos critérios de aceite e pela interface.
 */
/**
 * Nome do setor usado na definição do papel da IA ("especializado em sites para o
 * setor de ..."). Cada modelo traz o seu; o fallback usa a área do card.
 */
function setorDoModelo(modelo) {
  return texto(modelo.setor) || String(modelo.area || 'serviços').toLowerCase();
}

/**
 * Junta artigo + termo de busca do segmento ("uma clínica veterinária", "um
 * escritório de arquitetura"). O gênero vem do modelo: "um empresa" empobrece o
 * texto entregue à IA.
 */
function comArtigo(termo, genero) {
  return `${genero === 'f' ? 'uma' : 'um'} ${texto(termo) || 'empresa'}`;
}

function paginasAtivas(ctx) {
  const opcoes = ctx.opcoes || {};
  const regras = [
    { nomes: ['Loja', 'Loja / Produtos', 'Assinatura de Ração'], ativa: () => ctx.temEcommerce },
    { nomes: ['Blog / Dicas'], ativa: () => opcoes.incluirBlog !== false },
    { nomes: ['Perguntas Frequentes (FAQ)'], ativa: () => opcoes.incluirFaq !== false },
    { nomes: ['Depoimentos'], ativa: () => opcoes.incluirDepoimentos !== false },
    { nomes: ['Galeria'], ativa: () => opcoes.incluirGaleria !== false },
    { nomes: ['Equipe'], ativa: () => opcoes.incluirEquipe !== false },
    { nomes: ['Clube de Assinatura', 'Planos e Pacotes'], ativa: () => opcoes.incluirAssinatura !== false },
  ];
  return ctx.modelo.paginas.filter((pagina) => {
    const regra = regras.find((r) => r.nomes.includes(pagina.nome));
    return regra ? regra.ativa() : true;
  });
}

function seccaoPaginas(ctx) {
  const paginas = paginasAtivas(ctx);
  // Páginas de template (ficha do imóvel, página de projeto) existem no site mas
  // são alcançadas por listagem, não pelo menu principal.
  const menuObrigatorio = paginas.filter((p) => p.obrigatoria && p.noMenu !== true).map((p) => p.nome);

  const blocos = paginas.map((pagina, i) => {
    const marca = pagina.obrigatoria ? 'OBRIGATÓRIA' : 'OPCIONAL (recomendada)';
    const linhas = [
      `#### ${i + 1}. ${pagina.nome} — ${marca}`,
      `*Objetivo da página:* ${pagina.objetivo}`,
      'Seções, na ordem:',
      bulletsNumerados(
        pagina.secoes.map((secao) =>
          !ctx.temEcommerce ? secao.replace(/^Loja de produtos em destaque/i, 'Vitrine de produtos em destaque com pedido pelo WhatsApp (sem carrinho)') : secao
        )
      ),
    ];
    if (temTexto(pagina.dica)) linhas.push(`> Orientação específica: ${pagina.dica}`);
    return linhas.join('\n');
  });

  const l = [
    `A estrutura abaixo vem do modelo **${ctx.modelo.nome}**, já ajustada para este cliente. Mantenha a ordem, os rótulos do menu e adapte os textos ao contexto real do negócio.`,
    '',
    `**Menu principal sugerido:** ${menuObrigatorio.join(' | ')}`,
    'O menu deve ser fixo (sticky) no topo, com o botão de contato/destaque sempre visível no canto direito.',
    '',
    ...(ctx.temEcommerce
      ? []
      : [
          '> **Sem loja online nesta versão:** onde as seções abaixo citarem produtos ou prateleira, trate como **catálogo/vitrine** com pedido pelo WhatsApp ou retirada no balcão. Não implemente carrinho nem checkout.',
          '',
        ]),
    blocos.join('\n\n'),
    '',
    '**Regras transversais de navegação e layout**',
    '- Cabeçalho com logo à esquerda, menu ao centro/direita e botão de ação destacado.',
    '- Rodapé completo com NAP (nome, endereço, telefone), horários, redes sociais, formas de pagamento, mapa e link da Política de Privacidade.',
    '- Breadcrumbs em páginas internas e destaque da página atual no menu.',
    '- Botão de WhatsApp e/ou agendar fixo (flutuante) em todas as páginas.',
    '- Página 404 personalizada com atalhos para Serviços, Contato e Agendamento.',
    '- Título e descrição únicos por página (SEO), sem repetições.',
  ];
  return l.join('\n');
}

function seccaoFuncionalidades(ctx) {
  const f = ctx.modelo.funcionalidades;
  const essenciais = [...f.essenciais];
  const desejaveis = [...f.desejaveis];

  if (ctx.temEcommerce) {
    essenciais.push(
      'Carrinho e checkout completos, com cálculo de frete por CEP',
      'Cadastro/login do cliente com histórico de pedidos',
      'E-mails e mensagens automáticas de confirmação de pedido e status de envio'
    );
    if (ctx.modelo.ecommerce?.recursos) desejaveis.push(...ctx.modelo.ecommerce.recursos);
  } else {
    const semLoja = (lista) => lista.filter((i) => !/carrinho|checkout|frete|estoque|cupom|marketplace|catálogo|produto/i.test(i));
    return [
      '**Obrigatórias (sem elas o site não entra no ar)**',
      bullets(semLoja(essenciais)),
      '',
      '**Desejáveis (fase 2, se houver prazo ou orçamento)**',
      bullets(semLoja(desejaveis)),
      '',
      '**Integrações a prever no projeto**',
      bullets(f.integracoes),
      '',
      '> Este cliente **não vendeu online** nesta contratação. Não crie carrinho, checkout ou catálogo de produtos. Se o cliente optar por vender depois, a estrutura deve permitir acoplar uma loja sem refazer o site (deixe o menu e o CSS preparados).',
    ].join('\n');
  }

  const ecommerce = ctx.modelo.ecommerce;
  const l = [
    '**Obrigatórias (sem elas o site não entra no ar)**',
    bullets(essenciais),
    '',
    '**Desejáveis (fase 2)**',
    bullets(desejaveis),
    '',
    '**Integrações a prever no projeto**',
    bullets(f.integracoes),
    '',
    '### Loja online — especificação',
    `Categorias a montar: ${(ecommerce?.categorias || ['Produtos']).join(', ')}.`,
    '',
    '**Fluxo de compra**',
    bulletsNumerados([
      'Vitrine → página de produto → adicionar ao carrinho → carrinho lateral com resumo e frete → checkout → obrigado.',
      'Checkout em página única, com campos mínimos: nome, CPF/CNPJ (opcional), e-mail, telefone, endereço com busca por CEP e forma de pagamento.',
      'Ofereça Pix (com desconto opcional), cartão de crédito (parcelamento) e boleto; e sempre a alternativa "finalizar pelo WhatsApp".',
      'Confirmação imediata na tela + e-mail/WhatsApp com número do pedido e prazo estimado.',
      'Página de acompanhamento de pedido por código.',
    ]),
    '',
    '**Regras comerciais a implementar**',
    bullets([
      'Exibir preço, parcelamento estimado e disponibilidade de estoque em todo card de produto.',
      'Cálculo de frete por CEP no carrinho; frete grátis acima do valor definido pelo cliente.',
      'Cupom de primeira compra e cupom de recuperação de carrinho abandonado.',
      'Aviso "últimas unidades" apenas quando for verdadeiro.',
      'Recuperação de carrinho por e-mail e WhatsApp em 2 toques (24h e 72h).',
    ]),
    '',
    '**Catálogo inicial**',
    bullets([
      `Cadastrar entre 20 e 40 itens no lançamento${ecommerce?.categorias ? `, cobrindo ${listarTexto(ecommerce.categorias)}` : ''}.`,
      'Fotos em fundo neutro, 1:1, com no mínimo 3 ângulos por produto.',
      'Descrições com benefício + especificação técnica + modo de uso.',
      'Variações (tamanho, peso, cor) com estoque próprio por variação.',
    ]),
    ...(ecommerce?.observacoes?.length ? ['', '**Atenção específica do segmento**', bullets(ecommerce.observacoes)] : []),
  ];
  return l.join('\n');
}

function seccaoConteudo(ctx) {
  const { conteudo, modelo } = ctx;
  const l = [];

  const textos = texto(conteudo.textos);
  if (temTexto(textos)) {
    l.push('**Textos enviados pelo cliente (usar como base e ajustar apenas para clareza e SEO)**');
    l.push(textos.length > 2000 ? `${textos.slice(0, 2000)}\n[...texto completo nos arquivos da pasta conteudo/]` : textos);
    l.push('');
  } else {
    l.push('O cliente não enviou textos prontos. **Redija o conteúdo** seguindo a estrutura sugerida abaixo e o tom de voz definido neste prompt. Entregue os textos na pasta `conteudo/` em `.md` além de aplicá-los no site.');
    l.push('');
  }

  l.push('**Estrutura de textos a produzir por página**');
  l.push(
    bulletsNumerados([
      'Home: headline (máx. 8 palavras), subheadline (1 frase), chamadas de cada bloco e CTAs.',
      'Serviços: um texto curto por serviço com o que é, para quem é, como acontece e o que está incluso.',
      'Sobre: história, propósito, equipe e números de credibilidade.',
      'Contato: instruções de chegada e orientação de atendimento.',
      'Rodapé: descrição curta da empresa em 1 frase (até 25 palavras).',
    ])
  );
  l.push('');

  l.push('**Sugestão de serviços/produtos para esta página (base do modelo)**');
  l.push(bullets(ctx.modelo.conteudoPronto.servicos.slice(0, 12).map((s, i) => (ctx.listaServicos[i]?.nome === s ? `${s} *(confirmado pelo cliente)*` : s))));
  l.push('');

  l.push('**Depoimentos**');
  if (ctx.depoimentos.length) {
    l.push(bullets(ctx.depoimentos.map((d) => `"${d.texto}"${d.nome ? ` — ${d.nome}` : ''}${d.nota ? ` (${d.nota})` : ''}`)));
  } else {
    l.push('O cliente não enviou depoimentos. **Não invente depoimentos, avaliações ou notas** — isso é prova social falsa.');
    l.push('Prepare o layout da seção com 3 a 6 blocos e deixe um comentário no código indicando onde colar os depoimentos reais. Sugira ao cliente coletar avaliações no Google e pedir autorização de uso.');
  }
  l.push('');

  l.push('**FAQ**');
  if (ctx.faq.length) {
    l.push(bullets(ctx.faq.map((f) => `${f.pergunta} → ${f.resposta || '(resposta a redigir com o cliente)'}`)));
  } else {
    l.push('O cliente não enviou FAQ. Use estas perguntas (típicas do segmento) como base — ajuste as respostas aos fatos reais do negócio:');
    l.push(bullets(modelo.conteudoPronto.faq.map((f) => `${f.pergunta} → ${f.resposta}`)));
  }

  if (Array.isArray(conteudo.avisos) && conteudo.avisos.filter(Boolean).length) {
    l.push('', '**Informações que NÃO podem ser publicadas ou prometidas**');
    l.push(bullets(conteudo.avisos.filter(Boolean).map(texto)));
  }

  return l.join('\n');
}

function seccaoTomDeVoz(ctx) {
  const t = ctx.modelo.tomDeVoz;
  const custom = texto(ctx.opcoes.tomDeVoz);
  const sub = (lista) => (lista || []).map((item) => substituirTokens(item, ctx));
  const l = [
    `**Personalidade da marca:** ${sub(t.personalidade).join(' · ')}`,
  ];
  if (custom) l.push('', `**Ajuste pedido pelo cliente:** ${custom}`);
  l.push(
    '',
    '**Como escrever (regras práticas)**',
    bullets(sub(t.regras)),
    '',
    '**Evitar**',
    bullets(sub(t.evitar)),
    '',
    '**Exemplos de referência para copiar o padrão**',
    bullets(sub(t.exemplos)),
    '',
    '**Boas práticas de redação para web (aplicar em todo o site)**',
    bullets([
      'Frases curtas (até 20 palavras) e parágrafos de no máximo 4 linhas.',
      'Um CTA por bloco, com verbo no infinitivo ou imperativo ("Agendar", "Falar no WhatsApp").',
      'Títulos que falem do benefício, não do recurso.',
      'Zero "clique aqui", "saiba mais" solto ou "bem-vindo ao nosso site".',
      'Revisar ortografia e remover repetições de "qualidade", "excelência" e "compromisso".',
    ])
  );
  return l.join('\n');
}

function seccaoIdentidadeVisual(ctx) {
  const v = ctx.modelo.estiloVisual;
  const estiloCliente = texto(ctx.identidade.estilo);
  const estilos = estiloCliente ? [estiloCliente, ...v.estilos] : v.estilos;

  const cores = ctx.cores.length
    ? ctx.cores
    : (v.paletas[0]?.cores || []).map((c) => ({ nome: c.nome, hex: c.hex, origem: 'sugerida' }));

  const l = [
    `**Estilo desejado pelo cliente:** ${estiloCliente || `${v.estilos[0]} (não especificado — sugestão do modelo para o segmento)`}`,
    `**Direções adequadas ao segmento:** ${v.estilos.join(' / ')}`,
    '',
    '**Paleta de cores a usar**',
    bullets(
      cores.map((c) => {
        const origem = ctx.cores.length ? 'informada pelo cliente' : 'sugerida pelo modelo';
        return c.hex ? `**${c.hex}**${c.nome ? ` — ${c.nome}` : ''} (${origem})` : `${c.nome} (${origem})`;
      }),
      bullets(v.paletas[0].cores.map((c) => `**${c.hex}** — ${c.nome}`))
    ),
    '',
    `**Cor de destaque/CTA:** usar ${cores.some((c) => /ros|terracota|dourad|laranja|cor/i.test(c.nome)) ? 'o tom mais quente da paleta' : 'o tom mais saturado da paleta'} nos botões de ação, com contraste mínimo de 4.5:1 contra o fundo (WCAG AA).`,
    `**Neutros:** definir uma escala de cinzas/off-white para fundos e divisores a partir da paleta acima; evitar preto puro (#000) em grandes áreas.`,
    '',
    '**Tipografia**',
    `- Títulos: ${v.tipografia.titulos}`,
    `- Corpo do texto: ${v.tipografia.corpo}`,
    '- Escala sugerida: H1 40–56px (24–30px no mobile), H2 28–36px, corpo 16–18px, legenda 14px.',
    '- No máximo **duas famílias tipográficas**. Carregar com `display=swap` e apenas os pesos usados.',
  ];

  if (temTexto(ctx.identidade.fontes)) {
    l.push(`- Fontes informadas pelo cliente (priorizar se houver arquivo em branding/): ${texto(ctx.identidade.fontes)}`);
  }

  l.push(
    '',
    '**Diretrizes visuais específicas do segmento**',
    bullets(v.diretrizes),
    '',
    '**Imagens e vídeos adequados (usar os arquivos do cliente quando existirem)**',
    bullets(v.imagensIdeais),
    '',
    '**Evitar neste segmento**',
    bullets(v.evitar),
    '',
    '**Sistema de design a entregar**',
    bullets([
      'Tokens em CSS custom properties (cores, espaçamentos, raios, sombras e tipografia).',
      'Componentes reutilizáveis: botão (primário/secundário/texto), card, badge, acordeão, carrossel, formulário e modal.',
      'Sombras discretas, raio de borda entre 8px e 16px e espaçamento em múltiplos de 8px.',
      'Ícones de linha consistentes (mesma família e espessura) — nada de misturar estilos.',
      'Microinterações discretas (200–300ms) em hover, foco e abertura de acordeão; respeitar `prefers-reduced-motion`.',
    ])
  );

  if (Array.isArray(ctx.identidade.referencias) && ctx.identidade.referencias.filter(Boolean).length) {
    l.push('', '**Sites de referência enviados pelo cliente (inspiração de layout, nunca cópia de conteúdo)**');
    l.push(bullets(ctx.identidade.referencias.filter(Boolean).map(texto)));
  }
  return l.join('\n');
}

/** Mapeia arquivos enviados para usos concretos no site, citando nomes reais. */
function seccaoMidias(ctx) {
  const pasta = NOME_PASTA(ctx);
  const imagens = ctx.arquivosMidias.filter((a) => !['mp4', 'mov', 'webm'].includes(a.extensao));
  const videos = ctx.arquivosMidias.filter((a) => ['mp4', 'mov', 'webm'].includes(a.extensao));
  const logos = ctx.arquivosBranding.filter((a) => /logo|marca|simbolo/i.test(a.nome) || ['png', 'svg', 'webp', 'jpg', 'jpeg'].includes(a.extensao));
  const docs = ctx.arquivosConteudo;

  const achar = (padrao) => imagens.find((i) => new RegExp(padrao, 'i').test(i.nome));

  const l = ['**Pasta do projeto**', `${pasta}/midias/ — imagens; ${pasta}/branding/ — logo e identidade; ${pasta}/conteudo/ — textos e documentos.`, ''];

  l.push('**Como usar cada arquivo**');
  const regras = [];

  if (logos.length) {
    regras.push(`**Logo:** usar \`${logos[0].nome}\` no cabeçalho (versão principal) e no rodapé. Gerar favicon a partir dele e manter área de respiro equivalente à altura da letra. Se houver versão clara e escura, usar a versão que garantir contraste no fundo do cabeçalho.`);
  } else {
    regras.push('**Logo:** não há arquivo de logo na pasta. Preencha o cabeçalho com o nome da empresa em tipografia da paleta e sinalize ao cliente sobre a necessidade do vetor.');
  }

  const banner = achar('banner|hero|capa|fachada|principal');
  if (banner) {
    regras.push(`**Banner principal (hero):** usar \`${banner.nome}\` como imagem de fundo, com sobreposição escura (40–60%) ou gradiente para garantir legibilidade do título. Usar `+'`object-fit: cover`'+` e posicionamento que preserve o assunto da foto no mobile.`);
  } else if (imagens.length) {
    regras.push(`**Banner principal (hero):** usar \`${imagens[0].nome}\` como imagem principal, aplicando sobreposição escura para o texto ficar legível. Se a foto não tiver qualidade ou enquadramento para o hero, usar um bloco de cor da paleta com o título e reservar a foto para a seção seguinte.`);
  } else {
    regras.push('**Banner principal (hero):** sem imagens enviadas. Use composição tipográfica sobre a cor principal da paleta e deixe o componente pronto para receber a foto (mesma proporção de 16:9 no desktop e 4:5 no mobile).');
  }

  if (videos.length) {
    regras.push(`**Vídeos:** ${videos.map((v) => `\`${v.nome}\``).join(', ')}. Usar no hero (autoplay, ` + '`muted`' + `, ` + '`loop`' + `, ` + '`playsinline`' + `, com poster estático) ou em bloco próprio com botão de play. Nunca iniciar com som ligado.`);
  }

  const antesDepois = imagens.filter((i) => /antes|depois|resultado/i.test(i.nome));
  if (antesDepois.length) {
    regras.push(
      `**Antes e depois / resultados:** usar ${antesDepois.map((a) => `\`${a.nome}\``).join(', ')} na seção de resultados, em pares, com legenda indicando procedimento, número de sessões e o aviso de que os resultados variam. Publicar somente com autorização de uso de imagem assinada.`
    );
  }

  if (imagens.length) {
    // O primeiro arquivo só é "consumido" pelo hero quando não existe um banner nomeado.
    const usadas = new Set([banner?.nome].filter(Boolean));
    if (!banner) usadas.add(imagens[0].nome);
    const galeria = imagens.filter((i) => !usadas.has(i.nome)).slice(0, 12);
    if (galeria.length) {
      regras.push(`**Galeria / portfólio:** usar ${galeria.map((g) => `\`${g.nome}\``).join(', ')} em grade com lightbox, legendas curtas e filtro por categoria quando houver mais de 8 itens.`);
    }
    const destaques = imagens.filter((i) => !usadas.has(i.nome)).slice(12, 18);
    if (destaques.length) {
      regras.push(`**Cards de serviço e seções internas:** distribuir ${destaques.map((d) => `\`${d.nome}\``).join(', ')} entre cards de serviço, "sobre" e depoimentos.`);
    } else {
      regras.push('**Cards de serviço e seções internas:** reaproveitar imagens do conjunto enviado, recortadas em 4:3, mantendo consistência de cor e luminosidade.');
    }
    regras.push('**Otimização obrigatória:** converter para WebP, gerar `srcset` (640/1024/1600px), aplicar `loading="lazy"` (exceto na imagem do hero) e `width`/`height` definidos para não haver salto de layout. Meta de peso: até 200 KB por imagem.');
  } else {
    regras.push('**Sem imagens próprias:** não preencher o site com banco de imagens genérico. Usar blocos de cor, ícones e espaços reservados sinalizados, e entregar uma lista do que o cliente precisa fotografar (ver seção "Materiais a solicitar").');
  }

  if (docs.length) {
    regras.push(`**Documentos de conteúdo:** \`${docs.map((d) => d.nome).join('`, `')}\` — ler integralmente antes de escrever qualquer texto do site e respeitar as informações ali contidas.`);
  }

  l.push(bullets(regras));
  l.push('');
  l.push('**Regras gerais de imagem**');
  l.push(
    bullets([
      'Nunca usar imagens de banco de imagens quando houver material próprio do cliente disponível.',
      'Toda imagem precisa de `alt` descritivo e contextualizado (ex.: "corte de cabelo feminino em camadas no salão X"), nunca "imagem1.jpg".',
      'Manter proporções consistentes por seção: hero 16:9, cards 4:3, produtos 1:1, retratos 3:4.',
      'Não distorcer nem esticar fotos; usar recorte centralizado inteligente.',
      'Comprimir antes de subir e manter os arquivos originais em `midias/` intactos.',
      'Vídeos: máximo 30s, com legenda embutida (a maioria assiste sem som).',
    ])
  );
  l.push('');
  l.push('**Tratamento quando faltar material**');
  l.push(
    bullets([
      'Sinalizar no site, com comentário no código ou bloco marcado, exatamente onde cada foto deve entrar.',
      'Nunca publicar placeholder genérico visível ao visitante final.',
      'Entregar a lista "Materiais a solicitar ao cliente" junto com o site (logo vetorial, fotos de ambiente, fotos de equipe, fotos de produto).',
    ])
  );
  return l.join('\n');
}

function seccaoLinksEcontato(ctx) {
  const { empresa, redes, endereco } = ctx;
  const tel = texto(empresa.telefone) || texto(empresa.whatsapp);
  const whats = texto(empresa.whatsapp) || texto(empresa.telefone);
  const whatsInt = telefoneInternacional(whats);

  const links = [
    redes.googleMaps ? `Google Maps: ${redes.googleMaps}` : '',
    redes.instagram ? `Instagram: ${redes.instagram}` : '',
    redes.facebook ? `Facebook: ${redes.facebook}` : '',
    redes.youtube ? `YouTube: ${redes.youtube}` : '',
    redes.pinterest ? `Pinterest: ${redes.pinterest}` : '',
    redes.tiktok ? `TikTok: ${redes.tiktok}` : '',
    redes.siteAtual ? `Site atual (referência de conteúdo a migrar): ${redes.siteAtual}` : '',
    ...ctx.linksExtras.map((l) => `${l.rotulo}: ${l.url}`),
  ].filter(Boolean);

  const l = [
    '**Dados de contato que devem aparecer no rodapé e na página de contato (idênticos em todo o site)**',
    bullets(
      [
        empresa.telefone ? `Telefone fixo: ${formatarTelefone(empresa.telefone)}` : '',
        empresa.whatsapp ? `WhatsApp: ${formatarTelefone(empresa.whatsapp)}` : '',
        !empresa.telefone && !empresa.whatsapp ? 'Telefone/WhatsApp: (não informado)' : '',
        whatsInt
          ? `Link de WhatsApp a usar em todos os botões: https://wa.me/${whatsInt} — com mensagem pré-preenchida e contextualizada por página (ex.: na home "Olá! Vim pelo site e gostaria de mais informações"; na página de ${substituirTokens('[SERVIÇO]', ctx)} "${`Olá! Vim pelo site e gostaria de informações sobre ${substituirTokens('[SERVIÇO]', ctx)}`}")`
          : '',
        empresa.email ? `E-mail: ${empresa.email}` : '',
        enderecoCompleto(ctx) ? `Endereço: ${enderecoCompleto(ctx)}` : '',
        empresa.horario ? `Horário de atendimento: ${empresa.horario}` : '',
        empresa.razaoSocial ? `Razão social (para rodapé e políticas): ${empresa.razaoSocial}` : '',
        empresa.cnpj ? `CNPJ: ${empresa.cnpj}` : '',
      ],
      '- (dados de contato ainda não informados — não inventar telefone, endereço ou e-mail)'
    ),
    '',
    '**Redes sociais e links**',
    bullets(links, '- Nenhum link informado. Criar os ícones no rodapé apenas para os canais que o cliente realmente tiver.'),
    '',
    '**Regras de aplicação dos links**',
    bullets([
      'Abrir links externos com `target="_blank"` e `rel="noopener noreferrer"`.',
      'Não usar placeholders do tipo `#` em links publicados — se o canal não existir, o ícone não aparece.',
      'Incorporar o Google Maps em `iframe` com `loading="lazy"` e `title` descritivo; oferecer também o botão "Traçar rota".',
      'Manter o mesmo NAP (nome, endereço, telefone) do Google Meu Negócio, do Instagram e do site — divergência prejudica o SEO local.',
      'Formulário de contato: enviar para ' + (empresa.email ? `${empresa.email}` : 'o e-mail do cliente') + ' e replicar no WhatsApp; incluir checkbox de consentimento LGPD com link para a política.',
    ]),
  ];

  if (ctx.linksExtras.length) {
    l.push('', '**Links adicionais informados** (exibir onde fizer sentido: rodapé, página de contato ou página específica)');
    l.push(bullets(ctx.linksExtras.map((link) => `${link.rotulo} → ${link.url}`)));
  }
  return l.join('\n');
}

function seccaoSeo(ctx) {
  const { empresa, endereco, modelo } = ctx;
  const base = modelo.conteudoPronto.seo;
  const cidade = texto(endereco.cidade) || '[CIDADE]';
  const bairro = texto(endereco.bairro);
  const nome = empresa.nomeFantasia;

  // O modelo pode usar [CIDADE], [BAIRRO], [NOME], [SERVIÇO] e [SERVIÇOS].
  // O serviço vem da lista confirmada pelo cliente (ou das sugestões do modelo),
  // para nenhum placeholder vazar no prompt entregue à IA.
  const tokens = (valor, minusculo = false) => {
    const servico = ctx.listaServicos[0]?.nome || 'nossos serviços';
    const servicos = ctx.listaServicos.map((x) => x.nome).join(', ') || 'nossos serviços';
    return texto(valor)
      .replace(/\[CIDADE\]/g, cidade)
      .replace(/\[BAIRRO\]/g, bairro || cidade)
      .replace(/\[NOME\]/g, nome)
      .replace(/\[SERVIÇOS\]/g, minusculo ? servicos.toLowerCase() : servicos)
      .replace(/\[SERVIÇO\]/g, minusculo ? servico.toLowerCase() : servico);
  };

  const palavras = (Array.isArray(ctx.conteudo.palavrasChave) ? ctx.conteudo.palavrasChave.map(texto).filter(Boolean) : [])
    .concat(base.palavrasChave || [])
    .map((p) => tokens(p, true))
    .filter((p, i, arr) => arr.indexOf(p) === i);

  const titulo = texto(ctx.conteudo.seoTitulo) || tokens(base.tituloHome);

  const descricao = texto(ctx.conteudo.seoDescricao) || tokens(base.descricaoHome);

  const servicosChave = ctx.listaServicos.slice(0, 6).map((s) => s.nome.toLowerCase());
  const paginas = modelo.paginas.filter((p) => p.obrigatoria).map((p) => p.nome);

  const l = [
    '**SEO local — aplicar obrigatoriamente**',
    '',
    '**Título e descrição da home**',
    `- Title (até 60 caracteres): \`${titulo}\``,
    `- Meta description (até 155 caracteres): \`${descricao.slice(0, 155)}\``,
    `- H1 único da home: variação do title com a cidade, sem repetir palavra-chave em excesso.`,
    '',
    '**Titles sugeridos para as páginas internas** (padrão: `[Página] | [Nome] em [Cidade]`)',
  ];

  for (const pagina of paginas) {
    l.push(`- ${pagina}: \`${pagina} | ${nome}${cidade ? ` em ${cidade}` : ''}\``);
  }

  l.push(
    '',
    '**Palavras-chave a trabalhar** (uma principal por página, as demais como secundárias no corpo do texto)',
    bullets(palavras.slice(0, 12)),
    '',
    '**Palavras-chave por serviço** (usar na página de serviços e nos textos individuais)',
    bullets(servicosChave.map((s) => `${s}${cidade ? ` em ${cidade}` : ''}`)),
    '',
    '**Palavras-chave de cauda longa** (blog e FAQ)',
    bullets([
      `quanto custa ${servicosChave[0] || 'o serviço'} em ${cidade}`,
      `onde fazer ${servicosChave[1] || servicosChave[0] || 'o serviço'} perto de ${bairro || cidade}`,
      `melhor ${ctx.modelo.termoBusca} em ${bairro || cidade}`,
      `horário de funcionamento d${ctx.modelo.genero === 'f' ? 'a' : 'o'} ${ctx.modelo.termoBusca} em ${cidade}`,
      `como escolher ${comArtigo(ctx.modelo.termoBusca, ctx.modelo.genero)} em ${cidade}`,
    ]),
    '',
    '**Dados estruturados (JSON-LD) a implementar**',
    bullets([
      `${ctx.modelo.schemaOrg || 'LocalBusiness'} com nome, endereço, telefone, geo, horário (openingHoursSpecification), preço e ` + '`aggregateRating`' + ' apenas se houver avaliações reais.',
      '`FAQPage` na página de perguntas frequentes.',
      '`BreadcrumbList` nas páginas internas.',
      '`Product` e `Offer` na loja, com preço, disponibilidade e avaliações.',
      '`Organization` com logo e perfis sociais (`sameAs`).',
    ]),
    '',
    '**Google Meu Negócio**',
    bullets([
      'Reivindicar e padronizar o perfil com o mesmo nome, endereço e telefone do site.',
      'Publicar fotos reais da fachada, interior, equipe e serviços (o perfil é a principal fonte de cliques locais).',
      'Pedir avaliação por link curto após cada atendimento e responder todas as avaliações.',
      'Incluir UTM nos botões do site que levam ao perfil para medir o retorno.',
    ]),
    '',
    '**Arquivos e configurações técnicas**',
    bullets([
      '`sitemap.xml` e `robots.txt` gerados e enviados no Google Search Console.',
      'URLs amigáveis com a palavra-chave (ex.: /servicos/limpeza-de-pele, nunca /?p=123).',
      'Canonical em todas as páginas, `lang` correto e `hreflang` apenas se houver versão em outro idioma.',
      'Open Graph e Twitter Card configurados para compartilhamento bonito no WhatsApp e no Instagram.',
      'HTTPS, redirecionamento de www e de http para a versão canônica.',
      'Página 404 com retorno de status correto e links úteis.',
    ])
  );
  return l.join('\n');
}

function seccaoTecnica(ctx) {
  const multi = Array.isArray(ctx.opcoes.paginasExtras) ? ctx.opcoes.paginasExtras.filter(Boolean) : [];
  const l = [
    '**Requisitos técnicos do site**',
    '',
    '**Desempenho (metas objetivas)**',
    bullets([
      'Nota mínima de 90 no Lighthouse em Desktop e 80 em Mobile para Performance, Acessibilidade e SEO.',
      'LCP abaixo de 2,5s e CLS abaixo de 0,1 em conexão 4G.',
      'Lazy loading em imagens/vídeos, compactação de assets e CDN para arquivos estáticos.',
      'CSS crítico inline no topo e carregamento assíncrono do restante.',
    ]),
    '',
    '**Acessibilidade (WCAG 2.1 AA)**',
    bullets([
      'Contraste mínimo de 4.5:1 em texto e 3:1 em elementos de interface.',
      'Todos os campos de formulário com `label` visível e mensagens de erro claras.',
      'Navegação completa por teclado, com foco visível e link "pular para o conteúdo".',
      'Textos alternativos em todas as imagens informativas e legendas nos vídeos.',
      'Não usar cor como único indicador de estado.',
    ]),
    '',
    '**Estrutura técnica recomendada**',
    bullets([
      'Site responsivo com breakpoints em 480, 768, 1024 e 1440px.',
      'Páginas renderizadas no servidor ou pré-renderizadas (bom para SEO local).',
      'CMS simples para o cliente editar textos, serviços, preços, horários, posts e produtos.',
      'Formulário com proteção anti-spam (honeypot + reCAPTCHA invisível) e envio por e-mail + WhatsApp.',
      'Painel administrativo protegido com 2FA e backups automáticos semanais.',
      'Ambiente de homologação separado da produção.',
    ]),
    '',
    '**Conformidade**',
    bullets([
      'LGPD: política de privacidade, banner de cookies, consentimento explícito nos formulários e dados sensíveis com tratamento restrito.',
      'Termos de uso quando houver venda online ou área do cliente.',
      'Rodapé com razão social e CNPJ quando exigido pelo segmento.',
      'Conteúdo em conformidade com as regras publicitárias da profissão (ver seção de cuidados).',
    ]),
    '',
    '**Integrações obrigatórias no lançamento**',
    bullets(['Google Analytics 4 com eventos de conversão', 'Google Search Console', 'Google Meu Negócio', 'Meta Pixel', 'WhatsApp Business (link e resposta rápida configurados)']),
    '',
    `**Idioma do site:** ${texto(ctx.empresa.idioma) || 'Português (Brasil)'}`,
  ];
  if (multi.length) {
    l.push('', '**Páginas extras solicitadas e não previstas no modelo**');
    l.push(bullets(multi));
  }
  return l.join('\n');
}

function seccaoCuidados(ctx) {
  const cuidados = ctx.modelo.cuidados || [];
  const extras = Array.isArray(ctx.opcoes.cuidadosExtras) ? ctx.opcoes.cuidadosExtras.filter(Boolean).map(texto) : [];
  const l = [
    '**Regras de comunicação e conformidade deste segmento — não violar**',
    bullets([...cuidados, ...extras]),
  ];
  return l.join('\n');
}

function seccaoAceite(ctx) {
  const paginas = paginasAtivas(ctx).map((p) => p.nome);

  const listaAceite = [
    `Todas as páginas obrigatórias implementadas e acessíveis pelo menu: ${paginas.join(', ')}.`,
    'Nenhum texto placeholder, "lorem ipsum" ou imagem de exemplo publicada.',
    'NAP (nome, endereço, telefone) idêntico em todas as páginas e igual ao Google Meu Negócio.',
    'Links de WhatsApp e telefone testados em Android e iPhone.',
    'Formulários testados de ponta a ponta, com mensagem de sucesso e de erro.',
    'SEO: title, description, H1 único, alt em imagens, sitemap e robots publicados.',
    'Dados estruturados validados no Rich Results Test, sem erros.',
    'Lighthouse com as notas mínimas definidas na seção técnica.',
    'Testado nos navegadores Chrome, Safari e Firefox (últimas 2 versões) e em telas de 360px a 1920px.',
    'Política de privacidade publicada e linkada no rodapé e nos formulários.',
    'GA4 e Pixel disparando os eventos de conversão configurados.',
    'Backup, acesso ao CMS e treinamento de uso entregues ao cliente.',
  ];
  if (ctx.temEcommerce) {
    listaAceite.splice(4, 0, 'Fluxo de compra testado com pedido real de baixo valor: carrinho, frete, pagamento, confirmação e rastreio.');
  }

  const materiais = [
    'Logo em vetor (SVG/AI/PDF) — se o cliente só tiver PNG, solicitar o vetor.',
    'Fotos próprias em alta resolução (mínimo 1600px de largura): fachada, ambiente, equipe e serviços/produtos.',
    'Vídeos curtos (opcional), em boa luz e sem áudio obrigatório.',
    'Depoimentos reais com nome e autorização de uso.',
    'Lista de preços atualizada (ou definição de "consultar valores").',
    texto(ctx.empresa.horario) ? '' : 'Horário de atendimento por dia da semana, incluindo feriados.',
    'Acesso ao perfil do Google Meu Negócio e às redes sociais.',
    'Dados para nota fiscal e política de trocas, no caso da loja.',
  ].filter(Boolean);

  const l = [
    '**Checklist de aceite — o trabalho só é considerado entregue quando todos os itens estiverem marcados**',
    bullets(listaAceite),
    '',
    '**Materiais a solicitar ao cliente, caso ainda não estejam na pasta**',
    bullets(materiais),
    '',
    '**Entregue junto com o site**',
    bullets([
      'Documento de orientação para o cliente (como editar textos, produtos e horários no CMS).',
      'Relatório de SEO inicial: palavras-chave, title/description aplicados e checklist do Google Meu Negócio.',
      'Acessos e credenciais organizados e entregues em local seguro (nunca por WhatsApp ou e-mail em texto aberto).',
      'Recomendação de rotina de manutenção: publicar 1 a 2 conteúdos por mês e revisar preços a cada trimestre.',
    ]),
  ];
  return l.join('\n');
}

function seccaoNaoFazer(ctx) {
  const itens = [
    'Não inventar informações: telefone, endereço, preços, prazos, certificações, prêmios, número de clientes ou depoimentos.',
    'Não usar textos genéricos de "empresa séria e comprometida com a qualidade" — escreva o que a empresa realmente faz.',
    'Não copiar layout, textos ou imagens de sites de concorrentes.',
    'Não usar banco de imagens quando houver material próprio; nunca usar imagem com marca d\'água.',
    'Não colocar carrossel automático no topo que troca de slide rápido (ruim para conversão e acessibilidade).',
    'Não esconder informações essenciais (preço, endereço, horário) atrás de menus distantes.',
    'Não usar CAPS LOCK em títulos, nem fontes decorativas no corpo do texto.',
    'Não publicar o site com links `href="#"`, formulários não testados ou página 404 genérica do servidor.',
    'Não deixar o site dependente de um único canal (só Instagram não basta — o objetivo do site é ser a base própria do negócio).',
    'Não exceder duas famílias tipográficas nem mais de 5 cores principais.',
  ];
  if (ctx.temEcommerce) {
    itens.push('Não esconder o frete ou o prazo até a última etapa do checkout.');
    itens.push('Não deixar o cadastro obrigatório antes de o cliente ver o preço final.');
  }
  return ['**O que NÃO fazer em nenhum caso**', bullets(itens)].join('\n');
}

/* ------------------------------------------------------------------ *
 * Montagem final
 * ------------------------------------------------------------------ */

/**
 * Gera o prompt completo.
 * @param {object} entrada dados do cliente (ver seccaoFicha / README)
 * @param {object} arquivos { midias, branding, conteudo } com { nome, extensao }
 * @returns {{texto: string, meta: object}}
 */
function gerarPrompt(entrada = {}, arquivos = {}) {
  const ctx = prepararContexto(entrada, arquivos);
  const { empresa, modelo } = ctx;
  const pasta = NOME_PASTA(ctx);

  const objetivoNome = (OBJETIVOS.find((o) => o.id === ctx.objetivoPrincipal) || {}).nome || ctx.objetivoPrincipal;
  const cidade = texto(ctx.endereco.cidade);
  const tel = formatarTelefone(texto(empresa.telefone) || texto(empresa.whatsapp));

  const secoes = [];
  const empurrar = (titulo, corpo) => {
    if (temTexto(corpo)) secoes.push({ titulo, corpo: String(corpo).trim() });
  };

  empurrar('FICHA DO PROJETO', seccaoFicha(ctx));
  empurrar(
    '1. PAPEL E MISSÃO',
    [
      'Você é um **designer e desenvolvedor web sênior**, especializado em sites para o setor de ' + setorDoModelo(modelo) + ', com forte domínio de SEO local, conversão, acessibilidade e performance.',
      '',
      `Sua missão: **criar (ou reformular) o site de "${empresa.nomeFantasia}"${cidade ? `, em ${cidade}` : ''}**, ${comArtigo(modelo.termoBusca, modelo.genero)}, entregando estrutura, conteúdo e design prontos para publicação.`,
      '',
      '**Entregáveis esperados nesta rodada**',
      bulletsNumerados([
        'Mapa do site e wireframe textual de cada página (seções na ordem em que aparecem).',
        'Textos finais aplicados, prontos para copiar — sem placeholders.',
        'Direção visual: paleta aplicada, tipografia, componentes e estados de interação.',
        'Código responsivo e acessível, com os dados estruturados e o SEO on-page configurados.',
        'Lista do que ficou pendente de material do cliente.',
      ]),
      '',
      '**Como responder**',
      bullets([
        'Antes de produzir, apresente em até 10 linhas o seu plano de execução (estrutura + direção visual) para validação.',
        'Depois, entregue na ordem: wireframe → textos → design → código.',
        'Quando faltar informação, use a decisão mais coerente com o segmento e **sinalize a suposição** no final, na lista de pendências. Nunca invente dados factuais.',
      ]),
    ].join('\n')
  );

  empurrar('2. ARQUIVOS DE APOIO DO PROJETO', seccaoArquivos(ctx));
  empurrar('3. DESCRIÇÃO DO NEGÓCIO', seccaoNegocio(ctx));
  empurrar('4. PÚBLICO-ALVO', seccaoPublico(ctx));
  empurrar('5. OBJETIVO DO SITE', seccaoObjetivo(ctx));
  empurrar('6. ESTRUTURA DE PÁGINAS E SEÇÕES', seccaoPaginas(ctx));
  empurrar('7. FUNCIONALIDADES E INTEGRAÇÕES', seccaoFuncionalidades(ctx));
  empurrar('8. CONTEÚDO E COPY SUGERIDA', seccaoConteudo(ctx));
  empurrar('9. TOM DE VOZ E COMUNICAÇÃO', seccaoTomDeVoz(ctx));
  empurrar('10. ESTILO VISUAL E IDENTIDADE DA MARCA', seccaoIdentidadeVisual(ctx));
  empurrar('11. USO DAS IMAGENS E VÍDEOS ANEXADOS', seccaoMidias(ctx));
  empurrar('12. LINKS, REDES SOCIAIS E DADOS DE CONTATO', seccaoLinksEcontato(ctx));
  empurrar('13. SEO BÁSICO E LOCAL', seccaoSeo(ctx));
  empurrar('14. REQUISITOS TÉCNICOS, LGPD E ACESSIBILIDADE', seccaoTecnica(ctx));
  empurrar('15. CUIDADOS ESPECÍFICOS DO SEGMENTO', seccaoCuidados(ctx));
  empurrar('16. O QUE EVITAR', seccaoNaoFazer(ctx));
  empurrar('17. CRITÉRIOS DE ACEITE E MATERIAIS PENDENTES', seccaoAceite(ctx));

  const observacoes = texto(ctx.opcoes.observacoesOperador);
  if (observacoes) empurrar('18. OBSERVAÇÕES DO OPERADOR', observacoes);

  const cabecalho = [
    '# PROMPT PARA CRIAÇÃO DO SITE',
    `## ${empresa.nomeFantasia}${cidade ? ` — ${cidade}` : ''} | ${modelo.nome}`,
    '',
    `> Documento gerado pelo sistema Magic Prompt a partir do modelo "${modelo.nome}" (${modelo.id}) e dos dados preenchidos para este cliente.`,
    `> **Objetivo declarado do site:** ${objetivoNome}${ctx.temEcommerce ? ' + loja online' : ''}.`,
    `> Cole este prompt integralmente na ferramenta de IA de criação de sites e anexe a pasta \`${pasta}/\` com as mídias e o conteúdo.`,
    '',
    '---',
    '',
  ].join('\n');

  const rodape = [
    '',
    '---',
    '',
    '## RESUMO PARA COLAR NO CHAT (versão curta)',
    gerarPromptResumo(entrada, arquivos),
  ].join('\n');

  const corpo = secoes.map((s) => `\n## ${s.titulo}\n\n${s.corpo}\n`).join('');
  const conteudoFinal = `${cabecalho}${corpo}${rodape}`;

  const avisos = [];
  if (ctx.faltando.length) {
    avisos.push(`Campos não preenchidos: ${ctx.faltando.join(', ')}. O prompt usa as sugestões do modelo nesses pontos.`);
  }
  if (!ctx.depoimentos.length) avisos.push('Sem depoimentos reais enviados — a seção fica preparada, mas os textos não foram inventados.');
  if (!ctx.arquivosMidias.length) avisos.push('Nenhuma mídia enviada — as instruções de imagem pedem placeholders e uma lista de fotos a solicitar.');

  return {
    texto: conteudoFinal,
    meta: {
      versao: VERSAO,
      segmento: modelo.id,
      nomeSegmento: modelo.nome,
      objetivo: ctx.objetivoPrincipal,
      objetivoNome,
      ecommerce: ctx.temEcommerce,
      pasta,
      paginas: paginasAtivas(ctx).map((p) => p.nome),
      totalSecoes: secoes.length + 2,
      caracteres: conteudoFinal.length,
      palavras: conteudoFinal.split(/\s+/).filter(Boolean).length,
      tokensAproximados: Math.ceil(conteudoFinal.length / 4),
      faltando: ctx.faltando,
      avisos,
      arquivos: {
        midias: ctx.arquivosMidias.length,
        branding: ctx.arquivosBranding.length,
        conteudo: ctx.arquivosConteudo.length,
      },
      geradoEm: new Date().toISOString(),
    },
  };
}

/** Versão curta, para colar direto em chats com limite de caracteres. */
function gerarPromptResumo(entrada = {}, arquivos = {}) {
  const ctx = prepararContexto(entrada, arquivos);
  const { empresa, modelo } = ctx;
  const pasta = NOME_PASTA(ctx);
  const cidade = texto(ctx.endereco.cidade);
  const objetivoNome = (OBJETIVOS.find((o) => o.id === ctx.objetivoPrincipal) || {}).nome;

  const paginas = paginasAtivas(ctx).map((p) => p.nome);

  const servicos = ctx.listaServicos.slice(0, 8).map((s) => s.nome);
  const cores = ctx.cores.map((c) => c.hex || c.nome).filter(Boolean).slice(0, 5);
  const paletaFallback = (modelo.estiloVisual.paletas[0]?.cores || []).map((c) => `${c.hex} (${c.nome})`).slice(0, 5);

  const partes = [
    `Crie o site de "${empresa.nomeFantasia}"${cidade ? ` (${cidade}${ctx.endereco.bairro ? `, ${ctx.endereco.bairro}` : ''})` : ''} — ${modelo.nome.toLowerCase()}.`,
    `Descrição: ${texto(ctx.negocio.descricao) || modelo.descricaoNegocioPadrao}.`,
    `Público-alvo: ${(texto(ctx.negocio.publicoAlvo) || modelo.publicoAlvoPadrao).split('.')[0]}.`,
    `Objetivo do site: ${objetivoNome}${ctx.temEcommerce ? ' + e-commerce' : ''}.`,
    `Serviços: ${servicos.join(', ')}.`,
    `Páginas: ${paginas.join(', ')}.`,
    `Funcionalidades: ${modelo.funcionalidades.essenciais.slice(0, ctx.temEcommerce ? 8 : 6).join(', ')}${ctx.temEcommerce ? ', carrinho e checkout com Pix, cartão e frete por CEP' : ''}.`,
    `Tom de voz: ${modelo.tomDeVoz.personalidade.join(', ')}.`,
    `Estilo visual: ${texto(ctx.identidade.estilo) || modelo.estiloVisual.estilos.join(', ')} (${modelo.estiloVisual.estilos.join(', ')}).`,
    `Cores: ${(cores.length ? cores : paletaFallback).join(', ')}.`,
    ctx.arquivosBranding.length || ctx.arquivosMidias.length
      ? `Use os arquivos da pasta ${pasta}/ (logo em branding/, imagens e vídeos em midias/, textos em conteudo/) — não invente mídias nem dados.`
      : `Não há mídias enviadas: use placeholders elegantes e liste o que precisa ser fotografado.`,
    `SEO local: title "${texto(ctx.conteudo.seoTitulo) || substituirTokens(modelo.conteudoPronto.seo.tituloHome, ctx)}", palavras-chave com foco em "${substituirTokens(modelo.conteudoPronto.seo.palavrasChave[0], ctx)}" e dados estruturados ${modelo.schemaOrg || 'LocalBusiness'}.`,
    `Contato: ${[formatarTelefone(texto(empresa.telefone) || texto(empresa.whatsapp)), texto(empresa.email), ctx.redes.instagram].filter(Boolean).join(' | ') || 'informar ao cliente'}.`,
    'Não invente informações, preços, avaliações ou depoimentos.',
  ];
  return partes.map((p) => `- ${p}`).join('\n');
}

/** Lista os campos que faltam, sem gerar prompt (usada na validação do formulário). */
function validarDados(entrada = {}, arquivos = {}) {
  const erros = [];
  const segmento = texto(entrada.segmento);
  if (!segmento) {
    erros.push({ campo: 'segmento', mensagem: 'Escolha o segmento de atuação.' });
  } else if (!getModelo(segmento)) {
    erros.push({ campo: 'segmento', mensagem: `Segmento "${segmento}" não existe. Escolha um dos modelos disponíveis.` });
  }
  if (!temTexto(entrada.empresa?.nomeFantasia)) {
    erros.push({ campo: 'empresa.nomeFantasia', mensagem: 'Informe o nome fantasia da empresa.' });
  }
  const empresa = entrada.empresa || {};
  if (!texto(empresa.whatsapp) && !texto(empresa.telefone) && !texto(empresa.email)) {
    erros.push({ campo: 'empresa.whatsapp', mensagem: 'Informe ao menos um contato: WhatsApp/telefone ou e-mail.' });
  }

  // Só monta o contexto (e a lista de pendências) quando já dá para gerar.
  if (erros.length || arquivos === null) return { ok: erros.length === 0, erros, faltando: [], contexto: null };
  const contexto = prepararContexto(entrada, arquivos);
  return { ok: erros.length === 0, erros, faltando: contexto.faltando, contexto };
}

module.exports = {
  gerarPrompt,
  gerarPromptResumo,
  validarDados,
  /** Contexto normalizado (dados + modelo do segmento) usado pelos arquivos de apoio. */
  obterContexto: prepararContexto,
  /** Páginas efetivamente ativas depois das escolhas do operador. */
  paginasAtivas,
  VERSAO,
};
  };

  REGISTRO['pacote'] = function (module, exports, require) {
'use strict';

/**
 * MONTAGEM DA PASTA DO CLIENTE
 * ----------------------------
 * Além do `prompt_site.txt`, o sistema gera os arquivos de apoio que tornam a
 * pasta utilizável na ferramenta de criação de sites:
 *
 *   nome_cliente_nome_empresa/
 *   ├── LEIA-ME.txt
 *   ├── prompt_site.txt
 *   ├── dados-cliente.json
 *   ├── prompt_resumo.txt
 *   ├── midias/      (arquivos enviados)
 *   ├── branding/    (logo enviado + identidade-visual.md)
 *   └── conteudo/    (textos, depoimentos, faq, seo, checklist)
 */

const { texto, temTexto, juntar, dataLegivel } = require('./utils');
const { gerarPromptResumo, obterContexto } = require('./prompt-engine');

/* ------------------------- Arquivos de conteúdo ------------------------- */

function arquivoLeiaMe(ctx, meta) {
  const pasta = meta.pasta;
  return `COMO USAR ESTA PASTA
====================

Projeto: ${ctx.empresa.nomeFantasia}${ctx.endereco.cidade ? ` — ${ctx.endereco.cidade}/${ctx.endereco.estado || ''}` : ''}
Segmento: ${meta.nomeSegmento}
Gerado em: ${dataLegivel(meta.geradoEm)}
Pasta do cliente: ${pasta}

1) O arquivo principal é o prompt_site.txt. Copie o conteúdo integral e cole na
   ferramenta de IA que vai criar o site.

2) Anexe (ou envie junto) os arquivos das pastas:
   - midias/    imagens e vídeos que devem aparecer no site
   - branding/  logo, paleta de cores e referências visuais
   - conteudo/  textos, depoimentos e FAQ

3) Se a ferramenta limitar o tamanho da mensagem, use o arquivo
   prompt_resumo.txt (versão curta) e depois complemente com as seções do
   prompt completo conforme a ferramenta pedir.

4) dados-cliente.json guarda tudo o que foi preenchido no formulário. Use-o para
   reabrir este cliente no sistema e gerar uma nova versão do prompt quando
   alguma informação mudar.

5) Pendências registradas nesta geração:
${(meta.faltando || []).length ? meta.faltando.map((f) => `   - ${f}`).join('\n') : '   - nenhuma: todos os campos relevantes foram preenchidos.'}

Dúvidas sobre o que pedir ao cliente? Veja conteudo/checklist-entrega.md.
`;
}

function arquivoTextos(ctx) {
  const linhas = [
    `# Textos — ${ctx.empresa.nomeFantasia}`,
    '',
    'Este arquivo reúne o que o cliente enviou e o que ainda precisa ser escrito.',
    'O prompt (prompt_site.txt) já instrui a IA a produzir os textos que faltam.',
    '',
    '## Textos enviados pelo cliente',
    '',
    texto(ctx.conteudo.textos) || '_Nenhum texto enviado. A IA deve redigir todo o conteúdo seguindo o tom de voz do prompt._',
    '',
    '## Estrutura de textos a produzir',
    '',
    '| Página | Bloco | Limite sugerido |',
    '| --- | --- | --- |',
    '| Home | Headline | até 8 palavras |',
    '| Home | Subheadline | 1 frase, até 20 palavras |',
    '| Home | Chamadas dos blocos | 1 linha por bloco |',
    '| Serviços | Descrição por serviço | 3 a 5 linhas |',
    '| Sobre | História e propósito | 300 a 500 palavras |',
    '| Contato | Instruções de chegada | 2 a 4 linhas |',
    '| Rodapé | Descrição curta | até 25 palavras |',
    '',
    '## Serviços/produtos do cliente',
    '',
    ctx.listaServicos.length
      ? ctx.listaServicos
          .map((s) =>
            juntar([`- **${s.nome}**`, s.descricao || '', s.duracao ? `(${s.duracao})` : '', s.preco ? `— ${s.preco}` : ''], ' ')
          )
          .join('\n')
      : '_Não informados. Usar a lista sugerida no prompt._',
    '',
    '## Diferenciais',
    '',
    (ctx.diferenciais.length ? ctx.diferenciais : ctx.modelo.conteudoPronto.diferenciais).map((d) => `- ${d}`).join('\n'),
    '',
  ];
  if (temTexto(ctx.conteudo.observacoes)) {
    linhas.push('## Observações do cliente sobre o conteúdo', '', texto(ctx.conteudo.observacoes), '');
  }
  return linhas.join('\n');
}

function arquivoDepoimentos(ctx) {
  const linhas = [
    `# Depoimentos — ${ctx.empresa.nomeFantasia}`,
    '',
    ctx.depoimentos.length
      ? 'Depoimentos reais enviados pelo cliente (usar exatamente estes textos):'
      : 'O cliente não enviou depoimentos. **Não invente.** Colete avaliações reais no Google e peça autorização de uso.',
    '',
  ];
  if (ctx.depoimentos.length) {
    ctx.depoimentos.forEach((d, i) => {
      linhas.push(`## Depoimento ${i + 1}`, `> "${d.texto}"`, '', `- Autoria: ${d.nome || '(pedir autorização e nome ao cliente)'}`, d.nota ? `- Nota: ${d.nota}` : '', '');
    });
  } else {
    linhas.push(
      'Como coletar:',
      '1. Peça avaliação no Google Meu Negócio logo após o atendimento (link curto no WhatsApp).',
      '2. Peça ao cliente o print ou a cópia do depoimento por escrito.',
      '3. Registre a autorização de uso de nome, texto e foto.',
      '',
      'Sugestões de temas para pedir depoimento (não são depoimentos prontos):',
      '- Como foi o atendimento e a pontualidade.',
      '- Como o resultado atendeu à expectativa.',
      '- O que faria indicar a empresa a um amigo.',
      ''
    );
  }
  return linhas.filter((l) => l !== '').join('\n');
}

function arquivoFaq(ctx) {
  const faq = ctx.faq.length ? ctx.faq : ctx.modelo.conteudoPronto.faq;
  const origem = ctx.faq.length ? 'enviadas pelo cliente' : 'sugeridas pelo modelo do segmento (validar as respostas com o cliente)';
  const linhas = [
    `# Perguntas frequentes — ${ctx.empresa.nomeFantasia}`,
    '',
    `Perguntas ${origem}:`,
    '',
  ];
  faq.forEach((f, i) => {
    linhas.push(`${i + 1}. **${f.pergunta}**`, `   ${f.resposta || '(resposta a validar com o cliente)'}`, '');
  });
  linhas.push(
    'Boas práticas:',
    '- Resposta de até 3 frases, começando pela informação principal.',
    '- Se a pergunta for sobre preço, explique o que faz o valor variar e ofereça o contato direto.',
    '- Marcar a página como FAQPage (schema.org) para aparecer nos resultados do Google.',
    ''
  );
  return linhas.join('\n');
}

function arquivoSeo(ctx) {
  const cidade = texto(ctx.endereco.cidade) || '[cidade]';
  const bairro = texto(ctx.endereco.bairro);
  const base = ctx.modelo.conteudoPronto.seo;
  const palavras = (Array.isArray(ctx.conteudo.palavrasChave) ? ctx.conteudo.palavrasChave.map(texto).filter(Boolean) : [])
    .concat(base.palavrasChave)
    .map((p) => p.replace(/\[CIDADE\]/g, cidade).replace(/\[BAIRRO\]/g, bairro || cidade));
  const unicas = palavras.filter((p, i, a) => a.indexOf(p) === i);

  return [
    `# SEO — ${ctx.empresa.nomeFantasia}`,
    '',
    '## Title e description da home',
    '',
    `- Title: \`${(texto(ctx.conteudo.seoTitulo) || base.tituloHome.replace(/\[NOME\]/g, ctx.empresa.nomeFantasia).replace(/\[CIDADE\]/g, cidade)).slice(0, 60)}\``,
    `- Description: \`${(texto(ctx.conteudo.seoDescricao) || base.descricaoHome.replace(/\[NOME\]/g, ctx.empresa.nomeFantasia).replace(/\[CIDADE\]/g, cidade)).slice(0, 155)}\``,
    '',
    '## Palavras-chave',
    '',
    unicas.slice(0, 20).map((p) => `- ${p}`).join('\n'),
    '',
    '## Palavras-chave por serviço',
    '',
    ctx.listaServicos.map((s) => `- ${s.nome.toLowerCase()} em ${cidade}`).join('\n'),
    '',
    '## Google Meu Negócio',
    '',
    '- Nome do perfil igual ao nome fantasia do site (sem palavras-chave extras).',
    '- Endereço e telefone idênticos ao rodapé do site.',
    '- Categoria principal + categorias secundárias conforme os serviços.',
    '- Fotos reais (fachada, interior, equipe, serviços) publicadas mensalmente.',
    '- Link curto de avaliação enviado ao cliente após cada atendimento.',
    '',
    '## Checklist técnico de SEO',
    '',
    '- [ ] Title e description únicos por página',
    '- [ ] Um único H1 por página, com a palavra-chave principal',
    '- [ ] Alt descritivo em todas as imagens',
    '- [ ] URLs amigáveis e em minúsculas',
    '- [ ] sitemap.xml e robots.txt publicados e enviados ao Search Console',
    '- [ ] Dados estruturados LocalBusiness + FAQPage validados',
    '- [ ] Open Graph com imagem 1200x630',
    '- [ ] HTTPS e redirecionamento de www',
    '',
  ].join('\n');
}

function arquivoChecklist(ctx, meta) {
  return [
    `# Checklist de entrega — ${ctx.empresa.nomeFantasia}`,
    '',
    '## Antes de publicar',
    '',
    '- [ ] Todos os textos revisados (sem placeholder e sem "lorem ipsum")',
    '- [ ] Telefone, WhatsApp e e-mail testados em celular e desktop',
    '- [ ] Endereço confere com o Google Maps e com o Google Meu Negócio',
    '- [ ] Horários atualizados, incluindo feriados',
    '- [ ] Formulários enviando e com mensagem de sucesso configurada',
    '- [ ] Política de Privacidade publicada e linkada no rodapé',
    '- [ ] Imagens comprimidas e com alt',
    '- [ ] Teste em Chrome, Safari e Firefox; telas de 360px a 1920px',
    '- [ ] GA4 e Meta Pixel disparando os eventos de conversão',
    '- [ ] Backup e acessos documentados',
    '',
    '## Materiais a solicitar ao cliente',
    '',
    '- [ ] Logo em vetor (SVG/AI/PDF)',
    '- [ ] Fotos próprias em alta resolução (fachada, ambiente, equipe, serviços/produtos)',
    '- [ ] Depoimentos reais com autorização de uso',
    '- [ ] Textos institucionais (história, missão, diferenciais)',
    '- [ ] Lista de preços atualizada ou decisão de manter "consultar valores"',
    '- [ ] Acesso ao perfil do Google Meu Negócio e às redes sociais',
    '',
    '## Pendências registradas nesta geração',
    '',
    (meta.faltando || []).length ? meta.faltando.map((f) => `- [ ] ${f}`).join('\n') : '- Nenhuma pendência de cadastro.',
    '',
    '## Objetivo declarado do site',
    '',
    `- ${meta.objetivoNome}`,
    `- Segmento: ${meta.nomeSegmento}`,
    `- E-commerce nesta versão: ${meta.ecommerce ? 'sim' : 'não'}`,
    '',
  ].join('\n');
}

function arquivoIdentidadeVisual(ctx) {
  const v = ctx.modelo.estiloVisual;
  const cores = ctx.cores.length ? ctx.cores : v.paletas[0].cores;
  const linhas = [
    `# Identidade visual — ${ctx.empresa.nomeFantasia}`,
    '',
    `Estilo desejado: ${texto(ctx.identidade.estilo) || v.estilos[0] + ' (sugestão do modelo)'}`,
    '',
    '## Paleta de cores',
    '',
    '| Cor | Hex | Uso sugerido |',
    '| --- | --- | --- |',
    ...cores.map((c, i) => `| ${c.nome || `Cor ${i + 1}`} | ${c.hex || 'a definir'} | ${['Fundo/base', 'Secundária', 'Destaque e CTA', 'Texto', 'Apoio'][i] || 'Apoio'} |`),
    '',
    'Observação: manter contraste mínimo de 4.5:1 entre texto e fundo (WCAG AA).',
    '',
    '## Tipografia',
    '',
    `- Títulos: ${v.tipografia.titulos}`,
    `- Corpo: ${v.tipografia.corpo}`,
    '- Escala: H1 40–56px / H2 28–36px / corpo 16–18px / legenda 14px',
    '- Carregar no máximo 2 famílias e apenas os pesos utilizados',
    '',
    '## Ícones e imagens',
    '',
    '- Ícones de linha, mesma família e espessura em todo o site.',
    '- Fotos em boa luz, sem filtros pesados; proporções consistentes (16:9 hero, 4:3 cards, 1:1 produtos, 3:4 retratos).',
    '',
    '## Referências de estilo enviadas pelo cliente',
    '',
  ];
  const refs = (Array.isArray(ctx.identidade.referencias) ? ctx.identidade.referencias : []).filter(Boolean).map(texto);
  linhas.push(refs.length ? refs.map((r) => `- ${r}`).join('\n') : '- Nenhuma referência enviada.');
  linhas.push('');
  if (temTexto(ctx.identidade.observacoes)) {
    linhas.push('## Observações do cliente', '', texto(ctx.identidade.observacoes), '');
  }
  linhas.push(
    '## Checklist de marca',
    '',
    '- [ ] Logo em vetor disponível',
    '- [ ] Versões do logo (colorida, branca, preta) e área de respiro definida',
    '- [ ] Paleta oficial validada pelo cliente',
    '- [ ] Tipografia licenciada ou gratuita definida',
    '- [ ] Favicon gerado',
    ''
  );
  return linhas.join('\n');
}

/* ----------------------------- API pública ----------------------------- */

/** Mapa { caminhoRelativo: conteudoTexto } dos arquivos de apoio. */
function gerarArquivosDeApoio(entrada, arquivos, meta) {
  // Reaproveita o contexto já normalizado pelo motor de prompt.
  const ctx = obterContexto(entrada, arquivos);
  return {
    'LEIA-ME.txt': arquivoLeiaMe(ctx, meta),
    'prompt_resumo.txt': gerarPromptResumo(entrada, arquivos),
    'conteudo/textos.md': arquivoTextos(ctx),
    'conteudo/depoimentos.md': arquivoDepoimentos(ctx),
    'conteudo/faq.md': arquivoFaq(ctx),
    'conteudo/seo-palavras-chave.md': arquivoSeo(ctx),
    'conteudo/checklist-entrega.md': arquivoChecklist(ctx, meta),
    'branding/identidade-visual.md': arquivoIdentidadeVisual(ctx),
  };
}

/** Resumo textual (para a interface) do que existe na pasta do cliente. */
function resumoPasta(meta) {
  return [
    `${meta.pasta}/`,
    '├── prompt_site.txt',
    '├── prompt_resumo.txt',
    '├── LEIA-ME.txt',
    '├── dados-cliente.json',
    '├── midias/',
    '├── branding/',
    '│   └── identidade-visual.md',
    '└── conteudo/',
    '    ├── textos.md',
    '    ├── depoimentos.md',
    '    ├── faq.md',
    '    ├── seo-palavras-chave.md',
    '    └── checklist-entrega.md',
  ].join('\n');
}

module.exports = { gerarArquivosDeApoio, resumoPasta };
  };

  REGISTRO['zip'] = function (module, exports, require) {
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
  };

  /* --------------------- Carregador CommonJS mínimo --------------------- */
  var CACHE = {};
  function normalizar(id) {
    return String(id).replace(/^\.\//, '').replace(/\.js$/, '');
  }
  function requireLocal(id) {
    var nome = normalizar(id);
    if (CACHE[nome]) return CACHE[nome].exports;
    var fabrica = REGISTRO[nome] || MODULOS_NATIVOS[nome];
    if (!fabrica) throw new Error('Módulo não encontrado no bundle: ' + id);
    var modulo = { exports: {} };
    CACHE[nome] = modulo;
    fabrica(modulo, modulo.exports, requireLocal);
    return modulo.exports;
  }
  global.MagicPromptRequire = requireLocal;

  /* --------------------------- Exportações --------------------------- */
  var require = requireLocal;
/* =====================================================================
   Exportação dos módulos do motor para uso no navegador.
   Executado no fim do bundle gerado por scripts/build-pagina.js.
   ===================================================================== */
const segmentos = require('./segmentos');
const promptEngine = require('./prompt-engine');
const pacote = require('./pacote');
const zip = require('./zip');
const utils = require('./utils');

globalThis.MagicPromptMotor = {
  versao: promptEngine.VERSAO,

  // modelos e catálogos
  MODELOS: segmentos.MODELOS,
  OBJETIVOS: segmentos.OBJETIVOS,
  ESTILOS_DESEJADOS: segmentos.ESTILOS_DESEJADOS,
  IDIOMAS: segmentos.IDIOMAS,
  listarModelos: segmentos.listarModelos,
  getModelo: segmentos.getModelo,
  sugestoesDoModelo: segmentos.sugestoesDoModelo,

  // geração
  gerarPrompt: promptEngine.gerarPrompt,
  gerarPromptResumo: promptEngine.gerarPromptResumo,
  validarDados: promptEngine.validarDados,
  paginasAtivas: promptEngine.paginasAtivas,
  gerarArquivosDeApoio: pacote.gerarArquivosDeApoio,
  resumoPasta: pacote.resumoPasta,

  // empacotamento e utilidades
  ZipWriter: zip.ZipWriter,
  Buffer: globalThis.Buffer,
  utils,
};

})(typeof globalThis !== 'undefined' ? globalThis : window);
