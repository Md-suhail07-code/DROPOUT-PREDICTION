import React, { useState } from 'react';
import { AuthContext } from '../../App';
import { studentAPI } from '../../services/api';

const roles = ['Admin','Mentor','Student'];

const AuthPage = () => {
  const { login } = React.useContext(AuthContext);
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Student' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignup) {
        const res = await studentAPI.signup(form);
        login(res.data);
      } else {
        const res = await studentAPI.login({ email: form.email, password: form.password });
        login(res.data);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-center text-gray-900">{isSignup ? 'Create account' : 'Sign in'}</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
          </div>
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select name="role" value={form.role} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}
          {error && <div className="text-sm text-danger-600">{error}</div>}
          <button disabled={loading} type="submit" className="w-full bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Please wait...' : isSignup ? 'Sign up' : 'Sign in'}
          </button>
        </form>
        <div className="text-center mt-4">
          <button onClick={() => setIsSignup(v => !v)} className="text-primary-600 hover:underline">
            {isSignup ? 'Have an account? Sign in' : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;


