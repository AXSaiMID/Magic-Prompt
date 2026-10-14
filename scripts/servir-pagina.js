#!/usr/bin/env node
'use strict';

/**
 * Pré-visualização local da página estática (docs/).
 *
 * Serve a pasta `docs/` como o GitHub Pages faz, para conferir antes de publicar.
 *
 *   npm run pagina:ver          → http://localhost:8080/
 *   npm run pagina:ver -- 9000  → outra porta
 *
 * A opção --subpasta simula o endereço real do Pages
 * (https://usuario.github.io/repositorio/), útil para garantir que os caminhos
 * relativos funcionam quando a página não está na raiz do domínio:
 *
 *   node scripts/servir-pagina.js --subpasta
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'docs');
const argumentos = process.argv.slice(2);
const subpasta = argumentos.includes('--subpasta');
const porta = Number(argumentos.find((a) => /^\d+$/.test(a))) || Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const PREFIXO = subpasta ? '/Magic-Prompt' : '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

if (!fs.existsSync(DIR)) {
  console.error('A pasta docs/ não existe. Rode `npm run pagina` primeiro.');
  process.exit(1);
}

const servidor = http.createServer((req, res) => {
  let caminho = decodeURIComponent(new URL(req.url, 'http://local').pathname);

  if (PREFIXO) {
    if (caminho === PREFIXO) {
      res.writeHead(301, { Location: `${PREFIXO}/` });
      return res.end();
    }
    if (!caminho.startsWith(`${PREFIXO}/`)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(`Fora da subpasta. Acesse http://localhost:${porta}${PREFIXO}/`);
    }
    caminho = caminho.slice(PREFIXO.length);
  }

  if (caminho === '/' || caminho === '') caminho = '/index.html';
  const destino = path.join(DIR, path.normalize(caminho));
  if (!destino.startsWith(DIR)) {
    res.writeHead(403);
    return res.end('Acesso negado');
  }

  fs.readFile(destino, (erro, conteudo) => {
    if (erro) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 — arquivo não encontrado');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(destino).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(conteudo);
  });
});

servidor.listen(porta, HOST, () => {
  console.log('\n  Página estática (docs/) servida localmente');
  console.log(`  http://localhost:${porta}${PREFIXO}/`);
  if (PREFIXO) console.log('  (simulando o endereço https://usuario.github.io/Magic-Prompt/)');
  console.log('');
});
