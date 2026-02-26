import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyB8A2LOkD1ILy6evSWgZOoOGl7ou4Rmw3I",
    authDomain: "aractakip-a87a8.firebaseapp.com",
    projectId: "aractakip-a87a8",
    storageBucket: "aractakip-a87a8.firebasestorage.app",
    messagingSenderId: "48183349937",
    appId: "1:48183349937:web:a41a249d3281275e214890",
    measurementId: "G-2DNB2W6Y62"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
