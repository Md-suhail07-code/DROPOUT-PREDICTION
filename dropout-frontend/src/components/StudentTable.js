import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';

const StudentTable = ({ refreshTrigger, onRefresh }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHighRiskOnly, setShowHighRiskOnly] = useState(false);
  const [showMediumRiskOnly, setShowMediumRiskOnly] = useState(false);
  const [showLowRiskOnly, setShowLowRiskOnly] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await studentAPI.getAllStudents();
      setStudents(response.data);
      if (showHighRiskOnly) {
        setFilteredStudents(response.data.filter(student => student.risk_level === 'High'));
      } else if (showMediumRiskOnly) {
        setFilteredStudents(response.data.filter(student => student.risk_level === 'Medium'));
      } else if (showLowRiskOnly) {
        setFilteredStudents(response.data.filter(student => student.risk_level === 'Low'));
      } else {
        setFilteredStudents(response.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };  


  const fetchHighRiskStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await studentAPI.getHighRiskStudents();
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchMediumRiskStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await studentAPI.getMediumRiskStudents();
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchLowRiskStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await studentAPI.getLowRiskStudents();
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [refreshTrigger, showHighRiskOnly, showMediumRiskOnly, showLowRiskOnly]);
  
  const handleFilterToggle = () => {
    setShowHighRiskOnly(!showHighRiskOnly);
    setShowMediumRiskOnly(!showMediumRiskOnly);
    setShowLowRiskOnly(!showLowRiskOnly);
  };


  const getRiskLevelBadge = (riskLevel) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (riskLevel) {
      case 'High':
        return `${baseClasses} bg-danger-500 text-danger-800`;
      case 'Medium':
        return `${baseClasses} bg-warning-100 text-warning-800`;
      case 'Low':
        return `${baseClasses} bg-success-100 text-success-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Compute numeric risk score using same heuristics as backend/index.js
  const computeRiskScore = (attendance = 0, score = 0, feeStatus = '') => {
    let riskScore = 0;
    // Attendance scoring (0-40)
    if (attendance < 60) riskScore += 40;
    else if (attendance < 70) riskScore += 30;
    else if (attendance < 80) riskScore += 20;
    else if (attendance < 90) riskScore += 10;

    // Academic performance scoring (0-30)
    const perf = Number.isFinite(Number(score)) ? Number(score) : 0;
    if (perf < 40) riskScore += 30;
    else if (perf < 50) riskScore += 25;
    else if (perf < 60) riskScore += 20;
    else if (perf < 70) riskScore += 15;
    else if (perf < 80) riskScore += 10;
    else if (perf < 90) riskScore += 5;

    // Fee status scoring (0-30)
    if ((feeStatus || '').toLowerCase() === 'overdue') riskScore += 30;
    else if ((feeStatus || '').toLowerCase() === 'pending') riskScore += 15;
    else if ((feeStatus || '').toLowerCase() === 'partial') riskScore += 10;

    // Cap to 100
    return Math.min(100, Math.max(0, Math.round(riskScore)));
  };

  const riskColorForScore = (score) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 40) return 'bg-amber-400';
    return 'bg-green-500';
  };

  const getFeeStatusBadge = (feeStatus) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (feeStatus) {
      case 'Paid':
        return `${baseClasses} bg-success-100 text-success-800`;
      case 'Pending':
        return `${baseClasses} bg-warning-100 text-warning-800`;
      case 'Partial':
        return `${baseClasses} bg-primary-100 text-primary-800`;
      case 'Overdue':
        return `${baseClasses} bg-danger-500 text-danger-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-50 border border-danger-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-danger-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-danger-800">Error loading students</h3>
            <div className="mt-2 text-sm text-danger-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchStudents}
                className="bg-danger-100 px-3 py-2 rounded-md text-sm font-medium text-danger-800 hover:bg-danger-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Students ({filteredStudents.length})
          </h3>
          <div className="flex items-center space-x-4">
            <select
              value={showHighRiskOnly ? 'High' : showMediumRiskOnly ? 'Medium' : showLowRiskOnly ? 'Low' : 'All'}
              onChange={(e) => {
                if (e.target.value === 'High') {
                  setShowHighRiskOnly(true);
                  setShowMediumRiskOnly(false);
                  setShowLowRiskOnly(false);
                } else if (e.target.value === 'Medium') {
                  setShowHighRiskOnly(false);
                  setShowMediumRiskOnly(true);
                  setShowLowRiskOnly(false);
                } else if (e.target.value === 'Low') {
                  setShowHighRiskOnly(false);
                  setShowMediumRiskOnly(false);
                  setShowLowRiskOnly(true);
                } else {
                  setShowHighRiskOnly(false);
                  setShowMediumRiskOnly(false);
                  setShowLowRiskOnly(false);
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <option value="All">All Students</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
            <button onClick={fetchStudents} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50" >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attendance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fee Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Level
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                  {showHighRiskOnly ? 'No high-risk students found' : 'No students found'}
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            student.attendance >= 80
                              ? 'bg-success-500'
                              : student.attendance >= 60
                              ? 'bg-warning-500'
                              : 'bg-danger-500'
                          }`}
                          style={{ width: `${student.attendance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{student.attendance}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            student.score >= 80
                              ? 'bg-success-500'
                              : student.score >= 60
                              ? 'bg-warning-500'
                              : 'bg-danger-500'
                          }`}
                          style={{ width: `${student.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{student.score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getFeeStatusBadge(student.fee_status)}>
                      {student.fee_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    { (student.risk_score !== undefined && student.risk_score !== null) || student.risk_level ? (
                      (() => {
                        const score = (student.risk_score !== undefined && student.risk_score !== null) ? Number(student.risk_score) : computeRiskScore(student.attendance, student.score, student.fee_status);
                        const displayScore = Number.isFinite(score) ? Math.round(score) : null;
                        if (displayScore !== null) {
                          return (
                            <div className="flex items-center gap-3">
                              <div className="w-28 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div className={`${riskColorForScore(displayScore)} h-2`} style={{ width: `${displayScore}%` }} />
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${displayScore >= 70 ? 'bg-red-600 text-white' : displayScore >=40 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                {displayScore}%
                              </span>
                            </div>
                          );
                        }
                        // fallback to text badge
                        return <span className={getRiskLevelBadge(student.risk_level)}>{student.risk_level || 'N/A'}</span>;
                      })()
                    ) : (
                      <span className={getRiskLevelBadge(student.risk_level)}>{student.risk_level || 'N/A'}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTable;
