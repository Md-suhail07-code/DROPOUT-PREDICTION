import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../App';
import { studentAPI } from '../../services/api';
import TopNav from '../common/TopNav';
import SummaryCards from '../common/SummaryCards'; // Assuming this component is reusable
import CircularProgress from '../common/CircularProgress'; // Assuming this component is reusable
import { calculateRiskScore } from '../../utils/riskCalculation'; // Assuming this utility is available

const MentorDashboard = () => {
    const { user } = useContext(AuthContext);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [riskFilter, setRiskFilter] = useState('All'); // New filter
    const [sortBy, setSortBy] = useState('name'); // New sort state
    const [sortDir, setSortDir] = useState('asc'); // New sort state
    const [page, setPage] = useState(1);
    const pageSize = 10; // Increased page size for table view

    // --- Utility Functions (Copied/Adapted from AdminDashboard) ---

    const computeRiskScore = (attendance = 0, score = 0, feeStatus = '') => {
        // Assume score is either s.performance or s.score
        const performanceValue = score ?? 0;

        // Use the same risk calculation logic as the AdminDashboard
        return Number(calculateRiskScore({
            attendance,
            score: performanceValue, // Using score for the calculation
            fee_status: feeStatus
        })) * 10; // Convert 0-10 score to percentage
    };

    const riskColorForScore = (score) => {
        if (score >= 70) return 'bg-red-500';
        if (score >= 40) return 'bg-amber-400';
        return 'bg-green-500';
    };

    const getFeeBadgeClasses = (feeStatus) => {
        switch (feeStatus) {
            case 'Paid':
                return 'bg-green-100 text-green-800';
            case 'Pending':
                return 'bg-amber-100 text-amber-800';
            default:
                return 'bg-red-100 text-red-800';
        }
    };

    const getRiskBadgeClasses = (riskLevel) => {
        switch (riskLevel) {
            case 'High':
                return 'bg-red-500 text-white shadow-md';
            case 'Medium':
                return 'bg-amber-100 text-amber-800';
            case 'Low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const renderSortArrow = (key) => {
        if (sortBy === key) {
            return sortDir === 'asc' ? '▲' : '▼';
        }
        return ' ';
    };

    // --- Data Fetching Effect ---

    useEffect(() => {
        (async () => {
            try {
                const res = await studentAPI.getMentorStudents();
                // Add a simple risk_level to the data for filtering/summary
                const studentsWithRisk = res.data.map(s => {
                    const riskScore = computeRiskScore(s.attendance, s.performance ?? s.score, s.fee_status);
                    let riskLevel;
                    if (riskScore >= 70) riskLevel = 'High';
                    else if (riskScore >= 40) riskLevel = 'Medium';
                    else riskLevel = 'Low';

                    return {
                        ...s,
                        risk_score: riskScore,
                        risk_level: riskLevel
                    };
                });
                setStudents(studentsWithRisk);
            } catch (err) {
                console.error('Failed to load mentor students', err);
                setStudents([]);
                alert(err.message || 'Failed to load your students. Make sure you are logged in as a Mentor.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // --- Filtering and Sorting Logic ---

    const filteredAndSorted = students.filter(s => {
        const matchSearch = `${s.name} ${s.roll_number || ''}`.toLowerCase().includes(search.toLowerCase());
        const matchRisk = riskFilter === 'All' || s.risk_level === riskFilter;
        return matchSearch && matchRisk;
    }).sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        let av, bv;
        switch (sortBy) {
            case 'attendance':
                av = a.attendance || 0;
                bv = b.attendance || 0;
                break;
            case 'performance':
                av = a.performance ?? a.score ?? 0;
                bv = b.performance ?? b.score ?? 0;
                break;
            case 'risk_score':
                av = a.risk_score || 0;
                bv = b.risk_score || 0;
                break;
            case 'roll_number':
                av = a.roll_number || '';
                bv = b.roll_number || '';
                break;
            default: // name
                av = a.name || '';
                bv = b.name || '';
        }
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
    });

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
    useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages]);
    const current = filteredAndSorted.slice((page - 1) * pageSize, page * pageSize);

    const totals = {
        total: students.length,
        high: students.filter(s => s.risk_level === 'High').length,
        medium: students.filter(s => s.risk_level === 'Medium').length,
        low: students.filter(s => s.risk_level === 'Low').length,
    };

    // --- Render ---

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNav title={`Mentor Dashboard: ${user?.name || ''}`} />

            <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 space-y-8">
                {/* 1. Summary Cards */}
                <SummaryCards
                    total={totals.total}
                    high={totals.high}
                    medium={totals.medium}
                    low={totals.low}
                    setRiskFilter={setRiskFilter}
                />

                {/* 2. Filter/Search Bar */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 space-y-4">
                    <h3 className="text-xl font-bold text-gray-800">Student List</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        <div className="sm:col-span-2">
                            <label htmlFor="search" className="sr-only">Search</label>
                            <input
                                id="search"
                                placeholder="Search by name or roll number..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            />
                        </div>

                        <select
                            value={riskFilter}
                            onChange={e => setRiskFilter(e.target.value)}
                            className="border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        >
                            <option value="All">All Risk Levels</option>
                            <option value="Low">Low Risk</option>
                            <option value="Medium">Medium Risk</option>
                            <option value="High">High Risk</option>
                        </select>
                    </div>
                </div>

                {/* 3. Loading State */}
                {loading ? (
                    <div className="text-center text-gray-500 py-10">
                        <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2">Loading students...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        <p>No students assigned to you.</p>
                    </div>
                ) : (
                    <>
                        {/* 4. Student Data Table */}
                        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-indigo-50 border-b border-indigo-200">
                                        <tr>
                                            {[
                                                { key: 'name', label: 'Name' },
                                                { key: 'roll_number', label: 'Roll' },
												{ key: 'email', label: 'Email' },
                                                { key: 'attendance', label: 'Attendance' },
                        						{ key: 'backlogs', label: 'Backlogs' },
                                                { key: 'fee_status', label: 'Fee Status' },
                                                { key: 'risk_score', label: 'Risk' },
                                            ].map(h => (
                                                <th
                                                    key={h.key}
                                                    className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (['fee_status'].includes(h.key)) return;
                                                            setSortBy(h.key);
                                                            setSortDir(d =>
                                                                sortBy === h.key ? (d === 'asc' ? 'desc' : 'asc') : 'asc'
                                                            );
                                                        }}
                                                        className="inline-flex items-center gap-1"
                                                    >
                                                        {h.label}
                                                        {(['name', 'attendance', 'performance', 'roll_number', 'risk_score'].includes(h.key) &&
                                                            sortBy === h.key) && (
                                                                <span className="text-sm ml-1">{renderSortArrow(h.key)}</span>
                                                            )}
                                                    </button>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {current.map((s, index) => (
                                            <tr key={s.id} className={index % 2 === 0 ? 'bg-white hover:bg-indigo-50/50 transition-colors' : 'bg-gray-50 hover:bg-indigo-50/50 transition-colors'}>
                                                <td className="px-6 py-4 whitespace-nowrap text-md font-medium text-gray-900">
                                                    {/* Linking to a student detail page would be a good next step */}
                                                    <a href={`/mentor/students/${s.id}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                                        {s.name}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">{s.roll_number || '-'}</td>
                        						<td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">{s.email || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <CircularProgress value={s.attendance || 0} size={48} stroke={5} />
                                                </td>
                        						<td className="px-6 py-4 whitespace-nowrap text-md font-medium text-gray-700">{s.backlogs ?? s.score ?? '-'}</td>
												<td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-bold ${getFeeBadgeClasses(s.fee_status)}`}
                                                    >
                                                        {s.fee_status || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {s.risk_score !== undefined && s.risk_score !== null ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-28 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                                <div className={`${riskColorForScore(s.risk_score)} h-2`} style={{ width: `${Math.round(s.risk_score)}%` }} />
                                                            </div>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.risk_score >= 70 ? 'bg-red-600 text-white' : s.risk_score >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                                                {Math.round(s.risk_score)}%
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBadgeClasses(s.risk_level)}`}>{s.risk_level || 'N/A'}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 5. Pagination */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-lg border border-gray-100">
                            <div className="text-sm text-gray-600 font-medium">Page {page} of {totalPages}</div>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                >
                                    Prev
                                </button>
                                <span className="px-3 py-2 text-sm font-semibold text-indigo-700 bg-indigo-100 rounded-lg">{page}</span>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default MentorDashboard;