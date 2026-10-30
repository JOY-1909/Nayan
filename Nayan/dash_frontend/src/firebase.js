// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyA4YZVp-LPaIGnQ0Y0TU-h7NyPwYIoWtKc",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "hackiit-70a92.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "hackiit-70a92",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "hackiit-70a92.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "112684681132",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:112684681132:web:5d4c33986c3750c5869c09"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
