import React, { useState } from 'react';
import { AuthContext } from '../../App';
import { studentAPI } from '../../services/api';
import { motion } from 'framer-motion';

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
      // Better error handling for 401 and other errors
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.response?.status === 400) {
        setError('Please check your email and password format.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentAPI.login({ email: 'sampleemail@gmail.com', password: 'pass@123' });
      login(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Demo credentials are invalid. Please contact support.');
      } else {
        setError('Demo login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 overflow-hidden">
      {/* Modern animated background */}
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-gray-200/30 to-gray-300/30 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-gray-300/30 to-gray-400/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-gray-200/20 to-gray-300/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }}></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-md w-full mx-4"
      >
        {/* Main card */}
        <div className="card p-8 relative overflow-hidden">
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4">
                <img 
                  src="/logoinverted.png" 
                  alt="Logo" 
                  className="w-16 h-16 mx-auto"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="w-16 h-16 bg-gray-900 rounded-lg hidden mx-auto"></div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600">
                {isSignup ? 'Join the platform and start your journey' : 'Sign in to continue'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignup && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    className="input w-full"
                    style={{ borderRadius: '10px' }}
                  />
                </div>
              )}
              
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                  className="input w-full"
                  style={{ borderRadius: '10px' }}
                />
              </div>
              
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="input w-full"
                  style={{ borderRadius: '10px' }}
                />
              </div>
              
              {isSignup && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="input w-full"
                    style={{ borderRadius: '10px' }}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r} className="bg-white text-gray-900">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {error && (
                <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                type="submit"
                className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-gray-900/25 border border-gray-900 hover:border-black"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Please wait...</span>
                  </div>
                ) : (
                  isSignup ? 'Create Account' : 'Sign In'
                )}
              </motion.button>
            </form>

            {/* Demo Login Button - Only show on login page */}
            {!isSignup && (
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  onClick={handleDemoLogin}
                  className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md border border-yellow-400 hover:border-yellow-500"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                      <span>Logging in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View Demo / Guest Login</span>
                    </div>
                  )}
                </motion.button>
              </div>
            )}

            <div className="text-center mt-6">
              <button
                onClick={() => setIsSignup((v) => !v)}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                {isSignup ? 'Already have an account? Sign in' : "New here? Create an account"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
