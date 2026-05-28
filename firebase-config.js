// ── FIREBASE CONFIG ───────────────────────────────────────────────────────────

const firebaseConfig = {
    apiKey:            "AIzaSyDL0noFF4y3tE2BvkwwdzaUy57-WNhwuVc",
    authDomain:        "contole-financeiro.firebaseapp.com",
    databaseURL:       "https://contole-financeiro-default-rtdb.firebaseio.com",
    projectId:         "contole-financeiro",
    storageBucket:     "contole-financeiro.firebasestorage.app",
    messagingSenderId: "900080057773",
    appId:             "1:900080057773:web:01c625097fdbb140c03524"
};

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Auth
    const firebaseAuth   = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    window.firebaseAuth   = firebaseAuth;
    window.googleProvider = googleProvider;

    // Realtime Database
    window.rtdb = firebase.database();

} catch (err) {
    console.error('Erro ao inicializar Firebase:', err);
}
