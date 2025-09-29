import React from 'react';
import { Users, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react'; // Icons for visual flair

// Helper component for the Icon
const CardIcon = ({ riskLevel }) => {
    let Icon;
    let colorClass;

    switch (riskLevel) {
        case 'Total':
            Icon = Users;
            colorClass = 'text-gray-500'; // Gray for neutral/total
            break;
        case 'High':
            Icon = AlertTriangle;
            colorClass = 'text-red-500';
            break;
        case 'Medium':
            Icon = TrendingUp;
            colorClass = 'text-amber-500';
            break;
        case 'Low':
            Icon = CheckCircle;
            colorClass = 'text-green-500';
            break;
        default:
            Icon = Users;
            colorClass = 'text-gray-500';
    }

    return (
        <div className={`p-1 rounded-full ${colorClass}`}>
            <Icon size={24} strokeWidth={1.5} />
        </div>
    );
};

// Enhanced Card Component with deeper shadows, large typography, and accent ring
const Card = ({ title, value, accentColor, iconType, onClick }) => (
    <div
        className={`p-6 bg-white cursor-pointer rounded-xl transition duration-300 transform hover:scale-[1.02] hover:shadow-xl`}
        onClick={onClick}
        style={{ borderLeft: `4px solid var(--color-${accentColor})` }}
    >
        <div className="flex items-start justify-between">
            <div className="text-sm text-gray-600 font-medium uppercase tracking-wider">{title}</div>
            <CardIcon riskLevel={iconType} />
        </div>

        <div className={`mt-2 text-3xl font-extrabold text-${accentColor}-600`}>
            {value}
        </div>
    </div>
);

const SummaryCards = ({ total = 0, high = 0, medium = 0, low = 0, setRiskFilter }) => {
    return (
        <div 
            className="p-6 bg-white rounded-xl shadow-lg border-b border-gray-200"
            style={{
                '--color-indigo': '#4F46E5',
                '--color-red': '#EF4444',
                '--color-amber': '#F59E0B',
                '--color-green': '#10B981',
            }}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title="Total Students"
                    value={total}
                    accentColor="indigo" 
                    iconType="Total"
                    onClick={() => setRiskFilter('All')}
                />
                <Card
                    title="High Risk"
                    value={high}
                    accentColor="red" 
                    iconType="High"
                    onClick={() => setRiskFilter('High')}
                />
                <Card
                    title="Medium Risk"
                    value={medium}
                    accentColor="amber" 
                    iconType="Medium"
                    onClick={() => setRiskFilter('Medium')}
                />
                <Card
                    title="Low Risk"
                    value={low}
                    accentColor="green" 
                    iconType="Low"
                    onClick={() => setRiskFilter('Low')}
                />
            </div>
        </div>
    );
};

export default SummaryCards;
