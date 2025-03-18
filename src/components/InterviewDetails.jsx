import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiLink, FiCheckCircle } from 'react-icons/fi';
import { Timestamp } from 'firebase/firestore';

const InterviewDetails = ({ booking, onClose, onUpdate }) => {
  const [status, setStatus] = useState(booking?.status || 'pending');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [meetLink, setMeetLink] = useState(booking?.meetLink || '');
  const [notes, setNotes] = useState(booking?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (booking?.scheduledDate) {
      const date = booking.scheduledDate.toDate();
      setScheduledDate(formatDateForInput(date));
      setScheduledTime(formatTimeForInput(date));
    }
  }, [booking]);

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create update object
      const updateData = {
        status,
        notes
      };

      // Add scheduled date if provided
      if (scheduledDate && scheduledTime) {
        const [year, month, day] = scheduledDate.split('-').map(Number);
        const [hours, minutes] = scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date(year, month - 1, day, hours, minutes);
        updateData.scheduledDate = Timestamp.fromDate(scheduledDateTime);
      }

      // Add meet link if provided
      if (meetLink) {
        updateData.meetLink = meetLink;
      }

      // Call update function
      await onUpdate(updateData);
    } catch (err) {
      console.error('Error updating interview:', err);
      setError('Failed to update interview details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Interview Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <FiX size={24} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* User details (read-only) */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">User Information</h4>
            <p className="text-sm"><span className="font-medium">Name:</span> {booking?.userDetails?.name || 'N/A'}</p>
            <p className="text-sm"><span className="font-medium">Email:</span> {booking?.userDetails?.email || 'N/A'}</p>
            <p className="text-sm"><span className="font-medium">Phone:</span> {booking?.userDetails?.phone || 'N/A'}</p>
            <p className="text-sm"><span className="font-medium">Amount Paid:</span> ₹{((booking?.amount || 0) / 100).toLocaleString()}</p>
            <p className="text-sm"><span className="font-medium">Payment ID:</span> {booking?.paymentId || 'N/A'}</p>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Scheduled Date and Time */}
          <div>
            <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-1">
              <FiCalendar className="inline mr-1" /> Schedule Date & Time
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                id="scheduledDate"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="time"
                id="scheduledTime"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Meet Link */}
          <div>
            <label htmlFor="meetLink" className="block text-sm font-medium text-gray-700 mb-1">
              <FiLink className="inline mr-1" /> Google Meet Link
            </label>
            <input
              type="url"
              id="meetLink"
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className="border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Admin Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Admin Notes (Private)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any private notes about this booking..."
            ></textarea>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
              disabled={loading}
            >
              {loading ? 'Saving...' : (
                <>
                  <FiCheckCircle className="mr-2" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewDetails; 