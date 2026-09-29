'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { MODELOS, OBJETIVOS, listarModelos, getModelo, sugestoesDoModelo } = require('../server/lib/segmentos');

const IDS_OBJETIVOS = new Set(OBJETIVOS.map((o) => o.id));

test('há 7 modelos de negócio, com ids únicos', () => {
  assert.equal(MODELOS.length, 7);
  const ids = MODELOS.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const esperado of ['estetica', 'salao', 'barbearia', 'petshop', 'petshop_banho_tosa', 'petshop_veterinaria', 'veterinaria']) {
    assert.ok(ids.includes(esperado), `modelo ausente: ${esperado}`);
  }
});

test('segmentos com e sem e-commerce estão contemplados', () => {
  assert.ok(MODELOS.every((m) => m.suportaEcommerce === true), 'todos os modelos devem permitir a opção de loja');
  assert.ok(MODELOS.some((m) => m.temAgendamento), 'deve haver modelos com agendamento');
  assert.ok(MODELOS.some((m) => !m.temAgendamento), 'deve haver modelo sem agendamento (pet shop)');
});

test('cada modelo tem estrutura, funcionalidades, tom de voz e estilo visual completos', () => {
  for (const m of MODELOS) {
    assert.ok(m.nome && m.emoji && m.resumo, `${m.id}: identificação incompleta`);
    assert.ok(m.paginas.length >= 5, `${m.id}: páginas insuficientes`);
    assert.ok(m.paginas.some((p) => p.nome === 'Home' && p.obrigatoria), `${m.id}: falta Home obrigatória`);
    assert.ok(m.paginas.some((p) => p.nome === 'Contato'), `${m.id}: falta página de Contato`);
    assert.ok(m.paginas.some((p) => p.nome === 'Política de Privacidade'), `${m.id}: falta política de privacidade (LGPD)`);

    for (const p of m.paginas) {
      assert.ok(p.nome && p.objetivo, `${m.id}: página sem nome/objetivo`);
      assert.ok(Array.isArray(p.secoes) && p.secoes.length >= 3, `${m.id}/${p.nome}: poucas seções`);
    }

    assert.ok(m.funcionalidades.essenciais.length >= 5, `${m.id}: poucas funcionalidades essenciais`);
    assert.ok(m.funcionalidades.desejaveis.length >= 3, `${m.id}: poucas funcionalidades desejáveis`);
    assert.ok(m.funcionalidades.integracoes.length >= 2, `${m.id}: poucas integrações`);

    assert.ok(m.tomDeVoz.personalidade.length >= 3, `${m.id}: tom de voz incompleto`);
    assert.ok(m.tomDeVoz.regras.length >= 3, `${m.id}: regras de tom de voz insuficientes`);
    assert.ok(m.tomDeVoz.evitar.length >= 2, `${m.id}: lista de "evitar" insuficiente`);
    assert.ok(m.tomDeVoz.exemplos.length >= 2, `${m.id}: exemplos de copy insuficientes`);

    assert.ok(m.estiloVisual.estilos.length >= 2, `${m.id}: estilos insuficientes`);
    assert.ok(m.estiloVisual.paletas.length >= 2, `${m.id}: paletas insuficientes`);
    for (const paleta of m.estiloVisual.paletas) {
      assert.ok(paleta.cores.length >= 4, `${m.id}: paleta ${paleta.nome} com poucas cores`);
      for (const cor of paleta.cores) {
        assert.match(cor.hex, /^#[0-9A-Fa-f]{6}$/, `${m.id}: hex inválido em ${paleta.nome}: ${cor.hex}`);
      }
    }

    assert.ok(m.conteudoPronto.servicos.length >= 8, `${m.id}: poucos serviços de exemplo`);
    assert.ok(m.conteudoPronto.faq.length >= 4, `${m.id}: FAQ de exemplo insuficiente`);
    assert.ok(m.conteudoPronto.seo.palavrasChave.length >= 4, `${m.id}: poucas palavras-chave`);

    assert.ok(m.cuidados.length >= 3, `${m.id}: cuidados de conformidade insuficientes`);
  }
});

test('objetivo recomendado de cada modelo existe na lista de objetivos', () => {
  for (const m of MODELOS) {
    assert.ok(IDS_OBJETIVOS.has(m.objetivoRecomendado), `${m.id}: objetivo desconhecido (${m.objetivoRecomendado})`);
  }
});

test('modelos com loja descrevem categorias e recursos de e-commerce', () => {
  for (const m of MODELOS) {
    assert.ok(m.ecommerce, `${m.id}: falta bloco de e-commerce`);
    assert.ok(m.ecommerce.categorias.length >= 3, `${m.id}: poucas categorias de loja`);
    assert.ok(m.ecommerce.recursos.length >= 2, `${m.id}: poucos recursos de loja`);
  }
});

test('especificidades do briefing estão presentes nos modelos certos', () => {
  const barbearia = getModelo('barbearia');
  assert.ok(barbearia.paginas.some((p) => /clube de assinatura/i.test(p.nome)), 'barbearia deve ter clube de assinatura');

  const banhoTosa = getModelo('petshop_banho_tosa');
  assert.ok(banhoTosa.paginas.some((p) => /banho e tosa/i.test(p.nome)), 'pet shop com banho e tosa deve detalhar o serviço');
  assert.match(banhoTosa.tomDeVoz.regras.join(' '), /tutor/i, 'tom de voz deve usar "tutor"');

  const vet = getModelo('petshop_veterinaria');
  assert.ok(vet.paginas.some((p) => /serviços veterinários/i.test(p.nome)), 'pet shop com clínica deve ter página clínica');
  assert.ok(vet.cuidados.some((c) => /CRMV/i.test(c)), 'deve citar CRMV entre os cuidados');

  const clinica = getModelo('veterinaria');
  assert.ok(clinica.paginas.some((p) => /urgência/i.test(p.nome)), 'clínica veterinária deve ter página de urgência');

  const estetica = getModelo('estetica');
  assert.ok(estetica.paginas.some((p) => /resultados/i.test(p.nome)), 'estética deve ter página de resultados');
});

test('sugestões trazem textos prontos para pré-preencher o formulário', () => {
  const s = sugestoesDoModelo('estetica');
  assert.ok(s.descricaoNegocio.length > 30);
  assert.ok(s.publicoAlvo.length > 30);
  assert.ok(s.servicos.length >= 8);
  assert.ok(s.faq[0].pergunta && s.faq[0].resposta);
  assert.ok(s.paginas.length >= 5);
  assert.equal(sugestoesDoModelo('nao-existe'), null);
});

test('listarModelos devolve versão enxuta para a interface', () => {
  const lista = listarModelos();
  assert.equal(lista.length, 7);
  assert.ok(lista[0].paginasObrigatorias.includes('Home'));
  assert.ok(lista.every((m) => typeof m.suportaEcommerce === 'boolean'));
});
