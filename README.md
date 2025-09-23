# DROPOUT PREDICTION

A full-stack application to help educational institutions identify students at risk of dropping out and provide actionable recommendations. The project includes:

- A Node.js/Express backend (`dropout-backend`) serving REST APIs and managing user accounts, mentors, and students.
- A React frontend (`dropout-frontend`) for Admin/Mentor/Student user interfaces.
- A Python Flask model service (`backend/model_service.py`) that loads a trained scikit-learn model to predict dropout risk and generate recommendations.
- A lightweight SQLite database (`dropout-backend/dropout.db`) for local development.

This README explains the architecture, how to run the services locally, the main API endpoints, and development notes so anyone can understand and run the project.

---

## Table of contents

- [Project overview](#project-overview)
- [Repository structure](#repository-structure)
- [Requirements](#requirements)
- [Configuration & environment variables](#configuration--environment-variables)
- [Running locally (recommended order)](#running-locally-recommended-order)
	- [1. Backend API (Express)](#1-backend-api-express)
	- [2. Model service (Flask)](#2-model-service-flask)
	- [3. Frontend (React)](#3-frontend-react)
- [Database](#database)
- [Key API endpoints](#key-api-endpoints)
- [Authentication & roles](#authentication--roles)
- [CSV import/export flows](#csv-importexport-flows)
- [Model service API](#model-service-api)
- [Troubleshooting](#troubleshooting)
- [Development notes and tips](#development-notes-and-tips)
- [Acknowledgements](#acknowledgements)

---

## Project overview

This project predicts students' dropout risk using features such as attendance, backlogs, fee status, and simple derived scores. Admins can import student and mentor data via CSV, view aggregated risk dashboards, export student data, and request per-student predictions and recommendations. The model service encapsulates the ML model and optionally calls an LLM (Gemini) for enhanced personalized recommendations.

Use cases:
- Admins: import initial data, view dashboards, export data, manage mentors/students.
- Mentors: view their assigned students and act on at-risk recommendations.
- Students: view their own profile (if implemented in UI).

---

## Repository structure

Top-level layout:

```
README.md
start-dev.bat
start-dev.ps1
backend/                    # Python model service and model files
	model_service.py
  train_model.py
	model.joblib
dropout-backend/            # Express API server + DB
	index.js
	dropout.db
	package.json
	scripts/
		seed.js
dropout-frontend/           # React front-end
	package.json
	src/
		components/
		services/
		...
```

---

## Requirements

- Node.js (v16+) and npm
- Python 3.8+ (for model service)
- pip to install Python dependencies
- Optional: a Gemini API key (environment) for LLM-based recommendations

---

## Configuration & environment variables

Create `.env` files or export environment variables before running services. Main variables used:

- Backend (`dropout-backend` / `index.js`):
	- `PORT` - port for the backend API (default: `5000`)
	- `JWT_SECRET` - secret used to sign JWT tokens (set to a secure string in production)
	- `MODEL_SERVICE_URL` - URL of the model service (default: `http://127.0.0.1:5001`)

- Model service (`backend/model_service.py`):
	- `PORT` - port for the Flask service (default: `5001`)
	- `MODEL_PATH` - path to the `model.joblib` file (default: `model.joblib` inside `backend/`)
	- `GEMINI_API_KEY` - optional; if set, the model service will call Gemini to generate recommendations

- Frontend (`dropout-frontend/src/services/api.js`):
	- `PORT` - used in some scripts; frontend default is build-in dev server (React)
	- The frontend uses `localStorage` for tokens and the axios instance sets `Authorization: Bearer <token>` if present.

Note: For development, `dropout-backend/dropout.db` SQLite file is used. The repo includes seed scripts under `dropout-backend/scripts/seed.js`.

---

## Running locally (recommended order)

Start services in this order: backend API, model service, then frontend.

### 1. Backend API (Express)

Open a PowerShell terminal in `dropout-backend` and install dependencies (if not already):

```powershell
cd 'c:\Users\Md.Suhail\Downloads\DROPOUT-PREDICTION\dropout-backend'
npm install
```

Start the backend:

```powershell
# development with auto-reload (nodemon)
npm run dev
# or production-like
npm start
```

The backend listens on port `5000` by default.

Run the seed script to populate example data (optional):

```powershell
npm run seed
```

### 2. Model service (Flask, Python)

Open a PowerShell terminal in `backend` (the Python model service directory). Create a virtual environment and install dependencies if needed.

```powershell
cd 'c:\Users\Md.Suhail\Downloads\DROPOUT-PREDICTION\backend'
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# If you don't have requirements.txt, install minimal deps:
# pip install flask joblib numpy google-generative-ai
```

Ensure the model file `model.joblib` exists in `backend/` (it should be in the repo). Then run:

```powershell
$env:PORT=5001
python model_service.py
```

The model service will run on port `5001` by default and exposes `/predict` and `/recommend` endpoints.

### 3. Frontend (React)

Open a PowerShell terminal in `dropout-frontend` and install dependencies:

```powershell
cd 'c:\Users\Md.Suhail\Downloads\DROPOUT-PREDICTION\dropout-frontend'
npm install
npm start
```

The React dev server typically runs on `http://localhost:3000`.

---

## Database

- The backend uses SQLite (`dropout-backend/dropout.db`) for development.
- `index.js` will create tables automatically if they do not exist (users, mentors, students).
- `dropout-backend/scripts/seed.js` can insert sample users/mentors/students for testing.

---

## Key API endpoints (summary)

Auth:
- `POST /auth/signup` - Create user (body: `name,email,password,role`)
- `POST /auth/login` - Login (body: `email,password`) → returns `{ user, token }`

Admin:
- `GET /admin/students` - (auth: Admin) list all students
- `GET /admin/students/:id` - (auth: Admin) student details
- `GET /admin/students/:id/predict` - (auth: Admin|Mentor) call model service for prediction + recs
- `POST /admin/students/import` - (auth: Admin) import students via multipart CSV (`file`)
- `POST /admin/mentors/import` - (auth: Admin) import mentors via CSV (`file`)
- `GET /admin/students/export` - (auth: Admin) export Excel
- `GET /admin/students/export-csv` - (auth: Admin) export CSV
- `GET /admin/isdataadded` - (auth: Admin) returns `{ success: true, isdataadded: <0|1> }`
- `PUT /admin/toggle-data-added` - (auth: Admin) toggles user's `isdataadded` flag

Mentor:
- `GET /mentor/students` - (auth: Mentor) list mentor's students

Student:
- `GET /student/me` - (auth: Student) own profile

Model service:
- `POST /predict` - predict risk given `attendance`, `backlogs`, `fee_status`
- `POST /recommend` - returns recommendations

---

## Authentication & roles

- The backend issues JWT tokens on login/signup. Frontend stores `token` in `localStorage` and axios includes it on requests.
- Roles supported: `Admin`, `Mentor`, `Student`. Role-based route guards are implemented on the server.

---

## CSV import/export flows

- CSV import endpoints accept a `multipart/form-data` upload with `file` field. Column mapping is forgiving (attempts common header names).
- Mentor import and student import scripts attempt to `INSERT OR IGNORE` so re-running imports is safe.
- After a successful student import, the backend does not automatically toggle `isdataadded`; the frontend calls the `PUT /admin/toggle-data-added` endpoint (or `PUT /admin/isdataadded` if implemented) to mark the flag for UI flow.

---

## Model service API

The Python Flask model service exposes:

- `POST /predict` — payload example:
```json
{
	"attendance": 72.5,
	"backlogs": 2,
	"fee_status": "Paid"
}
```
Response example:
```json
{
	"success": true,
	"data": {
		"prediction": {"risk_level": "Medium", "confidence": 0.78, "proba": [...]},
		"recommendations": ["...", "..."],
		"explanation": {"attendance":72.5, "backlogs":2, "fee_status":"Paid"}
	}
}
```

- `POST /recommend` — returns recommendations based on provided student features.

The service loads a `model.joblib` containing the classifier and label encoders. If `GEMINI_API_KEY` is set in the environment, the service uses Gemini to generate personalized recommendations.

---

## Troubleshooting

- If frontend keeps showing the import tab after successful import and refresh:
	1. Verify the backend `GET /admin/isdataadded` returns `isdataadded: 1` (or `true`) for the logged-in Admin. The frontend expects either a boolean or an object with `isdataadded`.
	2. Ensure the token exists in `localStorage` so the request includes Authorization header.
	3. Check console/network logs in browser devtools to see the response payload.

- If `model_service.py` fails to start:
	- Ensure `model.joblib` is present at the configured `MODEL_PATH`.
	- Install Python dependencies and verify `joblib` version compatibility.

- If SQLite build fails on npm install on Windows, run:
	```powershell
	npm rebuild sqlite3 --build-from-source
	```

---

## Development notes and tips

- The backend creates tables on startup. If you change schema make sure to migrate or delete `dropout.db` during development.
- The frontend is a plain Create-React-App with Tailwind CSS. Scripts are under `dropout-frontend/package.json`.
- Testing: There are some basic tests scaffolding in the frontend (`react-scripts test`). Consider adding unit tests for API utilities and import parsing.

---

## Acknowledgements

- This project was developed for an SIH (Smart India Hackathon) style submission and combines a small Express API, a React dashboard, and a lightweight ML service.

---

If you'd like, I can also:
- Add an `ENV_SAMPLE` file with recommended environment variables.
- Add step-by-step screenshots for UI flows.
- Add a CONTRIBUTING guide and code-of-conduct.

If you want me to commit this README, tell me and I'll create the file in the repo (already prepared).
