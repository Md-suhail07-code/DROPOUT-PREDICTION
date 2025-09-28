import React, { useEffect, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import { useParams } from 'react-router-dom';
import { adminAPI } from '../services/api';
import CircularProgress from './common/CircularProgress';
import TopNav from './common/TopNav';

// Re-using the Badge component with improved modern styling
const Badge = ({ color, children }) => (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${color}`}>{children}</span>
);

// Dynamic risk color helper with high-contrast styles
const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
        case 'High':
            return 'bg-red-600 text-white border border-red-700';
        case 'Medium':
            return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
        case 'Low':
            return 'bg-green-100 text-green-800 border border-green-300';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

// Frontend copy of backend performance->score mapping
function performanceToScoreFrontend(value) {
    if (value == null) return 0;
    const v = String(value).trim().toLowerCase();
    switch (v) {
        case 'excellent': return 90;
        case 'good': return 80;
        case 'average': return 70;
        case 'poor': return 50;
        default: {
            const n = parseFloat(value);
            return Number.isFinite(n) ? n : 0;
        }
    }
}

// Mirror backend calculateRiskLevel to get a numeric 0-100 score
function calculateRiskScoreFrontend(attendance, score, feeStatus) {
    let riskScore = 0;
    const a = Number(attendance) || 0;
    const s = Number(score) || 0;

    // Attendance scoring (0-40 points)
    if (a < 60) riskScore += 40;
    else if (a < 70) riskScore += 30;
    else if (a < 80) riskScore += 20;
    else if (a < 90) riskScore += 10;

    // Academic performance scoring (0-30 points)
    if (s < 40) riskScore += 30;
    else if (s < 50) riskScore += 25;
    else if (s < 60) riskScore += 20;
    else if (s < 70) riskScore += 15;
    else if (s < 80) riskScore += 10;
    else if (s < 90) riskScore += 5;

    // Fee status scoring (0-30 points)
    if (feeStatus === 'Overdue') riskScore += 30;
    else if (feeStatus === 'Pending') riskScore += 15;
    else if (feeStatus === 'Partial') riskScore += 10;

    // Keep in 0-100
    return Math.max(0, Math.min(100, Math.round(riskScore)));
}

function normalizeRiskScoreFromPrediction(val) {
    if (val == null) return null;
    const n = Number(val);
    if (!Number.isFinite(n)) return null;
    // If model returned a probability 0..1, convert to percent
    if (n <= 1) return Math.round(n * 100);
    return Math.round(n);
}

function getScorePillClass(score) {
    if (score >= 70) return 'bg-red-600 text-white';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
}

function getScoreBarColor(score) {
    if (score >= 70) return 'bg-red-600';
    if (score >= 40) return 'bg-yellow-400';
    return 'bg-green-500';
}

const StudentDetail = () => {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [loadingStudent, setLoadingStudent] = useState(true);

    const [prediction, setPrediction] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRec, setLoadingRec] = useState(false);
    const [recError, setRecError] = useState(null);
    const [notifyMessage, setNotifyMessage] = useState(null);
    const [autoNotifyShown, setAutoNotifyShown] = useState(false);
    const [planModalOpen, setPlanModalOpen] = useState(false);
    const [planGenerating, setPlanGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState(null);

    // normalize student response
    const normalizeStudentResponse = (res) => {
        if (!res) return null;
        if (res.data) return res.data;
        if (res.success && res.data) return res.data;
        if (res.name && (res.id || res.roll_number)) return res;
        return res;
    };

    useEffect(() => {
        const loadStudent = async () => {
            setLoadingStudent(true);
            try {
                const res = await adminAPI.getStudentById(id);
                const s = normalizeStudentResponse(res);
                setStudent(s);
            } catch (err) {
                console.error('Failed to load student', err);
                setStudent(null);
            } finally {
                setLoadingStudent(false);
            }
        };
        loadStudent();
    }, [id]);

    const parsePredictionResponse = (resp) => {
        if (!resp) return { prediction: null, recommendations: [] };
        if (resp.data && resp.data.prediction) {
            return {
                prediction: resp.data.prediction,
                recommendations: resp.data.recommendations || resp.data.prediction.recommendations || []
            };
        }
        if (resp.data && (resp.data.risk_score !== undefined || resp.data.risk_level !== undefined)) {
            return {
                prediction: { risk_score: resp.data.risk_score, risk_level: resp.data.risk_level },
                recommendations: resp.data.recommendations || []
            };
        }
        if (resp.prediction) {
            return {
                prediction: resp.prediction,
                recommendations: resp.recommendations || resp.prediction.recommendations || []
            };
        }
        if (Array.isArray(resp.recommendations)) {
            return { prediction: null, recommendations: resp.recommendations };
        }
        if (Array.isArray(resp)) return { prediction: null, recommendations: resp };
        return { prediction: null, recommendations: [] };
    };


    const fetchRecommendations = async () => {
        if (!student) return;
        setRecError(null);
        setLoadingRec(true);
        try {
            const resp = await adminAPI.getPredictionForStudent(id);
            const { prediction: pred, recommendations: recs } = parsePredictionResponse(resp);
            setPrediction(pred);
            setRecommendations(recs);
        } catch (err) {
            console.error('Failed to fetch prediction/recommendations', err);
            setRecError(err.message || 'Failed to fetch recommendations');
            setPrediction(null);
            setRecommendations([]);
        } finally {
            setLoadingRec(false);
        }
    };

    useEffect(() => {
        if (student) {
            fetchRecommendations();
        }
    }, [student]);

    // Auto-notify mentor when student's risk score is high (>70)
    useEffect(() => {
        if (autoNotifyShown) return;
        // need student and prediction (prediction may be null, that's fine)
        if (!student) return;

        const predScore = normalizeRiskScoreFromPrediction(prediction?.risk_score);
        const perfVal = student.performance ?? student.score;
        const perfNum = performanceToScoreFrontend(perfVal);
        const computed = calculateRiskScoreFrontend(student.attendance, perfNum, student.fee_status);
        const score = predScore ?? computed;

        if (score > 70) {
            setNotifyMessage('Mentor Notified');
            setAutoNotifyShown(true);
            setTimeout(() => setNotifyMessage(null), 3000);
        }
    }, [student, prediction, autoNotifyShown]);

    if (loadingStudent) {
        return <div className="text-center text-gray-500 mt-10 p-10 bg-white shadow-lg mx-auto max-w-lg rounded-xl">Loading student details...</div>;
    }
    if (!student) {
        return <div className="text-center text-red-600 mt-10 p-10 bg-white shadow-lg mx-auto max-w-lg rounded-xl">Student not found</div>;
    }

    const riskLevel = prediction?.risk_level ?? student.risk_level ?? (student.risk_flag ? 'At Risk' : 'OK');
    const riskColor = getRiskColor(riskLevel);

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNav title="Student Profile" />
            <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">

                {/* Header + Core Details */}
                <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100 flex flex-col lg:flex-row lg:space-x-8">
                    {/* Left: Main Info */}
                    <div className="flex-1 space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4">
                            <div className="flex items-center space-x-4">
                                <h1 className="text-3xl font-extrabold text-gray-900">{student.name}</h1>
                                {/* Numeric risk score: prefer prediction.risk_score, fallback to calculated score */}
                                {(() => {
                                    const predScore = normalizeRiskScoreFromPrediction(prediction?.risk_score);
                                    const perfVal = student.performance ?? student.score;
                                    const perfNum = performanceToScoreFrontend(perfVal);
                                    const computed = calculateRiskScoreFrontend(student.attendance, perfNum, student.fee_status);
                                    const score = predScore ?? computed;
                                    const pillClass = getScorePillClass(score);
                                    const barColor = getScoreBarColor(score);
                                    return (
                                        <div className="ml-3 flex items-center space-x-3">
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${pillClass}`}>{score}%</span>
                                            <div className="w-36 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div style={{ width: `${score}%` }} className={`${barColor} h-full`} />
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="text-sm text-gray-500 mt-2 sm:mt-0">
                                Roll: <strong className="font-semibold text-gray-800">{student.roll_number || '—'}</strong>
                                <span className="mx-2">&middot;</span>
                                Section: <strong className="font-semibold text-gray-800">{student.section || '—'}</strong>
                            </div>
                        </div>

                        {/* Grid Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div><span className="text-gray-500 font-medium">Email:</span> <span className="font-medium text-indigo-600">{student.email || '—'}</span></div>
                            <div><span className="text-gray-500 font-medium">Fee Status:</span>
                                <Badge color={student.fee_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                    {student.fee_status || '—'}
                                </Badge>
                            </div>
                            <div><span className="text-gray-500 font-medium">Mentor:</span> <span className="font-medium text-gray-900">{student.mentor_name || '—'}</span></div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-6 border-t border-gray-200 pt-6 mt-6">
                            <div className="flex flex-col items-center">
                                <CircularProgress value={student.attendance ?? 0} />
                                <small className="mt-2 text-gray-600">Attendance</small>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-2xl font-extrabold text-gray-900">{student.backlogs ?? 0}</div>
                                <small className="mt-2 text-gray-600">Backlogs</small>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-2xl font-extrabold text-gray-900">{student.attempts ?? 0}</div>
                                <small className="mt-2 text-gray-600">Attempts</small>
                            </div>
                        </div>

                        {/* Performance */}
                        {/* Performance */}
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
                            {(() => {
                                const backlogs = Number(student.backlogs || 0);
                                const getPerformanceLabelFromBacklogs = (b) => {
                                    if (b <= 0) return 'Excellent';
                                    if (b === 1) return 'Good';
                                    if (b === 2) return 'Average';
                                    return 'Poor';
                                };

                                const label = getPerformanceLabelFromBacklogs(backlogs);

                                // Dynamic Tailwind CSS classes based on performance label
                                let badgeColor = 'bg-green-100 text-green-800';
                                if (label === 'Good') badgeColor = 'bg-green-100 text-green-800';
                                if (label === 'Average') badgeColor = 'bg-yellow-100 text-yellow-800';
                                if (label === 'Poor') badgeColor = 'bg-red-100 text-red-800';

                                return (
                                    <div className="flex items-center space-x-2 mt-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-md font-medium ${badgeColor}`}>
                                            {label}
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Right: Mentor Panel */}
                    <div className="w-full lg:w-80 bg-indigo-50 rounded-xl p-6 mt-6 lg:mt-0 shadow-inner space-y-4 border border-indigo-200">
                        <h3 className="text-lg font-bold text-indigo-800">Assigned Mentor</h3>
                        <div className="font-semibold text-gray-900">{student.mentor_name || 'Unassigned'}</div>
                        <div className="text-sm text-gray-600 truncate">{student.mentor_email || 'No email provided'}</div>
                        <div className="mt-4 text-sm text-gray-500">
                            <strong>Risk Flag:</strong>{' '}
                            <Badge color={student.risk_flag ? 'bg-red-600 text-white' : 'bg-green-100 text-green-800'}>
                                {student.risk_flag ? 'At risk' : 'OK'}
                            </Badge>
                        </div>

                        {/* Actions: Notify Mentor + Generate Plan */}
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={async () => {
                                    // Simulate notify action (could be wired to an API)
                                    setNotifyMessage('Mentor Notified');
                                    // auto-hide after 3s
                                    setTimeout(() => setNotifyMessage(null), 3000);
                                }}
                                className="w-full inline-flex justify-center items-center px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none"
                            >
                                Notify Mentor
                            </button>

                            <button
                                onClick={async () => {
                                    // Build a personalized plan based on available data
                                    setPlanGenerating(true);
                                    try {
                                        const plan = buildPersonalizedPlan(student, prediction, recommendations);
                                        setGeneratedPlan(plan);
                                        setPlanModalOpen(true);
                                    } catch (err) {
                                        console.error('Failed to generate plan', err);
                                    } finally {
                                        setPlanGenerating(false);
                                    }
                                }}
                                className="w-full inline-flex justify-center items-center px-3 py-2 border border-indigo-600 text-indigo-600 text-sm font-medium rounded-md hover:bg-indigo-50 focus:outline-none"
                                disabled={planGenerating}
                            >
                                {planGenerating ? 'Generating…' : 'Generate Plan'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">AI Recommendations 🧠</h3>
                        <button
                            onClick={fetchRecommendations}
                            className="px-3 py-1 text-xs border border-transparent font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none disabled:opacity-50 transition"
                            disabled={loadingRec}
                        >
                            {loadingRec ? 'Refreshing…' : 'Refresh'}
                        </button>
                    </div>

                    {loadingRec ? (
                        <p className="py-4 text-center text-gray-500">Loading recommendations…</p>
                    ) : recError ? (
                        <p className="py-4 text-center text-red-500 font-medium">{recError}</p>
                    ) : recommendations && recommendations.length > 0 ? (
                        <ul className="grid gap-4 mt-6">
                          {recommendations.map((item, i) => (
                            item.length < 60 ? (
                              <h3 key={i} className="text-gray-800 font-medium">
                                {item.replaceAll('*', '').replaceAll('### ', '')}
                              </h3>
                            ) : (
                              <li key={i} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1 border border-gray-100">
                                <div className="flex items-start">
                                  <span className="flex-shrink-0 text-blue-500 mr-4 mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                  <p className="text-gray-800 font-medium">
                                    {item.replaceAll('*', '').replaceAll('### ', '')}
                                  </p>
                                </div>
                              </li>
                            )
                          ))}
                        </ul>

                    ) : (
                        <p className="py-4 text-center text-gray-500">No recommendations available</p>
                    )}
                </div>
            </main>

            {/* Notify modal (centered) - replaces the bottom-right toast */}
            <Popup
                open={!!notifyMessage}
                onClose={() => setNotifyMessage(null)}
                modal
                closeOnDocumentClick
                contentStyle={{ padding: 0, borderRadius: 12 }}
            >
                {(close) => (
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-auto text-center">
                        {/* Image / Icon */}
                        <div className="flex justify-center mb-3">
                            {/* Inline check SVG — acts as the "notified image" */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" className="stroke-current text-green-100" fill="#ecfdf5" />
                                <path d="M7 12l2.5 2.5L17 8" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>

                        {/* Message */}
                        <h3 className="text-lg font-semibold text-gray-900">{notifyMessage}</h3>
                        <p className="text-sm text-gray-500 mt-2">The assigned mentor has been notified.</p>

                        {/* Close button */}
                        <div className="mt-5 flex justify-center">
                            <button
                                onClick={() => { close(); setNotifyMessage(null); }}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Popup>


            {/* Plan Modal */}
            {planModalOpen && generatedPlan ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Background overlay */}
                    <div
                        className="absolute inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-md"
                        onClick={() => setPlanModalOpen(false)}
                    />
                    {/* Modal Box */}
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto p-6 sm:p-8 
                    transform transition-all duration-300 ease-in-out scale-100 opacity-100 
                    z-10 overflow-y-auto max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                            <h2 className="text-3xl font-extrabold text-gray-900">
                                Personalized Mentor Plan
                            </h2>
                            <div className="flex items-center space-x-3">
                                {/* Copy Button */}
                                <button
                                    onClick={() => {
                                        try {
                                            navigator.clipboard.writeText(formatPlanText(generatedPlan));
                                        } catch (e) {
                                            console.error('Copy failed', e);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 
                       bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 
                       focus:outline-none focus:ring-2 focus:ring-gray-300"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M8 2a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V3a1 1 0 00-1-1H8z" />
                                        <path d="M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                                    </svg>
                                    <span>Copy</span>
                                </button>

                                {/* Close Button */}
                                <button
                                    onClick={() => setPlanModalOpen(false)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 
                       bg-red-100 rounded-lg transition-colors hover:bg-red-200 
                       focus:outline-none focus:ring-2 focus:ring-red-300"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    <span>Close</span>
                                </button>
                            </div>
                        </div>

                        {/* Student & Risk Level Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 mb-8">
                            <div className="flex items-center">
                                <span className="text-sm font-semibold text-gray-900 mr-2">Student:</span>
                                <span className="text-md">{student.name} — {student.roll_number || '—'}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-sm font-semibold text-gray-900 mr-2">Risk Level:</span>
                                {(() => {
                                    const score = 60; // Your risk score logic here
                                    const pillClass = getScorePillClass(score);
                                    return (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${pillClass}`}>{score}%</span>
                                    );
                                })()}
                            </div>
                        </div>
                        {/* Plan Sections */}
                        <div className="space-y-8 text-gray-700">
                            {/* Goals Section */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-900">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 16v-2M18 16v-2M4 12V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" /></svg>
                                    Goals
                                </h3>
                                <ul className="list-disc pl-6 space-y-2 text-base">
                                    {generatedPlan.goals.map((g, i) => <li key={i}>{g}</li>)}
                                </ul>
                            </div>
                            {/* Actions for Mentor Section */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-900">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M12 4h9M12 12h9M3 10h1M3 14h1M3 18h1" /></svg>
                                    Actions for Mentor
                                </h3>
                                <ol className="list-decimal pl-6 space-y-2 text-base">
                                    {generatedPlan.actions.map((a, i) => <li key={i}>{a}</li>)}
                                </ol>
                            </div>
                            {/* Timeline & Resources Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Timeline */}
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-900">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                        Timeline
                                    </h3>
                                    <p className="text-base">{generatedPlan.timeline}</p>
                                </div>
                                {/* Notes / Resources */}
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-900">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H7M17 19H7" /></svg>
                                        Notes / Resources
                                    </h3>
                                    <ul className="list-disc pl-6 space-y-2 text-base">
                                        {generatedPlan.resources.map((r, i) => <li key={i}>{r}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

// Heuristic plan builder: small deterministic function using student metrics & recommendations
function buildPersonalizedPlan(student, prediction, recommendations) {
    const risk = (prediction && prediction.risk_level) || student.risk_level || (student.risk_flag ? 'High' : 'Low');
    const goals = [];
    const actions = [];
    const resources = [];

    // Goals
    if (risk.toLowerCase().includes('high') || risk === 'At Risk' || risk.toLowerCase().includes('high')) {
        goals.push('Stabilize attendance to > 75% within 8 weeks');
        goals.push('Reduce backlog count by 1 in the next term');
    } else if (risk.toLowerCase().includes('medium')) {
        goals.push('Improve attendance to > 85% in 6 weeks');
        goals.push('Provide academic support for weak subjects');
    } else {
        goals.push('Maintain current performance and monitor monthly');
    }

    // Actions
    if (student.attendance !== undefined && student.attendance < 75) {
        actions.push('Schedule weekly check-ins focused on attendance and class engagement.');
        resources.push('Attendance counseling template; connect with academic advisor');
    }
    if ((student.backlogs || 0) > 0) {
        actions.push('Arrange targeted tutoring sessions for subjects with backlogs.');
        resources.push('Peer-tutor list; tutoring schedule template');
    }
    if (recommendations && recommendations.length > 0) {
        actions.push('Follow AI recommendations: ' + recommendations.slice(0, 3).map(r => (typeof r === 'string' ? r : (r.title || JSON.stringify(r)))).join('; '));
    }

    // Generic actions
    actions.push('Contact guardian if no improvement after 4 weeks.');
    actions.push('Set measurable weekly targets and log progress in mentor portal.');

    // Resources
    resources.push('Mental health and counseling contacts');
    resources.push('Fee assistance options if financial issues are present');

    const timeline = 'Immediate actions for 1-2 weeks, weekly review for 8 weeks, escalate if no progress.';

    return { goals, actions, resources, timeline };
}

function formatPlanText(plan) {
    let txt = '';
    txt += 'Goals:\n';
    plan.goals.forEach(g => txt += `- ${g}\n`);
    txt += '\nActions:\n';
    plan.actions.forEach(a => txt += `- ${a}\n`);
    txt += `\nTimeline:\n- ${plan.timeline}\n`;
    txt += '\nResources:\n';
    plan.resources.forEach(r => txt += `- ${r}\n`);
    return txt;
}

export default StudentDetail;
