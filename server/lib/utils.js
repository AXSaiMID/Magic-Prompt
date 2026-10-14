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
