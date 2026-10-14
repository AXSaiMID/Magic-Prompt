#!/usr/bin/env node
'use strict';

/**
 * Gera pastas de exemplo completas em `exemplos/`, usando os clientes fictícios
 * de test/fixtures/clientes.js. Serve para:
 *   - ver o resultado do sistema sem preencher o formulário;
 *   - demonstrar o padrão de prompt para a equipe;
 *   - validar rapidamente uma alteração nos modelos do segmento.
 *
 * Uso: npm run exemplo
 */

const fs = require('fs');
const path = require('path');

const { gerarPrompt } = require('../server/lib/prompt-engine');
const { gerarArquivosDeApoio } = require('../server/lib/pacote');
const { clienteEstetica, clienteBarbearia, clienteVeterinaria, clienteImobiliaria } = require('../test/fixtures/clientes');

const RAIZ = path.resolve(__dirname, '..');
const DESTINO = path.join(RAIZ, 'exemplos');

const CLIENTES = [
  { dados: clienteEstetica, arquivos: exigirArquivos(), rotulo: 'Centro de estética com loja online' },
  { dados: clienteBarbearia, arquivos: {}, rotulo: 'Barbearia sem loja (agendamento)' },
  { dados: clienteVeterinaria, arquivos: {}, rotulo: 'Clínica veterinária com blog e loja' },
  { dados: clienteImobiliaria, arquivos: {}, rotulo: 'Imobiliária (busca de imóveis, captação e locação)' },
];

function exigirArquivos() {
  return {
    midias: [
      { nome: 'banner-fachada.jpg', extensao: 'jpg' },
      { nome: 'antes-depois-01.jpg', extensao: 'jpg' },
      { nome: 'antes-depois-02.jpg', extensao: 'jpg' },
      { nome: 'equipe.jpg', extensao: 'jpg' },
      { nome: 'institucional.mp4', extensao: 'mp4' },
    ],
    branding: [{ nome: 'logo-principal.png', extensao: 'png' }],
    conteudo: [{ nome: 'textos-sobre.docx', extensao: 'docx' }],
  };
}

function escrever(caminho, conteudo) {
  fs.mkdirSync(path.dirname(caminho), { recursive: true });
  fs.writeFileSync(caminho, conteudo, 'utf8');
}

function main() {
  fs.rmSync(DESTINO, { recursive: true, force: true });
  const linhas = ['# Exemplos gerados automaticamente', '', 'Rode `npm run exemplo` para recriar esta pasta.', ''];

  for (const cliente of CLIENTES) {
    const { texto, meta } = gerarPrompt(cliente.dados, cliente.arquivos);
    const pasta = path.join(DESTINO, meta.pasta);

    escrever(path.join(pasta, 'prompt_site.txt'), texto);
    const apoio = gerarArquivosDeApoio(cliente.dados, cliente.arquivos, meta);
    for (const [caminho, conteudo] of Object.entries(apoio)) escrever(path.join(pasta, caminho), conteudo);

    linhas.push(
      `- **${cliente.dados.empresa.nomeFantasia}** — ${cliente.rotulo}`,
      `  - pasta: \`exemplos/${meta.pasta}/\``,
      `  - ${meta.palavras.toLocaleString('pt-BR')} palavras · ~${meta.tokensAproximados.toLocaleString('pt-BR')} tokens · ${meta.paginas.length} páginas · objetivo: ${meta.objetivoNome}${meta.ecommerce ? ' + loja' : ''}`,
      `  - pendências de cadastro: ${meta.faltando.length ? meta.faltando.join(', ') : 'nenhuma'}`
    );

    console.log(`✓ ${meta.pasta}/prompt_site.txt — ${meta.palavras.toLocaleString('pt-BR')} palavras, ${meta.paginas.length} páginas`);
  }

  escrever(path.join(DESTINO, 'LEIA-ME.md'), `${linhas.join('\n')}\n`);
  console.log(`\nExemplos gerados em ${path.relative(RAIZ, DESTINO)}/\n`);
}

main();
