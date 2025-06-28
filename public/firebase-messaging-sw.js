// firebase-messaging-sw.js
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyBpNUxyC4stfKOuEoZiZOq0cxkvnGjTkHM',
  authDomain: 'forex-signal-app-c0c32.firebaseapp.com',
  projectId: 'forex-signal-app-c0c32',
  storageBucket: 'forex-signal-app-c0c32.firebasestorage.app',
  messagingSenderId: '245922029776',
  appId: '1:245922029776:web:ad1ff5d97ac5e4e01d3ed5',
  measurementId: 'G-VSC3CR04FV',
});

const messaging = firebase.messaging();
