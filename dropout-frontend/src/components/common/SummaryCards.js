import React from 'react';

// Enhanced Card Component with deeper shadows, larger typography, and hover effects
const Card = ({ title, value, accent, onClick, bg, borderClass = '' }) => (
  <div
    // Increased padding, used rounded-2xl for smoother corners,
    // Applied shadow-xl for elevation, added transition and scale effect on hover.
    // Added border-l-4 for a strong left accent border based on risk level.
    className={`p-6 border border-gray-100 cursor-pointer rounded-xl shadow-lg transition duration-300 transform hover:scale-[1.02] hover:shadow-2xl ${bg} ${borderClass}`}
    onClick={onClick}
  >
    {/* Title style: Slightly adjusted color and added bold and spacing */}
    <div className="text-sm text-gray-600 font-medium uppercase tracking-wider">{title}</div>
    
    {/* Value style: Increased text size to 4xl for prominence */}
    <div className={`mt-2 text-4xl font-extrabold ${accent}`}>{value}</div>
  </div>
);

const SummaryCards = ({ total = 0, high = 0, medium = 0, low = 0, setRiskFilter }) => {
  return (
    // Increased gap between cards for better separation
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card
        title="Total Students"
        value={total}
        // Used indigo theme for "Total" card background
        accent="text-gray-900"
        bg="bg-indigo-50"
        borderClass="border-l-4 border-indigo-400" // Accent border for total
        onClick={() => setRiskFilter('All')}
      />
      <Card
        title="High Risk"
        value={high}
        // Used vibrant red colors
        bg="bg-red-50"
        accent="text-red-600"
        borderClass="border-l-4 border-red-500" // Strong red accent border
        onClick={() => setRiskFilter('High')}
      />
      <Card
        title="Medium Risk"
        value={medium}
        // Used amber/yellow colors
        bg="bg-amber-50"
        accent="text-amber-600"
        borderClass="border-l-4 border-amber-700" // Amber accent border
        onClick={() => setRiskFilter('Medium')}
      />
      <Card
        title="Low Risk"
        value={low}
        // Used green colors
        bg="bg-green-50"
        accent="text-green-600"
        borderClass="border-l-4 border-green-500" // Green accent border
        onClick={() => setRiskFilter('Low')}
      />
    </div>
  );
};

export default SummaryCards;
