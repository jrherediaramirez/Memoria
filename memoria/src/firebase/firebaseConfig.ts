// src/firebase/firebaseConfig.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";           // value import only
import type { Auth } from "firebase/auth";        // type import
import { getFirestore } from "firebase/firestore"; 
import type { Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";     // value import only
import type { FirebaseStorage } from "firebase/storage";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwKW1cNFEq-8CvDaXdhzSTnHmStJSr_WI",
  authDomain: "memoria-36eca.firebaseapp.com",
  projectId: "memoria-36eca",
  storageBucket: "memoria-36eca.firebasestorage.app",
  messagingSenderId: "790353572994",
  appId: "1:790353572994:web:909a0e1e6afc86c3f2709b",
  measurementId: "G-RVY55JPF83"
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };