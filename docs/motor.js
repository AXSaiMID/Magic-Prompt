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
 * MODELOS
 * ------------------------------------------------------------------ */

const MODELOS = [
  /* ============================== 1. ESTÉTICA ============================== */
  {
    id: 'estetica',
    nome: 'Centro de Estética e Beleza',
    emoji: '✨',
    area: 'Estética',
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
    area: 'Pet / Saúde Animal',
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
    area: 'Saúde Animal',
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
    totalPaginas: m.paginas.filter((p) => p.obrigatoria).length,
    paginasObrigatorias: m.paginas.filter((p) => p.obrigatoria).map((p) => p.nome),
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
  const menuObrigatorio = paginas.filter((p) => p.obrigatoria).map((p) => p.nome);

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

  const palavras = (Array.isArray(ctx.conteudo.palavrasChave) ? ctx.conteudo.palavrasChave.map(texto).filter(Boolean) : [])
    .concat(base.palavrasChave || [])
    .map((p) => p.replace(/\[CIDADE\]/g, cidade).replace(/\[BAIRRO\]/g, bairro || cidade))
    .filter((p, i, arr) => arr.indexOf(p) === i);

  const titulo = texto(ctx.conteudo.seoTitulo) || base.tituloHome
    .replace(/\[NOME\]/g, nome)
    .replace(/\[CIDADE\]/g, cidade);

  const descricao = texto(ctx.conteudo.seoDescricao) || base.descricaoHome
    .replace(/\[NOME\]/g, nome)
    .replace(/\[CIDADE\]/g, cidade);

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
      `melhor ${ctx.modelo.nome.toLowerCase()} em ${bairro || cidade}`,
      `horário de funcionamento de ${ctx.modelo.nome.toLowerCase()} em ${cidade}`,
    ]),
    '',
    '**Dados estruturados (JSON-LD) a implementar**',
    bullets([
      `\`LocalBusiness\` (subtipo mais específico: ${ctx.modelo.id === 'barbearia' || ctx.modelo.id === 'salao' ? 'HairSalon' : ctx.modelo.id === 'veterinaria' || ctx.modelo.id === 'petshop_veterinaria' ? 'VeterinaryCare' : ctx.modelo.id === 'estetica' ? 'BeautySalon' : 'Store'}) com nome, endereço, telefone, geo, horário (openingHoursSpecification), preço e ` + '`aggregateRating`' + ' apenas se houver avaliações reais.',
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
      'Você é um **designer e desenvolvedor web sênior**, especializado em sites para o setor de ' + modelo.area.toLowerCase() + ', com forte domínio de SEO local, conversão, acessibilidade e performance.',
      '',
      `Sua missão: **criar (ou reformular) o site de "${empresa.nomeFantasia}"${cidade ? `, em ${cidade}` : ''}**, um ${modelo.nome.toLowerCase()}, entregando estrutura, conteúdo e design prontos para publicação.`,
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
    `SEO local: title "${texto(ctx.conteudo.seoTitulo) || modelo.conteudoPronto.seo.tituloHome.replace(/\[NOME\]/g, empresa.nomeFantasia).replace(/\[CIDADE\]/g, cidade)}", palavras-chave com foco em "${modelo.conteudoPronto.seo.palavrasChave[0].replace(/\[CIDADE\]/g, cidade)}" e dados estruturados LocalBusiness.`,
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
