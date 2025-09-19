# train_model.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib
import argparse

"""
Usage:
    python train_model.py --csv students.csv --out model.joblib

CSV must include columns (case-insensitive): Attendance, Backlogs, Fee status
You can include more rows to improve accuracy.
This script creates a model joblib file containing:
{ 'model': clf, 'le_fee': fee_encoder, 'label_map': label_map }
"""

parser = argparse.ArgumentParser()
parser.add_argument("--csv", required=True, help="Path to student csv file")
parser.add_argument("--out", default="model.joblib", help="Output joblib file")
args = parser.parse_args()

df = pd.read_csv(args.csv)

# Normalize column names
df.columns = [c.strip().lower().replace('-', '_').replace(' ', '_') for c in df.columns]

# --- MODIFICATION START ---
# Calculate the 'attendance' column from 'total_attend' and 'total_held'
df['attendance'] = (df['total_attend'] / df['total_held']) * 100
# --- MODIFICATION END ---

# Required fields
# The 'attendance' column is now created, so we can check for it.
required = ['attendance', 'no_of_backlogs', 'fee_status']
missing = [r for r in required if r not in df.columns]
if missing:
    raise SystemExit(f"Missing columns in CSV: {missing}")

# Preprocessing
# attendance -> numeric (0-100)
df['attendance'] = pd.to_numeric(df['attendance'], errors='coerce').fillna(0).astype(float)
df['no_of_backlogs'] = pd.to_numeric(df['no_of_backlogs'], errors='coerce').fillna(0).astype(int)

# fee_status normalization
df['fee_status'] = df['fee_status'].astype(str).str.strip().str.title()
# Map fee statuses to categories if many variations exist
allowed = ['Paid', 'Pending', 'Partial', 'Overdue']
df['fee_status'] = df['fee_status'].apply(lambda v: v if v in allowed else 'Paid')

# Create a synthetic target "risk" for training if not present.
# If your CSV already has 'risk_level' column, use it. Otherwise, synthesize using simple heuristic:
if 'risk_level' in df.columns:
    df['risk_level'] = df['risk_level'].astype(str).str.title()
else:
    # heuristic: low attendance + many backlogs or overdue fees => High; moderate => Medium; else Low
    def synth(row):
        att = row['attendance']
        b = row['no_of_backlogs']
        fee = row['fee_status']
        score = 0
        if att < 60: score += 40
        elif att < 70: score += 25
        elif att < 80: score += 10
        if b >= 3: score += 30
        elif b == 2: score += 20
        elif b == 1: score += 10
        if fee == 'Overdue': score += 30
        elif fee == 'Pending': score += 10
        if score >= 60: return 'High'
        if score >= 30: return 'Medium'
        return 'Low'
    df['risk_level'] = df.apply(synth, axis=1)

# Encode fee_status
le_fee = LabelEncoder()
df['fee_encoded'] = le_fee.fit_transform(df['fee_status'])

# Encode target
le_target = LabelEncoder()
y = le_target.fit_transform(df['risk_level'])

X = df[['attendance', 'no_of_backlogs', 'fee_encoded']].values

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42, stratify=y)

clf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
clf.fit(X_train, y_train)

# Eval
y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print("Accuracy:", acc)
print(classification_report(y_test, y_pred, target_names=le_target.classes_))

# Save model and encoders
label_map = {int(i): s for i, s in enumerate(le_target.inverse_transform(np.arange(len(le_target.classes_))))}

joblib.dump({'model': clf, 'le_fee': le_fee, 'le_target': le_target, 'label_map': label_map}, args.out)
print(f"Saved model to {args.out}")