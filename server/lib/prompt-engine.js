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
