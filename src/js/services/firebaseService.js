import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  getDoc,
  getDocs
} from 'firebase/firestore';

import firebaseConfig from '../../config/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections
const SPINS_COLLECTION = 'spins';
const STATS_COLLECTION = 'stats';
const STATS_DOC = 'prizeDistribution';

/**
 * Subscribe to real-time updates for recent spins
 * @param {number} limitCount - Number of recent spins to fetch
 * @param {Function} onUpdate - Callback function when spins are updated
 * @returns {Function} Unsubscribe function
 */
export const subscribeToRecentSpins = (limitCount = 10, onUpdate) => {
  const q = query(
    collection(db, SPINS_COLLECTION),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, 
    (querySnapshot) => {
      const spins = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        spins.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate()
        });
      });
      onUpdate(spins);
    },
    (error) => {
      console.error('Error getting spins:', error);
      onUpdate([], error);
    }
  );
};

/**
 * Subscribe to real-time updates for prize statistics
 * @param {Function} onUpdate - Callback function when stats are updated
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPrizeStats = (onUpdate) => {
  const docRef = doc(db, STATS_COLLECTION, STATS_DOC);
  
  return onSnapshot(docRef, 
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      } else {
        console.warn('No prize stats found');
        onUpdate({});
      }
    },
    (error) => {
      console.error('Error getting prize stats:', error);
      onUpdate({}, error);
    }
  );
};

/**
 * Get all prizes configuration
 * @returns {Promise<Array>} Array of prize configurations
 */
export const getPrizesConfig = async () => {
  try {
    const prizesRef = collection(db, 'prizes');
    const querySnapshot = await getDocs(prizesRef);
    
    const prizes = [];
    querySnapshot.forEach((doc) => {
      prizes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return prizes;
  } catch (error) {
    console.error('Error getting prizes config:', error);
    return [];
  }
};

/**
 * Get user details by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User data
 */
export const getUserDetails = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user details:', error);
    return null;
  }
};

export default {
  subscribeToRecentSpins,
  subscribeToPrizeStats,
  getPrizesConfig,
  getUserDetails
};
