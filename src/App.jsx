import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import InterviewBookings from './components/InterviewBookings';
import InterviewSettings from './components/InterviewSettings';
import TestAnalytics from './components/TestAnalytics';
import DashboardLayout from './components/DashboardLayout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin panel routes with layout */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard/interviews" replace />} />
            <Route path="interviews" element={<InterviewBookings />} />
            <Route path="test-analytics" element={<TestAnalytics />} />
            <Route path="interview-settings" element={<InterviewSettings />} />
          </Route>
          
          {/* Redirect root to interviews */}
          <Route path="/" element={<Navigate to="/dashboard/interviews" replace />} />
          
          {/* Catch all other routes */}
          <Route path="*" element={<Navigate to="/dashboard/interviews" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
