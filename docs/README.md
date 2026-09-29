# Página estática (GitHub Pages)

**Esta pasta é gerada automaticamente.** Não edite os arquivos aqui:
altere as fontes em `server/lib/` e `web/` e rode `npm run pagina`.

| Arquivo | Origem |
| --- | --- |
| `motor.js` | bundle de `server/lib/*.js` + `web/buffer.js` + `web/motor-export.js` |
| `index.html`, `app.js` | `web/` |
| `styles.css` | `public/styles.css` + `web/extras.css` |

## Como publicar

Settings → Pages → Source: *Deploy from a branch* → Branch: `main` → Folder: `/docs` → Save.

A página fica em `https://<usuario>.github.io/<repositorio>/`.

> A versão estática gera o prompt e monta o `.zip` no próprio navegador.
> Arquivos enviados e histórico ficam apenas no navegador do visitante.
> Para o modo multiusuário com pastas no servidor, rode `npm start` na raiz do projeto.
