#!/usr/bin/env node
'use strict';

/**
 * BUILD DA PÁGINA ESTÁTICA (GitHub Pages)
 * ---------------------------------------
 * Gera a pasta `docs/`, que pode ser publicada diretamente pelo GitHub Pages
 * (Settings → Pages → Deploy from a branch → main → /docs).
 *
 * O que ele faz:
 *   1. empacota os módulos do motor (server/lib/*.js) em um único arquivo
 *      `docs/motor.js`, com um carregador CommonJS mínimo + Buffer para
 *      navegador. Assim a página gera o prompt com EXATAMENTE o mesmo código
 *      do servidor — test/pagina.test.js compara as duas saídas.
 *   2. copia a interface estática de `web/` para `docs/`.
 *   3. monta `docs/styles.css` reutilizando a folha de estilo do app servidor
 *      + os ajustes específicos da versão estática.
 *
 * Uso: npm run pagina
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const DIR_LIB = path.join(RAIZ, 'server', 'lib');
const DIR_WEB = path.join(RAIZ, 'web');
const DIR_SAIDA = path.join(RAIZ, 'docs');

/** Ordem dos módulos no bundle (a posição não importa: o require é resolvido por nome). */
const MODULOS = ['utils', 'segmentos', 'prompt-engine', 'pacote', 'zip'];

const CABECALHO = `/* =====================================================================
   MOTOR DO MAGIC PROMPT — bundle para navegador
   ---------------------------------------------------------------------
   ARQUIVO GERADO AUTOMATICAMENTE por scripts/build-pagina.js.
   Não edite aqui: altere server/lib/*.js e rode \`npm run pagina\`.

   Contém os mesmos módulos usados pelo servidor (modelos por segmento,
   motor de geração de prompt, arquivos de apoio e escritor de ZIP), com um
   carregador CommonJS e um Buffer mínimo para rodar no navegador.
   ===================================================================== */
`;

function lerModulo(nome) {
  const arquivo = path.join(DIR_LIB, `${nome}.js`);
  if (!fs.existsSync(arquivo)) throw new Error(`Módulo não encontrado: ${arquivo}`);
  return fs.readFileSync(arquivo, 'utf8');
}

/**
 * Injeta o código-fonte sem alterar NENHUMA linha.
 * Importante: indentar o código mudaria o conteúdo de template literals de
 * várias linhas (ex.: o LEIA-ME gerado sairia com espaços sobrando), então a
 * indentação das funções registradas é zero de propósito.
 */
function semIndentar(codigo) {
  return codigo.replace(/\s+$/, '');
}

function gerarBundle() {
  const partes = [CABECALHO, ''];
  partes.push('(function (global) {');
  partes.push("  'use strict';");
  partes.push('');

  // 1) Buffer mínimo para navegador
  partes.push('  /* ------------------------- Buffer para navegador ------------------------- */');
  partes.push(semIndentar(fs.readFileSync(path.join(DIR_WEB, 'buffer.js'), 'utf8')));
  partes.push('');

  // 2) shims de módulos nativos do Node
  partes.push('  /* --------------------- Shims de módulos do Node --------------------- */');
  partes.push('  var MODULOS_NATIVOS = {');
  partes.push('    crypto: function (module) {');
  partes.push('      // Usado apenas por utils.novoId(): gera identificadores locais.');
  partes.push('      module.exports = {');
  partes.push('        randomUUID: function () {');
  partes.push("          if (global.crypto && typeof global.crypto.randomUUID === 'function') return global.crypto.randomUUID();");
  partes.push("          if (global.crypto && typeof global.crypto.getRandomValues === 'function') {");
  partes.push('            var b = new Uint8Array(16);');
  partes.push('            global.crypto.getRandomValues(b);');
  partes.push("            b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;");
  partes.push('            var hex = [];');
  partes.push('            for (var i = 0; i < 16; i++) hex.push((b[i] + 0x100).toString(16).slice(1));');
  partes.push("            return hex.slice(0, 4).join('') + '-' + hex.slice(4, 6).join('') + '-' + hex.slice(6, 8).join('') + '-' + hex.slice(8, 10).join('') + '-' + hex.slice(10, 16).join('');");
  partes.push('          }');
  partes.push("          return 'id-' + Date.now().toString(16) + Math.random().toString(16).slice(2, 10);");
  partes.push('        },');
  partes.push('      };');
  partes.push('    },');
  partes.push('  };');
  partes.push('');

  // 3) registro de módulos do motor
  partes.push('  /* ------------------------ Módulos do motor ------------------------ */');
  partes.push('  var REGISTRO = {};');
  partes.push('');
  for (const nome of MODULOS) {
    partes.push(`  REGISTRO['${nome}'] = function (module, exports, require) {`);
    partes.push(semIndentar(lerModulo(nome)));
    partes.push('  };');
    partes.push('');
  }

  // 4) carregador CommonJS
  partes.push('  /* --------------------- Carregador CommonJS mínimo --------------------- */');
  partes.push('  var CACHE = {};');
  partes.push('  function normalizar(id) {');
  partes.push("    return String(id).replace(/^\\.\\//, '').replace(/\\.js$/, '');");
  partes.push('  }');
  partes.push('  function requireLocal(id) {');
  partes.push('    var nome = normalizar(id);');
  partes.push('    if (CACHE[nome]) return CACHE[nome].exports;');
  partes.push('    var fabrica = REGISTRO[nome] || MODULOS_NATIVOS[nome];');
  partes.push("    if (!fabrica) throw new Error('Módulo não encontrado no bundle: ' + id);");
  partes.push('    var modulo = { exports: {} };');
  partes.push('    CACHE[nome] = modulo;');
  partes.push('    fabrica(modulo, modulo.exports, requireLocal);');
  partes.push('    return modulo.exports;');
  partes.push('  }');
  partes.push('  global.MagicPromptRequire = requireLocal;');
  partes.push('');
  partes.push('  /* --------------------------- Exportações --------------------------- */');
  partes.push('  var require = requireLocal;');
  partes.push(semIndentar(fs.readFileSync(path.join(DIR_WEB, 'motor-export.js'), 'utf8')));
  partes.push('');
  partes.push("})(typeof globalThis !== 'undefined' ? globalThis : window);");
  partes.push('');

  return partes.join('\n');
}

function copiarArquivo(origem, destino) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(origem, destino);
}

function main() {
  fs.rmSync(DIR_SAIDA, { recursive: true, force: true });
  fs.mkdirSync(DIR_SAIDA, { recursive: true });

  // 1) bundle do motor
  const bundle = gerarBundle();
  fs.writeFileSync(path.join(DIR_SAIDA, 'motor.js'), bundle, 'utf8');

  // 2) interface estática
  copiarArquivo(path.join(DIR_WEB, 'index.html'), path.join(DIR_SAIDA, 'index.html'));
  copiarArquivo(path.join(DIR_WEB, 'app.js'), path.join(DIR_SAIDA, 'app.js'));

  // 3) folha de estilo = base do app servidor + ajustes da versão estática
  const base = fs.readFileSync(path.join(RAIZ, 'public', 'styles.css'), 'utf8');
  const extras = fs.readFileSync(path.join(DIR_WEB, 'extras.css'), 'utf8');
  const aviso = '/* ARQUIVO GERADO por scripts/build-pagina.js — base em public/styles.css + web/extras.css */\n';
  fs.writeFileSync(path.join(DIR_SAIDA, 'styles.css'), `${aviso}${base}\n\n${extras}`, 'utf8');

  // 4) marcadores de publicação
  fs.writeFileSync(path.join(DIR_SAIDA, '.nojekyll'), '', 'utf8');
  fs.writeFileSync(
    path.join(DIR_SAIDA, 'README.md'),
    [
      '# Página estática (GitHub Pages)',
      '',
      '**Esta pasta é gerada automaticamente.** Não edite os arquivos aqui:',
      'altere as fontes em `server/lib/` e `web/` e rode `npm run pagina`.',
      '',
      '| Arquivo | Origem |',
      '| --- | --- |',
      '| `motor.js` | bundle de `server/lib/*.js` + `web/buffer.js` + `web/motor-export.js` |',
      '| `index.html`, `app.js` | `web/` |',
      '| `styles.css` | `public/styles.css` + `web/extras.css` |',
      '',
      '## Como publicar',
      '',
      'Settings → Pages → Source: *Deploy from a branch* → Branch: `main` → Folder: `/docs` → Save.',
      '',
      'A página fica em `https://<usuario>.github.io/<repositorio>/`.',
      '',
      '> A versão estática gera o prompt e monta o `.zip` no próprio navegador.',
      '> Arquivos enviados e histórico ficam apenas no navegador do visitante.',
      '> Para o modo multiusuário com pastas no servidor, rode `npm start` na raiz do projeto.',
      '',
    ].join('\n'),
    'utf8'
  );

  const tamanho = (caminho) => `${(fs.statSync(path.join(DIR_SAIDA, caminho)).size / 1024).toFixed(1)} KB`;
  console.log('\n  Página estática gerada em docs/');
  for (const arquivo of ['index.html', 'styles.css', 'app.js', 'motor.js']) {
    console.log(`  - ${arquivo.padEnd(14)} ${tamanho(arquivo).padStart(9)}`);
  }
  console.log('\n  Publique em: Settings → Pages → Deploy from a branch → /docs\n');
}

main();
