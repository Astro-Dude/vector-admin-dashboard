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
import { signInWithEmailAndPassword, signOut, getAuth } from 'firebase/auth';
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

// Test analytics functions
export const fetchTestResults = async (filters = {}) => {
  try {
    // First check if the user is authenticated
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    console.log("Fetching test results with filters:", filters);
    
    // Start with base query
    let constraints = [
      orderBy('timestamp', 'desc')
    ];
    
    // Apply filters if provided
    if (filters.testId) {
      constraints.push(where('testId', '==', filters.testId));
    }
    
    if (filters.startDate) {
      const startTimestamp = Timestamp.fromDate(new Date(filters.startDate));
      constraints.push(where('timestamp', '>=', startTimestamp));
    }
    
    if (filters.endDate) {
      const endTimestamp = Timestamp.fromDate(new Date(filters.endDate));
      constraints.push(where('timestamp', '<=', endTimestamp));
    }
    
    if (filters.minScore) {
      constraints.push(where('percentage', '>=', filters.minScore));
    }
    
    if (filters.maxScore) {
      constraints.push(where('percentage', '<=', filters.maxScore));
    }
    
    if (filters.resultStatus) {
      constraints.push(where('resultStatus', '==', filters.resultStatus));
    }
    
    const testResultsQuery = query(
      collection(db, 'testResults'),
      ...constraints
    );
    
    const querySnapshot = await getDocs(testResultsQuery);
    console.log(`Found ${querySnapshot.docs.length} test results`);
    
    // First, gather all user IDs from test results
    const userIds = new Set();
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.userId) {
        userIds.add(data.userId);
      }
    });
    
    console.log(`Found ${userIds.size} unique user IDs`);
    
    // Next, try to find user details in related collections
    const userDetailsMap = {};
    
    // Check testAttempts collection - might have user info
    try {
      const testAttemptsQuery = query(collectionGroup(db, 'testAttempts'));
      const attemptsSnapshot = await getDocs(testAttemptsQuery);
      console.log(`Found ${attemptsSnapshot.docs.length} test attempts`);
      
      attemptsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.userId || '';
        
        if (userId && userIds.has(userId)) {
          if (!userDetailsMap[userId]) {
            userDetailsMap[userId] = {
              name: data.userName || data.studentName || data.displayName || data.name || 'Unknown',
              email: data.userEmail || data.email || 'N/A',
              phone: data.userPhone || data.phoneNumber || data.phone || 'N/A'
            };
            console.log(`Found user details in testAttempts for userId ${userId}:`, userDetailsMap[userId]);
          }
        }
      });
    } catch (err) {
      console.log("Error checking testAttempts collection:", err);
    }
    
    // Try to lookup each user in the users collection
    for (const userId of userIds) {
      if (!userDetailsMap[userId]) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userDetailsMap[userId] = {
              name: userData.displayName || userData.name || 'Unknown',
              email: userData.email || 'N/A',
              phone: userData.phoneNumber || userData.phone || 'N/A'
            };
            console.log(`Found user details in users collection for userId ${userId}:`, userDetailsMap[userId]);
          }
        } catch (err) {
          console.log(`Error looking up user ${userId} in users collection:`, err);
        }
      }
    }
    
    // Process test results to include consistent userDetails
    const resultsWithUserDetails = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      
      // Get user information with priority:
      // 1. Directly from test result fields
      // 2. From userDetailsMap if we found user elsewhere
      // 3. Default values
      
      const userId = data.userId || '';
      const userDetails = {
        name: data.displayName || data.userName || data.studentName || data.name || 
              (userId && userDetailsMap[userId]?.name) || 'Unknown',
        email: data.email || data.userEmail || 
               (userId && userDetailsMap[userId]?.email) || 'N/A',
        phone: data.phone || data.userPhone || data.phoneNumber || 
               (userId && userDetailsMap[userId]?.phone) || 'N/A'
      };
      
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp ? data.timestamp.toDate() : null,
        userDetails
      };
    });
    
    console.log("Returning processed test results with user details");
    return resultsWithUserDetails;
  } catch (error) {
    console.error("Error fetching test results:", error);
    throw error;
  }
};

// Test category analytics
export const fetchTestCategoryPerformance = async () => {
  try {
    // First check if the user is authenticated
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    const testResults = await fetchTestResults();
    
    // Group by test category
    const categoryMap = {};
    
    testResults.forEach(result => {
      const testId = result.testId || 'unknown';
      
      if (!categoryMap[testId]) {
        categoryMap[testId] = {
          testId,
          testName: result.testName || 'Unknown Test',
          attempts: 0,
          totalScore: 0,
          avgScore: 0,
          highestScore: 0,
          lowestScore: 100,
          totalTime: 0,
          avgTime: 0,
          passCount: 0,
          failCount: 0
        };
      }
      
      const category = categoryMap[testId];
      category.attempts++;
      category.totalScore += result.percentage || 0;
      category.highestScore = Math.max(category.highestScore, result.percentage || 0);
      category.lowestScore = Math.min(category.lowestScore, result.percentage || 0);
      category.totalTime += result.timeSpent || 0;
      
      if (result.resultStatus === 'pass') {
        category.passCount++;
      } else {
        category.failCount++;
      }
    });
    
    // Calculate averages
    Object.values(categoryMap).forEach(category => {
      category.avgScore = category.attempts > 0 ? category.totalScore / category.attempts : 0;
      category.avgTime = category.attempts > 0 ? category.totalTime / category.attempts : 0;
    });
    
    return Object.values(categoryMap);
  } catch (error) {
    console.error("Error fetching test category performance:", error);
    throw error;
  }
}; 