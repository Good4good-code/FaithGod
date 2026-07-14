import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyB8Az6vx4Hudkw6UK7ptLOV1tWtSca-rLo",
  authDomain: "tonal-monolith-zn50x.firebaseapp.com",
  projectId: "tonal-monolith-zn50x",
  storageBucket: "tonal-monolith-zn50x.firebasestorage.app",
  messagingSenderId: "72623846592",
  appId: "1:72623846592:web:09d01b0d23361f74336925"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
