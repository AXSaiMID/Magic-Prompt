'use strict';

/**
 * Testes de sanidade da interface (sem navegador):
 *  - todo id usado por $('#id') no app.js precisa existir no index.html;
 *  - todo id usado no HTML precisa existir de fato (evita link morto);
 *  - os arquivos estáticos referenciados existem e têm conteúdo.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const DIR_PUBLICO = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(DIR_PUBLICO, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(DIR_PUBLICO, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(DIR_PUBLICO, 'styles.css'), 'utf8');

const idsNoHtml = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

test('todo elemento do HTML tem id único', () => {
  const todos = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(todos).size, todos.length, 'há ids duplicados no index.html');
  assert.ok(todos.length > 5);
});

test('todo $("#id") usado no app.js existe no HTML ou é criado dinamicamente', () => {
  // Elementos do painel do prompt e dos modais nascem de templates no próprio app.js.
  const idsDinamicos = new Set([...app.matchAll(/id="([\w-]+)"/g)].map((m) => m[1]));
  const usados = new Set([...app.matchAll(/\$\('#([\w-]+)'\)/g)].map((m) => m[1]));
  const ausentes = [...usados].filter((id) => !idsNoHtml.has(id) && !idsDinamicos.has(id));
  assert.deepEqual(ausentes, [], `ids referenciados no app.js e inexistentes: ${ausentes.join(', ')}`);
});

test('o HTML carrega os arquivos estáticos que existem', () => {
  const referenciados = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]);
  for (const caminho of referenciados) {
    const arquivo = path.join(DIR_PUBLICO, caminho.slice(1));
    assert.ok(fs.existsSync(arquivo), `arquivo estático ausente: ${caminho}`);
  }
  assert.ok(referenciados.includes('/app.js'));
  assert.ok(referenciados.includes('/styles.css'));
});

test('o app.js declara as sete abas do cadastro', () => {
  for (const aba of ['segmento', 'empresa', 'negocio', 'redes', 'visual', 'conteudo', 'arquivos']) {
    assert.ok(app.includes(`id: '${aba}'`), `aba ausente no app.js: ${aba}`);
  }
  assert.ok(/data-modelo/.test(app), 'deve permitir escolher o segmento');
  assert.ok(/data-upload/.test(app), 'deve haver zona de upload');
  assert.ok(/btn-baixar-zip/.test(app), 'deve haver download da pasta completa');
});

test('o CSS cobre os componentes principais e é responsivo', () => {
  for (const classe of ['.sidebar', '.card', '.zona-upload', '.painel-prompt', '.modal', '.cartao-segmento', '.stepper']) {
    assert.ok(css.includes(classe), `classe ausente no CSS: ${classe}`);
  }
  assert.ok(/@media/.test(css), 'o CSS deve ter breakpoints responsivos');
});
