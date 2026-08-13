import { useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { studentAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Top navigation bar — displayed on the dashboard
 * Props:
 *   studentName {string}
 *   onRefresh   {function} - callback to re-fetch dashboard data
 */
export default function Navbar({ studentName = '', onRefresh }) {
  const navigate = useNavigate();
  const logout   = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login', { replace: true });
  };

  const handleRefresh = async () => {
    try {
      await studentAPI.refreshData();
      if (onRefresh) onRefresh();
      toast.success('Data refreshed from latest records.');
    } catch {
      toast.error('Failed to refresh data.');
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rtu-gradient rounded-xl flex items-center justify-center shadow-rtu">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-rtu-navy leading-tight font-display">
                RTU Placement Cell
              </h1>
              <p className="text-[10px] text-gray-500 leading-tight">
                Rajasthan Technical University, Kota
              </p>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Refresh */}
            <button
              id="navbar-refresh-btn"
              onClick={handleRefresh}
              title="Refresh data from Google Sheet"
              className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-rtu-blue flex items-center justify-center transition-all duration-200 border border-gray-200 hover:border-blue-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* User info */}
            {studentName && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-7 h-7 bg-rtu-gradient rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {studentName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-700 max-w-[140px] truncate">
                  {studentName}
                </span>
              </div>
            )}

            {/* Logout */}
            <button
              id="navbar-logout-btn"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold
                         text-red-600 bg-red-50 hover:bg-red-100 border border-red-100
                         hover:border-red-200 transition-all duration-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
