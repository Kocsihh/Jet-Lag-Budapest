// firebase_config.js
// Firebase V10+ Compat SDK használatával
const firebaseConfig = {
    apiKey: "AIzaSyAfAdaLSQRWcfc1oJV72vA5BVh50UgcRKk",
    authDomain: "jet-lag-budapest.firebaseapp.com",
    databaseURL: "https://jet-lag-budapest-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "jet-lag-budapest",
    storageBucket: "jet-lag-budapest.firebasestorage.app",
    messagingSenderId: "262224183019",
    appId: "1:262224183019:web:e449bf8926845b1b6d08ae",
    measurementId: "G-KP5CSPNWMH"
};

// Inicializálás, ha még nem történt meg
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
