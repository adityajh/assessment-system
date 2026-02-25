# Let's Entreprise — Year 1 Assessment System

A data pipeline + admin tool + student dashboard for the Let's Entreprise Year 1 programme.

---

## 📁 Project Structure

```
AssessmentSystem/
├── data/               ← Source Excel files (assessments, peer feedback, term reports)
├── docs/               ← Architecture docs (CONTEXT.md, SUPABASE_SCHEMA.md, FRONTEND_PLAN.md)
├── scripts/            ← Python ETL scripts + SQL migrations
│   ├── import_data.py      ← Ingests all 5 Excel files into Supabase
│   ├── run_migration.py    ← Applies SQL schema to Supabase
│   ├── migrations/         ← SQL schema files
│   └── venv/               ← Python virtual environment
├── frontend/           ← Next.js 16 app (admin panel + student dashboard)
└── STATUS.md           ← Project roadmap and agent coordination
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
