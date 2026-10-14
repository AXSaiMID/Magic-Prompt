'use strict';

/**
 * Clientes de exemplo usados nos testes e no script `npm run exemplo`.
 * Servem também como referência de preenchimento para o operador.
 */

const clienteEstetica = {
  segmento: 'estetica',
  nomeContato: 'Maria Souza',
  pasta: 'maria-souza_bella-estetica',
  empresa: {
    nomeFantasia: 'Bella Estética',
    razaoSocial: 'Bella Estética LTDA',
    cnpj: '12.345.678/0001-90',
    endereco: {
      rua: 'Rua das Flores',
      numero: '123',
      complemento: 'Sala 4',
      bairro: 'Jardim Europa',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-000',
    },
    telefone: '(11) 3456-7890',
    whatsapp: '(11) 98888-7777',
    email: 'contato@bellaestetica.com.br',
    horario: 'Segunda a sexta, 9h às 19h; sábado, 9h às 14h. Fechado em feriados.',
    servicos: [
      { nome: 'Limpeza de pele profunda', descricao: 'Higienização com extração e máscara calmante', duracao: '60 min', preco: 'a partir de R$ 180' },
      { nome: 'Peeling de diamante', descricao: 'Renovação da pele com microdermoabrasão', duracao: '50 min', preco: 'a partir de R$ 220' },
      { nome: 'Drenagem linfática', descricao: 'Massagem manual para retenção de líquidos', duracao: '60 min', preco: 'a partir de R$ 150' },
      { nome: 'Microagulhamento', descricao: 'Indução de colágeno com ativos', duracao: '70 min', preco: 'a partir de R$ 350' },
    ],
    idioma: 'pt-BR',
  },
  negocio: {
    descricao:
      'centro de estética especializado em tratamentos faciais e corporais, com protocolos personalizados definidos após avaliação individual',
    publicoAlvo:
      'Mulheres de 30 a 50 anos, moradoras do Jardim Europa e região, que buscam prevenção de rugas, tratamento de manchas e autocuidado. Chegam pelo Instagram e por indicação, valorizam explicação clara do procedimento e ambiente reservado.',
    diferenciais: [
      'Avaliação individual antes de qualquer aplicação, com protocolo montado para o seu caso',
      'Equipe com formação em estética avançada e atualização anual',
      'Ambiente reservado e atendimento com hora marcada, sem espera',
    ],
    objetivo: 'agendamento',
    objetivosExtras: ['venda'],
  },
  redes: {
    googleMaps: 'https://maps.app.goo.gl/exemplo-bella-estetica',
    instagram: 'https://instagram.com/bellaestetica',
    facebook: 'https://facebook.com/bellaestetica',
    youtube: '',
    pinterest: '',
    siteAtual: '',
    linksExtras: [{ rotulo: 'TikTok', url: 'https://tiktok.com/@bellaestetica' }],
  },
  identidade: {
    cores: ['#EFE6DD', '#C98B8B', '#3B3B3B'],
    estilo: 'Sofisticado e minimalista',
    fontes: 'Títulos em serifada elegante; corpo em sans-serif leve',
    referencias: ['https://exemplo-de-referencia.com', 'https://outro-exemplo.com'],
    observacoes: 'A marca tem um tom rosé que deve aparecer nos botões.',
  },
  conteudo: {
    textos:
      'A Bella Estética nasceu em 2015 com a proposta de oferecer tratamentos personalizados. Nossa equipe é formada por três profissionais especializadas em estética facial e corporal.',
    depoimentos: [
      { nome: 'Ana Paula', texto: 'Desde a primeira avaliação explicaram tudo com calma. Minha pele melhorou muito depois de três sessões.' },
      { nome: 'Juliana M.', texto: 'Ambiente impecável e pontualidade absoluta. Recomendo de olhos fechados.' },
    ],
    faq: [
      { pergunta: 'Preciso fazer avaliação antes de fechar o tratamento?', resposta: 'Sim. A avaliação é gratuita e serve para indicar o protocolo adequado ao seu objetivo e ao seu tipo de pele.' },
      { pergunta: 'Quais as formas de pagamento?', resposta: 'Aceitamos Pix, débito, crédito em até 6x e pacotes com desconto.' },
    ],
    palavrasChave: ['clínica de estética Jardim Europa', 'limpeza de pele São Paulo'],
    observacoes: 'O logo ainda está em versão provisória.',
  },
  opcoes: {
    ecommerce: true,
    incluirBlog: true,
    incluirFaq: true,
    incluirDepoimentos: true,
    incluirGaleria: true,
    incluirEquipe: true,
    observacoesOperador: 'Cliente pediu entrega antes do dia 15. Priorizar mobile, pois 80% do tráfego vem do Instagram.',
  },
};

const clienteBarbearia = {
  segmento: 'barbearia',
  nomeContato: 'Carlos Mendes',
  pasta: 'carlos-mendes_barbearia-tradicao',
  empresa: {
    nomeFantasia: 'Barbearia Tradição',
    endereco: { rua: 'Av. Central', numero: '900', bairro: 'Centro', cidade: 'Belo Horizonte', estado: 'MG', cep: '30110-000' },
    whatsapp: '(31) 97777-6666',
    email: 'contato@barbeariatradicao.com.br',
    horario: 'Terça a sábado, 9h às 20h',
    servicos: ['Corte social', 'Degradê', 'Barba na navalha', 'Corte + barba'],
    idioma: 'pt-BR',
  },
  negocio: {
    descricao: 'barbearia com atendimento por hora marcada, especializada em cortes masculinos e barba na navalha',
    publicoAlvo: 'Homens de 20 a 45 anos da região central que valorizam atendimento sem fila',
    diferenciais: ['Zero fila: só atendemos com hora marcada', 'Toalha quente e finalização inclusas'],
    objetivo: 'agendamento',
  },
  redes: { instagram: 'https://instagram.com/barbeariatradicao', googleMaps: 'https://maps.app.goo.gl/exemplo-barbearia' },
  identidade: { cores: ['#111111', '#C8A24A'], estilo: 'Dark clássico' },
  conteudo: {},
  opcoes: { ecommerce: false, incluirBlog: false, incluirFaq: true, incluirDepoimentos: true, incluirGaleria: true, incluirEquipe: true },
};

const clienteVeterinaria = {
  segmento: 'veterinaria',
  nomeContato: 'Dra. Renata Lima',
  pasta: 'renata-lima_clinica-vida-animal',
  empresa: {
    nomeFantasia: 'Clínica Vida Animal',
    razaoSocial: 'Vida Animal Serviços Veterinários LTDA',
    cnpj: '98.765.432/0001-10',
    endereco: { rua: 'Rua dos Ipês', numero: '45', bairro: 'Vila Nova', cidade: 'Curitiba', estado: 'PR', cep: '80000-000' },
    telefone: '(41) 3333-4444',
    whatsapp: '(41) 99999-1111',
    email: 'contato@vidaanimal.com.br',
    horario: 'Segunda a sábado, 8h às 20h. Plantão de urgência até 22h.',
    servicos: [
      { nome: 'Consulta clínica geral', duracao: '30 min' },
      { nome: 'Vacinação', descricao: 'Protocolo completo para filhotes e adultos' },
      { nome: 'Ultrassonografia', duracao: '40 min' },
      { nome: 'Castração', descricao: 'Procedimento eletivo com orçamento prévio' },
    ],
    idioma: 'pt-BR',
  },
  negocio: {
    descricao: 'clínica veterinária com atendimento clínico, exames de imagem e laboratório próprio, além de urgências no horário estendido',
    publicoAlvo: 'Tutores de cães e gatos de 25 a 60 anos que buscam atendimento de confiança e orçamento transparente',
    diferenciais: ['Laboratório próprio com resultado no mesmo dia', 'Orçamento aprovado pelo tutor antes de qualquer procedimento'],
    objetivo: 'agendamento',
    objetivosExtras: ['relacionamento'],
  },
  redes: {
    instagram: 'https://instagram.com/vidaanimal',
    googleMaps: 'https://maps.app.goo.gl/exemplo-vida-animal',
    siteAtual: 'https://vidaanimal.com.br',
  },
  identidade: { cores: ['#14395C', '#2E7BB8', '#3E9E7C'], estilo: 'Clínico acolhedor' },
  conteudo: {
    depoimentos: [{ nome: 'Marcos A.', texto: 'Atenderam minha gata em uma urgência num sábado e explicaram tudo com paciência.' }],
    faq: [{ pergunta: 'Vocês atendem emergência?', resposta: 'Sim, dentro do nosso horário, com prioridade para casos graves; ligue antes para prepararmos o atendimento.' }],
  },
  opcoes: { ecommerce: true, incluirBlog: true, incluirFaq: true, incluirDepoimentos: true, incluirGaleria: true, incluirEquipe: true },
};

/** Imobiliária — cobre os modelos de imóveis e obras acrescentados depois. */
const clienteImobiliaria = {
  nomeContato: 'Paulo Andrade',
  pasta: 'paulo-andrade_andrade-imoveis',
  segmento: 'imobiliaria',
  empresa: {
    nomeFantasia: 'Andrade Imóveis',
    razaoSocial: 'Andrade Intermediação Imobiliária Ltda',
    cnpj: '98.765.432/0001-10',
    telefone: '(44) 3222-4455',
    whatsapp: '(44) 98888-1234',
    email: 'contato@andradeimoveis.com.br',
    horario: 'Seg a Sex, 8h30 às 18h • Sáb, 9h às 13h',
    endereco: {
      rua: 'Avenida São Paulo',
      numero: '1200',
      complemento: 'Sala 12',
      bairro: 'Zona 07',
      cidade: 'Maringá',
      estado: 'PR',
      cep: '87020-015',
    },
    servicos: [
      { nome: 'Compra e venda de apartamentos', descricao: 'Intermediação completa, da avaliação à escritura.', preco: '', duracao: '' },
      { nome: 'Locação residencial com garantia', descricao: 'Análise de crédito e contrato em até 48 horas.', preco: '', duracao: '' },
      { nome: 'Administração de aluguéis', descricao: 'Repasse em dia, vistoria e manutenção.', preco: '', duracao: '' },
      { nome: 'Avaliação de imóveis', descricao: 'Gratuita e sem compromisso, com laudo de valor de mercado.', preco: '', duracao: '' },
    ],
  },
  negocio: {
    descricao:
      'imobiliária com 18 anos de atuação na Zona 07, especializada em apartamentos usados e lançamentos da região central de Maringá, com administração de locação para proprietários e assessoria completa de documentação.',
    publicoAlvo:
      'Famílias e casais de 28 a 50 anos comprando o primeiro ou o segundo imóvel, investidores de locação e proprietários que querem alugar sem dor de cabeça; chegam pelo Google e pelos portais, filtram por bairro e faixa de preço e decidem pela clareza das informações e pela agilidade do corretor.',
    diferenciais: [
      'Corretores com CRECI ativo e especialização por bairro da cidade',
      'Anúncios com fotos atualizadas e visita agendada em até 24 horas',
      'Documentação conferida antes de publicar: matrícula, IPTU e condomínio',
      'Repasse do aluguel em dia e acompanhamento de manutenção para o proprietário',
    ],
    objetivo: 'orcamento',
    objetivoDetalhe: 'Receber pedidos de avaliação de proprietários e agendamentos de visita qualificados pelo site.',
    sazonalidade: 'Pico de procura em janeiro e fevereiro e nos lançamentos do segundo semestre.',
  },
  redes: {
    googleMaps: 'https://maps.google.com/?q=Andrade+Imoveis+Maringa',
    instagram: 'https://instagram.com/andradeimoveis',
    facebook: 'https://facebook.com/andradeimoveis',
    youtube: 'https://youtube.com/@andradeimoveis',
    siteAtual: 'https://andradeimoveis.com.br',
    linksExtras: [{ rotulo: 'Portal de avaliação', url: 'https://andradeimoveis.com.br/avalie' }],
  },
  identidade: {
    cores: [{ hex: '#132B45', nome: 'Azul-marinho' }, { hex: '#C8A24A', nome: 'Dourado' }],
    estilo: 'Corporativo confiável',
    referencias: ['https://exemplo-imobiliaria.com', 'https://exemplo-lancamentos.com'],
    observacoes: 'O dourado deve aparecer apenas nos botões de ação.',
  },
  conteudo: {
    textos:
      'A Andrade Imóveis nasceu em 2008 na Zona 07 e acompanhou o crescimento da região central de Maringá...',
    depoimentos: [{ nome: 'Compradora', texto: 'Visitei três apartamentos no mesmo sábado e fechei negócio em três semanas, com a documentação toda conferida pela equipe.' }],
    faq: [{ pergunta: 'Quanto custa a comissão?', resposta: 'A comissão segue a tabela do CRECI e é informada por escrito antes da contratação, sem taxa surpresa.' }],
    palavrasChave: ['imobiliária Zona 07', 'apartamento à venda Maringá'],
    avisos: ['Não divulgar o endereço exato de imóveis desocupados.'],
  },
  opcoes: {
    ecommerce: false,
    incluirBlog: true,
    incluirFaq: true,
    incluirDepoimentos: true,
    incluirGaleria: true,
    incluirEquipe: true,
    tomDeVoz: 'Transparente e resolutivo, sem pressão de venda',
  },
};

const ARQUIVOS_EXEMPLO = {
  midias: [
    { nome: 'banner-fachada.jpg', extensao: 'jpg' },
    { nome: 'antes-depois-01.jpg', extensao: 'jpg' },
    { nome: 'antes-depois-02.jpg', extensao: 'jpg' },
    { nome: 'sala-de-atendimento.jpg', extensao: 'jpg' },
    { nome: 'equipe.jpg', extensao: 'jpg' },
    { nome: 'institucional.mp4', extensao: 'mp4' },
  ],
  branding: [
    { nome: 'logo-principal.png', extensao: 'png' },
    { nome: 'paleta-cores.pdf', extensao: 'pdf' },
  ],
  conteudo: [{ nome: 'textos-sobre.docx', extensao: 'docx' }],
};

module.exports = { clienteEstetica, clienteBarbearia, clienteVeterinaria, clienteImobiliaria, ARQUIVOS_EXEMPLO };
