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
| Botão “Falar com o Nômade no WhatsApp” | `Contact` | Ao clicar no CTA que abre o WhatsApp oficial do Nômade |

O `Lead` não é disparado em cliques com formulário inválido nem em falhas de geração. O CTA de WhatsApp usa o número oficial já publicado pelo Nômade (`+55 11 91654-7785`). Os eventos automáticos da Meta estão desativados para que apenas os eventos documentados sejam enviados.

## Arquivos

- `index.html`: código base, inicialização do Pixel e primeiro `PageView`.
- `src/lib/metaPixel.js`: filtro de rotas e função segura de envio de eventos.
- `src/components/MetaPixelTracker.jsx`: `PageView` em navegação SPA e evento `Contact` para WhatsApp.
- `src/pages/feijoada/FeijoadaRegister.jsx`: `CompleteRegistration` e `Lead` após a geração bem-sucedida do convite.
