import { useState, useEffect } from 'react';
import { db, doc, getDoc, updateDoc, setDoc, Timestamp } from '../firebase';
import { FiSave, FiCheck, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

const InterviewSettings = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAppSettings();
  }, []);

  const getAppSettings = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const settingsRef = doc(db, 'systemConfig/appSettings');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setIsEnabled(data.interviewBookingsEnabled ?? true);
        setMessage(data.interviewBookingsMessage ?? '');
      } else {
        // Default values if document doesn't exist
        setIsEnabled(true);
        setMessage('');
        
        // Create the document with default values
        await setDoc(settingsRef, {
          interviewBookingsEnabled: true,
          interviewBookingsMessage: '',
          lastUpdated: Timestamp.now()
        });
      }
    } catch (err) {
      console.error('Error fetching app settings:', err);
      setError('Failed to load settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateInterviewBookingSettings = async (enabled, message) => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);
    
    try {
      const settingsRef = doc(db, 'systemConfig/appSettings');
      
      await updateDoc(settingsRef, {
        interviewBookingsEnabled: enabled,
        interviewBookingsMessage: message,
        lastUpdated: Timestamp.now()
      });
      
      setSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = () => {
    setIsEnabled(!isEnabled);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateInterviewBookingSettings(isEnabled, message);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Interview Booking Settings</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Interview Booking Settings</h2>
      
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {saveSuccess && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center">
          <FiCheck className="mr-2" /> Settings saved successfully
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Interview Bookings</h3>
            <p className="text-sm text-gray-500">
              {isEnabled 
                ? 'Users can book mock interviews' 
                : 'Mock interview bookings are disabled'}
            </p>
          </div>
          <button 
            type="button"
            onClick={handleToggle}
            className="focus:outline-none"
            aria-pressed={isEnabled}
            aria-label="Toggle interview bookings"
          >
            {isEnabled ? (
              <FiToggleRight className="h-10 w-10 text-blue-600" />
            ) : (
              <FiToggleLeft className="h-10 w-10 text-gray-400" />
            )}
          </button>
        </div>
        
        {/* Message Field */}
        <div>
          <label htmlFor="disabledMessage" className="block text-sm font-medium text-gray-700 mb-1">
            Message When Disabled
          </label>
          <textarea
            id="disabledMessage"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message to display when interview bookings are disabled"
            rows={3}
            className="border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
          <p className="mt-1 text-sm text-gray-500">
            This message will be shown to users when they try to book an interview while the feature is disabled.
          </p>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
          >
            {isSaving ? (
              <>
                <div className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="mr-2" /> Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InterviewSettings; 