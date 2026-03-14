"""Synthetic insurance claims data generator."""
import os, csv, random
from datetime import datetime, timedelta
from faker import Faker
from config import DATA_DIR, NUM_SYNTHETIC_RECORDS

fake = Faker()
Faker.seed(42)
random.seed(42)

CLAIM_TYPES = ["Medical","Dental","Vision","Pharmacy","Behavioral Health","Surgical","Emergency"]
STATUSES = ["Open","Closed","Pending","Denied","Under Review"]
STATUS_WEIGHTS = [0.15, 0.45, 0.20, 0.10, 0.10]
DIAGNOSIS_CODES = ["J06.9","M54.5","E11.9","I10","J18.9","K21.0","S52.501A","Z00.00","F32.9","N39.0"]
PROVIDERS = [
    "HealthFirst Medical","Summit Care Partners","Lakeview Health","Midwest Regional Hospital",
    "ClearPath Dental","Horizon Eye Care","PrimeCare Pharmacy","Behavioral Wellness Center",
    "AllCare Surgical","Metro Emergency Services","Northside Family Practice","Valley Medical",
]
STATES = ["MN","WI","IL","MI","OH","IN","IA","MO","NY","PA","TX","CA","FL","GA","NC","VA"]
AMOUNT_RANGES = {
    "Medical":(150,50000,5000),"Dental":(75,8000,1200),"Vision":(50,3000,500),
    "Pharmacy":(10,5000,350),"Behavioral Health":(100,15000,2500),
    "Surgical":(2000,200000,35000),"Emergency":(500,100000,12000),
}


def generate(num_records=NUM_SYNTHETIC_RECORDS) -> str:
    os.makedirs(DATA_DIR, exist_ok=True)
    output = os.path.join(DATA_DIR, "insurance_claims.csv")
    headers = [
        "claim_id","policy_id","claimant_name","claimant_age","claimant_state",
        "claim_date","received_date","claim_type","diagnosis_code","provider_name",
        "claim_amount","approved_amount","status","processing_days","adjuster_id","notes",
    ]

    with open(output, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(headers)
        for i in range(1, num_records + 1):
            is_dirty = random.random() < 0.03
            ctype = random.choice(CLAIM_TYPES)
            status = random.choices(STATUSES, weights=STATUS_WEIGHTS, k=1)[0]
            low, high, mean = AMOUNT_RANGES[ctype]
            amount = round(max(low, min(high, random.gauss(mean, (high-low)/6))), 2)
            cdate = datetime.now() - timedelta(days=random.randint(1, 730))
            rdate = cdate + timedelta(days=random.randint(0, 5))
            pdays = random.randint(0, 60)
            approved = round(amount * random.uniform(0.6, 1.0), 2) if status == "Closed" else (0.0 if status == "Denied" else "")

            if is_dirty:
                dtype = random.choice(["missing_name","negative_amount","future_date","invalid_status","missing_type"])
                row = [
                    f"CLM-{i:06d}", f"POL-{random.randint(10000,99999)}",
                    "" if dtype == "missing_name" else fake.name(),
                    random.randint(18,85), random.choice(STATES),
                    (datetime.now()+timedelta(days=30)).strftime("%Y-%m-%d") if dtype=="future_date" else cdate.strftime("%Y-%m-%d"),
                    rdate.strftime("%Y-%m-%d"),
                    "" if dtype == "missing_type" else ctype,
                    random.choice(DIAGNOSIS_CODES), random.choice(PROVIDERS),
                    -500.0 if dtype == "negative_amount" else amount,
                    approved,
                    "INVALID" if dtype == "invalid_status" else status,
                    pdays, f"ADJ-{random.randint(100,200)}", "dirty-record"
                ]
            else:
                row = [
                    f"CLM-{i:06d}", f"POL-{random.randint(10000,99999)}",
                    fake.name(), random.randint(18,85), random.choice(STATES),
                    cdate.strftime("%Y-%m-%d"), rdate.strftime("%Y-%m-%d"),
                    ctype, random.choice(DIAGNOSIS_CODES), random.choice(PROVIDERS),
                    amount, approved, status, pdays,
                    f"ADJ-{random.randint(100,200)}", ""
                ]
            w.writerow(row)
    return output
