import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth, db } from "./configurationFirebase.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const form = document.getElementById("registroForm");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

if (form && emailInput && passwordInput) {
    const errorMsg = document.createElement("p");
    errorMsg.className = "form-feedback is-error";
    form.appendChild(errorMsg);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        errorMsg.innerText = "";

        if (!email.includes("@") || !email.includes(".")) {
            errorMsg.innerText = "Correo no valido.";
            return;
        }

        if (password.length < 6) {
            errorMsg.innerText = "La contrasena debe tener al menos 6 caracteres.";
            return;
        }

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);

            await setDoc(doc(db, "users", cred.user.uid), {
                email,
                tipo: "GRATIS",
                createdAt: new Date()
            });

            console.log("Usuario registrado:", cred.user);
            window.location.href = "/GlucoPredict-AI/FrontEnd/HTML/paga.html?where=registro";
        } catch (error) {
            console.error(error);

            switch (error.code) {
                case "auth/email-already-in-use":
                    errorMsg.innerText = "El correo ya esta registrado.";
                    break;
                case "auth/invalid-email":
                    errorMsg.innerText = "Formato de correo invalido.";
                    break;
                case "auth/weak-password":
                    errorMsg.innerText = "La contrasena es muy debil.";
                    break;
                default:
                    errorMsg.innerText = "Error al registrar usuario.";
            }
        }
    });
}
