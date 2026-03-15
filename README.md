# ClaimsIQ — Insurance Claims Reporting Platform

A full-stack web application that automates insurance claims data ingestion, validation, report generation, and distribution tracking. Built with React, FastAPI, and Tailwind CSS.

**Live Demo:** [claimsiq.up.railway.app](https://claimsiq.up.railway.app) 

## Features

### Dashboard
Real-time portfolio overview with KPI cards (total claims, amount, pass rate, processing days), monthly trend line charts, status distribution pie chart, claims by type bar chart, and geographic breakdown by state.

### Submissions Inbox
Drag-and-drop CSV upload for claim files. Preview data before loading, run validation on import, track submission history with status (New → Processed), error counts, and timestamps.

### Data Quality Center
8-rule validation engine with severity levels (ERROR/WARNING). Interactive charts showing issues by rule and severity split. Filterable issues table with export-to-CSV functionality. One-click revalidation.

### Report Generator
Generate Daily, Weekly, or Monthly reports in Excel (XLSX) or PDF format. Each report includes charts, pivot-style analysis, conditional formatting, and KPI summaries. Download instantly from the browser.

### Outbox & Distribution
Send reports to configured recipient lists with one click. Full audit trail showing every report distributed — type, file name, size, recipients, timestamp, and status.

### RFP Tracker
Log and track incoming Requests for Proposal. Create, edit, filter by status (Received → In Review → Quoted → Accepted/Declined), assign analysts, set deadlines, and add notes.

### Settings
View email recipient lists per report type, validation rules and thresholds, and reseed the database with fresh synthetic data.

### Dark Mode
Full dark mode toggle with persistent preference.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 3, Recharts, Lucide Icons, React Router |
| Backend | FastAPI, Python 3.10+, SQLite |
| Reports | openpyxl (Excel), ReportLab (PDF) |
| Data | Faker (synthetic generation), pandas |
| Deployment | Railway / Render (backend) + Vercel (frontend) |

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

The API auto-seeds with 5,000 synthetic claims on first startup. Swagger docs available at `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173` with API proxy to port 8000.

### Production Build
```bash
cd frontend && npm run build
cd ../backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

The backend serves the built frontend at `http://localhost:8000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Portfolio KPIs, charts data |
| GET | `/api/submissions` | List submissions |
| POST | `/api/submissions/upload` | Upload CSV |
| POST | `/api/submissions/{id}/process` | Process & validate |
| GET | `/api/quality` | Validation issues (filterable) |
| POST | `/api/quality/revalidate` | Rerun validation |
| GET | `/api/reports/generate/{type}` | Generate & download report |
| POST | `/api/distribution/send` | Send report to recipients |
| GET | `/api/distribution/log` | Distribution audit trail |
| GET/POST | `/api/rfp` | RFP CRUD operations |
| GET | `/api/settings/*` | Configuration data |
| POST | `/api/seed` | Reseed synthetic data |

Full interactive API docs at `/docs` (Swagger UI).

## Project Structure

```
claimsiq/
├── backend/
│   ├── main.py              # FastAPI app + all routes
│   ├── config.py            # Configuration
│   ├── requirements.txt
│   ├── core/
│   │   ├── database.py      # SQLite schema, views, queries
│   │   ├── data_generator.py # Synthetic data generation
│   │   ├── validation.py    # 8-rule validation engine
│   │   └── reports.py       # Excel + PDF report generation
│   └── data/                # DB, uploads, reports (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Router + layout
│   │   ├── components/      # Sidebar, KPICard
│   │   └── pages/           # Dashboard, Submissions, Quality,
│   │                        # Reports, Distribution, RFP, Settings
│   ├── tailwind.config.js
│   └── vite.config.js
├── Procfile                 # Railway deployment
├── .gitignore
└── README.md
```

## Validation Rules

| Rule | Severity | Description |
|------|----------|-------------|
| Required Fields | ERROR | Checks claim_id, policy_id, name, date, type, amount, status |
| Amount Range | ERROR/WARNING | Negative or exceeding $5M threshold |
| Valid Status | ERROR | Must be Open, Closed, Pending, Denied, or Under Review |
| Valid Type | WARNING | Must match allowed claim types |
| Date Logic | ERROR/WARNING | No future dates; received_date must be after claim_date |
| Duplicates | ERROR | No duplicate claim IDs |
| Approved vs Claimed | WARNING | Approved amount should not exceed claimed |
| Processing Time | WARNING | Flags claims over 90 days |

## Author

**Mahdi Bedoui** — M.S. Data Science & Analytics, Grand Valley State University
- Email: bedouim@mail.gvsu.edu
- Website: mahdibedoui.com

## License

MIT
