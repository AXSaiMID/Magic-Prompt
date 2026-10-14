# ✨ Magic Prompt

Sistema que **gera automaticamente prompts detalhados para a criação de sites de clientes**, com base em modelos pré-definidos por segmento de atuação.

O prompt gerado é entregue junto com uma **pasta organizada do cliente** (prompt + mídias + branding + conteúdo), pronta para ser usada por uma IA de criação de sites.

```
preenche o cadastro  →  escolhe o segmento  →  gera o prompt  →  baixa a pasta (.zip)  →  cola na IA
```

---

## Índice

- [Como rodar](#como-rodar)
- [Fluxo de uso](#fluxo-de-uso)
- [Segmentos suportados](#segmentos-suportados)
- [O que o prompt gerado contém](#o-que-o-prompt-gerado-contém)
- [Pasta gerada por cliente](#pasta-gerada-por-cliente)
- [Dados cadastrados por cliente](#dados-cadastrados-por-cliente)
- [API REST](#api-rest)
- [Como criar ou ajustar um modelo de segmento](#como-criar-ou-ajustar-um-modelo-de-segmento)
- [Testes](#testes)
- [Configurações](#configurações)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Regras de geração do prompt](#regras-de-geração-do-prompt)
- [Limites, ética e privacidade](#limites-ética-e-privacidade)
- [Próximos passos](#próximos-passos)

---

## Como rodar

**Não há dependências para instalar.** O sistema usa apenas o Node.js padrão (versão 18 ou superior) e não exige build.

```bash
node --version      # precisa ser >= 18
npm start           # inicia em http://localhost:3000
```

Outros comandos:

```bash
npm run dev         # inicia com reinício automático ao salvar arquivos
npm test            # roda a suíte de testes (71 testes)
npm run exemplo     # gera prompts de exemplo em exemplos/ sem abrir a interface
npm run pagina      # regenera a página estática (docs/) do GitHub Pages
npm run pagina:ver  # pré-visualiza a página estática localmente
```

### Publicar como página (GitHub Pages)

O repositório já vem pronto para publicar: a pasta **`docs/`** contém uma versão **100% estática** do sistema, na qual o motor de prompt e o gerador de `.zip` rodam no próprio navegador.

```bash
npm run pagina       # regenera docs/ a partir de server/lib/ e web/
npm run pagina:ver   # abre a página em http://localhost:8080 (prévia local)
```

**Como ativar (uma vez):** no GitHub, vá em **Settings → Pages**, escolha
*Source: Deploy from a branch*, **Branch: `main`** e **Folder: `/docs`**, e salve.
A página fica em `https://<usuario>.github.io/<repositorio>/`.

Para conferir a página **antes** de mesclar, aponte o Pages para a branch
`arena/01a0eb21-magic-prompt` com a pasta `/docs` — depois é só trocar para `main`.
Também funciona publicar pela **raiz** do repositório: o `index.html` da raiz
encaminha o visitante para `/docs/`.

| Modo | O que roda | Onde ficam os dados |
| --- | --- | --- |
| **Página estática** (`docs/`) | Motor de prompt e montagem do `.zip` no navegador | Histórico no `localStorage` do visitante; arquivos enviados apenas em memória (saem no `.zip` baixado) |
| **Servidor** (`npm start`) | API + armazenamento em disco por cliente | `data/clientes/<id>/` na máquina que roda o servidor |

A versão estática gera **exatamente o mesmo prompt** que o servidor — o teste
`test/pagina.test.js` compara as duas saídas byte a byte e falha se alguém
alterar o motor e esquecer de rodar `npm run pagina`.

Variáveis de ambiente opcionais:

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta do servidor |
| `HOST` | `0.0.0.0` | Interface de rede |
| `MAGIC_PROMPT_DATA` | `./data` | Onde os projetos dos clientes são gravados |
| `MAGIC_PROMPT_MAX_ARQUIVO` | `209715200` (200 MB) | Tamanho máximo por arquivo enviado |
| `MAGIC_PROMPT_MAX_UPLOAD` | `524288000` (500 MB) | Tamanho máximo por requisição de upload |

> Os dados dos clientes ficam **apenas na máquina onde o sistema roda** (`data/`), não são versionados no Git e saem do sistema somente pelo `.zip` baixado pelo operador.

---

## Fluxo de uso

1. **Novo projeto** → escolha o segmento de atuação e informe o nome da empresa.
   O sistema já abre o cadastro com textos de exemplo do segmento pré-preenchidos.
2. **Preencha as sete etapas** do cadastro (o salvamento é automático a cada pausa na digitação):

   | Etapa | O que entra |
   | --- | --- |
   | 1. Segmento e objetivo | Modelo do nicho, objetivo do site (agendamento, venda, orçamento, institucional, autoridade, relacionamento) e quais recursos entram (loja, blog, FAQ, galeria, equipe, depoimentos) |
   | 2. Empresa | Nome fantasia, razão social, CNPJ, telefone, WhatsApp, e-mail, horário, idioma, endereço completo e lista de serviços/produtos |
   | 3. Negócio e público | Descrição, público-alvo, faixa etária, diferenciais e observações |
   | 4. Redes e links | Google Maps, Instagram, Facebook, YouTube, Pinterest, TikTok, site atual, links extras (com botão **+**) e sites de referência |
   | 5. Identidade visual | Cores (hex ou nome, com paleta sugerida por segmento), estilo desejado, fontes e observações |
   | 6. Conteúdo | Textos enviados, depoimentos, FAQ, palavras-chave, título/descrição de SEO e restrições de divulgação |
   | 7. Imagens e vídeos | Upload de arquivos em `midias/`, `branding/` e `conteudo/`, com pré-visualização e exclusão |

3. **Gerar prompt** → o texto aparece no painel lateral, editável, com contagem de palavras, tokens aproximados e a lista de pendências do cadastro.
4. **Revisar e exportar**:
   - `📋 Copiar` — copia o prompt para colar na ferramenta de IA;
   - `⬇ .txt` — baixa apenas o prompt;
   - `⬇ Baixar pasta (.zip)` — baixa a pasta completa do cliente (prompt + mídias + branding + conteúdo + dados).
5. **Reaproveitar** → no histórico, qualquer projeto pode ser duplicado para um novo cliente do mesmo nicho, trocando apenas os dados específicos.

O **Histórico de clientes** fica na barra lateral, com busca por nome ou empresa, data da última alteração e um indicador de pendências de cadastro.

---

## Segmentos suportados

São **14 modelos**, agrupados por área na interface (com busca por nome):

| Área | Segmento | Agendamento | Loja opcional | Páginas obrigatórias |
| --- | --- | :---: | :---: | --- |
| Beleza | ✨ Centro de Estética e Beleza | sim | sim | 9 |
| Beleza | 💇‍♀️ Salão de Beleza | sim | sim | 8 |
| Beleza | 💈 Barbearia | sim | sim | 9 |
| Pet | 🐶 Pet Shop | não | sim | 6 |
| Pet | 🛁 Pet Shop com Banho e Tosa | sim | sim | 8 |
| Pet | 🩺 Pet Shop com Clínica Veterinária | sim | sim | 7 |
| Pet | 🐾 Clínica Veterinária | sim | sim | 7 |
| Construção e Imóveis | 📐 Arquitetura | sim | sim | 8 |
| Construção e Imóveis | 📊 Engenharia | não | não | 8 |
| Construção e Imóveis | 🧱 Construção | não | não | 9 |
| Construção e Imóveis | 🏠 Imobiliária | sim | não | 8 |
| Construção e Imóveis | 🏙️ Empreendimentos Imobiliários | sim | não | 11 |
| Casa e Decoração | 🛋️ Decoração | sim | sim | 9 |
| Geral | 🏢 Empresas em Geral | não | sim | 9 |

> **Empresas em Geral** é o modelo coringa: serve para qualquer negócio fora dos nichos acima (prestadores de serviço, comércios, indústrias, escritórios) e é a saída quando o cliente vende produtos mas o segmento dele não tem loja no modelo, como engenharia e imobiliária.

Cada modelo traz: estrutura de páginas com seções ordenadas, funcionalidades típicas (essenciais e desejáveis), integrações, tom de voz, estilo visual com duas paletas prontas, serviços de exemplo, FAQ, depoimentos-modelo, SEO local e **cuidados de conformidade do nicho**.

Cada modelo também declara metadados que o motor usa para escrever bem: o **setor** (aparece no papel da IA), o **gênero gramatical** e o **termo de busca** (é o que produz "uma clínica veterinária" e "melhor imobiliária em [cidade]" sem concordância errada) e o **subtipo de dado estruturado** (`HairSalon`, `VeterinaryCare`, `RealEstateAgent`, `GeneralContractor`…), usado no JSON-LD do prompt.

---

## O que o prompt gerado contém

O documento tem 19 seções e cerca de **5.000 a 6.000 palavras** (aproximadamente 8 mil tokens). Nada de seções vazias ou `[preencher aqui]`.

| # | Seção | Conteúdo |
| --- | --- | --- |
| — | Ficha do projeto | Cliente, empresa, segmento, localização, pasta, modelo base e data |
| 1 | Papel e missão | Persona da IA, entregáveis e formato de resposta |
| 2 | Arquivos de apoio | Árvore da pasta e **lista real dos arquivos enviados** |
| 3 | Descrição do negócio | Descrição, localização, serviços/produtos e diferenciais |
| 4 | Público-alvo | Perfil, dispositivo, região de influência e objeções a derrubar |
| 5 | Objetivo do site | Objetivo principal, secundários e métricas de sucesso com conversões |
| 6 | Estrutura de páginas | Cada página com objetivo, seções na ordem e orientação específica |
| 7 | Funcionalidades e integrações | Obrigatórias, desejáveis e **especificação da loja** (fluxo, frete, cupons, catálogo) quando houver e-commerce |
| 8 | Conteúdo e copy sugerida | Textos do cliente, estrutura de redação por página, depoimentos e FAQ (com guarda contra prova social falsa) |
| 9 | Tom de voz | Personalidade, regras práticas, o que evitar e exemplos de headline/CTA |
| 10 | Estilo visual | Paleta aplicada com hex, tipografia, escala, tokens e diretrizes do nicho |
| 11 | Uso das imagens e vídeos | **Instrução arquivo por arquivo** (hero, galeria, cards, antes/depois, logo, documentos) + otimização e `alt` |
| 12 | Links e contato | NAP completo, link de WhatsApp pronto (`https://wa.me/...`) e regras de aplicação |
| 13 | SEO básico e local | Title/description, palavras-chave por página e serviço, cauda longa, JSON-LD e Google Meu Negócio |
| 14 | Técnica, LGPD e acessibilidade | Metas de performance, WCAG 2.1 AA, CMS, backups e conformidade |
| 15 | Cuidados do segmento | Regras de comunicação e limites legais do nicho (CRMV, propaganda de resultados etc.) |
| 16 | O que evitar | Lista de anti-padrões explícita |
| 17 | Critérios de aceite | Checklist de entrega e materiais a solicitar ao cliente |
| 18 | Observações do operador | Campo livre para instruções internas |
| — | Resumo para o chat | Versão curta (~2 KB) para ferramentas com limite de caracteres |

### Exemplos prontos

A pasta [`exemplos/`](exemplos/) tem quatro projetos completos gerados pelo sistema: estética com loja, barbearia sem loja, clínica veterinária com blog e **imobiliária** (busca de imóveis, captação de proprietários e locação). Rode `npm run exemplo` para recriá-los.

---

## Pasta gerada por cliente

O nome segue o padrão `nome_cliente_nome_empresa`:

```
maria-souza_bella-estetica/
├── prompt_site.txt               ← prompt completo (editável no sistema)
├── prompt_resumo.txt             ← versão curta para chats com limite
├── LEIA-ME.txt                   ← como usar a pasta + pendências
├── dados-cliente.json            ← tudo que foi preenchido (permite reimportar)
├── midias/                       ← imagens e vídeos para o site
├── branding/
│   ├── logo-principal.png        ← logo enviado pelo cliente
│   └── identidade-visual.md      ← paleta com hex, tipografia, referências e checklist
└── conteudo/
    ├── textos.md
    ├── depoimentos.md
    ├── faq.md
    ├── seo-palavras-chave.md
    ├── checklist-entrega.md
    └── textos-sobre.docx         ← documentos enviados pelo cliente
```

Os arquivos `.md` das pastas `branding/` e `conteudo/` são **regravados a cada geração do prompt**, sempre coerentes com o cadastro atual.

---

## Dados cadastrados por cliente

| Bloco | Campos |
| --- | --- |
| **Empresa** | Nome fantasia, razão social (opcional), CNPJ (opcional), telefone (opcional), WhatsApp, e-mail, horário de atendimento, idioma, endereço completo (rua, número, complemento, bairro, cidade, UF, CEP) |
| **Serviços/produtos** | Nome, descrição, duração e preço — lista dinâmica com **+ Adicionar** |
| **Negócio** | Descrição, público-alvo, faixa etária, sensibilidade a preço, diferenciais, sazonalidade, observações |
| **Objetivo** | Principal + secundários + o que o cliente espera alcançar |
| **Redes** | Google Maps, Instagram, Facebook, YouTube, Pinterest, TikTok, site atual, links extras ilimitados, sites de referência |
| **Identidade** | Cores (hex/nome) com paleta sugerida, estilo, fontes, observações da marca |
| **Conteúdo** | Textos, depoimentos (opcional), FAQ (opcional), palavras-chave, title/description, restrições de divulgação |
| **Mídias** | Upload com arrastar-e-soltar em três categorias, pré-visualização e exclusão |
| **Opções** | Loja online, blog, FAQ, depoimentos, galeria, equipe, clube de assinatura, observações do operador |

Campos obrigatórios para gerar o prompt: **segmento**, **nome fantasia** e **pelo menos um contato** (WhatsApp/telefone ou e-mail). Os demais são opcionais e, quando vazios, o sistema usa os exemplos do segmento — indicando isso na lista de pendências.

---

## API REST

Todas as rotas são JSON, exceto upload (multipart) e download (zip).

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/health` | Versão, quantidade de segmentos, projetos e diretório de dados |
| `GET` | `/api/segmentos` | Modelos, objetivos, estilos e idiomas |
| `GET` | `/api/segmentos/:id` | Modelo completo do segmento |
| `GET` | `/api/segmentos/:id/sugestoes` | Textos de exemplo para pré-preencher o formulário |
| `POST` | `/api/prompt/preview` | Gera o prompt **sem salvar** (`{dados, forcar?}`) |
| `POST` | `/api/prompt/resumo` | Gera a versão curta |
| `GET` | `/api/projetos` | Histórico de clientes |
| `POST` | `/api/projetos` | Cria o projeto e gera o prompt |
| `GET` | `/api/projetos/:id` | Projeto, dados, prompt, arquivos e árvore da pasta |
| `PUT` | `/api/projetos/:id` | Atualiza e regenera (`somenteSalvar: true` só grava; `somentePrompt: true` salva edição manual) |
| `PUT` | `/api/projetos/:id/prompt` | Salva o prompt editado à mão |
| `POST` | `/api/projetos/:id/duplicar` | Reaproveita a estrutura para outro cliente |
| `DELETE` | `/api/projetos/:id` | Exclui o projeto e a pasta do cliente |
| `POST` | `/api/projetos/:id/arquivos?categoria=midias\|branding\|conteudo` | Upload (`multipart/form-data`, campo `arquivos`) |
| `GET` | `/api/projetos/:id/arquivos` | Lista os arquivos enviados |
| `GET` | `/api/projetos/:id/arquivos/raw?categoria=&nome=` | Entrega o arquivo para pré-visualização |
| `DELETE` | `/api/projetos/:id/arquivos?categoria=&nome=` | Remove um arquivo |
| `GET` | `/api/projetos/:id/download` | ZIP com a pasta completa do cliente |

Exemplo:

```bash
curl -X POST http://localhost:3000/api/projetos \
  -H 'Content-Type: application/json' \
  -d '{"dados":{"segmento":"barbearia","empresa":{"nomeFantasia":"Barbearia Tradição","whatsapp":"(31) 97777-6666"}},"forcar":true}'
```

---

## Como criar ou ajustar um modelo de segmento

Os modelos ficam em um único arquivo: [`server/lib/segmentos.js`](server/lib/segmentos.js). Para adicionar um nicho novo (ex.: "Estúdio de tatuagem"), copie um objeto de `MODELOS` e ajuste os campos — o formulário, o prompt e os arquivos de apoio passam a funcionar automaticamente, sem tocar em nenhum outro arquivo.

Campos de cada modelo:

```js
{
  id, nome, emoji, area, resumo,
  suportaEcommerce, temAgendamento, objetivoRecomendado,
  descricaoNegocioPadrao, publicoAlvoPadrao,
  tomDeVoz:     { personalidade, regras, evitar, exemplos },
  estiloVisual: { estilos, paletas: [{ nome, descricao, cores: [{ nome, hex }] }], tipografia, diretrizes, imagensIdeais, evitar },
  paginas:      [{ nome, obrigatoria, objetivo, secoes[], dica }],
  funcionalidades: { essenciais, desejaveis, integracoes },
  conteudoPronto:  { servicos, diferenciais, faq, depoimentos, seo },
  ecommerce:    { categorias, recursos, observacoes },
  cuidados:     [ ... ]
}
```

Os textos podem usar os marcadores `[CIDADE]`, `[BAIRRO]`, `[NOME]` e `[SERVIÇO]`, substituídos automaticamente pelos dados do cliente.

Depois de editar, rode `npm test` (a suíte valida completude do modelo e o resultado do prompt) e `npm run exemplo` para inspecionar a saída.

---

## Testes

```bash
npm test
```

71 testes em seis arquivos:

| Arquivo | O que cobre |
| --- | --- |
| `test/segmentos.test.js` | Integridade dos 7 modelos: páginas, seções, funcionalidades, tom, paletas com hex válido, FAQ, SEO e especificidades de cada nicho |
| `test/prompt-engine.test.js` | Geração do prompt: 19 seções obrigatórias, dados do cliente presentes, ausência de placeholders, e-commerce condicional, mídias citadas por nome, guarda contra depoimentos inventados, SEO local, resumo curto e validação |
| `test/zip.test.js` | Escritor de ZIP: CRC32, índice central, nomes UTF-8, conteúdo recuperável e muitos arquivos |
| `test/api.test.js` | Integração HTTP ponta a ponta: criar projeto, gerar prompt, upload multipart, arquivo bruto, path traversal bloqueado, edição manual, ZIP completo, duplicação e exclusão |
| `test/interface.test.js` | Sanidade da interface: ids do HTML, arquivos estáticos e cobertura do CSS |
| `test/pagina.test.js` | Página estática: bundle atualizado, prompt idêntico ao do servidor, `Buffer` do navegador, `.zip` gerado no navegador e ausência de chamadas ao servidor |

---

## Estrutura do repositório

```
server/
├── index.js              servidor HTTP: API REST + arquivos estáticos + montagem do .zip
└── lib/
    ├── segmentos.js      modelos pré-definidos por segmento (o "cérebro" do nicho)
    ├── prompt-engine.js  geração do prompt completo e da versão curta
    ├── pacote.js         geração dos arquivos de apoio (textos, FAQ, SEO, identidade)
    ├── store.js          persistência em JSON e arquivos por cliente
    ├── multipart.js      parser de multipart/form-data (sem dependências)
    ├── zip.js             escritor de ZIP (store + CRC32, sem dependências)
    └── utils.js          slugs, telefone, datas e formatação

public/                   interface do modo servidor (HTML + CSS + JS puros, sem build)
web/                      fontes da página estática (Buffer do navegador + app estático)
docs/                     PÁGINA GERADA para o GitHub Pages (`npm run pagina`)
test/                     suíte de testes + clientes de exemplo em fixtures/
scripts/gerar-exemplo.js  gera projetos completos em exemplos/
scripts/build-pagina.js   empacota o motor para o navegador e gera docs/
scripts/servir-pagina.js  pré-visualiza a página estática localmente
exemplos/                 saída de exemplo do sistema (versionada como documentação)
data/                     projetos dos clientes (não versionado)
```

---

## Regras de geração do prompt

O motor segue estas regras, verificadas por testes automatizados:

- **Nada de instrução genérica.** Cada seção cita nome, segmento, cidade, bairro, serviços e preços reais do cliente.
- **Objetivo explícito.** O objetivo do site é declarado no cabeçalho e detalhado com métricas de sucesso.
- **Estrutura do segmento.** As páginas vêm do modelo do nicho, filtradas pelas escolhas do operador (loja, blog, FAQ, galeria, equipe).
- **Funcionalidades separadas.** Obrigatórias ≠ desejáveis, com integrações nomeadas.
- **Tom e estilo sempre presentes.** Se o cliente não informa, o modelo do segmento fornece — e o prompt diz quando é sugestão.
- **Mídias citadas por arquivo.** O prompt lê o nome real de cada arquivo enviado e diz onde usá-lo (`banner-*` no hero, `antes-depois-*` nos resultados, logo no cabeçalho, documentos lidos antes de escrever).
- **SEO básico e local.** Title, description, palavras-chave por página/serviço, cauda longa, JSON-LD e Google Meu Negócio.
- **Sem invenção de fatos.** Depoimentos, avaliações, preços e credenciais nunca são criados pela IA; quando faltam, o prompt instrui a preparar o espaço e sinaliza a pendência.
- **Conformidade do nicho.** Cada segmento carrega suas próprias restrições (CRMV, propaganda de resultados estéticos, venda de medicamentos, LGPD de dados de saúde).

---

## Limites, ética e privacidade

- **O sistema não inventa dados.** Ele organiza e instrui. Toda informação factual (depoimentos, preços, credenciais) deve vir do cliente.
- **Depoimentos e imagens de clientes** só podem ser publicados com autorização de uso assinada — o prompt exige isso explicitamente em todos os segmentos.
- **Dados sensíveis** (saúde do pet/tutor, histórico de procedimentos) aparecem no cadastro apenas quando fazem parte do site, e a política de privacidade, o banner de cookies e o consentimento nos formulários são itens obrigatórios do prompt.
- **Dados de clientes ficam locais** em `data/` e não são versionados; o compartilhamento acontece pelo `.zip` baixado pelo operador.
- **Uploads grandes**: no modo servidor o corpo da requisição é processado em memória (limite de 200 MB por arquivo). No modo estático, os arquivos escolhidos ficam apenas na aba aberta e não são enviados a lugar nenhum.
- **Página estática**: por não ter servidor, o histórico mora no `localStorage` de cada navegador e os arquivos enviados precisam ser re-adicionados após recarregar — o `.zip` baixado é a via de saída. Precisa de histórico compartilhado entre pessoas? Use o modo servidor.

---

## Próximos passos

- [ ] **Integração direta com APIs de IA de criação de sites** — enviar prompt + arquivos automaticamente (hoje a ponte é o `.zip`).
- [x] **Versão estática para o GitHub Pages** — `docs/`, com o motor rodando no navegador (`npm run pagina`).
- [ ] Autenticação de operadores e trilha de auditoria por projeto.
- [ ] Versionamento de prompts por cliente (histórico de gerações e comparação).
- [ ] Importação de `dados-cliente.json` para reabrir projetos em outra máquina.
- [ ] Templates adicionais de segmento (restaurantes, academias, advocacia, imobiliárias).
- [ ] Processamento de imagens no upload (conversão para WebP e miniaturas).
- [ ] Exportação do prompt também em PDF e envio por e-mail ao cliente.
