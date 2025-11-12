// 🔐 FIREBASE KONFIGURACE - ZDARMA!
// Postupujte podle kroků na https://firebase.google.com/

const firebaseConfig = {
    apiKey: "AIzaSyD_XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "blender-mastery-xxxxx.firebaseapp.com",
    databaseURL: "https://blender-mastery-xxxxx.firebaseio.com",
    projectId: "blender-mastery-xxxxx",
    storageBucket: "blender-mastery-xxxxx.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdefghijklmnop"
};

// Inicializuj Firebase
firebase.initializeApp(firebaseConfig);

// Vytvoř reference (dostupné globálně)
window.db = firebase.database();
window.auth = firebase.auth();
window.storage = firebase.storage();

console.log("✅ Firebase připojen - vše se ukládá ONLINE!");
