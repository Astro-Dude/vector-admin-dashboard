import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { loginWithEmail, logoutUser } from '../services/firebaseService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Login function with admin email validation
  const login = async (email, password) => {
    setError('');
    
    // Check if email is the admin email
    if (email !== 'vector.scalernset@gmail.com') {
      setError('Access denied. Only admin accounts are allowed.');
      return false;
    }
    
    try {
      const user = await loginWithEmail(email, password);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setError('Failed to login. Please check your credentials.');
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    setError('');
    try {
      await logoutUser();
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      setError('Failed to logout.');
      return false;
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    error,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 