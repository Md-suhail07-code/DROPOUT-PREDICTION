import React from 'react';

const Card = ({ title, value, accent, onClick }) => (
  <div className="bg-white rounded-xl shadow p-5 border border-gray-100 cursor-pointer" onClick={onClick}>
    <div className="text-sm text-gray-500">{title}</div>
    <div className={`mt-2 text-2xl font-bold ${accent}`}>{value}</div>
  </div>
);

const SummaryCards = ({ total = 0, high = 0, medium = 0, low = 0, setRiskFilter }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card title="Total Students" value={total} accent="text-gray-900" onClick={() => setRiskFilter('All')} />
      <Card title="High Risk" value={high} accent="text-red-600" onClick={() => setRiskFilter('High')} />
      <Card title="Medium Risk" value={medium} accent="text-amber-600" onClick={() => setRiskFilter('Medium')} />
      <Card title="Low Risk" value={low} accent="text-green-600" onClick={() => setRiskFilter('Low')} />
    </div>
  );
};

export default SummaryCards;


