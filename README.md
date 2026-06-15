# Casa dos Bares — Sistema de Validação de Descontos

Sistema web para cadastro, geração e validação de cupons de desconto para as unidades **Nômade** e **Pé de Manga**.

---

## Visão Geral

Clientes se cadastram via QR Code e recebem um código único. Na entrada do restaurante, um validador (garçom/hostess) escaneia ou digita o código para consumir o desconto — uma única vez por código.

**URL de produção:** `https://casa-dos-bares.vercel.app`

**Domínios customizados:**
- `https://cadastro.nomaderestaurantebar.com.br` → unidade Nômade
- `https://cadastro.pedemanga.com.br` → unidade Pé de Manga

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite 5 |
| Estilo | Tailwind CSS 3 |
| Banco de dados | Supabase (PostgreSQL) |
| Deploy | Vercel |

---

## Estrutura de Rotas

| Rota | Descrição |
|------|-----------|
| `/register/:unit` | Formulário de cadastro do cliente |
| `/validar/:unit` | Tela do validador (acesso com PIN) |
| `/admin/login` | Login do painel administrativo |
| `/admin/dashboard` | Dashboard com KPIs |
| `/admin/clientes` | Listagem e export de clientes |
| `/admin/validacoes` | Histórico de validações |
| `/admin/promocoes` | Gestão de promoções |
| `/admin/aniversarios` | Clientes aniversariantes por mês |
| `/admin/tipos-desconto` | Tipos de desconto (UOL, Clube Folha, etc.) |

**Slugs de unidade:** `nomade` | `manga`

---

## Banco de Dados — Supabase

Projeto ID: `rfggzdohnchnnmavphrm`

Todas as tabelas usam o prefixo `dv_`.

### `dv_registrations`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `unit_slug` | text | `nomade` ou `manga` |
| `name` | text | Nome do cliente |
| `email` | text | E-mail (opcional) |
| `phone` | text | Telefone |
| `birthdate` | date | Data de nascimento |
| `code` | text | Código único gerado |
| `used` | boolean | Se o código já foi usado |
| `used_at` | timestamptz | Quando foi usado |
| `discount_type_id` | uuid FK | Referência ao tipo de desconto |
| `created_at` | timestamptz | |

### `dv_discount_types`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `name` | text | Ex: `UOL`, `CLUBE FOLHA` |
| `description` | text | Descrição opcional |
| `unit_slug` | text | Unidade (ou null para ambas) |
| `active` | boolean | Se está ativo |
| `created_at` | timestamptz | |

### `dv_validations`
Histórico de validações (código, unidade, data/hora).

### `dv_promotions`
Promoções cadastradas por unidade.

### `dv_admins`
Usuários do painel administrativo.

---

## Autenticação

### Validador (operacional)
O PIN de cada unidade é configurado em `src/config/units.js`, lido das
variáveis de ambiente `VITE_NOMADE_PIN` / `VITE_MANGA_PIN` com fallback:
- Nômade: `VITE_NOMADE_PIN` (fallback `1234`)
- Pé de Manga: `VITE_MANGA_PIN` (fallback `5678`)

> O validador opera apenas com o PIN, **sem sessão Supabase**. Por isso a
> consumação do código é feita pela função RPC `dv_validate_code`
> (`SECURITY DEFINER`), que faz lookup + marca como usado + registra a
> validação de forma atômica — evitando validação dupla e respeitando o RLS.

### Admin
Sessão armazenada via `sessionStorage`. Gerenciado em `src/pages/AdminLogin.jsx` e `src/components/ProtectedRoute.jsx`.

---

## QR Code

Formato da URL gerada no cadastro:
```
https://casa-dos-bares.vercel.app/validar/{unit_slug}?code={code}
```

O validador lê o parâmetro `?code=` e preenche o campo automaticamente.

---

## Storage (Supabase)

Bucket público `logos`:
- `Logo Nomade Escurol.png`
- `Logo PedeManga.png`

---

## Variáveis de Ambiente (Vercel)

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase |

---

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Criar arquivo de ambiente
cp .env.example .env
# Preencher VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build
```

---

## Deploy

O deploy é automático via Vercel ao fazer push na branch `main`.

Deploy manual:
```bash
vercel deploy --prod
```

---

## Observações Importantes

- **Firebase NÃO é usado.** Os arquivos `firebase.json`, `.firebaserc`,
  `firestore.rules` e `firestore.indexes.json` são legado de hospedagem e
  não fazem parte do app — todas as operações de dados usam
  **exclusivamente Supabase**.
- A tabela `dv_registrations` contém a coluna `cpf` por compatibilidade histórica — o formulário ativo (`Registration.jsx`) não coleta CPF.
