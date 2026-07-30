# Arquitetura — Discografia + Loja

## Stack
- **Frontend**: GitHub Pages (estático existente) + JS vanilla
- **Backend**: Node.js/Express em Railway ou Render
- **Pagamentos**: Mercado Pago (PIX + cartão)
- **Storage**: Cloudflare R2 (ou S3)
- **Banco**: SQLite (Railway) ou PostgreSQL

## Data Flow
```
Usuário → Frontend (matesu.me) → Backend /create-preference → Mercado Pago Checkout
Mercado Pago → Webhook → Backend → Registra compra + gera token JWT
Usuário → Frontend (Biblioteca) → Backend /stream/:token → URL assinada
```

## Endpoints do Backend
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/create-preference | Cria preferência MP, retorna link/ID |
| POST | /webhook | Recebe confirmação de pagamento |
| GET | /api/stream/:token/:fileKey | Gera URL assinada (stream) |
| GET | /api/download/:token/:fileKey | Gera URL de download |
| GET | /api/library/:token | Lista itens comprados |

## Variáveis de Ambiente (servidor Railway)
- `MERCADO_PAGO_ACCESS_TOKEN`
- `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
- `JWT_SECRET`
- `FRONTEND_URL` (https://matesu.me)
- `BACKEND_URL`