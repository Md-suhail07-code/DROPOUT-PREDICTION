import React, { useState } from 'react';
import { AuthContext } from '../../App';
import { studentAPI } from '../../services/api';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Shield } from 'lucide-react';

const roles = ['Admin', 'Mentor', 'Student'];

const AuthPage = () => {
  const { login } = React.useContext(AuthContext);
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Student' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-gray-200"
      >
        <h2 className="text-3xl font-extrabold text-center text-indigo-800">
          {isSignup ? 'Create an Account' : 'Welcome Back'}
        </h2>
        <p className="text-center text-gray-600 mt-1">
          {isSignup ? 'Join the platform and start your journey!' : 'Sign in to continue'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  className="pl-10 pr-3 py-2 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="pl-10 pr-3 py-2 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="pl-10 pr-3 py-2 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="pl-10 pr-3 py-2 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 shadow-md"
          >
            {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Sign In'}
          </motion.button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => setIsSignup((v) => !v)}
            className="text-indigo-600 hover:underline font-medium"
          >
            {isSignup ? 'Already have an account? Sign in' : "New here? Create an account"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
