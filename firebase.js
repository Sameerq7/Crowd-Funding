// Import the necessary Firebase SDK modules
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAv8G64Fs7MWokKtSY1dy-u8t6s8e3IywY",
  authDomain: "chittiapp-fc56c.firebaseapp.com",
  projectId: "chittiapp-fc56c",
  storageBucket: "chittiapp-fc56c.appspot.com",
  messagingSenderId: "358165352945",
  appId: "1:358165352945:web:10d81e052f30f4780df450",
  measurementId: "G-ESKQ7BX2S9",
  databaseURL: "https://chittiapp-fc56c-default-rtdb.firebaseio.com",  // Add the database URL
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Realtime Database
const db = getDatabase(app);

export { db }; // Export the db instance to use in your application
