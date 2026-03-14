"""Data validation engine with 8 configurable rules."""
from datetime import datetime
from collections import Counter
from core.database import get_connection, query


class ValidationEngine:
    def __init__(self, rules):
        self.rules = rules
        self.issues = []
        self.stats = Counter()

    def _log(self, claim_id, rule, severity, msg, field="", value=""):
        self.issues.append({
            "claim_id": claim_id, "rule_name": rule, "severity": severity,
            "message": msg, "field_name": field, "field_value": str(value)
        })
        self.stats[severity] += 1

    def check_required_fields(self, claims):
        for c in claims:
            for f in self.rules["required_fields"]:
                if not c.get(f) or str(c[f]).strip() == "":
                    self._log(c["claim_id"], "REQUIRED_FIELD", "ERROR", f"Missing: {f}", f, "")

    def check_amounts(self, claims):
        for c in claims:
            amt = c.get("claim_amount", 0)
            if amt is not None:
                if amt < self.rules["claim_amount_min"]:
                    self._log(c["claim_id"], "AMOUNT_RANGE", "ERROR", f"Negative: ${amt:,.2f}", "claim_amount", amt)
                elif amt > self.rules["claim_amount_max"]:
                    self._log(c["claim_id"], "AMOUNT_RANGE", "WARNING", f"High: ${amt:,.2f}", "claim_amount", amt)

    def check_statuses(self, claims):
        for c in claims:
            if c.get("status") not in self.rules["allowed_statuses"]:
                self._log(c["claim_id"], "INVALID_STATUS", "ERROR", f"Invalid: '{c['status']}'", "status", c["status"])

    def check_types(self, claims):
        for c in claims:
            ct = c.get("claim_type", "")
            if ct and ct not in self.rules["allowed_claim_types"]:
                self._log(c["claim_id"], "INVALID_TYPE", "WARNING", f"Unknown: '{ct}'", "claim_type", ct)

    def check_dates(self, claims):
        today = datetime.now().date()
        for c in claims:
            try:
                cd = datetime.strptime(c["claim_date"], self.rules["date_format"]).date()
                if cd > today:
                    self._log(c["claim_id"], "FUTURE_DATE", "ERROR", f"Future: {c['claim_date']}", "claim_date", c["claim_date"])
                if c.get("received_date"):
                    rd = datetime.strptime(c["received_date"], self.rules["date_format"]).date()
                    if rd < cd:
                        self._log(c["claim_id"], "DATE_ORDER", "WARNING", "Received before claim date", "received_date", c["received_date"])
            except (ValueError, TypeError):
                self._log(c["claim_id"], "DATE_FORMAT", "ERROR", f"Bad format: {c.get('claim_date')}", "claim_date", c.get("claim_date", ""))

    def check_duplicates(self, claims):
        seen = {}
        for c in claims:
            cid = c["claim_id"]
            if cid in seen:
                self._log(cid, "DUPLICATE_ID", "ERROR", "Duplicate claim ID", "claim_id", cid)
            else:
                seen[cid] = True

    def check_approved(self, claims):
        for c in claims:
            claimed = c.get("claim_amount", 0) or 0
            approved = c.get("approved_amount")
            if approved is not None and approved != "":
                approved = float(approved)
                if approved > claimed:
                    self._log(c["claim_id"], "APPROVED_EXCEEDS", "WARNING", f"Approved ${approved:,.2f} > Claimed ${claimed:,.2f}", "approved_amount", approved)
                if c.get("status") == "Denied" and approved > 0:
                    self._log(c["claim_id"], "DENIED_APPROVED", "WARNING", f"Denied but approved ${approved:,.2f}", "approved_amount", approved)

    def check_processing(self, claims):
        for c in claims:
            days = c.get("processing_days")
            if days is not None and int(days) > 90:
                self._log(c["claim_id"], "LONG_PROCESSING", "WARNING", f"{days} days", "processing_days", days)

    def run_all(self) -> dict:
        claims = query("SELECT * FROM claims")
        total = len(claims)
        self.check_required_fields(claims)
        self.check_amounts(claims)
        self.check_statuses(claims)
        self.check_types(claims)
        self.check_dates(claims)
        self.check_duplicates(claims)
        self.check_approved(claims)
        self.check_processing(claims)

        # Save to DB
        conn = get_connection()
        c = conn.cursor()
        c.execute("DELETE FROM validation_log")
        for issue in self.issues:
            c.execute("""INSERT INTO validation_log (claim_id,rule_name,severity,message,field_name,field_value)
                VALUES (?,?,?,?,?,?)""",
                (issue["claim_id"], issue["rule_name"], issue["severity"],
                 issue["message"], issue["field_name"], issue["field_value"]))
        conn.commit()
        conn.close()

        flagged_ids = set(i["claim_id"] for i in self.issues)
        return {
            "total_records": total,
            "total_issues": len(self.issues),
            "errors": self.stats.get("ERROR", 0),
            "warnings": self.stats.get("WARNING", 0),
            "pass_rate": round((1 - len(flagged_ids) / max(total, 1)) * 100, 2),
            "issues_by_rule": dict(Counter(i["rule_name"] for i in self.issues)),
        }
