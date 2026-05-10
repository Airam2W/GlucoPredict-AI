import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signInWithEmailAndPassword } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { firebaseConfig } from "./configurationFirebase.js";
import { db } from "./configurationFirebase.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("googleLogin").addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        console.log("Usuario:", user);

        // 🔥 Detectar si es nuevo usuario
        const isNewUser = result._tokenResponse.isNewUser;

        const userRef = doc(db, "users", user.uid);

        if (isNewUser) {
            // -----------------------------
            // CREAR DOCUMENTO (PRIMER INICIO DE SESIÓN)
            // -----------------------------
            await setDoc(userRef, {
                email: user.email,
                nombre: user.displayName || "",
                tipo: "GRATIS",
                createdAt: new Date()
            });

            console.log("Nuevo usuario creado en Firestore");

            // 👉 Enviar a pantalla de pago
            window.location.href = "FrontEnd/HTML/paga.html?where=servicio";

        } else {
            // -----------------------------
            // USUARIO EXISTENTE
            // -----------------------------
            const snap = await getDoc(userRef);

            if (!snap.exists()) {
                // 🔥 Seguridad extra (por si algo falló antes)
                await setDoc(userRef, {
                    email: user.email,
                    nombre: user.displayName || "",
                    tipo: "GRATIS",
                    createdAt: new Date()
                });
            }

            // 👉 Ir directamente al panel
            window.location.href = "FrontEnd/HTML/panel_principal.html";
        }

    } catch (error) {
        console.error("Error en inicio de sesión:", error);
        alert("Error: " + error.message);
    }
});

  document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Usuario:", result.user);
      window.location.href = "FrontEnd/HTML/panel_principal.html";
    } catch (err) {
        alert("Credenciales incorrectas");
    }
});
