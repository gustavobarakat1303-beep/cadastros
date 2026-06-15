# Manual de Operação — Casa dos Bares

Sistema de cadastro, geração e validação de cupons de desconto das unidades
**Nômade** e **Pé de Manga**.

> **URL de produção:** https://casa-dos-bares.vercel.app

---

## 1. Visão geral do fluxo

```
Cliente  ──(QR/link)──►  Cadastro  ──►  Código único (ex.: NM-AB12CD) + QR Code
                                              │
Garçom/Hostess ──(PIN)──► Validador ──escaneia/digita──► consome o desconto (1x)
                                              │
Gestor ──(login)──► Painel Admin ──► relatórios, clientes, promoções, etc.
```

Cada código só pode ser validado **uma única vez**. A baixa é feita de forma
atômica no banco (função `dv_validate_code`), impedindo validação dupla.

---

## 2. Endereços de acesso

| Função | URL |
|--------|-----|
| Início | https://casa-dos-bares.vercel.app |
| Cadastro Nômade | https://casa-dos-bares.vercel.app/register/nomade |
| Cadastro Pé de Manga | https://casa-dos-bares.vercel.app/register/manga |
| Validador Nômade | https://casa-dos-bares.vercel.app/validar/nomade |
| Validador Pé de Manga | https://casa-dos-bares.vercel.app/validar/manga |
| Login do Admin | https://casa-dos-bares.vercel.app/admin/login |

**Domínios customizados (quando apontados):**
- `cadastro.nomaderestaurantebar.com.br` → Nômade
- `cadastro.pedemanga.com.br` → Pé de Manga

---

## 3. Acessos e senhas

### Painel administrativo
- **E-mail:** `gustavobarakat@pedemanga.com.br`
- **Senha:** fornecida separadamente (fora do controle de versão). Recomenda-se
  trocar a senha temporária no primeiro acesso.

### Validador (operacional — garçom/hostess)
O acesso é por **PIN**, sem login. Os PINs são definidos nas variáveis de
ambiente da Vercel `VITE_NOMADE_PIN` e `VITE_MANGA_PIN`. Caso não estejam
configuradas, o sistema usa o fallback: **Nômade `1234`** · **Pé de Manga `5678`**.

---

## 4. Cadastro do cliente (`/register/:unidade`)

1. O cliente abre o link/QR da unidade.
2. Preenche **Nome** e **Telefone** (obrigatórios); e-mail, nascimento e tipo
   de desconto são opcionais.
3. Ao enviar, o sistema gera um **código único** com o prefixo da unidade
   (`NM-` para Nômade, `PM-` para Pé de Manga) e exibe um **QR Code**.
4. O cliente apresenta o QR Code ou informa o código na entrada.

---

## 5. Validação do desconto (`/validar/:unidade`)

1. O operador acessa a tela do validador e digita o **PIN** da unidade.
2. Escaneia o QR Code (que preenche o código automaticamente pela URL
   `?code=...`) ou digita o código manualmente.
3. O sistema responde:
   - **Válido** → desconto liberado e código marcado como usado.
   - **Já utilizado** → o código já foi consumido antes.
   - **Inválido** → código inexistente.

---

## 6. Painel administrativo (`/admin/...`)

Após o login, ficam disponíveis:

| Seção | O que faz |
|-------|-----------|
| **Dashboard** | KPIs (cadastros, validações) e gráficos. |
| **Clientes** | Lista, busca e **exportação CSV** de todos os cadastros. |
| **Validações** | Histórico de códigos validados (data/hora e unidade). |
| **Promoções** | Cadastro e gestão de promoções por unidade. |
| **Aniversários** | Clientes aniversariantes por mês (útil para campanhas). |
| **Tipos de desconto** | Cria/edita os tipos (UOL, Clube Folha, Cartão Fidelidade, etc.). |

---

## 7. Base do Cartão Fidelidade (Nômade)

A base de fidelidade do Increasify (extração de **13/06/2026 — 241 clientes**)
já está carregada no banco, vinculada ao tipo de desconto **`CARTÃO FIDELIDADE`**
da unidade Nômade. Cada cliente possui um código único `NM-XXXXXX` pronto para
validação.

- Os aniversariantes dessa base aparecem automaticamente em **Admin → Aniversários**.
- Os dados pessoais residem **apenas no banco** (não versionados, por privacidade).
- Exportação completa disponível em **Admin → Clientes → Exportar CSV**.

---

## 8. Convites Nômade (cortesia via WhatsApp)

Convite especial enviado por link de WhatsApp aos clientes já cadastrados do Nômade.

**Fluxo:**
1. A equipe pega o link do convite em **Admin → Convites** (botão **Link** por cliente,
   ou **Exportar links** em CSV) e envia pelo WhatsApp.
2. O cliente abre o link `/convite/NOMADE-000123` e vê o convite, o código e um QR Code.
3. No restaurante, a equipe valida no **Validador** (`/validar/nomade`): escaneia o QR,
   digita o código `NOMADE-...` **ou** busca o cliente por nome/telefone.
4. Ao validar, o convite vira **Usado** (data/hora + nome do operador registrados).
   O cliente **não** valida sozinho — só a equipe.

**Benefício:** 1 prato executivo cortesia, mediante 1 acompanhante pagante. **Validade:** até 30/06.

**Status do convite:** `ativo` · `usado` · `expirado` (após a validade) · `cancelado` (pela administração, em **Admin → Convites**).

> A base inicial tem **241 convites** (`NOMADE-000001`…`NOMADE-000241`), um por cliente
> do Cartão Fidelidade. Os dados ficam só no banco; o acesso público é feito por funções
> RPC seguras (a tabela não é enumerável por terceiros).

---

## 9. Identidade visual (logotipos)

Os logotipos de cada unidade já estão integrados ao app e são exibidos nas telas
de cadastro/validação. Ficam no Storage público do Supabase (bucket `logos`):
- `Logo Nomade Escurol.png`
- `Logo PedeManga.png`

---

## 10. Formato dos códigos

| Unidade | Prefixo | Exemplo |
|---------|---------|---------|
| Nômade | `NM-` | `NM-AB12CD` |
| Pé de Manga | `PM-` | `PM-7KQ4ZP` |

Caracteres ambíguos (0/O, 1/I) são evitados para facilitar a digitação manual.

---

## 11. Stack técnica (resumo)

- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3
- **Banco/Auth/Storage:** Supabase (projeto `rfggzdohnchnnmavphrm`)
- **Deploy:** Vercel (automático no push da branch de produção)

Variáveis de ambiente necessárias na Vercel:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_NOMADE_PIN`, `VITE_MANGA_PIN`.
