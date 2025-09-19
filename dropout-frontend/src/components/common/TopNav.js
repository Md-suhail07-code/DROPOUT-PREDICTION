import React from 'react';
import { AuthContext } from '../../App';

const TopNav = ({ title }) => {
  const { user, logout } = React.useContext(AuthContext);
  return (
    <header className="bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-xs sm:text-sm text-gray-500">Role: {user?.role}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-gray-600">{user?.name}</span>
          <button onClick={logout} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md shadow">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;


