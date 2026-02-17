import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCc1-fCyAxjnSeQ05MXK1oJoXTrYhpv-6k",
  authDomain: "nable-inc.firebaseapp.com",
  projectId: "nable-inc",
  storageBucket: "nable-inc.firebasestorage.app",
  messagingSenderId: "926373306051",
  appId: "1:926373306051:web:e8599664f1079e0e220c76",
  measurementId: "G-E9EK0VH0Z8",
};

const app = initializeApp(firebaseConfig);
// const messaging = getMessaging(app);
const db = getFirestore(app);

let messaging;

isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  } else {
    console.warn("Firebase messaging is not supported on this browser.");
  }
});

export { db, messaging };
