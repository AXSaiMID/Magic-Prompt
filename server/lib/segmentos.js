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
