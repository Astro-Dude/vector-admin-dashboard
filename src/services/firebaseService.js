import { 
  db, 
  auth, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  collectionGroup 
} from '../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

// Authentication functions
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

// Data fetching functions
export const fetchAllPurchases = async () => {
  try {
    // First check if the user is authenticated
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    const purchasesQuery = query(
      collectionGroup(db, 'purchases'),
      orderBy('purchaseDate', 'desc')
    );
    
    const querySnapshot = await getDocs(purchasesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.ref.path.split('/')[1],
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching purchases:", error);
    throw error;
  }
};

export const fetchTestPurchases = async () => {
  try {
    // First check if the user is authenticated
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    const purchasesQuery = query(
      collectionGroup(db, 'purchases'),
      where('type', '==', 'test'),
      orderBy('purchaseDate', 'desc')
    );
    
    const querySnapshot = await getDocs(purchasesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.ref.path.split('/')[1],
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching test purchases:", error);
    throw error;
  }
};

export const fetchInterviewBookings = async () => {
  try {
    // First check if the user is authenticated
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    const bookingsQuery = query(
      collectionGroup(db, 'purchases'),
      where('type', '==', 'interview'),
      orderBy('bookingDate', 'desc')
    );
    
    const querySnapshot = await getDocs(bookingsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.ref.path.split('/')[1],
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching interview bookings:", error);
    throw error;
  }
};

export const updateInterviewBooking = async (userId, purchaseId, updateData) => {
  try {
    // First check if the user is authenticated
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    const purchaseRef = doc(db, `users/${userId}/purchases/${purchaseId}`);
    await updateDoc(purchaseRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error("Error updating interview booking:", error);
    throw error;
  }
};

// Analytics functions
export const fetchRevenueMetrics = async (startDate, endDate) => {
  try {
    // First check if the user is authenticated
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    // Convert dates to Firestore timestamps if provided
    let constraints = [];
    
    if (startDate) {
      constraints.push(where('purchaseDate', '>=', Timestamp.fromDate(new Date(startDate))));
    }
    
    if (endDate) {
      constraints.push(where('purchaseDate', '<=', Timestamp.fromDate(new Date(endDate))));
    }
    
    const purchasesQuery = query(
      collectionGroup(db, 'purchases'),
      ...constraints,
      orderBy('purchaseDate', 'desc')
    );
    
    const querySnapshot = await getDocs(purchasesQuery);
    const purchases = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Calculate metrics
    const totalRevenue = purchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0) / 100; // Convert paise to rupees
    const testRevenue = purchases
      .filter(purchase => purchase.type === 'test')
      .reduce((sum, purchase) => sum + (purchase.amount || 0), 0) / 100;
    const interviewRevenue = purchases
      .filter(purchase => purchase.type === 'interview')
      .reduce((sum, purchase) => sum + (purchase.amount || 0), 0) / 100;
    
    return {
      totalRevenue,
      testRevenue,
      interviewRevenue,
      totalPurchases: purchases.length,
      testPurchases: purchases.filter(purchase => purchase.type === 'test').length,
      interviewPurchases: purchases.filter(purchase => purchase.type === 'interview').length
    };
  } catch (error) {
    console.error("Error fetching revenue metrics:", error);
    throw error;
  }
}; 