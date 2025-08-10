
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "battlecode-rwb92",
  "appId": "1:434917292342:web:30b8809cc3a2c1a3d09b97",
  "storageBucket": "battlecode-rwb92.appspot.com",
  "apiKey": "AIzaSyCvCpLguhA7u-vOu-dSX2MR8frznFPQ5vY",
  "authDomain": "battlecode-rwb92.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "434917292342"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
