import React from 'react';

const RiskFactorsChart = ({ data, title = "Primary Risk Factors" }) => {
  // Analyze the data to identify primary risk factors
  const analyzeRiskFactors = (students) => {
    let attendanceIssues = 0;
    let backlogIssues = 0;
    let feeIssues = 0;
    
    students.forEach(student => {
      const attendance = Number(student.attendance) || 0;
      const backlogs = Number(student.backlogs) || 0;
      const feeStatus = student.fee_status || '';
      
      // Count students with attendance issues (< 75%)
      if (attendance < 75) {
        attendanceIssues++;
      }
      
      // Count students with backlog issues (≥ 2 backlogs)
      if (backlogs >= 2) {
        backlogIssues++;
      }
      
      // Count students with fee issues
      if (feeStatus.toLowerCase() === 'pending' || feeStatus.toLowerCase() === 'overdue') {
        feeIssues++;
      }
    });
    
    return [
      { 
        factor: 'Attendance Issues', 
        count: attendanceIssues, 
        percentage: Math.round((attendanceIssues / students.length) * 100),
        description: 'Students with < 75% attendance',
        color: 'bg-red-500'
      },
      { 
        factor: 'Academic Backlogs', 
        count: backlogIssues, 
        percentage: Math.round((backlogIssues / students.length) * 100),
        description: 'Students with ≥ 2 backlogs',
        color: 'bg-orange-500'
      },
      { 
        factor: 'Fee Payment Issues', 
        count: feeIssues, 
        percentage: Math.round((feeIssues / students.length) * 100),
        description: 'Students with pending/overdue fees',
        color: 'bg-yellow-500'
      }
    ];
  };

  const riskFactors = analyzeRiskFactors(data);
  const maxCount = Math.max(...riskFactors.map(f => f.count));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">Risk factors are not mutually exclusive - students may have multiple issues</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {riskFactors.map((factor, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${factor.color}`}></div>
                <div>
                  <span className="text-sm font-medium text-gray-700">{factor.factor}</span>
                  <p className="text-xs text-gray-500">{factor.description}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{factor.count}</span>
                <span className="text-xs text-gray-500 ml-1">({factor.percentage}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${factor.color} transition-all duration-1000 ease-out`}
                style={{ 
                  width: maxCount > 0 ? `${(factor.count / maxCount) * 100}%` : '0%' 
                }}
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default RiskFactorsChart;
