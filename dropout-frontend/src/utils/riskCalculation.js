// Unified risk score calculation that uses ML prediction or falls back to heuristic
export function calculateRiskScore(data) {
    // Try to use ML prediction first if available
    if (data.prediction != null) {
        const predictionScore = normalizeRiskScoreFromPrediction(data.prediction);
        if (predictionScore != null) {
            // Convert percentage to 0-10 scale
            return (predictionScore / 10).toFixed(1);
        }
    }

    // Fallback to heuristic calculation if no valid ML prediction
    return calculateHeuristicRiskScore(
        data.attendance,
        data.score || performanceToScore(data.performance),
        data.fee_status
    ).toFixed(1);
}

// Helper function to normalize ML prediction to percentage
function normalizeRiskScoreFromPrediction(val) {
    if (val == null) return null;
    const n = Number(val);
    if (!Number.isFinite(n)) return null;
    // If model returned a probability 0..1, convert to percent
    if (n <= 1) return Math.round(n * 100);
    return Math.round(n);
}

// Convert performance text to numeric score
function performanceToScore(value) {
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

// Heuristic risk score calculation (returns 0-10 score)
function calculateHeuristicRiskScore(attendance, backlogs, feeStatus) {
    let riskScore = 0;
    const a = Number(attendance) || 0;
    const b = Number(backlogs) || 0;

    // Attendance impact (0-4 points)
    if (a < 60) riskScore += 4;
    else if (a < 70) riskScore += 3;
    else if (a < 80) riskScore += 2;
    else if (a < 90) riskScore += 1;

    // Backlogs impact (0-3 points)
    if (b > 3) riskScore += 3;
    else if (b > 2) riskScore += 2;
    else if (b > 1) riskScore += 1;
    else if (b > 0) riskScore += 0.5;

    // Fee status impact (0-3 points)
    if (feeStatus === 'Overdue') riskScore += 3;
    else if (feeStatus === 'Pending') riskScore += 1.5;
    else if (feeStatus === 'Partial') riskScore += 1;

    return riskScore;
}

// Get risk level from score
export function getRiskLevel(score) {
    const numScore = Number(score);
    if (numScore >= 70) return 'High';
    if (numScore >= 40) return 'Medium';
    return 'Low';
}

// Get color class for risk score
export function getRiskScoreColor(score) {
    const numScore = Number(score);
    if (numScore >= 70) return 'text-red-600';
    if (numScore >= 40) return 'text-yellow-600';
    return 'text-green-600';
}

// Get background color class for risk score
export function getRiskScoreBackgroundColor(score) {
    const numScore = Number(score);
    if (numScore >= 70) return 'bg-red-600';
    if (numScore >= 40) return 'bg-yellow-400';
    return 'bg-green-500';
}
