// ════════════════════════════════════════════════════════
//  Firebase Configuration — Tomás Surfer
//  Nota: la API key es pública por diseño de Firebase.
//  La seguridad se maneja con Firebase Security Rules.
// ════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey:            "AIzaSyDNomSrcMhCk5ZIzQKvg3XXmDYZ9sVZJvU",
  authDomain:        "tomas-surfer.firebaseapp.com",
  projectId:         "tomas-surfer",
  storageBucket:     "tomas-surfer.firebasestorage.app",
  messagingSenderId: "5078839231",
  appId:             "1:5078839231:web:419b6c86151ece36ae3b0a",
  measurementId:     "G-TMF8F99232"
};

// Inicializar Firebase (compat SDK cargado via <script> en index.html)
if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (e) {
    // Ya inicializado (hot reload)
  }
}
