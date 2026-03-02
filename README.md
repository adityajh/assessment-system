# Let's Entreprise — Year 1 Assessment System

A data pipeline + admin tool + student dashboard for the Let's Entreprise Year 1 programme.

---

## 📁 Project Structure

```
AssessmentSystem/
├── docs/               ← Architecture docs (CONTEXT.md, SUPABASE_SCHEMA.md, DATA_IMPORT_RULES.md)
├── scripts/            ← Python utility scripts (backfills, migrations)
├── frontend/           ← Next.js 15 app (Admin Panel + Student Dashboard)
└── README.md           ← Project overview
```

---

## 🚀 Live App

**Vercel:** https://assessment-system.vercel.app/

---

## 🛠️ Setup

### Python Scripts (ETL)
```bash
cd scripts
source venv/bin/activate
python run_migration.py   # run once to set up schema
python import_data.py     # import all Excel data into Supabase
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev       # http://localhost:3000
```

---

## 📚 Docs

- [Architecture & Context](docs/CONTEXT.md)
- [Supabase Schema](docs/SUPABASE_SCHEMA.md)
- [Frontend Plan](docs/FRONTEND_PLAN.md)
- [Project Status](STATUS.md)
