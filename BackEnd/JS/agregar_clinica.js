import { auth, db } from "./configurationFirebase.js";
import { addDoc, collection } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { MAX_CLINICAS } from "./reestrinccionesLicencia.js";
import {
    attachValidation,
    validateOptionalEmail,
    validateOptionalPhone,
    validateOptionalText,
    validateRequiredText
} from "./formValidation.js";


onAuthStateChanged(auth, async (user) => {
    const ref = collection(db, "users", user.uid, "clinicas");
    const snapshot = await getDocs(ref);

    const numeroClinicas = snapshot.size;

    console.log("Número de clínicas registradas:", numeroClinicas);
    console.log("Límite máximo de clínicas:", MAX_CLINICAS);

    if (numeroClinicas >= MAX_CLINICAS) {
        alert(`Has alcanzado el límite de ${MAX_CLINICAS} clínicas. No puedes agregar más.`);
        window.location.href = "medico_dashboard.html";
    }

});


const form = document.getElementById("formClinica");
const validator = attachValidation(form, {
    nombreClinica: {
        validate: (value) => validateRequiredText(value, "nombre de la clinica", { min: 3, max: 100 })
    },
    direccionClinica: {
        validate: (value) => validateRequiredText(value, "direccion", {
            min: 5,
            max: 150,
            pattern: /^[A-Za-z\u00C0-\u017F0-9.,/#()\- ]+$/
        })
    },
    telefonoClinica: {
        validate: (value) => validateOptionalPhone(value, "telefono de contacto")
    },
    correoClinica: {
        validate: (value) => validateOptionalEmail(value, "correo de contacto")
    },
    responsableClinica: {
        validate: (value) => validateOptionalText(value, "responsable medico", { min: 3, max: 80 })
    },
    especialidadClinica: {
        validate: (value) => validateOptionalText(value, "especialidad principal", { min: 3, max: 80 })
    },
    horarioClinica: {
        validate: (value) => validateOptionalText(value, "horario de atencion", {
            min: 3,
            max: 80,
            pattern: /^[A-Za-z\u00C0-\u017F0-9:,\- ]+$/
        })
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validator.validateAll()) {
        return;
    }

    const user = auth.currentUser;

    const nombre = document.getElementById("nombreClinica").value.trim();
    const direccion = document.getElementById("direccionClinica").value.trim();
    const telefono = document.getElementById("telefonoClinica").value.trim();
    const correo = document.getElementById("correoClinica").value.trim();
    const responsable = document.getElementById("responsableClinica").value.trim();
    const especialidad = document.getElementById("especialidadClinica").value.trim();
    const horario = document.getElementById("horarioClinica").value.trim();

    await addDoc(collection(db, "users", user.uid, "clinicas"), {
        nombre,
        direccion,
        telefono,
        correo,
        responsable,
        especialidad,
        horario,
        createdAt: new Date()
    });

    window.location.href = "medico_dashboard.html";
});
