# Cookie and Tea — Backend API

REST API for **Cookie and Tea**, a creator-support platform in the spirit of Buy Me a Coffee / Ko-fi — supporters tip creators ("tea", "cookie", or both) and leave encouraging messages, without likes or vanity metrics.

- **Live API:** https://cookie-and-tea-backend.vercel.app (health check: [`/health`](https://cookie-and-tea-backend.vercel.app/health))
- **Live App (frontend):** https://cookie-and-tea.vercel.app
- **Frontend repo:** [cookie-and-tea](https://github.com/kybrakorkmaz/cookie-and-tea)

---

## Türkçe

**Cookie and Tea**, içerik üreticilerinin takipçilerinden bağış ve destek mesajları alabildiği bir platformdur (Buy Me a Coffee / Ko-fi benzeri). Bu depo, platformun sunucu tarafını (REST API) içerir. Beğeni sayısı gibi "gösteriş metrikleri" bilinçli olarak yoktur; amaç gerçek destek etkileşimidir.

### Canlı Bağlantılar

- **API:** https://cookie-and-tea-backend.vercel.app
- **Uygulama (arayüz):** https://cookie-and-tea.vercel.app
- **Arayüz deposu:** [cookie-and-tea](https://github.com/kybrakorkmaz/cookie-and-tea)

### Öne Çıkan Özellikler

- JWT + httpOnly cookie ile kimlik doğrulama, parolalar bcrypt ile saklanır
- E-posta doğrulamalı kayıt akışı (Nodemailer); doğrulama bağlantısı kullanıcıyı giriş sayfasına yönlendirir
- İsim/kullanıcı adına göre anlık kullanıcı arama (`GET /api/v1/search/users?q=...`)
- Profil, gönderi, takip sistemi, bağış (İyzico altyapısı — şu an demo modunda), bildirim (actions) uçları
- PostgreSQL + Drizzle ORM (yerelde Docker, canlıda Neon serverless)
- Zod ile tüm isteklerde şema doğrulama; merkezi hata yönetimi ve Winston ile loglama
- Jest + Supertest ile izole Docker test ortamı
- Vercel üzerinde serverless dağıtım; günlük cron ile eski bildirim temizliği

### Hızlı Başlangıç

Gereksinimler: Docker + Docker Compose (önerilen) veya Node.js 22+ ve PostgreSQL 15+.

```bash
cp .env.example .env        # değerleri kendinize göre doldurun
npm install
npm run docker:dev up       # API + PostgreSQL + pgAdmin ayağa kalkar
npm run docker:dev migrate  # veritabanı tabloları oluşturulur
```

API artık `http://localhost:8000` adresinde çalışır. Docker'sız çalıştırmak için: `npm run db:migrate` ardından `npm run dev`.

### Test

```bash
npm run test:docker run     # izole ortam: kur → migrate → test → temizle
```

Detaylı İngilizce dokümantasyon aşağıdadır. ⬇️

---

## English

### What Is This?

Cookie and Tea is a full-stack creator-support platform. This repository is the backend: an Express 5 (ESM) REST API backed by PostgreSQL, responsible for authentication, email verification, profiles, posts, donations, follower relationships, notifications, and user search. It is deployed as a serverless function on Vercel with a Neon serverless Postgres database.

The platform deliberately has **no like button and no nested comments** — interactions are designed around genuine support (tips + messages), not engagement metrics.

### Feature Highlights

- **Auth:** JWT in httpOnly cookies (`sameSite=none` in production for the cross-domain SPA), bcrypt password hashing, pending → active account lifecycle
- **Email verification:** signed-up users receive a link; clicking it verifies the account and redirects to the frontend login page with a success/failure flag
- **User search:** typeahead endpoint matching name or username (`ILIKE`, prefix-ranked, active users only)
- **Donations:** three tiers (Tea $5 / Cookie $7 / Both $12) through the İyzico API — currently running in **mock mode** (`MOCK_IYZICO=true`) so the full flow works without real charges
- **Media:** Cloudinary-backed image/video uploads (Multer in-memory → Cloudinary)
- **Notifications ("actions"):** donation/follow events with read-state, plus a daily Vercel Cron job that purges expired read actions
- **Observability:** Winston structured logging; a `POST /api/v1/logs/client` relay so frontend errors show up in backend logs
- **Validation:** every request body/query/params validated with Zod; centralized error handler with consistent `{ status, message, errors? }` responses

### Tech Stack

| Area | Choice |
|---|---|
| Runtime / Framework | Node.js 22+, Express 5 (ESM) |
| Database | PostgreSQL 15+ — Docker locally, Neon serverless in production |
| ORM | Drizzle ORM + drizzle-kit migrations |
| Auth | jsonwebtoken, bcrypt, cookie-parser |
| Validation | Zod |
| Payments | iyzipay (sandbox/mock) |
| Email | Nodemailer (Gmail SMTP or Mailtrap) |
| Media | Cloudinary, Multer |
| Logging | Winston, Morgan |
| Testing | Jest, Supertest, isolated Docker environment |
| Deployment | Vercel (serverless), daily cron via `vercel.json` |

### Getting Started

#### Prerequisites

- Docker and Docker Compose (recommended), **or** Node.js 22+ with PostgreSQL 15+
- Bash-compatible shell for the environment scripts (Git Bash / WSL on Windows)

#### Docker Setup (Recommended)

```bash
cp .env.example .env        # fill in your values
npm install
npm run docker:dev up       # API :8000, Postgres :5434, pgAdmin :5050
npm run docker:dev migrate  # create tables
```

The API is now at `http://localhost:8000`.

#### Local (no Docker)

Point `DATABASE_URL` in `.env` at any reachable Postgres, then:

```bash
npm install
npm run db:migrate
npm run dev
```

#### Environment Scripts

`npm run <env> <command>` is driven by the bash scripts in `src/scripts/bash/`:

| Command | dev | test | prod | Description |
|---|:-:|:-:|:-:|---|
| `up` | ✓ | ✓ | ✓ | Start the environment |
| `down` | ✓ | ✓ | ✓ | Stop and remove containers (`-v` also wipes volumes) |
| `logs` | ✓ | ✓ | ✓ | Stream container logs |
| `migrate` | ✓ | ✓ | — | Run database migrations |
| `run` | — | ✓ | — | Full test cycle: up → migrate → test → down |
| `restart` | ✓ | — | — | Restart dev containers |
| `ps` | ✓ | — | ✓ | List container status |

Dev and test stacks run side by side (API 8000/8001, DB 5434/5435).

### Environment Variables

See [`.env.example`](.env.example) for the annotated template. Essentials:

| Variable | Purpose |
|---|---|
| `NODE_ENV` / `PORT` / `BASE_URL` | Runtime environment and server binding |
| `JWT_SECRET` | Signs auth + email-verification tokens |
| `DATABASE_URL` | Postgres connection string (Neon pooled URL in production) |
| `FRONTEND_ORIGIN` | CORS origin and verification-redirect target |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USERNAME` / `EMAIL_PASSWORD` / `FROM_NAME` / `FROM_EMAIL` | SMTP delivery (Gmail or Mailtrap) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Media uploads |
| `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` / `IYZICO_BASE_URL` | Payments (sandbox values for dev) |
| `CRON_SECRET` | Bearer token guarding `/api/v1/cron/*` |
| `BYPASS_SECRET` | Test-only header secret for auto-verifying signups |

> Note: env vars are validated with Zod at boot — the server refuses to start with a missing/invalid configuration instead of failing later at runtime.

### API Overview

Base path: `/api/v1`

| Group | Endpoints |
|---|---|
| Auth | `POST /auth/sign-up` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` 🔒 · `GET /auth/verify-email?token=` (redirects to frontend) |
| Search | `GET /search/users?q=&limit=` (public typeahead) |
| Profile | `GET /profile/:username` 🔒 · `GET /profile/:username/posts` 🔒 · `POST|DELETE /profile/:username/follow` 🔒 · intro sub-routes: `about`, `socials`, `earnings`, `follow` 🔒 |
| Feed / Posts | `GET /feed/:username` 🔒 · `POST /feed` (create post) 🔒 · `PUT|DELETE /posts/:postId` 🔒 |
| Donations | `POST /donate/tip-tea | tip-cookie | tip-cookie-tea` 🔒 · `GET /donate/history` 🔒 · card & sub-merchant onboarding endpoints 🔒 |
| Actions (notifications) | `GET /actions` 🔒 · `PUT /actions/:id/read` 🔒 · `DELETE /actions/:id` 🔒 |
| Settings | `GET|PATCH /settings` 🔒 |
| Ops | `GET /health` · `POST /logs/client` (frontend error relay) · `GET /cron/purge-actions` (Bearer `CRON_SECRET`) |

🔒 = requires the auth cookie. Error responses share one shape: `{ status: "fail"|"error", message, errors?: [{field, message}] }`.

### Testing

```bash
npm run test:docker run   # isolated full cycle: up → migrate → jest → down
npm test                  # against a locally configured test DB
```

Jest + Supertest run against a dedicated Dockerized Postgres so tests never touch dev data.

### Deployment (Vercel + Neon)

- `app.js` at the repo root exports the Express app as the serverless entrypoint
- Production uses Neon's WebSocket pool (transactions don't work over the HTTP driver)
- File logging transports are disabled on Vercel (read-only FS) — logs go to the Vercel runtime console
- `vercel.json` registers a daily cron (`0 3 * * *`) hitting `/api/v1/cron/purge-actions`
- Frontend env var `VITE_API_BASE_URL` must point at this API's origin

### Useful Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Nodemon dev server |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run db:generate` / `db:migrate` / `db:seed` | Drizzle schema → migration → seed |
| `npm run email:test <address>` | SMTP smoke test |

### Project Structure

```
src/
├── servers/        # app assembly + server bootstrap
├── routes/         # Express routers per resource
├── controllers/    # HTTP layer (req/res)
├── services/       # business logic
├── repositories/   # Drizzle queries
├── db/             # client, schema, migrations, seed
├── middleware/     # auth, validation, file validation
├── validations/    # Zod request schemas
├── handlers/       # centralized error handler
├── lib/            # logger, scheduler
└── scripts/        # bash env scripts, email smoke test
```

---

## License

ISC — © Kübra Korkmaz
