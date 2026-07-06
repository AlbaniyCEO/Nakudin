/* global importScripts, firebase */
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'placeholder',
  authDomain: 'nakudin-3ec10.firebaseapp.com',
  projectId: 'nakudin-3ec10',
  storageBucket: 'nakudin-3ec10.firebasestorage.app',
  messagingSenderId: '426919044356',
  appId: '1:426919044356:web:48f4f4b9c50d5c51635c51',
  measurementId: 'G-3E4ZGMDTES',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'Nakudin';
  const options = {
    body: payload?.notification?.body || 'You have a new update.',
    data: {
      url: payload?.data?.url || '/',
    },
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
