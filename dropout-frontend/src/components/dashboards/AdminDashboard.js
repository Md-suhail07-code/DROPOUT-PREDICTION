import React, { useEffect, useState } from 'react';
import { AuthContext } from '../../App';
import { studentAPI, mentorAPI } from '../../services/api';
import TopNav from '../common/TopNav';
import SummaryCards from '../common/SummaryCards';
import './index.css'

const AdminDashboard = () => {
  const { user } = React.useContext(AuthContext);
  const [refresh, setRefresh] = useState(0);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [mentorFilter, setMentorFilter] = useState('All');
  const [file, setFile] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [dataadded, setDataadded] = useState(false);
  const pageSize = 10;

  const load = async () => {
    const res = await studentAPI.getAdminStudents();
    setStudents(res.data);
  };

  useEffect(() => { load(); }, [refresh]);

  // Filtering + sorting
  const filtered = students.filter(s => {
    const matchSearch = `${s.name} ${s.roll_number || ''} ${s.email || ''}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchMentor =
      mentorFilter === 'All' || (s.mentor_name || 'Unassigned') === mentorFilter;
    return matchSearch && matchMentor;
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
      case 'mentor_name':
        av = a.mentor_name || '';
        bv = b.mentor_name || '';
        break;
      case 'roll_number':
        av = a.roll_number || '';
        bv = b.roll_number || '';
        break;
      default:
        av = a.name || '';
        bv = b.name || '';
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages]);
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  // File export
  const handleExport = async () => {
    const res = await studentAPI.exportExcel();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportCSV = async () => {
    const res = await studentAPI.exportCSV();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const mentors = Array.from(new Set(students.map(s => s.mentor_name || 'Unassigned')));

  // File import
  const handleImportstudent = async (e) => {
    e.preventDefault();
    if (!file) return;
    await studentAPI.importCSV(file);
    setFile(null);
    e.target.reset();
    setRefresh(v => v + 1);
    setDataadded(true);
  };

  const handleImportmentor = async (e) => {
    e.preventDefault();
    if (!file) return;
    await mentorAPI.importCSV(file);
    setFile(null);
    e.target.reset();
    setRefresh(v => v + 1);
  };

  // Summary totals
  const totals = {
    total: students.length,
    high: students.filter(s => s.risk_level === 'High').length,
    medium: students.filter(s => s.risk_level === 'Medium').length,
    low: students.filter(s => s.risk_level === 'Low').length,
  };

  return (
    <>
      <TopNav title="Admin Dashboard" />
      {dataadded ? (
        <div className="min-h-screen bg-gray-50">
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
            <SummaryCards total={totals.total} high={totals.high} medium={totals.medium} low={totals.low} />

            {/* Filters + Upload/Export */}
            <div className="bg-white rounded-lg shadow p-4 border border-gray-100 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  placeholder="Search by name, roll, email"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="border-gray-300 rounded-md shadow-sm px-3 py-2"
                />
                <select
                  value={mentorFilter}
                  onChange={e => setMentorFilter(e.target.value)}
                  className="border-gray-300 rounded-md shadow-sm px-3 py-2"
                >
                  <option value="All">All Mentors</option>
                  {mentors.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button
                  onClick={() => setRefresh(v => v + 1)}
                  className="bg-white border border-gray-300 rounded-md px-3 py-2"
                >
                  Refresh
                </button>
              </div>
              <div className="flex items-center gap-3">
                  <button
                  onClick={handleExportCSV}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleExport}
                  className="px-3 py-2 bg-gray-900 hover:bg-black text-white rounded-md shadow"
                >
                  Export Excel
                </button>
              </div>
              
            </div>

            {/* Students Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-x-auto border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'name', label: 'Name' },
                      { key: 'roll_number', label: 'Roll' },
                      { key: 'email', label: 'Email' },
                      { key: 'attendance', label: 'Attendance' },
                      { key: 'performance', label: 'Performance' },
                      { key: 'mentor_name', label: 'Mentor' },
                      { key: 'risk', label: 'Risk' },
                    ].map(h => (
                      <th
                        key={h.key}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (['risk', 'email'].includes(h.key)) return;
                            setSortBy(h.key);
                            setSortDir(d =>
                              sortBy === h.key ? (d === 'asc' ? 'desc' : 'asc') : 'asc'
                            );
                          }}
                          className="inline-flex items-center gap-1"
                        >
                          {h.label}
                          {(['name', 'attendance', 'performance', 'mentor_name', 'roll_number'].includes(h.key) &&
                            sortBy === h.key) && (
                            <span>{sortDir === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {current.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3">{s.roll_number || '-'}</td>
                      <td className="px-4 py-3">{s.email || '-'}</td>
                      <td className="px-4 py-3">{s.attendance}%</td>
                      <td className="px-4 py-3">{s.performance ?? s.score ?? '-'}</td>
                      <td className="px-4 py-3">{s.mentor_name || 'Unassigned'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            s.risk_level === 'High'
                              ? 'bg-red-100 text-red-800'
                              : s.risk_level === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {s.risk_level || (s.risk_flag ? 'At Risk' : 'OK')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Page {page} of {totalPages}</div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </main>
        </div>
      ) : (
        <div>
          <div className='mentordata'>
            <h1 className='head'>Add Mentor data</h1>
            <form onSubmit={handleImportmentor} className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Upload CSV</label>
              <input
                type="file"
                accept=".csv"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="border-gray-300 rounded-md"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow"
              >
                Import CSV
              </button>
            </form>
          </div>
          <div className="flex items-center gap-3 mentordata">
            <h1 className='head'>Add Student data</h1>
            <form onSubmit={handleImportstudent} className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Upload CSV</label>
              <input
                type="file"
                accept=".csv"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="border-gray-300 rounded-md"
              />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow"
                  >
                    Import CSV
                  </button>
                </form>
              </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
