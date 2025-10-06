import React from 'react';

// Gumroad-inspired Card Component with thin outlines
const Card = ({ title, value, accent, onClick, bg, borderClass = '', icon, progressColor }) => (
    <div
        className={`card-hover p-6 cursor-pointer relative overflow-hidden group ${bg} ${borderClass} rounded-lg transition-transform duration-300 ease-out hover:shadow-2xl hover:scale-110`}
        onClick={onClick}
    >
        {/* Content */}
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600 font-medium uppercase tracking-wider">{title}</div>
                {icon && (
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                        {icon}
                    </div>
                )}
            </div>

            <div className={`text-4xl font-bold ${accent}`}>{value}</div>

            {/* Subtle progress indicator */}
            <div className="mt-3 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${progressColor} transition-all duration-500`} style={{ width: '100%' }}></div>
            </div>
        </div>
    </div>
);

const SummaryCards = ({ total = 0, high = 0, medium = 0, low = 0, setRiskFilter }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card
                title="Total Students"
                value={total}
                accent="text-gray-900"
                bg="bg-white"
                borderClass="border-l-4 border-gray-400"
                progressColor="bg-gray-400"
                onClick={() => setRiskFilter('All')}
                icon={
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                }
            />
            <Card
                title="High Risk"
                value={high}
                accent="text-red-600"
                bg="bg-white"
                borderClass="border-l-4 border-red-500"
                progressColor="bg-red-500"
                onClick={() => setRiskFilter('High')}
                icon={
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                }
            />
            <Card
                title="Medium Risk"
                value={medium}
                accent="text-amber-600"
                bg="bg-white"
                borderClass="border-l-4 border-amber-500"
                progressColor="bg-amber-500"
                onClick={() => setRiskFilter('Medium')}
                icon={
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
            />
            <Card
                title="Low Risk"
                value={low}
                accent="text-green-600"
                bg="bg-white"
                borderClass="border-l-4 border-green-500"
                progressColor="bg-green-500"
                onClick={() => setRiskFilter('Low')}
                icon={
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
            />
        </div>
    );
};

export default SummaryCards;
