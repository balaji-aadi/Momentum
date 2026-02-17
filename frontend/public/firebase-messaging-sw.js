importScripts(
  "https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js"
);

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDcXF5Ri_DPJPVPLUSU7O94acY03XAOql0",
  authDomain: "e-delivery-a0a51.firebaseapp.com",
  projectId: "e-delivery-a0a51",
  storageBucket: "e-delivery-a0a51.appspot.com",
  messagingSenderId: "215449653167",
  appId: "1:215449653167:web:bf22b1fc5e1603481c695a",
  measurementId: "G-KB5GVPFKQY",
};

// Initialize Firebase using compat SDK
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/firebase-logo.png", // Ensure the icon path is correct
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
