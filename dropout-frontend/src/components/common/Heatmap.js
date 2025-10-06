import React from 'react';

const Heatmap = ({ data, title = "Attendance Distribution by Section" }) => {
  // Process data to create heatmap showing attendance by section
  const processHeatmapData = (students) => {
    // Group students by attendance ranges and sections
    const attendanceRanges = [
      { min: 0, max: 60, label: '0-60%' },
      { min: 60, max: 70, label: '60-70%' },
      { min: 70, max: 80, label: '70-80%' },
      { min: 80, max: 90, label: '80-90%' },
      { min: 90, max: 100, label: '90-100%' }
    ];

    // Extract unique sections from student data
    const sections = [...new Set(students.map(s => s.section || s.branch || s.department || 'General').filter(Boolean))].sort();
    
    // If no sections found, create default sections based on roll numbers or other patterns
    const defaultSections = sections.length > 0 ? sections : ['A', 'B', 'C', 'D'];

    const heatmapData = attendanceRanges.map(attRange => 
      defaultSections.map(section => {
        const count = students.filter(student => {
          const attendance = student.attendance || 0;
          const studentSection = student.section || student.branch || student.department || 'General';
          return attendance >= attRange.min && attendance < attRange.max &&
                 studentSection === section;
        }).length;
        return count;
      })
    );

    return { heatmapData, attendanceRanges, sections: defaultSections };
  };

  const { heatmapData, attendanceRanges, sections } = processHeatmapData(data);
  const maxValue = Math.max(...heatmapData.flat());

  const getColorIntensity = (value) => {
    if (value === 0) return 'bg-gray-50';
    const intensity = value / maxValue;
    if (intensity <= 0.2) return 'bg-red-100';
    if (intensity <= 0.4) return 'bg-red-200';
    if (intensity <= 0.6) return 'bg-red-300';
    if (intensity <= 0.8) return 'bg-red-400';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      
      <div className="space-y-4">
        {/* Y-axis labels and heatmap */}
        <div className="flex">
          {/* Y-axis labels */}
          <div className="w-20 flex flex-col justify-between text-sm text-gray-600">
            {attendanceRanges.map((range, index) => (
              <div key={index} className="h-8 flex items-center">
                {range.label}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="flex-1">
            <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
              {heatmapData.map((row, rowIndex) =>
                row.map((value, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`h-8 rounded-sm flex items-center justify-center text-xs font-medium transition-all duration-200 hover:scale-105 ${getColorIntensity(value)} ${
                      value > 0 ? 'text-white' : 'text-gray-400'
                    }`}
                    title={`Attendance: ${attendanceRanges[rowIndex].label}, Section: ${sections[colIndex]}, Count: ${value}`}
                  >
                    {value}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* X-axis labels */}
        <div className="flex">
          <div className="w-20"></div>
          <div className={`flex-1 grid gap-1`} style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
            {sections.map((section, index) => (
              <div key={index} className="text-center text-sm text-gray-600">
                {section}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Section</span>
          <div className="flex items-center space-x-2">
            <span>Low</span>
            <div className="flex space-x-1">
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((intensity, index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-sm ${getColorIntensity(Math.round(intensity * maxValue))}`}
                />
              ))}
            </div>
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
