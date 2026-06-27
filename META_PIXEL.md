# Meta Pixel — LP Feijoada Nômade

## Configuração

- Pixel / Dataset ID: `1329781059130674`
- Código base: `index.html`, dentro do `<head>`
- Rotas rastreadas: `/feijoada` e `/feijoada/convite/:code`
- O painel administrativo e as demais páginas do projeto não enviam eventos para este Pixel.

## Eventos

| Ação | Evento Meta | Momento do disparo |
| --- | --- | --- |
| Carregamento da LP | `PageView` | Ao abrir `/feijoada` |
| Navegação para o voucher | `PageView` | Ao entrar em `/feijoada/convite/:code` |
| Botão “Quero meu convite” / envio do formulário | `CompleteRegistration` | Somente depois que o cadastro é aceito pelo backend |
| Voucher e QR Code gerados | `Lead` | No mesmo sucesso confirmado pelo backend, antes de abrir o voucher |
| Link ou botão de WhatsApp | `Contact` | Ao clicar em um link `wa.me`, `api.whatsapp.com`, `web.whatsapp.com` ou `whatsapp://` dentro das rotas rastreadas |

O `Lead` não é disparado em cliques com formulário inválido nem em falhas de geração. A LP atual não exibe um botão de WhatsApp; o gatilho `Contact` já está preparado para qualquer link de WhatsApp que exista nessas rotas, sem exigir mudança visual.

## Arquivos

- `index.html`: código base, inicialização do Pixel e primeiro `PageView`.
- `src/lib/metaPixel.js`: filtro de rotas e função segura de envio de eventos.
- `src/components/MetaPixelTracker.jsx`: `PageView` em navegação SPA e evento `Contact` para WhatsApp.
- `src/pages/feijoada/FeijoadaRegister.jsx`: `CompleteRegistration` e `Lead` após a geração bem-sucedida do convite.
