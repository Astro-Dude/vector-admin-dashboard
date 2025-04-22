import { useState, useEffect } from 'react';
import { fetchInterviewBookings, updateInterviewBooking } from '../services/firebaseService';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { FiSearch, FiFilter, FiEdit, FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiUsers, FiDollarSign, FiDownload } from 'react-icons/fi';
import InterviewDetails from './InterviewDetails';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const InterviewBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statsTimeframe, setStatsTimeframe] = useState('30');
  const [statsData, setStatsData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0
  });
  const [chartData, setChartData] = useState({
    bookingTrend: {
      labels: [],
      datasets: []
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (bookings.length > 0) {
      calculateStats();
      generateChartData();
    }
  }, [bookings, statsTimeframe]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const interviewBookings = await fetchInterviewBookings();
      setBookings(interviewBookings);
      setFilteredBookings(interviewBookings);
    } catch (err) {
      console.error('Error fetching interview bookings:', err);
      setError('Failed to load interview bookings');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const cutoffDate = subDays(now, parseInt(statsTimeframe));
    
    const filteredByDate = bookings.filter(booking => {
      if (!booking.bookingDate) return false;
      const bookingDate = booking.bookingDate.toDate();
      return bookingDate >= cutoffDate;
    });

    const pendingCount = filteredByDate.filter(b => b.status === 'pending').length;
    const confirmedCount = filteredByDate.filter(b => b.status === 'confirmed').length;
    const completedCount = filteredByDate.filter(b => b.status === 'completed').length;
    const cancelledCount = filteredByDate.filter(b => b.status === 'cancelled').length;
    
    const totalRevenue = filteredByDate.reduce((sum, booking) => sum + (booking.amount || 0), 0) / 100;
    
    setStatsData({
      totalBookings: filteredByDate.length,
      totalRevenue,
      pendingBookings: pendingCount,
      confirmedBookings: confirmedCount,
      completedBookings: completedCount,
      cancelledBookings: cancelledCount
    });
  };

  const generateChartData = () => {
    const days = parseInt(statsTimeframe);
    const today = new Date();
    const dateLabels = [];
    const dailyBookings = [];
    const dailyRevenue = [];
    
    // Create dates array and initialize data
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      dateLabels.push(format(date, 'MMM dd'));
      dailyBookings.push(0);
      dailyRevenue.push(0);
    }
    
    // Process booking data for trend chart
    bookings.forEach(booking => {
      if (!booking.bookingDate) return;
      
      const bookingDate = booking.bookingDate.toDate();
      const daysAgo = Math.floor((today - bookingDate) / (1000 * 60 * 60 * 24));
      
      if (daysAgo >= 0 && daysAgo < days) {
        dailyBookings[days - 1 - daysAgo]++;
        
        const amount = (booking.amount || 0) / 100; // Convert paise to rupees
        dailyRevenue[days - 1 - daysAgo] += amount;
      }
    });
    
    setChartData({
      bookingTrend: {
        labels: dateLabels,
        datasets: [
          {
            label: 'Bookings',
            data: dailyBookings,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Revenue (₹)',
            data: dailyRevenue,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      }
    });
  };

  useEffect(() => {
    // Apply filters
    let filtered = [...bookings];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.userDetails?.name?.toLowerCase().includes(term) ||
          booking.userDetails?.email?.toLowerCase().includes(term) ||
          booking.userDetails?.phone?.toLowerCase().includes(term)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const daysAgo = parseInt(dateFilter);
      const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
      
      filtered = filtered.filter((booking) => {
        if (!booking.bookingDate) return false;
        const bookingDate = booking.bookingDate.toDate();
        return bookingDate >= cutoffDate;
      });
    }
    
    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, dateFilter, bookings]);

  const handleUpdateBooking = async (updatedData) => {
    if (!selectedBooking) return;
    
    try {
      await updateInterviewBooking(selectedBooking.userId, selectedBooking.id, updatedData);
      setIsModalOpen(false);
      
      // Update booking in local state
      const updatedBookings = bookings.map((booking) => {
        if (booking.id === selectedBooking.id && booking.userId === selectedBooking.userId) {
          return { ...booking, ...updatedData };
        }
        return booking;
      });
      
      setBookings(updatedBookings);
      setSelectedBooking(null);
    } catch (err) {
      console.error('Error updating booking:', err);
      setError('Failed to update booking');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <FiClock className="mr-1" /> Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <FiCheckCircle className="mr-1" /> Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            <FiCheckCircle className="mr-1" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <FiXCircle className="mr-1" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const handleDownloadCSV = () => {
    // Define CSV headers
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Status',
      'Amount (₹)',
      'Scheduled Date',
      'Scheduled Time',
      'Booking Date',
      'Booking Time',
      'Payment ID'
    ];

    // Convert bookings data to CSV rows
    const dataRows = filteredBookings.map(booking => {
      const scheduledDate = booking.scheduledDate ? format(booking.scheduledDate.toDate(), 'yyyy-MM-dd') : 'Not Scheduled';
      const scheduledTime = booking.scheduledDate ? format(booking.scheduledDate.toDate(), 'HH:mm') : '';
      const bookingDate = booking.bookingDate ? format(booking.bookingDate.toDate(), 'yyyy-MM-dd') : 'N/A';
      const bookingTime = booking.bookingDate ? format(booking.bookingDate.toDate(), 'HH:mm') : '';
      
      return [
        booking.userDetails?.name || 'N/A',
        booking.userDetails?.email || 'N/A',
        booking.userDetails?.phone || 'N/A',
        booking.status || 'N/A',
        ((booking.amount || 0) / 100).toFixed(2),
        scheduledDate,
        scheduledTime,
        bookingDate,
        bookingTime,
        booking.paymentId || 'N/A'
      ];
    });

    // Combine headers and data rows
    const csvContent = [
      headers.join(','),
      ...dataRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `interview-bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  // Chart options
  const trendOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Number of Bookings'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Revenue (₹)'
        },
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Interview Statistics</h2>
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-600">Time Period:</span>
            <select
              value={statsTimeframe}
              onChange={(e) => setStatsTimeframe(e.target.value)}
              className="border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 365 days</option>
            </select>
          </div>
        </div>
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FiUsers className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-800">{statsData.totalBookings}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-5 border border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <FiDollarSign className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">₹{statsData.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <FiClock className="text-yellow-600 text-xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-800">{statsData.pendingBookings}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-full mr-4">
                <FiCalendar className="text-indigo-600 text-xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Scheduled</p>
                <p className="text-2xl font-bold text-gray-800">{statsData.confirmedBookings}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts section */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-700">Booking & Revenue Trends</h3>
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {`Statistics for last ${statsTimeframe} days`}
            </div>
          </div>
          <div className="bg-white p-4 border border-gray-100 rounded-lg shadow-sm h-80">
            <Line options={trendOptions} data={chartData.bookingTrend} />
          </div>
        </div>
      </div>

      {/* Bookings Table Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Interview Bookings</h2>
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-150"
            disabled={filteredBookings.length === 0}
          >
            <FiDownload className="mr-2" /> Download CSV
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-5 mb-6">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <FiFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <FiFilter className="text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Results count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{filteredBookings.length}</span> of <span className="font-medium">{bookings.length}</span> bookings
          </p>
          {filteredBookings.length > 0 && (
            <p className="text-sm text-gray-500">
              Total value: <span className="font-medium">₹{filteredBookings.reduce((sum, booking) => sum + ((booking.amount || 0) / 100), 0).toLocaleString()}</span>
            </p>
          )}
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.userDetails?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{booking.userDetails?.email || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{booking.userDetails?.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.scheduledDate ? format(booking.scheduledDate.toDate(), 'MMM dd, yyyy') : 'Not scheduled'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.scheduledDate ? format(booking.scheduledDate.toDate(), 'h:mm a') : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.bookingDate ? format(booking.bookingDate.toDate(), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.bookingDate ? format(booking.bookingDate.toDate(), 'h:mm a') : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{(booking.amount / 100).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 flex items-center justify-center hover:bg-blue-50 p-1 rounded-full transition-colors duration-150"
                      >
                        <FiEdit className="mr-1" /> 
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No interview bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interview Details Modal */}
      {isModalOpen && selectedBooking && (
        <InterviewDetails
          booking={selectedBooking}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedBooking(null);
          }}
          onUpdate={handleUpdateBooking}
        />
      )}
    </div>
  );
};

export default InterviewBookings; 