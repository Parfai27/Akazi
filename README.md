# Akazi

Openings in Rwanda, gathered from public company career pages. Browse on Akazi, then apply on the employer’s site.

## Run it locally

```bash
npm install
```

Copy `.env.example` to `.env.local` and set `ADMIN_PASSWORD`. Then:

```bash
npm run crawl
npm run dev
```

Open http://localhost:3000. Staff tools are at `/admin`.

Email alerts send only when `SMTP_HOST` and `MAIL_FROM` are set. Otherwise signups are saved and the mail stays queued.
