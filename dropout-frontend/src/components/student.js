import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { adminAPI } from '../services/api';
import CircularProgress from './common/CircularProgress';
import TopNav from './common/TopNav'; // assuming TopNav is a common component

// Re-using the Badge component from the dashboard
const Badge = ({ color, children }) => (
    <span className={`px-2 py-1 rounded-full text-xs ${color}`}>{children}</span>
);

// We need a helper for a dynamic risk color
const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
        case 'High':
            return 'bg-red-100 text-red-800';
        case 'Medium':
            return 'bg-yellow-100 text-yellow-800';
        case 'Low':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const StudentDetail = () => {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [loadingStudent, setLoadingStudent] = useState(true);

    const [prediction, setPrediction] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRec, setLoadingRec] = useState(false);
    const [recError, setRecError] = useState(null);

    // helper to safely extract student object returned by adminAPI.getStudentById
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [student]);

    if (loadingStudent) {
        return <div className="text-center text-gray-500 mt-10">Loading student details...</div>;
    }
    if (!student) {
        return <div className="text-center text-gray-500 mt-10">Student not found</div>;
    }

    const riskLevel = prediction?.risk_level ?? student.risk_level ?? (student.risk_flag ? 'At Risk' : 'OK');
    const riskColor = getRiskColor(riskLevel);

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            <TopNav title="Student Profile" />
            <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
                <div className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row md:space-x-6">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                            <Badge color={riskColor}>{riskLevel}</Badge>
                        </div>
                        <div className="text-gray-500 text-sm space-x-2">
                            <span>Roll: <strong className="font-semibold text-gray-900">{student.roll_number || '—'}</strong></span>
                            <span>&middot;</span>
                            <span>Section: <strong className="font-semibold text-gray-900">{student.section || '—'}</strong></span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{student.email || '—'}</span></div>
                            <div><span className="text-gray-500">Fee Status:</span> <span className="font-medium text-gray-900">{student.fee_status || '—'}</span></div>
                            <div><span className="text-gray-500">Mentor:</span> <span className="font-medium text-gray-900">{student.mentor_name || '—'}</span></div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-4 mt-4">
                            <div className="flex flex-col items-center">
                                <CircularProgress value={student.attendance ?? 0} />
                                <small className="mt-2 text-gray-600">Attendance</small>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-xl font-bold text-gray-900">{student.backlogs ?? 0}</div>
                                <small className="mt-2 text-gray-600">Backlogs</small>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-xl font-bold text-gray-900">{student.attempts ?? 0}</div>
                                <small className="mt-2 text-gray-600">Attempts</small>
                            </div>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
                            <p className="mt-1 text-gray-600">{student.performance ?? student.score ?? 'N/A'}</p>
                        </div>

                    </div>
                    
                    <div className="w-full md:w-64 bg-gray-50 rounded-lg p-4 mt-6 md:mt-0">
                        <div className="text-gray-500 text-sm">Assigned Mentor</div>
                        <div className="mt-1 font-semibold text-gray-900">{student.mentor_name || 'Unassigned'}</div>
                        <div className="text-sm text-gray-600">{student.mentor_email || ''}</div>
                        <div className="mt-4 text-sm text-gray-500">
                            <strong>Risk Flag:</strong> <Badge color={student.risk_flag ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>{student.risk_flag ? 'At risk' : 'OK'}</Badge>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
                        <button
                            onClick={fetchRecommendations}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            disabled={loadingRec}
                        >
                            {loadingRec ? 'Refreshing…' : 'Refresh Recommendations'}
                        </button>
                    </div>

                    {loadingRec ? (
                        <p className="mt-4 text-gray-500">Loading recommendations…</p>
                    ) : recError ? (
                        <p className="mt-4 text-red-500">{recError}</p>
                    ) : recommendations && recommendations.length > 0 ? (
                        <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
                            {recommendations.map((r, i) => {
                                if (typeof r === 'string') return <li key={i}>{r}</li>;
                                if (r && r.title) return (
                                    <li key={i}>
                                        <strong className="text-gray-900">{r.title}</strong>{r.detail ? ` — ${r.detail}` : null}
                                    </li>
                                );
                                return <li key={i}>{JSON.stringify(r)}</li>;
                            })}
                        </ul>
                    ) : (
                        <p className="mt-4 text-gray-500">No recommendations available</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentDetail;