import React from 'react';
import { AuthContext } from '../../App';
import logo from './logo.png'; // <-- Adjust path as per your project
import { LogOut, Plus } from 'lucide-react';

const TopNav = ({ onReset }) => {
  const { user, logout } = React.useContext(AuthContext);

  return (
    <header className="sticky top-0 z-20 bg-black text-white shadow-lg m-2 rounded-xl p-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
        {/* Left Section: Logo + Title */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            STEPUP-EWS
          </h1>
          <p className='text-s text-gray-400 ml-1'>by team Algophoenix</p>
        </div>

        {/* Right Section: Actions - Hidden on small screens */}
        <div className="hidden sm:flex items-center gap-4">
          {/* Reset button */}
          <button
            onClick={onReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-md transition-all duration-200 flex items-center gap-1"
          >
            <Plus size={18} />
            New Data
          </button>
          {/* User info */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-center">
              <span className="font-bold text-sm">{user?.name || 'Guest'}</span>
              <span className="text-xs bg-gray-100 px-2 rounded-full text-black font-bold p-1">{user?.role || 'User'}</span>
            </div>
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-gray-600 text-white font-bold border-2 border-white shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-2 p-2 text-gray-400 hover:text-red-500 rounded-md font-bold transition-all border-2 border-gray-400 hover:border-red-500"
          >
            <LogOut size={20} />
            Logout
          </button>


        </div>

        {/* Responsive buttons for small screens */}
        <div className="sm:hidden flex items-center gap-2">
          <button
            onClick={onReset}
            className="p-2 bg-red-600 text-white rounded-full transition-all duration-200"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-500 rounded-md transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
