# Student Dropout Prediction Frontend

A React dashboard for monitoring student performance and identifying those at risk of dropping out.

## Features

- 📊 **Student Table**: View all students with attendance, scores, and risk levels
- 🔍 **High-Risk Filter**: Toggle to show only high-risk students
- ➕ **Add Students**: Form to add new students with validation
- 🎨 **Clean UI**: Modern design with Tailwind CSS
- 📱 **Responsive**: Works on desktop and mobile devices
- 🔄 **Real-time Updates**: Automatic refresh after adding students

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm
- Backend API running on http://localhost:5000

### Installation

1. Navigate to the frontend directory:
```bash
cd dropout-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The dashboard will be available at `http://localhost:3000`

## Components

### Dashboard
Main component that orchestrates the entire dashboard layout.

### StudentTable
- Displays students in a responsive table
- Shows ID, name, attendance, score, fee status, and risk level
- Includes progress bars for attendance and scores
- Filter button to show only high-risk students
- Refresh functionality

### AddStudentForm
- Form to add new students
- Input validation for all fields
- Real-time error handling
- Success/error notifications
- Form reset functionality

### API Service
- Centralized API calls using axios
- Error handling and response formatting
- Base URL configuration

## Styling

The application uses Tailwind CSS for styling with:
- Custom color palette for risk levels
- Responsive grid layouts
- Form styling with focus states
- Loading states and animations
- Status badges and progress bars

## API Integration

The frontend communicates with the backend API at `http://localhost:5000`:

- `GET /students` - Fetch all students
- `GET /students/high-risk` - Fetch high-risk students
- `POST /students` - Add new student
- `PUT /students/:id/risk-level` - Update risk level
- `GET /students/:id` - Get specific student

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Project Structure

```
src/
├── components/
│   ├── Dashboard.js          # Main dashboard component
│   ├── StudentTable.js       # Student table with filtering
│   └── AddStudentForm.js     # Form to add new students
├── services/
│   └── api.js               # API service functions
├── App.js                   # Main app component
├── App.css                  # App styles
├── index.js                 # Entry point
└── index.css                # Global styles with Tailwind
```

## Features in Detail

### Student Table
- **Sorting**: Students sorted by risk level (High → Medium → Low)
- **Progress Bars**: Visual representation of attendance and scores
- **Status Badges**: Color-coded risk levels and fee status
- **Filtering**: Toggle between all students and high-risk only
- **Responsive**: Table scrolls horizontally on mobile

### Add Student Form
- **Validation**: Client-side validation for all fields
- **Real-time Feedback**: Immediate error/success messages
- **Auto-calculation**: Risk level calculated automatically by backend
- **Form Reset**: Clear form after successful submission

### Risk Level Indicators
- **High Risk**: Red badges and progress bars
- **Medium Risk**: Yellow/Orange indicators
- **Low Risk**: Green indicators

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC