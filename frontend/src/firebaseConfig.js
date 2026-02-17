import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDM1g0paGxT4anb8xyvj0FlyxX7ooDqADc",
  authDomain: "momentum-1d43b.firebaseapp.com",
  projectId: "momentum-1d43b",
  storageBucket: "momentum-1d43b.firebasestorage.app",
  messagingSenderId: "680167337515",
  appId: "1:680167337515:web:f0a8daec892bc0a709846e",
  measurementId: "G-YMGZV2L6DJ"
};

const app = initializeApp(firebaseConfig);
// const messaging = getMessaging(app);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

let messaging;

isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  } else {
    console.warn("Firebase messaging is not supported on this browser.");
  }
});

export { db, messaging, auth, googleProvider };
