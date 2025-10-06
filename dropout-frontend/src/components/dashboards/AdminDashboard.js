import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../App';
import { studentAPI, mentorAPI, adminAPI } from '../../services/api';
import TopNav from '../common/TopNav';
import SummaryCards from '../common/SummaryCards';
import CircularProgress from '../common/CircularProgress';
import Heatmap from '../common/Heatmap';
import RiskFactorsChart from '../common/RiskFactorsChart';


const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [refresh, setRefresh] = useState(0);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [mentorFilter, setMentorFilter] = useState('All');
  const [file, setFile] = useState(null);
  const [importingMentor, setImportingMentor] = useState(false);
  const [importingStudent, setImportingStudent] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dataadded, setDataadded] = useState(null);
  const [riskFilter, setRiskFilter] = useState('All');
  const pageSize = 10;

  const showNotification = (message, isError = false) => {
    console.log(isError ? `[ERROR] ${message}` : `[INFO] ${message}`);
  };

  const load = async () => {
    try {
      const res = await studentAPI.getAdminStudents();
      setStudents(res.data);
    } catch (e) {
      console.error("Error loading students:", e);
      setStudents([]);
    }
  };

  useEffect(() => { load(); }, [refresh]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await adminAPI.getDataAddedStatus();
        if (mounted) {
          const val = res;
          const parsed = typeof val === 'boolean' ? val : Boolean(val?.isdataadded ?? val?.isDataAdded ?? val?.dataadded ?? false);
          setDataadded(parsed);
        }
      } catch (err) {
        console.error('Failed to fetch dataadded status. Using default fallback.', err);
        if (mounted) setDataadded(false);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset and clear all data? This cannot be undone.")) {
      try {
        // Here you would call an API to clear the data on the backend
        // For now, we'll just simulate the change
        // await adminAPI.resetData();
        await adminAPI.setDataAddedStatus(false);
        setDataadded(false);
        setStudents([]); // Clear local state
        showNotification("Data has been reset.");
      } catch (err) {
        console.error('Failed to reset data', err);
        showNotification('Failed to reset data.', true);
      }
    }
  };

  const filtered = students.filter(s => {
    const matchSearch = `${s.name} ${s.roll_number || ''} ${s.email || ''}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchMentor =
      mentorFilter === 'All' || (s.mentor_name || 'Unassigned') === mentorFilter;
    const matchRisk = riskFilter === 'All' || s.risk_level === riskFilter;
    return matchSearch && matchMentor && matchRisk;
  }).sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    let av, bv;
    switch (sortBy) {
      case 'attendance':
        av = a.attendance || 0;
        bv = b.attendance || 0;
        break;
      case 'performance':
      case 'backlogs':
        av = a.backlogs ?? a.score ?? a.performance ?? 0;
        bv = b.backlogs ?? b.score ?? b.performance ?? 0;
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

  const handleExport = async () => {
    try {
      const res = await studentAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data || '']));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification('Export Excel initiated.');
    } catch (error) {
      console.error('Export failed', error);
      showNotification('Failed to export Excel.', true);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await studentAPI.exportCSV();
      const url = window.URL.createObjectURL(new Blob([res.data || '']));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification('Export CSV initiated.');
    } catch (error) {
      console.error('Export failed', error);
      showNotification('Failed to export CSV.', true);
    }
  };

  const mentors = Array.from(new Set(students.map(s => s.mentor_name || 'Unassigned')));

  const handleImportstudent = async (e) => {
    e.preventDefault();
    if (!file) {
      showNotification('Please choose a CSV file to import students.', true);
      return;
    }
    if (user?.role !== 'Admin') {
      showNotification('Only Admin users can import student data.', true);
      return;
    }
    setImportingStudent(true);
    try {
      const res = await studentAPI.importCSV(file);
      showNotification(res?.message || 'Students imported successfully');
      setFile(null);
      e.target.reset();
      setRefresh(v => v + 1);
      setDataadded(true);
      adminAPI.setDataAddedStatus(true).catch(err => {
        console.error('Failed to update server dataadded flag', err);
      });
    } catch (err) {
      console.error('Student import failed', err);
      showNotification(err.message || err.response?.data?.message || 'Student import failed', true);
    } finally {
      setImportingStudent(false);
    }
  };

  const handleImportmentor = async (e) => {
    e.preventDefault();
    if (!file) {
      showNotification('Please choose a CSV file to import mentors.', true);
      return;
    }
    if (user?.role !== 'Admin') {
      showNotification('Only Admin users can import mentors.', true);
      return;
    }
    setImportingMentor(true);
    try {
      const res = await mentorAPI.importCSV(file);
      showNotification(res?.message || 'Mentors imported successfully');
      setFile(null);
      e.target.reset();
      setRefresh(v => v + 1);
    } catch (err) {
      console.error('Mentor import failed', err);
      showNotification(err.message || err.response?.data?.message || 'Mentor import failed', true);
    } finally {
      setImportingMentor(false);
    }
  };

  const totals = {
    total: students.length,
    high: students.filter(s => s.risk_level === 'High').length,
    medium: students.filter(s => s.risk_level === 'Medium').length,
    low: students.filter(s => s.risk_level === 'Low').length,
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

  const computeRiskScore = (attendance = 0, score = 0, feeStatus = '') => {
    let riskScore = 0;
    if (attendance < 60) riskScore += 40;
    else if (attendance < 70) riskScore += 30;
    else if (attendance < 80) riskScore += 20;
    else if (attendance < 90) riskScore += 10;

    const perf = Number.isFinite(Number(score)) ? Number(score) : 0;
    if (perf < 40) riskScore += 30;
    else if (perf < 50) riskScore += 25;
    else if (perf < 60) riskScore += 20;
    else if (perf < 70) riskScore += 15;
    else if (perf < 80) riskScore += 10;
    else if (perf < 90) riskScore += 5;

    if ((feeStatus || '').toLowerCase() === 'overdue') riskScore += 30;
    else if ((feeStatus || '').toLowerCase() === 'pending') riskScore += 15;
    else if ((feeStatus || '').toLowerCase() === 'partial') riskScore += 10;

    return Math.min(100, Math.max(0, Math.round(riskScore)));
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

  const renderSortArrow = (key) => {
    if (sortBy === key) {
      return sortDir === 'asc' ? '▲' : '▼';
    }
    return ' ';
  };

  return (
    <>
      <TopNav onReset={handleReset} />
      {loading ? (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
          <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h1 className="text-xl font-semibold text-gray-700 mt-4">Loading Dashboard Data...</h1>
        </div>
      ) : dataadded ? (
        <div className="min-h-screen bg-gray-50">
          <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 space-y-8">
            <SummaryCards
              total={totals.total}
              high={totals.high}
              medium={totals.medium}
              low={totals.low}
              setRiskFilter={setRiskFilter}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Heatmap data={students} title="Attendance Distribution by Section" />
              <RiskFactorsChart data={students} title="Primary Risk Factors" />
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h3 className="text-xl font-bold text-gray-800">Filter students</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="lg:col-span-2">
                  <label htmlFor="search" className="sr-only">Search</label>
                  <input
                    id="search"
                    placeholder="Search by name, roll, or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>

                <select
                  value={mentorFilter}
                  onChange={e => setMentorFilter(e.target.value)}
                  className="border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                >
                  <option value="All">All Mentors</option>
                  {mentors.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-md bg-black hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-gray-800 rounded-lg shadow-md bg-white border border-gray-300 hover:bg-gray-100 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Export Excel
                  </button>
                </div>
              </div>
            </div>

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
                        { key: 'mentor_name', label: 'Mentor' },
                        { key: 'risk', label: 'Risk' },
                      ].map(h => (
                        <th
                          key={h.key}
                          className={`${h.width} px-4 py-4 ${h.align} text-sm font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (['risk', 'email', 'fee_status'].includes(h.key)) return;
                              setSortBy(h.key);
                              setSortDir(d =>
                                sortBy === h.key ? (d === 'asc' ? 'desc' : 'asc') : 'asc'
                              );
                            }}
                            className="inline-flex items-center gap-1"
                          >
                            {h.label}
                            {(['name', 'attendance', 'backlogs', 'mentor_name', 'roll_number'].includes(h.key) &&
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
                          <Link to={`/admin/students/${s.id}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                            {s.name}
                          </Link>
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
                            {s.fee_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-md text-gray-600">{s.mentor_name || 'Unassigned'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(s.risk_score !== undefined && s.risk_score !== null) || s.risk_level ? (
                            (() => {
                              const score = (s.risk_score !== undefined && s.risk_score !== null) ? Number(s.risk_score) : computeRiskScore(s.attendance, s.score ?? s.performance, s.fee_status);
                              const displayScore = Number.isFinite(score) ? Math.round(score) : null;
                              if (displayScore !== null) {
                                return (
                                  <div className="flex items-center gap-3">
                                    <div className="w-28 bg-gray-200 rounded-full h-2 overflow-hidden">
                                      <div className={`${riskColorForScore(displayScore)} h-2`} style={{ width: `${displayScore}%` }} />
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${displayScore >= 70 ? 'bg-red-600 text-white' : displayScore >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                      {displayScore}%
                                    </span>
                                  </div>
                                );
                              }
                              return <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBadgeClasses(s.risk_level)}`}>{s.risk_level || 'N/A'}</span>;
                            })()
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
          </main>
        </div>
      ) : (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 bg-gray-50">
          <div className="w-full max-w-4xl space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-200">
                <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                <span className="text-gray-600">Setup</span> Required
              </h2>
              <p className="text-center text-lg text-gray-600">
                Please import your student and mentor data to activate the dashboard.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Mentor Import Card */}
              <div className="card p-8 space-y-5">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900"> Import Mentor Data </h3>
                </div>
                <form onSubmit={handleImportmentor} className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="mentor-file-input" className="text-sm font-medium text-gray-700">Upload CSV</label>
                    <input id="mentor-file-input" type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-900 hover:file:bg-gray-200" />
                  </div>
                  <button type="submit" className="w-full px-4 py-2 bg-gray-900 hover:bg-black text-white font-semibold rounded-lg transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2 border border-gray-900 hover:border-black" disabled={importingMentor} >
                    {importingMentor ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Importing…
                      </>
                    ) : 'Import Mentors CSV'}
                  </button>
                </form>
              </div>

              {/* Student Import Card */}
              <div className="card p-8 space-y-5">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900"> Import Student Data </h3>
                </div>
                <form onSubmit={handleImportstudent} className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="student-file-input" className="text-sm font-medium text-gray-700">Upload CSV</label>
                    <input id="student-file-input" type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-900 hover:file:bg-gray-200" />
                  </div>
                  <button type="submit" className="w-full px-4 py-2 bg-gray-900 hover:bg-black text-white font-semibold rounded-lg transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2 border border-gray-900 hover:border-black" disabled={importingStudent} >
                    {importingStudent ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Importing…
                      </>
                    ) : 'Import Students CSV'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
