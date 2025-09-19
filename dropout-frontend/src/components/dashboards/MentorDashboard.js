import React, { useEffect, useState } from 'react';
import { AuthContext } from '../../App';
import { studentAPI } from '../../services/api';
import TopNav from '../common/TopNav';

const MentorDashboard = () => {
	const { user } = React.useContext(AuthContext);
	const [students, setStudents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const pageSize = 6;

	useEffect(() => {
		(async () => {
			try {
				const res = await studentAPI.getMentorStudents();
				setStudents(res.data);
			} catch (err) {
				console.error('Failed to load mentor students', err);
				setStudents([]);
				alert(err.message || 'Failed to load your students. Make sure you are logged in as a Mentor.');
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const filtered = students.filter(s => (
		`${s.name} ${s.roll_number || ''}`.toLowerCase().includes(search.toLowerCase())
	));
	const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
	const current = filtered.slice((page - 1) * pageSize, page * pageSize);
	useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages]);

	return (
		<div className="min-h-screen bg-gray-50">
			<TopNav title="Mentor Dashboard" />

			<main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
				<div className="bg-white rounded-lg shadow p-4 border border-gray-100 flex items-center justify-between">
					<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students" className="border-gray-300 rounded-md shadow-sm w-full max-w-xs" />
					<div className="text-sm text-gray-500">{filtered.length} students</div>
				</div>

				{loading ? (
					<div className="text-center text-gray-500">Loading...</div>
				) : (
					<>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{current.map(s => (
								<div key={s.id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
									<div className="flex items-center justify-between">
										<div>
											<div className="text-lg font-semibold">{s.name}</div>
											<div className="text-sm text-gray-500">{s.roll_number || '-'}</div>
										</div>
										<span className={`px-2 py-1 rounded-full text-xs ${s.attendance < 75 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
											{s.attendance < 75 ? 'At Risk' : 'Healthy'}
										</span>
									</div>
									<div className="mt-3 grid grid-cols-3 gap-3 text-sm">
										<div className="bg-gray-50 rounded-lg p-3">
											<div className="text-gray-500">Attendance</div>
											<div className="font-semibold">{s.attendance}%</div>
										</div>
										<div className="bg-gray-50 rounded-lg p-3">
											<div className="text-gray-500">Performance</div>
											<div className="font-semibold">{s.performance ?? s.score ?? '-'}</div>
										</div>
										<div className="bg-gray-50 rounded-lg p-3">
											<div className="text-gray-500">Fee</div>
											<div className="font-semibold">{s.fee_status || '-'}</div>
										</div>
									</div>
								</div>
							))}
						</div>
						<div className="flex items-center justify-between mt-4">
							<div className="text-sm text-gray-500">Page {page} of {totalPages}</div>
							<div className="flex items-center gap-2">
								<button disabled={page===1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50">Prev</button>
								<button disabled={page===totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50">Next</button>
							</div>
						</div>
					</>
				)}
			</main>
		</div>
	);
};

export default MentorDashboard;


