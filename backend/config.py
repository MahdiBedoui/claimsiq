"""ClaimsIQ Configuration"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data", "raw")
UPLOAD_DIR = os.path.join(BASE_DIR, "data", "uploads")
REPORTS_DIR = os.path.join(BASE_DIR, "data", "reports")
DB_PATH = os.path.join(BASE_DIR, "data", "claimsiq.db")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

NUM_SYNTHETIC_RECORDS = 5000
COMPANY_NAME = "ClaimsIQ"

VALIDATION_RULES = {
    "claim_amount_min": 0,
    "claim_amount_max": 5_000_000,
    "allowed_statuses": ["Open", "Closed", "Pending", "Denied", "Under Review"],
    "allowed_claim_types": [
        "Medical", "Dental", "Vision", "Pharmacy",
        "Behavioral Health", "Surgical", "Emergency",
    ],
    "required_fields": [
        "claim_id", "policy_id", "claimant_name", "claim_date",
        "claim_type", "claim_amount", "status",
    ],
    "date_format": "%Y-%m-%d",
}

EMAIL_RECIPIENTS = {
    "daily": ["claims_team@company.com", "operations@company.com"],
    "weekly": ["claims_manager@company.com", "underwriting@company.com"],
    "monthly": ["vp_claims@company.com", "executive_team@company.com"],
}
