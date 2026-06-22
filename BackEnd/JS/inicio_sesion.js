import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signInWithEmailAndPassword }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { firebaseConfig } from "./configurationFirebase.js";
import { db } from "./configurationFirebase.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const usoSelect = document.getElementById("uso");

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario ya autenticado, redirigir según su tipo
        const userRef = doc(db, "users", user.uid);
        getDoc(userRef).then(snap => {
            if (snap.exists()) {
                const userData = snap.data();
                if (userData.uso === "medico") {
                    window.location.href = "FrontEnd/HTML/medico_dashboard.html";
                } else {
                    window.location.href = "FrontEnd/HTML/persona_dashboard.html";
                }
            } else {
                // Si no hay datos en Firestore, redirige al panel principal
                window.location.href = "FrontEnd/HTML/persona_dashboard.html";
            }
        });
    } else {
        console.log("No hay usuario autenticado");
    }
});

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
                uso: usoSelect.value || "comun",
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
                    uso: usoSelect.value || "comun",
                    createdAt: new Date()
                });
            }

            // Si es uso: comun -> persona_dashboard, si es uso: medico -> medico_dashboard
            const userData = snap.data();
            if (userData.uso === "medico") {
                window.location.href = "FrontEnd/HTML/medico_dashboard.html";
            } else {
                window.location.href = "FrontEnd/HTML/persona_dashboard.html";
            }
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
        const user = result.user;

        // Obtener datos del usuario en Firestore
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            const userData = snap.data();

            if (userData.uso === "medico") {
                window.location.href = "FrontEnd/HTML/medico_dashboard.html";
            } else {
                window.location.href = "FrontEnd/HTML/persona_dashboard.html";
            }
        } else {
            // Si no hay datos en Firestore, redirige al panel principal
            window.location.href = "FrontEnd/HTML/persona_dashboard.html";
        }

    } catch (err) {
        console.error(err);
        alert("Credenciales incorrectas");
    }
});
