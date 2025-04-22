import { useState } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiLogOut, FiMenu, FiX, FiSettings, FiBarChart2 } from 'react-icons/fi';

const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { icon: FiUsers, text: 'Interview Bookings', path: '/dashboard/interviews' },
    { icon: FiBarChart2, text: 'Test Analytics', path: '/dashboard/test-analytics' },
    { icon: FiSettings, text: 'Interview Settings', path: '/dashboard/interview-settings' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 p-4 z-20">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="text-gray-500 focus:outline-none"
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-10 lg:relative lg:translate-x-0 transition duration-300 transform bg-white border-r border-gray-200 w-64 space-y-6 py-7 px-2 lg:flex flex-col`}>
        <div className="px-4">
          <h2 className="text-xl font-bold text-gray-800">Vector Admin</h2>
        </div>
        
        <nav className="flex-1 space-y-1 px-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`flex items-center w-full px-4 py-2 rounded-md ${
                location.pathname === item.path
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              } transition duration-150 ease-in-out`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.text}
            </button>
          ))}
        </nav>
        
        <div className="px-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition duration-200 ease-in-out"
          >
            <FiLogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {navItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 