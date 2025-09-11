import React, { useEffect, useState } from 'react';
import { AuthContext } from '../../App';
import { studentAPI } from '../../services/api';
import TopNav from '../common/TopNav';
import CircularProgress from '../common/CircularProgress';

const Badge = ({ color, children }) => (
	<span className={`px-2 py-1 rounded-full text-xs ${color}`}>{children}</span>
);

const StudentDashboard = () => {
	const { user } = React.useContext(AuthContext);
	const [data, setData] = useState(null);

	useEffect(() => {
		(async () => {
			const res = await studentAPI.getStudentMe();
			setData(res.data);
		})();
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
			<TopNav title="Your Dashboard" />

			{!data ? (
				<div className="text-center text-gray-500 mt-10">Loading your data...</div>
			) : (
				<main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-white rounded-xl shadow p-5">
							<div className="text-gray-500 text-sm">Attendance</div>
							<div className="mt-3 flex items-center gap-4">
								<CircularProgress value={data.attendance || 0} />
								<div className="space-y-1 text-sm">
									<div className="text-gray-600">Your attendance rate</div>
									<div className="font-semibold text-gray-900">{data.attendance || 0}%</div>
								</div>
							</div>
						</div>
						<div className="bg-white rounded-xl shadow p-5">
							<div className="text-gray-500 text-sm">Performance</div>
							<div className="mt-2 text-xl font-semibold">{data.performance ?? data.score ?? 0}</div>
						</div>
						<div className="bg-white rounded-xl shadow p-5">
							<div className="text-gray-500 text-sm">Status</div>
							<div className="mt-2">
								{(data.attendance || 0) < 75 ? (
									<Badge color="bg-red-100 text-red-800">At Risk</Badge>
								) : (
									<Badge color="bg-green-100 text-green-800">Doing Great</Badge>
								)}
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow p-6">
						<h3 className="text-lg font-semibold">Profile</h3>
						<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
							<div><span className="text-gray-500">Name:</span> <span className="font-medium">{data.name}</span></div>
							<div><span className="text-gray-500">Email:</span> <span className="font-medium">{data.email || '-'}</span></div>
							<div><span className="text-gray-500">Roll:</span> <span className="font-medium">{data.roll_number || '-'}</span></div>
							<div><span className="text-gray-500">Mentor:</span> <span className="font-medium">{data.mentor_name || '-'}</span></div>
							<div><span className="text-gray-500">Fee Status:</span> <span className="font-medium">{data.fee_status || '-'}</span></div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow p-6">
						<h3 className="text-lg font-semibold">Badges</h3>
						<div className="mt-3 flex gap-2 flex-wrap">
							{(data.attendance || 0) >= 90 && <Badge color="bg-blue-100 text-blue-800">Attendance Star</Badge>}
							{(data.performance ?? data.score ?? 0) >= 85 && <Badge color="bg-yellow-100 text-yellow-800">Top Performer</Badge>}
							{(data.attendance || 0) >= 75 && (data.performance ?? data.score ?? 0) >= 70 && <Badge color="bg-green-100 text-green-800">Consistent</Badge>}
							{(data.performance ?? data.score ?? 0) - ((data.prev_performance ?? data.performance) || 0) >= 5 && <Badge color="bg-emerald-100 text-emerald-800">Improving</Badge>}
						</div>
					</div>
				</main>
			)}
		</div>
	);
};

export default StudentDashboard;


