import React from 'react';

const Card = ({ title, value, accent, onClick, bg }) => (
  <div
    className={`p-5 border border-gray-100 cursor-pointer rounded-xl shadow ${bg}`}
    onClick={onClick}
  >
    <div className="text-sm text-gray-500">{title}</div>
    <div className={`mt-2 text-2xl font-bold ${accent}`}>{value}</div>
  </div>
);

const SummaryCards = ({ total = 0, high = 0, medium = 0, low = 0, setRiskFilter }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        title="Total Students"
        value={total}
        accent="text-gray-900"
        bg="bg-blue-100"
        onClick={() => setRiskFilter('All')}
      />
      <Card
        title="High Risk"
        value={high}
        bg="bg-red-100"
        accent="text-red-600"
        onClick={() => setRiskFilter('High')}
      />
      <Card
        title="Medium Risk"
        value={medium}
        bg="bg-amber-100"
        accent="text-amber-600"
        onClick={() => setRiskFilter('Medium')}
      />
      <Card
        title="Low Risk"
        value={low}
        bg="bg-green-100"
        accent="text-green-600"
        onClick={() => setRiskFilter('Low')}
      />
    </div>
  );
};

export default SummaryCards;
