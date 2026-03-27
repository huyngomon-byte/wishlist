import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCa1IwzADu7-r0Q9ZPWtwRbtsjOz-jLGpU",
  authDomain: "wishlist-15fa6.firebaseapp.com",
  projectId: "wishlist-15fa6",
  storageBucket: "wishlist-15fa6.firebasestorage.app",
  messagingSenderId: "24047356529",
  appId: "1:24047356529:web:a6034403f0a3a70e94a9d0",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
