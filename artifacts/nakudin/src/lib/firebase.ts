import { initializeApp, getApp, getApps } from "firebase/app";
  import { getAuth } from "firebase/auth";
  import { getFirestore } from "firebase/firestore";

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "nakudin-3ec10.firebaseapp.com",
    projectId: "nakudin-3ec10",
    storageBucket: "nakudin-3ec10.firebasestorage.app",
    messagingSenderId: "426919044356",
    appId: "1:426919044356:web:48f4f4b9c50d5c51635c51",
    measurementId: "G-3E4ZGMDTES",
  };

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const db = getFirestore(app);
  export { app };
  