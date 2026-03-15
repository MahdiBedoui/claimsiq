"""ClaimsIQ — FastAPI Backend"""
import os, json, shutil
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

from config import (
    UPLOAD_DIR, REPORTS_DIR, VALIDATION_RULES, EMAIL_RECIPIENTS, DB_PATH
)
from core.database import initialize_database, load_csv, query, execute, get_connection
from core.data_generator import generate
from core.validation import ValidationEngine
from core.reports import generate_excel, generate_pdf

app = FastAPI(title="ClaimsIQ API", version="1.0.0",
              description="Insurance Claims Reporting & Analytics Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    initialize_database()
    # Seed with synthetic data if empty
    rows = query("SELECT COUNT(*) as cnt FROM claims")
    if rows[0]["cnt"] == 0:
        csv_path = generate()
        load_csv(csv_path)
        engine = ValidationEngine(VALIDATION_RULES)
        engine.run_all()


# ─── Dashboard ────────────────────────────────────────────────────────────

@app.get("/api/dashboard")
def get_dashboard():
    totals = query("SELECT COUNT(*) as cnt, SUM(claim_amount) as total, AVG(claim_amount) as avg, AVG(processing_days) as avg_days FROM claims")
    t = totals[0]
    open_count = query("SELECT COUNT(*) as cnt FROM claims WHERE status='Open'")[0]["cnt"]
    pending_count = query("SELECT COUNT(*) as cnt FROM claims WHERE status='Pending'")[0]["cnt"]

    by_status = query("SELECT * FROM vw_claims_by_status")
    by_type = query("SELECT * FROM vw_claims_by_type")
    monthly = query("SELECT * FROM vw_monthly_trend")
    by_state = query("SELECT * FROM vw_by_state")

    val = query("SELECT COUNT(*) as cnt FROM validation_log")
    val_errors = query("SELECT COUNT(*) as cnt FROM validation_log WHERE severity='ERROR'")
    total_flagged = query("SELECT COUNT(DISTINCT claim_id) as cnt FROM validation_log")
    pass_rate = round((1 - total_flagged[0]["cnt"] / max(t["cnt"], 1)) * 100, 2) if t["cnt"] else 0

    return {
        "kpis": {
            "total_claims": t["cnt"],
            "total_amount": round(t["total"] or 0, 2),
            "avg_claim": round(t["avg"] or 0, 2),
            "avg_processing_days": round(t["avg_days"] or 0, 1),
            "open_claims": open_count,
            "pending_claims": pending_count,
            "pass_rate": pass_rate,
        },
        "by_status": by_status,
        "by_type": by_type,
        "monthly_trend": monthly,
        "by_state": by_state,
    }


# ─── Submissions ──────────────────────────────────────────────────────────

@app.get("/api/submissions")
def list_submissions():
    return query("SELECT * FROM submissions ORDER BY uploaded_at DESC")


@app.post("/api/submissions/upload")
async def upload_submission(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are accepted")

    fpath = os.path.join(UPLOAD_DIR, file.filename)
    with open(fpath, "wb") as f:
        content = await file.read()
        f.write(content)

    # Log submission
    sub_id = execute(
        "INSERT INTO submissions (file_name, source, status) VALUES (?, ?, ?)",
        (file.filename, "Manual Upload", "New")
    )
    return {"id": sub_id, "file_name": file.filename, "status": "New", "path": fpath}


@app.post("/api/submissions/{sub_id}/process")
def process_submission(sub_id: int):
    subs = query("SELECT * FROM submissions WHERE id=?", (sub_id,))
    if not subs:
        raise HTTPException(404, "Submission not found")
    sub = subs[0]
    fpath = os.path.join(UPLOAD_DIR, sub["file_name"])
    if not os.path.exists(fpath):
        raise HTTPException(404, "File not found")

    result = load_csv(fpath)
    engine = ValidationEngine(VALIDATION_RULES)
    val = engine.run_all()

    execute(
        "UPDATE submissions SET status=?, record_count=?, errors=?, warnings=?, processed_at=? WHERE id=?",
        ("Processed", result["loaded"], val["errors"], val["warnings"], datetime.now().isoformat(), sub_id)
    )
    return {"loaded": result["loaded"], "skipped": result["skipped"], "validation": val}


@app.get("/api/submissions/{sub_id}/preview")
def preview_submission(sub_id: int):
    subs = query("SELECT * FROM submissions WHERE id=?", (sub_id,))
    if not subs:
        raise HTTPException(404, "Submission not found")
    fpath = os.path.join(UPLOAD_DIR, subs[0]["file_name"])
    if not os.path.exists(fpath):
        raise HTTPException(404, "File not found")

    import csv as csv_mod
    rows = []
    with open(fpath, "r", encoding="utf-8") as f:
        reader = csv_mod.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 20:
                break
            rows.append(dict(row))
    return {"preview": rows, "columns": list(rows[0].keys()) if rows else []}


# ─── Data Quality ─────────────────────────────────────────────────────────

@app.get("/api/quality")
def get_quality(severity: Optional[str] = None, rule: Optional[str] = None,
                limit: int = 100, offset: int = 0):
    where = []
    params = []
    if severity:
        where.append("severity=?")
        params.append(severity)
    if rule:
        where.append("rule_name=?")
        params.append(rule)
    clause = ("WHERE " + " AND ".join(where)) if where else ""

    issues = query(f"SELECT * FROM validation_log {clause} ORDER BY id LIMIT ? OFFSET ?",
                   tuple(params) + (limit, offset))
    total = query(f"SELECT COUNT(*) as cnt FROM validation_log {clause}", tuple(params))[0]["cnt"]

    summary = query("""
        SELECT rule_name, severity, COUNT(*) as cnt
        FROM validation_log GROUP BY rule_name, severity
        ORDER BY CASE severity WHEN 'ERROR' THEN 1 ELSE 2 END, cnt DESC
    """)

    stats = query("SELECT COUNT(*) as total FROM validation_log")
    errors = query("SELECT COUNT(*) as cnt FROM validation_log WHERE severity='ERROR'")[0]["cnt"]
    warnings = query("SELECT COUNT(*) as cnt FROM validation_log WHERE severity='WARNING'")[0]["cnt"]
    total_claims = query("SELECT COUNT(*) as cnt FROM claims")[0]["cnt"]
    flagged = query("SELECT COUNT(DISTINCT claim_id) as cnt FROM validation_log")[0]["cnt"]
    pass_rate = round((1 - flagged / max(total_claims, 1)) * 100, 2)

    return {
        "issues": issues,
        "total": total,
        "summary": summary,
        "stats": {"errors": errors, "warnings": warnings, "pass_rate": pass_rate, "total_flagged": flagged}
    }


@app.post("/api/quality/revalidate")
def revalidate():
    engine = ValidationEngine(VALIDATION_RULES)
    return engine.run_all()


# ─── Reports ──────────────────────────────────────────────────────────────

@app.get("/api/reports/generate/{report_type}")
def gen_report(report_type: str, format: str = "xlsx"):
    if report_type not in ("daily", "weekly", "monthly"):
        raise HTTPException(400, "Invalid report type")
    if format == "pdf":
        path = generate_pdf(report_type)
    else:
        path = generate_excel(report_type)
    fname = os.path.basename(path)
    media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if format == "xlsx" else "application/pdf"
    return FileResponse(path, filename=fname, media_type=media)


@app.get("/api/reports/history")
def report_history():
    return query("SELECT * FROM distribution_log ORDER BY distributed_at DESC LIMIT 50")


# ─── Distribution / Outbox ────────────────────────────────────────────────

@app.post("/api/distribution/send")
def send_report(report_type: str, format: str = "xlsx"):
    if report_type not in ("daily", "weekly", "monthly"):
        raise HTTPException(400, "Invalid report type")

    if format == "pdf":
        path = generate_pdf(report_type)
    else:
        path = generate_excel(report_type)
    fname = os.path.basename(path)
    fsize = round(os.path.getsize(path) / 1024, 1)
    recipients = EMAIL_RECIPIENTS.get(report_type, [])

    execute(
        "INSERT INTO distribution_log (report_type, report_path, file_name, file_size_kb, recipients, status) VALUES (?,?,?,?,?,?)",
        (report_type, path, fname, fsize, json.dumps(recipients), "sent")
    )
    return {
        "status": "sent",
        "report_type": report_type,
        "file_name": fname,
        "file_size_kb": fsize,
        "recipients": recipients,
        "sent_at": datetime.now().isoformat()
    }


@app.get("/api/distribution/log")
def distribution_log():
    logs = query("SELECT * FROM distribution_log ORDER BY distributed_at DESC LIMIT 50")
    for log in logs:
        if isinstance(log.get("recipients"), str):
            try:
                log["recipients"] = json.loads(log["recipients"])
            except Exception:
                pass
    return logs


# ─── RFP Tracker ──────────────────────────────────────────────────────────

class RFPCreate(BaseModel):
    client_name: str
    broker: Optional[str] = ""
    line_of_business: Optional[str] = ""
    date_received: str
    deadline: Optional[str] = ""
    assigned_analyst: Optional[str] = ""
    notes: Optional[str] = ""


class RFPUpdate(BaseModel):
    status: Optional[str] = None
    assigned_analyst: Optional[str] = None
    notes: Optional[str] = None
    deadline: Optional[str] = None


@app.get("/api/rfp")
def list_rfps(status: Optional[str] = None):
    if status:
        return query("SELECT * FROM rfp_tracker WHERE status=? ORDER BY date_received DESC", (status,))
    return query("SELECT * FROM rfp_tracker ORDER BY date_received DESC")


@app.post("/api/rfp")
def create_rfp(rfp: RFPCreate):
    rid = execute(
        "INSERT INTO rfp_tracker (client_name,broker,line_of_business,date_received,deadline,assigned_analyst,notes) VALUES (?,?,?,?,?,?,?)",
        (rfp.client_name, rfp.broker, rfp.line_of_business, rfp.date_received, rfp.deadline, rfp.assigned_analyst, rfp.notes)
    )
    return {"id": rid, "status": "Received"}


@app.put("/api/rfp/{rfp_id}")
def update_rfp(rfp_id: int, rfp: RFPUpdate):
    existing = query("SELECT * FROM rfp_tracker WHERE id=?", (rfp_id,))
    if not existing:
        raise HTTPException(404, "RFP not found")

    updates, params = [], []
    if rfp.status:
        updates.append("status=?")
        params.append(rfp.status)
    if rfp.assigned_analyst:
        updates.append("assigned_analyst=?")
        params.append(rfp.assigned_analyst)
    if rfp.notes is not None:
        updates.append("notes=?")
        params.append(rfp.notes)
    if rfp.deadline:
        updates.append("deadline=?")
        params.append(rfp.deadline)

    if updates:
        params.append(rfp_id)
        execute(f"UPDATE rfp_tracker SET {','.join(updates)} WHERE id=?", tuple(params))
    return {"id": rfp_id, "updated": True}


@app.delete("/api/rfp/{rfp_id}")
def delete_rfp(rfp_id: int):
    execute("DELETE FROM rfp_tracker WHERE id=?", (rfp_id,))
    return {"deleted": True}


# ─── Settings ─────────────────────────────────────────────────────────────

@app.get("/api/settings/recipients")
def get_recipients():
    return EMAIL_RECIPIENTS


@app.get("/api/settings/rules")
def get_rules():
    return VALIDATION_RULES


# ─── Seed / Reset ─────────────────────────────────────────────────────────

@app.post("/api/seed")
def seed_data():
    csv_path = generate()
    result = load_csv(csv_path)
    engine = ValidationEngine(VALIDATION_RULES)
    val = engine.run_all()
    return {"loaded": result["loaded"], "validation": val}


# ─── Sample CSV Download ──────────────────────────────────────────────────

SAMPLE_CSV = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_claims.csv")

@app.get("/api/sample-csv")
def download_sample_csv():
    if not os.path.exists(SAMPLE_CSV):
        raise HTTPException(status_code=404, detail="Sample CSV not found")
    return FileResponse(SAMPLE_CSV, media_type="text/csv", filename="sample_claims.csv")


# ─── Serve Frontend (production) ──────────────────────────────────────────

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(FRONTEND_DIR):
    from fastapi.staticfiles import StaticFiles
    from starlette.responses import HTMLResponse

    assets_dir = os.path.join(FRONTEND_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", response_class=HTMLResponse)
    async def serve_frontend(full_path: str):
        index = os.path.join(FRONTEND_DIR, "index.html")
        with open(index) as f:
            return f.read()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
