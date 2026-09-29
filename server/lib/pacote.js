'use strict';

/**
 * MONTAGEM DA PASTA DO CLIENTE
 * ----------------------------
 * Além do `prompt_site.txt`, o sistema gera os arquivos de apoio que tornam a
 * pasta utilizável na ferramenta de criação de sites:
 *
 *   nome_cliente_nome_empresa/
 *   ├── LEIA-ME.txt
 *   ├── prompt_site.txt
 *   ├── dados-cliente.json
 *   ├── prompt_resumo.txt
 *   ├── midias/      (arquivos enviados)
 *   ├── branding/    (logo enviado + identidade-visual.md)
 *   └── conteudo/    (textos, depoimentos, faq, seo, checklist)
 */

const { texto, temTexto, juntar, dataLegivel } = require('./utils');
const { gerarPromptResumo, obterContexto } = require('./prompt-engine');

/* ------------------------- Arquivos de conteúdo ------------------------- */

function arquivoLeiaMe(ctx, meta) {
  const pasta = meta.pasta;
  return `COMO USAR ESTA PASTA
====================

Projeto: ${ctx.empresa.nomeFantasia}${ctx.endereco.cidade ? ` — ${ctx.endereco.cidade}/${ctx.endereco.estado || ''}` : ''}
Segmento: ${meta.nomeSegmento}
Gerado em: ${dataLegivel(meta.geradoEm)}
Pasta do cliente: ${pasta}

1) O arquivo principal é o prompt_site.txt. Copie o conteúdo integral e cole na
   ferramenta de IA que vai criar o site.

2) Anexe (ou envie junto) os arquivos das pastas:
   - midias/    imagens e vídeos que devem aparecer no site
   - branding/  logo, paleta de cores e referências visuais
   - conteudo/  textos, depoimentos e FAQ

3) Se a ferramenta limitar o tamanho da mensagem, use o arquivo
   prompt_resumo.txt (versão curta) e depois complemente com as seções do
   prompt completo conforme a ferramenta pedir.

4) dados-cliente.json guarda tudo o que foi preenchido no formulário. Use-o para
   reabrir este cliente no sistema e gerar uma nova versão do prompt quando
   alguma informação mudar.

5) Pendências registradas nesta geração:
${(meta.faltando || []).length ? meta.faltando.map((f) => `   - ${f}`).join('\n') : '   - nenhuma: todos os campos relevantes foram preenchidos.'}

Dúvidas sobre o que pedir ao cliente? Veja conteudo/checklist-entrega.md.
`;
}

function arquivoTextos(ctx) {
  const linhas = [
    `# Textos — ${ctx.empresa.nomeFantasia}`,
    '',
    'Este arquivo reúne o que o cliente enviou e o que ainda precisa ser escrito.',
    'O prompt (prompt_site.txt) já instrui a IA a produzir os textos que faltam.',
    '',
    '## Textos enviados pelo cliente',
    '',
    texto(ctx.conteudo.textos) || '_Nenhum texto enviado. A IA deve redigir todo o conteúdo seguindo o tom de voz do prompt._',
    '',
    '## Estrutura de textos a produzir',
    '',
    '| Página | Bloco | Limite sugerido |',
    '| --- | --- | --- |',
    '| Home | Headline | até 8 palavras |',
    '| Home | Subheadline | 1 frase, até 20 palavras |',
    '| Home | Chamadas dos blocos | 1 linha por bloco |',
    '| Serviços | Descrição por serviço | 3 a 5 linhas |',
    '| Sobre | História e propósito | 300 a 500 palavras |',
    '| Contato | Instruções de chegada | 2 a 4 linhas |',
    '| Rodapé | Descrição curta | até 25 palavras |',
    '',
    '## Serviços/produtos do cliente',
    '',
    ctx.listaServicos.length
      ? ctx.listaServicos
          .map((s) =>
            juntar([`- **${s.nome}**`, s.descricao || '', s.duracao ? `(${s.duracao})` : '', s.preco ? `— ${s.preco}` : ''], ' ')
          )
          .join('\n')
      : '_Não informados. Usar a lista sugerida no prompt._',
    '',
    '## Diferenciais',
    '',
    (ctx.diferenciais.length ? ctx.diferenciais : ctx.modelo.conteudoPronto.diferenciais).map((d) => `- ${d}`).join('\n'),
    '',
  ];
  if (temTexto(ctx.conteudo.observacoes)) {
    linhas.push('## Observações do cliente sobre o conteúdo', '', texto(ctx.conteudo.observacoes), '');
  }
  return linhas.join('\n');
}

function arquivoDepoimentos(ctx) {
  const linhas = [
    `# Depoimentos — ${ctx.empresa.nomeFantasia}`,
    '',
    ctx.depoimentos.length
      ? 'Depoimentos reais enviados pelo cliente (usar exatamente estes textos):'
      : 'O cliente não enviou depoimentos. **Não invente.** Colete avaliações reais no Google e peça autorização de uso.',
    '',
  ];
  if (ctx.depoimentos.length) {
    ctx.depoimentos.forEach((d, i) => {
      linhas.push(`## Depoimento ${i + 1}`, `> "${d.texto}"`, '', `- Autoria: ${d.nome || '(pedir autorização e nome ao cliente)'}`, d.nota ? `- Nota: ${d.nota}` : '', '');
    });
  } else {
    linhas.push(
      'Como coletar:',
      '1. Peça avaliação no Google Meu Negócio logo após o atendimento (link curto no WhatsApp).',
      '2. Peça ao cliente o print ou a cópia do depoimento por escrito.',
      '3. Registre a autorização de uso de nome, texto e foto.',
      '',
      'Sugestões de temas para pedir depoimento (não são depoimentos prontos):',
      '- Como foi o atendimento e a pontualidade.',
      '- Como o resultado atendeu à expectativa.',
      '- O que faria indicar a empresa a um amigo.',
      ''
    );
  }
  return linhas.filter((l) => l !== '').join('\n');
}

function arquivoFaq(ctx) {
  const faq = ctx.faq.length ? ctx.faq : ctx.modelo.conteudoPronto.faq;
  const origem = ctx.faq.length ? 'enviadas pelo cliente' : 'sugeridas pelo modelo do segmento (validar as respostas com o cliente)';
  const linhas = [
    `# Perguntas frequentes — ${ctx.empresa.nomeFantasia}`,
    '',
    `Perguntas ${origem}:`,
    '',
  ];
  faq.forEach((f, i) => {
    linhas.push(`${i + 1}. **${f.pergunta}**`, `   ${f.resposta || '(resposta a validar com o cliente)'}`, '');
  });
  linhas.push(
    'Boas práticas:',
    '- Resposta de até 3 frases, começando pela informação principal.',
    '- Se a pergunta for sobre preço, explique o que faz o valor variar e ofereça o contato direto.',
    '- Marcar a página como FAQPage (schema.org) para aparecer nos resultados do Google.',
    ''
  );
  return linhas.join('\n');
}

function arquivoSeo(ctx) {
  const cidade = texto(ctx.endereco.cidade) || '[cidade]';
  const bairro = texto(ctx.endereco.bairro);
  const base = ctx.modelo.conteudoPronto.seo;
  const palavras = (Array.isArray(ctx.conteudo.palavrasChave) ? ctx.conteudo.palavrasChave.map(texto).filter(Boolean) : [])
    .concat(base.palavrasChave)
    .map((p) => p.replace(/\[CIDADE\]/g, cidade).replace(/\[BAIRRO\]/g, bairro || cidade));
  const unicas = palavras.filter((p, i, a) => a.indexOf(p) === i);

  return [
    `# SEO — ${ctx.empresa.nomeFantasia}`,
    '',
    '## Title e description da home',
    '',
    `- Title: \`${(texto(ctx.conteudo.seoTitulo) || base.tituloHome.replace(/\[NOME\]/g, ctx.empresa.nomeFantasia).replace(/\[CIDADE\]/g, cidade)).slice(0, 60)}\``,
    `- Description: \`${(texto(ctx.conteudo.seoDescricao) || base.descricaoHome.replace(/\[NOME\]/g, ctx.empresa.nomeFantasia).replace(/\[CIDADE\]/g, cidade)).slice(0, 155)}\``,
    '',
    '## Palavras-chave',
    '',
    unicas.slice(0, 20).map((p) => `- ${p}`).join('\n'),
    '',
    '## Palavras-chave por serviço',
    '',
    ctx.listaServicos.map((s) => `- ${s.nome.toLowerCase()} em ${cidade}`).join('\n'),
    '',
    '## Google Meu Negócio',
    '',
    '- Nome do perfil igual ao nome fantasia do site (sem palavras-chave extras).',
    '- Endereço e telefone idênticos ao rodapé do site.',
    '- Categoria principal + categorias secundárias conforme os serviços.',
    '- Fotos reais (fachada, interior, equipe, serviços) publicadas mensalmente.',
    '- Link curto de avaliação enviado ao cliente após cada atendimento.',
    '',
    '## Checklist técnico de SEO',
    '',
    '- [ ] Title e description únicos por página',
    '- [ ] Um único H1 por página, com a palavra-chave principal',
    '- [ ] Alt descritivo em todas as imagens',
    '- [ ] URLs amigáveis e em minúsculas',
    '- [ ] sitemap.xml e robots.txt publicados e enviados ao Search Console',
    '- [ ] Dados estruturados LocalBusiness + FAQPage validados',
    '- [ ] Open Graph com imagem 1200x630',
    '- [ ] HTTPS e redirecionamento de www',
    '',
  ].join('\n');
}

function arquivoChecklist(ctx, meta) {
  return [
    `# Checklist de entrega — ${ctx.empresa.nomeFantasia}`,
    '',
    '## Antes de publicar',
    '',
    '- [ ] Todos os textos revisados (sem placeholder e sem "lorem ipsum")',
    '- [ ] Telefone, WhatsApp e e-mail testados em celular e desktop',
    '- [ ] Endereço confere com o Google Maps e com o Google Meu Negócio',
    '- [ ] Horários atualizados, incluindo feriados',
    '- [ ] Formulários enviando e com mensagem de sucesso configurada',
    '- [ ] Política de Privacidade publicada e linkada no rodapé',
    '- [ ] Imagens comprimidas e com alt',
    '- [ ] Teste em Chrome, Safari e Firefox; telas de 360px a 1920px',
    '- [ ] GA4 e Meta Pixel disparando os eventos de conversão',
    '- [ ] Backup e acessos documentados',
    '',
    '## Materiais a solicitar ao cliente',
    '',
    '- [ ] Logo em vetor (SVG/AI/PDF)',
    '- [ ] Fotos próprias em alta resolução (fachada, ambiente, equipe, serviços/produtos)',
    '- [ ] Depoimentos reais com autorização de uso',
    '- [ ] Textos institucionais (história, missão, diferenciais)',
    '- [ ] Lista de preços atualizada ou decisão de manter "consultar valores"',
    '- [ ] Acesso ao perfil do Google Meu Negócio e às redes sociais',
    '',
    '## Pendências registradas nesta geração',
    '',
    (meta.faltando || []).length ? meta.faltando.map((f) => `- [ ] ${f}`).join('\n') : '- Nenhuma pendência de cadastro.',
    '',
    '## Objetivo declarado do site',
    '',
    `- ${meta.objetivoNome}`,
    `- Segmento: ${meta.nomeSegmento}`,
    `- E-commerce nesta versão: ${meta.ecommerce ? 'sim' : 'não'}`,
    '',
  ].join('\n');
}

function arquivoIdentidadeVisual(ctx) {
  const v = ctx.modelo.estiloVisual;
  const cores = ctx.cores.length ? ctx.cores : v.paletas[0].cores;
  const linhas = [
    `# Identidade visual — ${ctx.empresa.nomeFantasia}`,
    '',
    `Estilo desejado: ${texto(ctx.identidade.estilo) || v.estilos[0] + ' (sugestão do modelo)'}`,
    '',
    '## Paleta de cores',
    '',
    '| Cor | Hex | Uso sugerido |',
    '| --- | --- | --- |',
    ...cores.map((c, i) => `| ${c.nome || `Cor ${i + 1}`} | ${c.hex || 'a definir'} | ${['Fundo/base', 'Secundária', 'Destaque e CTA', 'Texto', 'Apoio'][i] || 'Apoio'} |`),
    '',
    'Observação: manter contraste mínimo de 4.5:1 entre texto e fundo (WCAG AA).',
    '',
    '## Tipografia',
    '',
    `- Títulos: ${v.tipografia.titulos}`,
    `- Corpo: ${v.tipografia.corpo}`,
    '- Escala: H1 40–56px / H2 28–36px / corpo 16–18px / legenda 14px',
    '- Carregar no máximo 2 famílias e apenas os pesos utilizados',
    '',
    '## Ícones e imagens',
    '',
    '- Ícones de linha, mesma família e espessura em todo o site.',
    '- Fotos em boa luz, sem filtros pesados; proporções consistentes (16:9 hero, 4:3 cards, 1:1 produtos, 3:4 retratos).',
    '',
    '## Referências de estilo enviadas pelo cliente',
    '',
  ];
  const refs = (Array.isArray(ctx.identidade.referencias) ? ctx.identidade.referencias : []).filter(Boolean).map(texto);
  linhas.push(refs.length ? refs.map((r) => `- ${r}`).join('\n') : '- Nenhuma referência enviada.');
  linhas.push('');
  if (temTexto(ctx.identidade.observacoes)) {
    linhas.push('## Observações do cliente', '', texto(ctx.identidade.observacoes), '');
  }
  linhas.push(
    '## Checklist de marca',
    '',
    '- [ ] Logo em vetor disponível',
    '- [ ] Versões do logo (colorida, branca, preta) e área de respiro definida',
    '- [ ] Paleta oficial validada pelo cliente',
    '- [ ] Tipografia licenciada ou gratuita definida',
    '- [ ] Favicon gerado',
    ''
  );
  return linhas.join('\n');
}

/* ----------------------------- API pública ----------------------------- */

/** Mapa { caminhoRelativo: conteudoTexto } dos arquivos de apoio. */
function gerarArquivosDeApoio(entrada, arquivos, meta) {
  // Reaproveita o contexto já normalizado pelo motor de prompt.
  const ctx = obterContexto(entrada, arquivos);
  return {
    'LEIA-ME.txt': arquivoLeiaMe(ctx, meta),
    'prompt_resumo.txt': gerarPromptResumo(entrada, arquivos),
    'conteudo/textos.md': arquivoTextos(ctx),
    'conteudo/depoimentos.md': arquivoDepoimentos(ctx),
    'conteudo/faq.md': arquivoFaq(ctx),
    'conteudo/seo-palavras-chave.md': arquivoSeo(ctx),
    'conteudo/checklist-entrega.md': arquivoChecklist(ctx, meta),
    'branding/identidade-visual.md': arquivoIdentidadeVisual(ctx),
  };
}

/** Resumo textual (para a interface) do que existe na pasta do cliente. */
function resumoPasta(meta) {
  return [
    `${meta.pasta}/`,
    '├── prompt_site.txt',
    '├── prompt_resumo.txt',
    '├── LEIA-ME.txt',
    '├── dados-cliente.json',
    '├── midias/',
    '├── branding/',
    '│   └── identidade-visual.md',
    '└── conteudo/',
    '    ├── textos.md',
    '    ├── depoimentos.md',
    '    ├── faq.md',
    '    ├── seo-palavras-chave.md',
    '    └── checklist-entrega.md',
  ].join('\n');
}

module.exports = { gerarArquivosDeApoio, resumoPasta };
