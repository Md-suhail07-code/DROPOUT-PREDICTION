import React, { useState, useEffect } from 'react';
import StudentTable from './StudentTable';
import AddStudentForm from './AddStudentForm';
import { studentAPI } from '../services/api';

const Dashboard = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [highRiskStudents, setHighRiskStudents] = useState(0);
  const [mediumRiskStudents, setMediumRiskStudents] = useState(0);
  const [lowRiskStudents, setLowRiskStudents] = useState(0);

  const handleStudentAdded = (newStudent) => {
    // Trigger refresh of the student table
    setRefreshTrigger(prev => prev + 1);
  };
  const fetchStudentStats = async () => {
    try {
      const response = await studentAPI.getAllStudents();
      setTotalStudents(response.data.length);
      setHighRiskStudents(response.data.filter(student => student.risk_level === 'High').length);
      setMediumRiskStudents(response.data.filter(student => student.risk_level === 'Medium').length);
      setLowRiskStudents(response.data.filter(student => student.risk_level === 'Low').length);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchStudentStats();
  }, [refreshTrigger]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Dropout Prediction</h1>
              <p className="mt-1 text-sm text-gray-500">
                Monitor student performance and identify those at risk of dropping out
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">API Status</div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-success-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-gray-900">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                        <dd className="text-lg font-medium text-gray-900">{totalStudents}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">High Risk</dt>
                        <dd className="text-lg font-medium text-gray-900">{highRiskStudents}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Medium Risk</dt>
                        <dd className="text-lg font-medium text-gray-900">{mediumRiskStudents}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Low Risk</dt>
                        <dd className="text-lg font-medium text-gray-900">{lowRiskStudents}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Student Form */}
            <AddStudentForm onStudentAdded={handleStudentAdded} />

            {/* Student Table */}
            <StudentTable refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Student Dropout Prediction System v1.0.0
            </div>
            <div className="text-sm text-gray-500">
              Powered by React & Node.js
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
