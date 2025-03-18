import { useState, useEffect } from 'react';
import { fetchRevenueMetrics, fetchAllPurchases } from '../services/firebaseService';
import RevenueChart from './RevenueChart';
import { FiDollarSign, FiUsers, FiBookOpen, FiCalendar } from 'react-icons/fi';
import { format, subDays } from 'date-fns';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [recentPurchases, setRecentPurchases] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Calculate start date based on selected range
        const endDate = new Date();
        const startDate = subDays(endDate, parseInt(dateRange));
        
        const metricsData = await fetchRevenueMetrics(startDate, endDate);
        setMetrics(metricsData);
        
        // Fetch recent purchases for the dashboard
        const purchases = await fetchAllPurchases();
        setRecentPurchases(purchases.slice(0, 5)); // Get only the 5 most recent
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const statCards = [
    {
      title: 'Total Revenue',
      value: metrics ? `₹${metrics.totalRevenue.toLocaleString()}` : '0',
      icon: FiDollarSign,
      color: 'bg-blue-500'
    },
    {
      title: 'Test Revenue',
      value: metrics ? `₹${metrics.testRevenue.toLocaleString()}` : '0',
      icon: FiBookOpen,
      color: 'bg-green-500'
    },
    {
      title: 'Interview Revenue',
      value: metrics ? `₹${metrics.interviewRevenue.toLocaleString()}` : '0',
      icon: FiCalendar,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Customers',
      value: metrics ? metrics.totalPurchases : '0',
      icon: FiUsers,
      color: 'bg-yellow-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date range picker */}
      <div className="bg-white rounded-lg shadow p-4">
        <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-2">
          Time Period:
        </label>
        <select
          id="dateRange"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-auto rounded-md"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-full p-3 text-white mr-4`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
        <div className="h-64">
          <RevenueChart days={parseInt(dateRange)} />
        </div>
      </div>

      {/* Recent purchases */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Purchases</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentPurchases.length > 0 ? (
            recentPurchases.map((purchase) => (
              <div key={purchase.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {purchase.userDetails?.name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {purchase.type === 'test' ? 'Test Purchase' : 'Interview Booking'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ₹{(purchase.amount / 100).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {purchase.purchaseDate ? format(purchase.purchaseDate.toDate(), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">
              No recent purchases found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 