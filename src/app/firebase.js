import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';


const firebaseConfig = {
 apiKey: "AIzaSyBYpvS4gK5w92p8-9o3dBFokIg84ZIhOKw",
 authDomain: "inventory-management-app-f3804.firebaseapp.com",
 projectId: "inventory-management-app-f3804",
 storageBucket: "inventory-management-app-f3804.appspot.com",
 messagingSenderId: "179685923820",
 appId: "1:179685923820:web:57b03053127191cd49bec9",
measurementId: "G-THSKY40PZ0"
 };

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

export { app, firestore, auth  };


