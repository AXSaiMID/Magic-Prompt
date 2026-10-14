'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { gerarPrompt, gerarPromptResumo, validarDados } = require('../server/lib/prompt-engine');
const { clienteEstetica, clienteBarbearia, clienteVeterinaria, ARQUIVOS_EXEMPLO } = require('./fixtures/clientes');

const SECOES_OBRIGATORIAS = [
  'FICHA DO PROJETO',
  '1. PAPEL E MISSÃO',
  '2. ARQUIVOS DE APOIO DO PROJETO',
  '3. DESCRIÇÃO DO NEGÓCIO',
  '4. PÚBLICO-ALVO',
  '5. OBJETIVO DO SITE',
  '6. ESTRUTURA DE PÁGINAS E SEÇÕES',
  '7. FUNCIONALIDADES E INTEGRAÇÕES',
  '8. CONTEÚDO E COPY SUGERIDA',
  '9. TOM DE VOZ E COMUNICAÇÃO',
  '10. ESTILO VISUAL E IDENTIDADE DA MARCA',
  '11. USO DAS IMAGENS E VÍDEOS ANEXADOS',
  '12. LINKS, REDES SOCIAIS E DADOS DE CONTATO',
  '13. SEO BÁSICO E LOCAL',
  '14. REQUISITOS TÉCNICOS, LGPD E ACESSIBILIDADE',
  '15. CUIDADOS ESPECÍFICOS DO SEGMENTO',
  '16. O QUE EVITAR',
  '17. CRITÉRIOS DE ACEITE E MATERIAIS PENDENTES',
];

test('gera um prompt longo com todas as seções obrigatórias', () => {
  const { texto, meta } = gerarPrompt(clienteEstetica, ARQUIVOS_EXEMPLO);
  for (const titulo of SECOES_OBRIGATORIAS) {
    assert.ok(texto.includes(`## ${titulo}`), `seção ausente: ${titulo}`);
  }
  assert.ok(texto.length > 12000, 'o prompt deve ser detalhado');
  assert.equal(meta.segmento, 'estetica');
  assert.ok(meta.palavras > 2000);
  assert.ok(meta.tokensAproximados > 3000);
});

test('inclui dados específicos do cliente e nunca deixa placeholder de cidade vazado', () => {
  const { texto } = gerarPrompt(clienteEstetica, ARQUIVOS_EXEMPLO);
  assert.ok(texto.includes('Bella Estética'));
  assert.ok(texto.includes('São Paulo'));
  assert.ok(texto.includes('Jardim Europa'));
  assert.ok(texto.includes('Limpeza de pele profunda'));
  assert.ok(texto.includes('(11) 98888-7777'));
  assert.ok(texto.includes('https://wa.me/5511988887777'), 'deve montar o link de WhatsApp');
  assert.ok(!texto.includes('[CIDADE]'), 'não pode sobrar placeholder [CIDADE]');
  assert.ok(!texto.includes('[NOME]'), 'não pode sobrar placeholder [NOME]');
  assert.ok(!texto.includes('[BAIRRO]'), 'não pode sobrar placeholder [BAIRRO]');
});

test('declara o objetivo do site de forma explícita', () => {
  const { texto, meta } = gerarPrompt(clienteEstetica, ARQUIVOS_EXEMPLO);
  assert.equal(meta.objetivo, 'agendamento');
  assert.ok(texto.includes('Objetivo principal do site:** Agendamento online'));
  assert.ok(/métricas a instrumentar/i.test(texto));
});

test('respeita o objetivo recomendado quando o operador não escolhe', () => {
  const dados = JSON.parse(JSON.stringify(clienteBarbearia));
  delete dados.negocio.objetivo;
  const { meta } = gerarPrompt(dados, {});
  assert.equal(meta.objetivo, 'agendamento');
});

test('cita os arquivos enviados pelo nome nas instruções de mídia', () => {
  const { texto } = gerarPrompt(clienteEstetica, ARQUIVOS_EXEMPLO);
  assert.ok(texto.includes('logo-principal.png'));
  assert.ok(texto.includes('banner-fachada.jpg'));
  assert.ok(texto.includes('institucional.mp4'));
  assert.ok(texto.includes('textos-sobre.docx'));
  assert.ok(/object-fit: cover/.test(texto));
  assert.ok(/Antes e depois \/ resultados/.test(texto), 'deve orientar o uso dos arquivos antes/depois');
});

test('sem arquivos enviados, orienta placeholders e lista o que fotografar', () => {
  const { texto, meta } = gerarPrompt(clienteBarbearia, {});
  assert.ok(/nenhum arquivo foi enviado/i.test(texto));
  assert.ok(/Sem imagens próprias/.test(texto));
  assert.ok(meta.faltando.includes('Imagens/vídeos do site'));
  assert.ok(meta.faltando.includes('Arquivo do logo'));
});

test('com e-commerce gera especificação de loja; sem e-commerce não menciona carrinho', () => {
  const comLoja = gerarPrompt(clienteEstetica, ARQUIVOS_EXEMPLO).texto;
  assert.ok(/Loja online — especificação/.test(comLoja));
  assert.ok(/checkout/i.test(comLoja));
  assert.ok(/frete/i.test(comLoja));
  assert.ok(comLoja.includes('## 6. ESTRUTURA') && /Loja — OBRIGATÓRIA/.test(comLoja));

  const semLoja = gerarPrompt(clienteBarbearia, {}).texto;
  assert.ok(/não vendeu online/i.test(semLoja));
  assert.ok(/Não crie carrinho, checkout ou catálogo/.test(semLoja));
  assert.ok(!/Loja online — especificação/.test(semLoja));
});

test('não inventa depoimentos quando o cliente não envia', () => {
  const dados = JSON.parse(JSON.stringify(clienteBarbearia));
  dados.conteudo = {};
  const { texto, meta } = gerarPrompt(dados, {});
  assert.ok(/Não invente depoimentos, avaliações ou notas/.test(texto));
  assert.ok(meta.avisos.some((a) => /depoimentos reais/i.test(a)));
});

test('usa FAQ e depoimentos reais quando existem', () => {
  const { texto } = gerarPrompt(clienteEstetica, ARQUIVOS_EXEMPLO);
  assert.ok(texto.includes('Preciso fazer avaliação antes de fechar o tratamento?'));
  assert.ok(texto.includes('Desde a primeira avaliação explicaram tudo com calma'));
});

test('usa a paleta informada e cai na sugestão do segmento quando não há cores', () => {
  const comCores = gerarPrompt(clienteEstetica, ARQUIVOS_EXEMPLO).texto;
  assert.ok(comCores.includes('#EFE6DD'));
  assert.ok(comCores.includes('informada pelo cliente'));

  const barbeariaSemCores = JSON.parse(JSON.stringify(clienteBarbearia));
  barbeariaSemCores.identidade = {};
  const semCores = gerarPrompt(barbeariaSemCores, {}).texto;
  assert.ok(/sugerida pelo modelo/.test(semCores));
  assert.ok(semCores.includes('#111111') || semCores.includes('#C8A24A'));
});

test('respeita as opções de páginas (blog e FAQ desligados)', () => {
  const desligado = gerarPrompt(clienteEstetica, ARQUIVOS_EXEMPLO).texto;
  assert.ok(/Blog \/ Dicas/.test(desligado));

  const dados = JSON.parse(JSON.stringify(clienteEstetica));
  dados.opcoes.incluirBlog = false;
  dados.opcoes.incluirFaq = false;
  const { texto, meta } = gerarPrompt(dados, ARQUIVOS_EXEMPLO);
  assert.ok(!meta.paginas.includes('Blog / Dicas'));
  assert.ok(!texto.includes('#### ') || !/Blog \/ Dicas — /.test(texto));
});

test('inclui SEO local com cidade, palavras-chave e dados estruturados', () => {
  const { texto } = gerarPrompt(clienteVeterinaria, {});
  assert.ok(/SEO local — aplicar obrigatoriamente/.test(texto));
  assert.ok(/clínica veterinária Curitiba|clínica veterinária em Curitiba/.test(texto));
  assert.ok(/LocalBusiness/.test(texto));
  assert.ok(/VeterinaryCare/.test(texto));
  assert.ok(/Google Meu Negócio/.test(texto));
  assert.ok(/sitemap.xml/.test(texto));
});

test('inclui os cuidados de conformidade do segmento', () => {
  const vet = gerarPrompt(clienteVeterinaria, {}).texto;
  assert.ok(/CRMV/.test(vet));
  assert.ok(/responsável técnico/i.test(vet));

  const estetica = gerarPrompt(clienteEstetica, ARQUIVOS_EXEMPLO).texto;
  assert.ok(/propaganda enganosa/i.test(estetica) || /resultados garantidos/i.test(estetica));
});

test('traz tom de voz e estilo visual com diretrizes e exemplos', () => {
  const { texto } = gerarPrompt(clienteBarbearia, {});
  assert.ok(/Personalidade da marca/.test(texto));
  assert.ok(/Como escrever \(regras práticas\)/.test(texto));
  assert.ok(/Evitar neste segmento/.test(texto));
  assert.ok(texto.includes('Dark clássico'), 'usa o estilo informado pelo cliente');
  assert.ok(/WCAG/.test(texto));
});

test('acrescenta observações do operador em seção própria', () => {
  const { texto } = gerarPrompt(clienteEstetica, ARQUIVOS_EXEMPLO);
  assert.ok(texto.includes('## 18. OBSERVAÇÕES DO OPERADOR'));
  assert.ok(/priorizar mobile/i.test(texto));
});

test('gera a versão curta com os dados essenciais', () => {
  const resumo = gerarPromptResumo(clienteEstetica, ARQUIVOS_EXEMPLO);
  assert.ok(resumo.length > 400 && resumo.length < 4000, 'o resumo deve caber em uma mensagem de chat');
  assert.ok(resumo.includes('Bella Estética'));
  assert.ok(/Objetivo do site: Agendamento online/.test(resumo));
  assert.ok(/Nunca|não invente|Não invente/.test(resumo));
});

test('valida os campos obrigatórios antes de gerar', () => {
  const vazio = validarDados({}, {});
  assert.equal(vazio.ok, false);
  assert.ok(vazio.erros.some((e) => e.campo === 'empresa.nomeFantasia'));
  assert.ok(vazio.erros.some((e) => e.campo === 'segmento'));

  const semContato = validarDados({ segmento: 'estetica', empresa: { nomeFantasia: 'X' } }, {});
  assert.equal(semContato.ok, false);
  assert.ok(semContato.erros.some((e) => /contato/i.test(e.mensagem)));

  const completo = validarDados({ segmento: 'estetica', empresa: { nomeFantasia: 'X', whatsapp: '11 98888-7777' } }, {});
  assert.equal(completo.ok, true);
});

test('rejeita segmento desconhecido com erro identificável', () => {
  assert.throws(() => gerarPrompt({ segmento: 'inexistente' }, {}), (erro) => erro.codigo === 'SEGMENTO_INVALIDO');
});

test('aceita serviços como texto simples, linhas e objetos', () => {
  const comoTexto = gerarPrompt({
    segmento: 'barbearia',
    empresa: { nomeFantasia: 'X', whatsapp: '11 98888-7777', servicos: 'Corte\nBarba\n- Sobrancelha' },
  }, {});
  assert.ok(comoTexto.texto.includes('Corte'));
  assert.ok(comoTexto.texto.includes('Sobrancelha'));

  const comoObjetos = gerarPrompt(clienteEstetica, {}).texto;
  assert.ok(/Limpeza de pele profunda — Higienização com extração/.test(comoObjetos));
});

test('não deixa seções vazias no documento final', () => {
  const { texto } = gerarPrompt(clienteBarbearia, {});
  const partes = texto.split(/\n## /).slice(1);
  assert.ok(partes.length >= 19);
  for (const parte of partes) {
    const [titulo, ...resto] = parte.split('\n');
    assert.ok(resto.join('\n').trim().length > 40, `seção "${titulo.trim()}" parece vazia`);
  }
});

/* ---------------------- cobertura dos 14 segmentos ---------------------- */

const { MODELOS } = require('../server/lib/segmentos');

/** Cliente mínimo válido para qualquer segmento. */
function clienteMinimo(segmento) {
  return {
    segmento,
    empresa: { nomeFantasia: 'Empresa Modelo', whatsapp: '(44) 99999-0000', endereco: { cidade: 'Maringá', estado: 'PR' } },
  };
}

test('gera prompt válido para todos os segmentos suportados', () => {
  for (const modelo of MODELOS) {
    const { texto, meta } = gerarPrompt(clienteMinimo(modelo.id), {});

    assert.equal(meta.segmento, modelo.id);
    assert.ok(texto.length > 8000, `${modelo.id}: prompt curto demais (${texto.length})`);
    for (const secao of SECOES_OBRIGATORIAS) {
      assert.ok(texto.includes(`## ${secao}`), `${modelo.id}: seção ausente -> ${secao}`);
    }
    // nada de placeholder de outro segmento ou sobra de template
    assert.ok(!texto.includes('[NOME]'), `${modelo.id}: [NOME] não substituído`);
    assert.ok(!texto.includes('undefined'), `${modelo.id}: valor undefined no prompt`);
    assert.ok(!texto.includes('responde_'), `${modelo.id}: sobra de template no prompt`);
    assert.ok(!texto.includes('[SERVIÇO]'), `${modelo.id}: [SERVIÇO] não substituído`);
  }
});

test('a apresentação do segmento concorda em gênero e cita o termo de busca', () => {
  for (const modelo of MODELOS) {
    const { texto } = gerarPrompt(clienteMinimo(modelo.id), {});
    const artigo = modelo.genero === 'f' ? 'uma' : 'um';

    assert.ok(
      texto.includes(`${artigo} ${modelo.termoBusca}, entregando estrutura`),
      `${modelo.id}: esperado "${artigo} ${modelo.termoBusca}" na missão`
    );
    assert.ok(texto.includes(`melhor ${modelo.termoBusca} em`), `${modelo.id}: cauda longa sem o termo de busca`);
    assert.ok(
      texto.includes(`horário de funcionamento d${modelo.genero === 'f' ? 'a' : 'o'} ${modelo.termoBusca}`),
      `${modelo.id}: cauda longa com artigo errado`
    );
    assert.ok(texto.includes(`setor de ${modelo.setor}`), `${modelo.id}: papel da IA sem o setor do modelo`);
  }
  // nenhuma combinação errada de artigo
  for (const id of ['veterinaria', 'estetica', 'barbearia', 'imobiliaria', 'construtora', 'construcao']) {
    const modelo = MODELOS.find((m) => m.id === id);
    if (!modelo) continue;
    const { texto } = gerarPrompt(clienteMinimo(id), {});
    assert.ok(!texto.includes(`um ${modelo.termoBusca}, entregando`), `${id}: artigo masculino indevido`);
  }
});

test('o dado estruturado usa o subtipo de negócio do segmento', () => {
  for (const modelo of MODELOS) {
    const { texto } = gerarPrompt(clienteMinimo(modelo.id), {});
    assert.ok(
      texto.includes(`${modelo.schemaOrg} com nome, endereço, telefone`),
      `${modelo.id}: JSON-LD deveria usar ${modelo.schemaOrg}`
    );
  }
  assert.ok(gerarPrompt(clienteMinimo('barbearia'), {}).texto.includes('HairSalon'));
  assert.ok(gerarPrompt(clienteMinimo('veterinaria'), {}).texto.includes('VeterinaryCare'));
  assert.ok(gerarPrompt(clienteMinimo('imobiliaria'), {}).texto.includes('RealEstateAgent'));
});

test('segmentos sem loja não recebem especificação de e-commerce', () => {
  for (const modelo of MODELOS.filter((m) => !m.suportaEcommerce)) {
    const comPedidoDeLoja = gerarPrompt({ ...clienteMinimo(modelo.id), opcoes: { ecommerce: true } }, {}).texto;
    assert.ok(!/Loja online — especificação/.test(comPedidoDeLoja), `${modelo.id}: não deveria ter loja`);
    assert.ok(!/Fluxo de compra/.test(comPedidoDeLoja), `${modelo.id}: não deveria ter fluxo de compra`);
    assert.ok(!/Carrinho e checkout completos/.test(comPedidoDeLoja), `${modelo.id}: não deveria ter carrinho`);
    assert.ok(/não vendeu online/i.test(comPedidoDeLoja), `${modelo.id}: falta o aviso de que não há loja`);
  }
  // os que suportam loja continuam funcionando quando a opção é marcada
  const comLoja = gerarPrompt({ ...clienteMinimo('decoracao'), opcoes: { ecommerce: true } }, {}).texto;
  assert.ok(/Loja online — especificação/.test(comLoja));
});

test('o prompt de obra e de imóvel traz as páginas próprias do setor', () => {
  const obra = gerarPrompt(clienteMinimo('construcao'), {}).texto;
  assert.ok(/Obras Entregues/.test(obra));
  assert.ok(/Garantias e Pós-obra/.test(obra));
  assert.ok(/cronograma/i.test(obra));

  const imovel = gerarPrompt(clienteMinimo('imobiliaria'), {}).texto;
  assert.ok(/Buscar Imóveis/.test(imovel));
  assert.ok(/Ficha do Imóvel/.test(imovel));
  assert.ok(/Anuncie seu Imóvel/.test(imovel));
  assert.ok(/matrícula/i.test(imovel));
  // a ficha do imóvel é página de template: existe, mas não entra no menu
  const menu = (imovel.match(/\*\*Menu principal sugerido:\*\* [^\n]*/) || [''])[0];
  assert.ok(/Buscar Imóveis/.test(menu), 'busca de imóveis deve estar no menu');
  assert.ok(!/Ficha do Imóvel/.test(menu), 'ficha do imóvel não é item de menu');

  const lancamento = gerarPrompt(clienteMinimo('empreendimentos'), {}).texto;
  assert.ok(/O Empreendimento/.test(lancamento));
  assert.ok(/Plantas e Tipologias/.test(lancamento));
  assert.ok(/registro de incorporação/i.test(lancamento));
  assert.ok(/imagem ilustrativa|ilustrativ/i.test(lancamento));

  const decoracao = gerarPrompt(clienteMinimo('decoracao'), {}).texto;
  assert.ok(/Ambientes/.test(decoracao));
  assert.ok(/Showroom/.test(decoracao));
});
