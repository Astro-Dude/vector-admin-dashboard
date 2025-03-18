import { useState, useEffect } from 'react';
import { fetchInterviewBookings, updateInterviewBooking } from '../services/firebaseService';
import { format } from 'date-fns';
import { FiSearch, FiFilter, FiEdit, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import InterviewDetails from './InterviewDetails';

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

  useEffect(() => {
    fetchData();
  }, []);

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
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Interview Bookings</h2>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
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
        
        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </p>
        
        {/* Table */}
        <div className="overflow-x-auto">
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
                  <tr key={booking.id} className="hover:bg-gray-50">
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
                        className="text-blue-600 hover:text-blue-900 flex items-center justify-center"
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