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
    apiKey: "AIzaSyA4YZVp-LPaIGnQ0Y0TU-h7NyPwYIoWtKc",
    authDomain: "hackiit-70a92.firebaseapp.com",
    projectId: "hackiit-70a92",
    storageBucket: "hackiit-70a92.firebasestorage.app",
    messagingSenderId: "112684681132",
    appId: "1:112684681132:web:5d4c33986c3750c5869c09"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
