import { auth, db } from "./configurationFirebase.js";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { MAX_CLINICAS } from "./reestrinccionesLicencia.js";
import {
    attachValidation,
    validateOptionalEmail,
    validateOptionalPhone,
    validateOptionalText,
    validateRequiredText
} from "./formValidation.js";

const params = new URLSearchParams(window.location.search);
const clinicaId = params.get("id");
const isEditMode = Boolean(clinicaId);

const form = document.getElementById("formClinica");
const titulo = document.getElementById("tituloClinica");
const btnGuardar = document.getElementById("btnGuardarClinica");
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

function actualizarTextosModo() {
    if (!isEditMode) {
        return;
    }

    titulo.textContent = "Editar clinica";
    btnGuardar.textContent = "Guardar cambios";
}

function cargarFormulario(clinica) {
    document.getElementById("nombreClinica").value = clinica.nombre || "";
    document.getElementById("direccionClinica").value = clinica.direccion || "";
    document.getElementById("telefonoClinica").value = clinica.telefono || "";
    document.getElementById("correoClinica").value = clinica.correo || "";
    document.getElementById("responsableClinica").value = clinica.responsable || "";
    document.getElementById("especialidadClinica").value = clinica.especialidad || "";
    document.getElementById("horarioClinica").value = clinica.horario || "";
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        return;
    }

    actualizarTextosModo();

    if (!isEditMode) {
        const ref = collection(db, "users", user.uid, "clinicas");
        const snapshot = await getDocs(ref);

        if (snapshot.size >= MAX_CLINICAS) {
            alert(`Has alcanzado el límite de ${MAX_CLINICAS} clínicas. No puedes agregar más.`);
            window.location.href = "medico_dashboard.html";
        }
        return;
    }

    const clinicaRef = doc(db, "users", user.uid, "clinicas", clinicaId);
    const clinicaSnap = await getDoc(clinicaRef);

    if (!clinicaSnap.exists()) {
        alert("Clinica no encontrada");
        window.location.href = "medico_dashboard.html";
        return;
    }

    cargarFormulario(clinicaSnap.data());
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

    const data = {
        nombre,
        direccion,
        telefono,
        correo,
        responsable,
        especialidad,
        horario,
        updatedAt: new Date()
    };

    if (isEditMode) {
        await setDoc(doc(db, "users", user.uid, "clinicas", clinicaId), data, { merge: true });
        window.location.href = `clinica.html?id=${clinicaId}`;
        return;
    }

    await addDoc(collection(db, "users", user.uid, "clinicas"), {
        ...data,
        createdAt: new Date()
    });

    window.location.href = "medico_dashboard.html";
});
