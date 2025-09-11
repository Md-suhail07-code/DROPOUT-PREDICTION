# Dropout Prediction API

A Node.js + Express REST API with SQLite for student dropout prediction and management.

## Features

- 🎯 **Student Management**: Add, retrieve, and update student information
- 📊 **Risk Assessment**: Automatic risk level calculation based on attendance, academic performance, and fee status
- 🔍 **High-Risk Detection**: Identify students at high risk of dropping out
- ✅ **Data Validation**: Comprehensive input validation and error handling
- 📝 **RESTful API**: Clean, well-documented endpoints

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Navigate to the backend directory:
```bash
cd dropout-backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Base URL
```
http://localhost:5000
```

### 1. Health Check
```http
GET /
```
Returns API status and available endpoints.

**Response:**
```json
{
  "success": true,
  "message": "Dropout Prediction API running 🚀",
  "version": "1.0.0",
  "endpoints": [...]
}
```

### 2. Add Student
```http
POST /students
```

**Request Body:**
```json
{
  "name": "John Doe",
  "age": 16,
  "gender": "Male",
  "village": "Downtown",
  "attendance": 75.5,
  "score": 68.0,
  "fee_status": "Pending"
}
```

**Validation Rules:**
- `name`: Required, string
- `age`: Required, integer (5-25)
- `gender`: Required, one of: "Male", "Female", "Other"
- `village`: Required, string
- `attendance`: Required, number (0-100)
- `score`: Required, number (0-100)
- `fee_status`: Required, one of: "Paid", "Pending", "Partial", "Overdue"

**Response:**
```json
{
  "success": true,
  "message": "Student added successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "age": 16,
    "gender": "Male",
    "village": "Downtown",
    "attendance": 75.5,
    "score": 68.0,
    "fee_status": "Pending",
    "risk_level": "Medium"
  }
}
```

### 3. Get All Students
```http
GET /students
```

**Response:**
```json
{
  "success": true,
  "message": "Students fetched successfully",
  "count": 2,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "age": 16,
      "gender": "Male",
      "village": "Downtown",
      "attendance": 75.5,
      "score": 68.0,
      "fee_status": "Pending",
      "risk_level": "Medium"
    }
  ]
}
```

### 4. Get High-Risk Students
```http
GET /students/high-risk
```

**Response:**
```json
{
  "success": true,
  "message": "High-risk students fetched successfully",
  "count": 1,
  "data": [
    {
      "id": 2,
      "name": "Jane Smith",
      "age": 15,
      "gender": "Female",
      "village": "Uptown",
      "attendance": 45.0,
      "score": 35.0,
      "fee_status": "Overdue",
      "risk_level": "High"
    }
  ]
}
```

### 5. Update Student Risk Level
```http
PUT /students/:id/risk-level
```

**Request Body:**
```json
{
  "risk_level": "High"
}
```

**Valid Risk Levels:** "Low", "Medium", "High"

**Response:**
```json
{
  "success": true,
  "message": "Risk level updated successfully",
  "data": {
    "id": 1,
    "risk_level": "High"
  }
}
```

### 6. Get Specific Student
```http
GET /students/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Student fetched successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "age": 16,
    "gender": "Male",
    "village": "Downtown",
    "attendance": 75.5,
    "score": 68.0,
    "fee_status": "Pending",
    "risk_level": "Medium"
  }
}
```

## Risk Level Calculation

The API automatically calculates risk levels based on a scoring system:

### Scoring Criteria

**Attendance (0-40 points):**
- < 60%: 40 points
- 60-69%: 30 points
- 70-79%: 20 points
- 80-89%: 10 points
- ≥ 90%: 0 points

**Academic Performance (0-30 points):**
- < 40%: 30 points
- 40-49%: 25 points
- 50-59%: 20 points
- 60-69%: 15 points
- 70-79%: 10 points
- 80-89%: 5 points
- ≥ 90%: 0 points

**Fee Status (0-30 points):**
- Overdue: 30 points
- Pending: 15 points
- Partial: 10 points
- Paid: 0 points

### Risk Level Determination

- **High Risk**: 70+ points
- **Medium Risk**: 40-69 points
- **Low Risk**: < 40 points

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error

## Testing

Run the test script to verify API functionality:

```bash
node test-api.js
```

This will test all endpoints with sample data and demonstrate error handling.

## Database Schema

```sql
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  age INTEGER,
  gender TEXT,
  village TEXT,
  attendance REAL,
  score REAL,
  fee_status TEXT,
  risk_level TEXT
);
```

## Development

### Scripts

- `npm run dev`: Start development server with nodemon
- `node index.js`: Start production server

### Environment Variables

- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment mode (development/production)

## License

ISC
