"""Database layer with schema, loading, and query functions."""
import sqlite3
import csv
import os
from config import DB_PATH


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def initialize_database():
    conn = get_connection()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS claims (
            claim_id TEXT PRIMARY KEY, policy_id TEXT NOT NULL,
            claimant_name TEXT, claimant_age INTEGER, claimant_state TEXT,
            claim_date DATE NOT NULL, received_date DATE,
            claim_type TEXT NOT NULL, diagnosis_code TEXT, provider_name TEXT,
            claim_amount REAL NOT NULL, approved_amount REAL,
            status TEXT NOT NULL, processing_days INTEGER,
            adjuster_id TEXT, notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS validation_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_id TEXT, rule_name TEXT NOT NULL,
            severity TEXT NOT NULL CHECK(severity IN ('ERROR','WARNING','INFO')),
            message TEXT NOT NULL, field_name TEXT, field_value TEXT,
            validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS distribution_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_type TEXT NOT NULL, report_path TEXT NOT NULL,
            file_name TEXT, file_size_kb REAL,
            recipients TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'sent',
            distributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT NOT NULL, source TEXT DEFAULT 'Manual Upload',
            record_count INTEGER DEFAULT 0, status TEXT DEFAULT 'New',
            errors INTEGER DEFAULT 0, warnings INTEGER DEFAULT 0,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS rfp_tracker (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_name TEXT NOT NULL, broker TEXT,
            line_of_business TEXT, date_received DATE NOT NULL,
            deadline DATE, assigned_analyst TEXT,
            status TEXT DEFAULT 'Received',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Indexes
    for idx in [
        "CREATE INDEX IF NOT EXISTS idx_claims_date ON claims(claim_date)",
        "CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status)",
        "CREATE INDEX IF NOT EXISTS idx_claims_type ON claims(claim_type)",
        "CREATE INDEX IF NOT EXISTS idx_claims_state ON claims(claimant_state)",
        "CREATE INDEX IF NOT EXISTS idx_claims_adjuster ON claims(adjuster_id)",
    ]:
        c.execute(idx)

    # Views
    c.execute("DROP VIEW IF EXISTS vw_claims_by_type")
    c.execute("""
        CREATE VIEW vw_claims_by_type AS
        SELECT claim_type, COUNT(*) as total_claims,
            SUM(claim_amount) as total_claimed, AVG(claim_amount) as avg_claimed,
            SUM(COALESCE(approved_amount,0)) as total_approved,
            ROUND(SUM(COALESCE(approved_amount,0))*100.0/NULLIF(SUM(claim_amount),0),2) as approval_rate_pct,
            AVG(processing_days) as avg_processing_days
        FROM claims GROUP BY claim_type
    """)

    c.execute("DROP VIEW IF EXISTS vw_claims_by_status")
    c.execute("""
        CREATE VIEW vw_claims_by_status AS
        SELECT status, COUNT(*) as total_claims, SUM(claim_amount) as total_amount,
            AVG(claim_amount) as avg_amount
        FROM claims GROUP BY status
    """)

    c.execute("DROP VIEW IF EXISTS vw_monthly_trend")
    c.execute("""
        CREATE VIEW vw_monthly_trend AS
        SELECT strftime('%Y-%m', claim_date) as month, COUNT(*) as total_claims,
            SUM(claim_amount) as total_amount, AVG(claim_amount) as avg_amount,
            SUM(CASE WHEN status='Denied' THEN 1 ELSE 0 END) as denied,
            SUM(CASE WHEN status='Closed' THEN 1 ELSE 0 END) as closed
        FROM claims GROUP BY strftime('%Y-%m', claim_date) ORDER BY month
    """)

    c.execute("DROP VIEW IF EXISTS vw_by_state")
    c.execute("""
        CREATE VIEW vw_by_state AS
        SELECT claimant_state, COUNT(*) as total_claims, SUM(claim_amount) as total_amount,
            AVG(claim_amount) as avg_amount, AVG(processing_days) as avg_processing_days
        FROM claims GROUP BY claimant_state ORDER BY total_claims DESC
    """)

    conn.commit()
    conn.close()


def load_csv(csv_path: str) -> dict:
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM claims")
    loaded, skipped = 0, 0

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                approved = row.get("approved_amount", "")
                approved_val = float(approved) if approved and approved.strip() else None
                c.execute("""
                    INSERT OR REPLACE INTO claims
                    (claim_id,policy_id,claimant_name,claimant_age,claimant_state,
                     claim_date,received_date,claim_type,diagnosis_code,provider_name,
                     claim_amount,approved_amount,status,processing_days,adjuster_id,notes)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """, (
                    row["claim_id"], row["policy_id"], row["claimant_name"],
                    int(row["claimant_age"]) if row.get("claimant_age") else None,
                    row.get("claimant_state", ""), row["claim_date"],
                    row.get("received_date", ""), row["claim_type"],
                    row.get("diagnosis_code", ""), row.get("provider_name", ""),
                    float(row["claim_amount"]), approved_val, row["status"],
                    int(row["processing_days"]) if row.get("processing_days") else None,
                    row.get("adjuster_id", ""), row.get("notes", ""),
                ))
                loaded += 1
            except (ValueError, KeyError):
                skipped += 1

    conn.commit()
    conn.close()
    return {"loaded": loaded, "skipped": skipped}


def query(sql: str, params: tuple = ()) -> list:
    conn = get_connection()
    c = conn.cursor()
    c.execute(sql, params)
    results = [dict(r) for r in c.fetchall()]
    conn.close()
    return results


def execute(sql: str, params: tuple = ()) -> int:
    conn = get_connection()
    c = conn.cursor()
    c.execute(sql, params)
    conn.commit()
    last_id = c.lastrowid
    conn.close()
    return last_id
