import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  setDoc, 
  deleteDoc,
  addDoc,
  query, 
  where, 
  orderBy, 
  collectionGroup, 
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBcuoctmR1FgvxlaF_WAJhKECDJkbC2Oa0",
  authDomain: "vector-9ade4.firebaseapp.com",
  projectId: "vector-9ade4",
  storageBucket: "vector-9ade4.appspot.com",
  messagingSenderId: "1075793698398",
  appId: "1:1075793698398:web:2f0f4f3315d1fbd95cdecf",
  measurementId: "G-NP9CZT2TJR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { 
  app, 
  db, 
  auth, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  setDoc,
  deleteDoc,
  addDoc,
  query, 
  where, 
  orderBy, 
  collectionGroup,
  Timestamp,
  serverTimestamp
}; 