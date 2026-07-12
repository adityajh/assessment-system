# Let's Entreprise — Year 1 Assessment System

> **HISTORICAL ARCHIVE — cohort 2025 (frozen 2026-07-12).** Read-only record; successor: Tricorder v2 in The Bridge. Live DB ≠ committed migrations — never rebuild from scripts/; the running instance is the artifact.

An admin portal + student dashboard for the Let's Entreprise Year 1 programme.

---

## 📁 Project Structure

```
AssessmentSystem/
├── docs/               ← Architecture docs & changelog
├── scripts/            ← Python utility scripts (backfills, migrations)
├── frontend/           ← Next.js 15 app (Admin Panel + Student Dashboard)
└── README.md           ← Project overview
```

---

## 🚀 Live App

**Vercel:** https://assessment-system.vercel.app/

---

## 🛠️ Local Development

```bash
cd frontend
npm install
npm run dev       # http://localhost:3000
```

---

## 📚 Docs

- [Architecture & Context](docs/CONTEXT.md)
- [Supabase Schema](docs/SUPABASE_SCHEMA.md)
- [Data Import Rules](docs/DATA_IMPORT_RULES.md)
- [Project Vision](docs/VISION.md)
- [3-Month Roadmap](docs/ROADMAP.md)
- [Changelog](docs/CHANGELOG.md)
