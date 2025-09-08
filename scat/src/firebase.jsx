import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBkFymr6kGQu2nY1FxRe1kG4KiAx9oci2A",
  authDomain: "scattegoriesuv.firebaseapp.com",
  projectId: "scattegoriesuv",
  storageBucket: "scattegoriesuv.firebasestorage.app",
  messagingSenderId: "169134108050",
  appId: "1:169134108050:web:2d7262ba9435fd5c26e54b",
  measurementId: "G-QZSK9X3V7X",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);
