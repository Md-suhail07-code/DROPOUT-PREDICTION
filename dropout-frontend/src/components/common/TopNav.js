import React from 'react';
// FIX: The external import is commented out to prevent compilation errors
import { AuthContext } from '../../App';

// Necessary definition for AuthContext to avoid runtime errors in this isolated file.
// In your complete application, this will correctly reference '../../App'.


const TopNav = ({ title }) => {
  const { user, logout } = React.useContext(AuthContext);
  return (
    // Make the header sticky at the top, increase z-index, and use a slightly darker background for contrast
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div>
          {/* Enhanced font weight and slightly deeper text color */}
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
          {/* Role subtitle for context */}
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">Role: <span className="text-indigo-600 font-semibold">{user?.role || 'Guest'}</span></p>
        </div>
        <div className="flex items-center gap-3">
          {/* User name display with a friendly text color */}
          <span className="hidden sm:block text-sm font-semibold text-gray-700">{user?.name}</span>
          <button 
            onClick={logout} 
            // Enhanced button styling: added padding, font-weight, smoother border radius, and a deeper red color with a pronounced hover effect
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
