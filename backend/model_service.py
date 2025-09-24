from flask import Flask, request, jsonify
import joblib
import numpy as np
import os
import google.generativeai as genai

app = Flask(__name__)

MODEL_PATH = os.environ.get("MODEL_PATH", "model.joblib")
print("Loading model from", MODEL_PATH)

# Check if model file exists before trying to load
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

model_bundle = joblib.load(MODEL_PATH)
clf = model_bundle['model']
le_fee = model_bundle['le_fee']
le_target = model_bundle['le_target']
label_map = model_bundle.get('label_map', None)

# --- GEMINI API CONFIGURATION START ---
# Get the Gemini API key from environment variables
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
# --- GEMINI API CONFIGURATION END ---

def predict_risk(attendance, backlogs, fee_status):
    # prepare
    try:
        fee_enc = le_fee.transform([fee_status])[0]
    except Exception:
        # unknown status -> map to 'Paid' index fallback
        fee_enc = le_fee.transform([le_fee.classes_[0]])[0]
    # Corrected: use no_of_backlogs to match the training data
    X = np.array([[float(attendance), int(backlogs), int(fee_enc)]])
    proba = clf.predict_proba(X)[0]  # order corresponds to le_target.classes_
    idx = np.argmax(proba)
    risk_label = le_target.inverse_transform([idx])[0]
    confidence = float(proba[idx])
    return {"risk_level": risk_label, "confidence": confidence, "proba": proba.tolist()}

def generate_recommendations(student):
    """
    student: dict with attendance, backlogs, fee_status, (optional) other values
    returns list of strings (recommendations)
    """
    att = float(student.get('attendance', 0))
    backlogs = int(student.get('backlogs', 0))
    fee = student.get('fee_status', 'Paid').title()

    recs = []
    # rule-based recommendations
    if att < 60:
        recs.append("Immediate one-on-one mentoring: arrange weekly meetings with mentor to address attendance barriers.")
        recs.append("Make attendance recovery plan: mandatory remedial classes and a daily roll-call for 2 weeks.")
    elif att < 75:
        recs.append("Encourage class participation and set a short-term attendance target (e.g., +10% in 1 month).")
    else:
        recs.append("Maintain consistent attendance and encourage peer-study groups.")

    if backlogs >= 3:
        recs.append("Prioritise backlog clearance: enroll in targeted remedial courses and set exam plan to clear backlogs.")
    elif backlogs == 2:
        recs.append("Book extra practice sessions and pair with a high-performing peer for problem solving.")
    elif backlogs == 1:
        recs.append("Provide revision materials and short quizzes to quickly close the backlog.")

    if fee == 'Overdue':
        recs.append("Financial counseling and fee installment plan: connect student with accounts to discuss options.")
    elif fee == 'Pending':
        recs.append("Send reminders and offer short grace period or instalment options to reduce stress.")
    
    # If still less than 3 suggestions, add generic behavioural suggestions
    if len(recs) < 3:
        recs.append("Monitor progress weekly and engage parents/guardians if required.")
    return list(dict.fromkeys(recs))[:5]  # dedupe keep order

def llm_recommendations(student, risk_label):
    """
    student: dict with attendance, backlogs, fee_status, (optional) other values
    risk_label: string with the predicted risk level
    returns list of strings (recommendations)
    """
    try:
        model = genai.GenerativeModel("models/gemini-2.5-flash") 
        prompt = f"""
        You are an educational counselor. Student details:
        Attendance: {student.get('attendance')}
        Backlogs: {student.get('backlogs')}
        Fee status: {student.get('fee_status')}
        Predicted risk: {risk_label}

        Give 4 concise personalized recommendations, each 1 sentence long, to reduce dropout risk.
        """
        response = model.generate_content(prompt)
        txt = response.text.strip()
        # split into lines
        return [x.strip() for x in txt.split("\n") if x.strip()][:6]
    except Exception as e:
        print(f"An error occurred with the Gemini API: {e}")
        return []

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Python ML Backend is running ✅"}), 200

@app.route("/predict", methods=["POST"])
def predict():
    """
    Request JSON:
    { "attendance": 72.5, "backlogs": 1, "fee_status": "Paid" }
    Response:
    { "risk_level": "Medium", "confidence": 0.82, "proba": [...], "recommendations": [...] (optional) }
    """
    data = request.json or {}
    attendance = data.get('attendance', 0)
    backlogs = data.get('backlogs', 0)
    fee_status = (data.get('fee_status') or 'Paid').title()
    pred = predict_risk(attendance, backlogs, fee_status)
    
    # attach small explanation
    explanation = {
        "attendance": attendance,
        "backlogs": backlogs,
        "fee_status": fee_status
    }

    # Use LLM recs if API key is set, otherwise fall back to rule-based
    recs = []
    if GEMINI_API_KEY:
        recs = llm_recommendations(explanation, pred['risk_level'])
    if not recs or recs == []:
        recs = generate_recommendations(explanation)
        
    return jsonify({"success": True, "data": {"prediction": pred, "recommendations": recs, "explanation": explanation}})

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.json or {}
    student = {
        "attendance": data.get('attendance', 0),
        "backlogs": data.get('backlogs', 0),
        "fee_status": (data.get('fee_status') or 'Paid').title()
    }
    
    # Use LLM recs if API key is set, otherwise fall back to rule-based
    recs = []
    if GEMINI_API_KEY:
        recs = llm_recommendations(student, data.get('risk_label','Unknown'))
    if not recs or recs == []:
        recs = generate_recommendations(student)
        
    return jsonify({"success": True, "data": {"recommendations": recs}})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5001)), debug=False)
