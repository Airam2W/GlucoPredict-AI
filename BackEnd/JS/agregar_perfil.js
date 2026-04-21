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
import { MAX_PERFILES } from "./reestrinccionesLicencia.js";
import {
    attachValidation,
    validateInteger,
    validateOptionalEmail,
    validateOptionalNumber,
    validateOptionalPhone,
    validateOptionalText,
    validateRequiredSelect,
    validateRequiredText
} from "./formValidation.js";

function calcularIMC(peso, alturaCm) {
    const pesoNum = Number(peso);
    const alturaNum = Number(alturaCm);

    if (!pesoNum || !alturaNum) {
        return null;
    }

    const alturaMetros = alturaNum / 100;
    return Number((pesoNum / (alturaMetros * alturaMetros)).toFixed(1));
}

const params = new URLSearchParams(window.location.search);
const perfilId = params.get("id");
const isEditMode = Boolean(perfilId);

const formPerfil = document.getElementById("formPerfil");
const titulo = document.getElementById("tituloPerfil");
const btnGuardar = document.getElementById("btnGuardarPerfil");
const validator = attachValidation(formPerfil, {
    nombrePerfil: {
        validate: (value) => validateRequiredText(value, "nombre completo", { min: 3, max: 80 })
    },
    edadPerfil: {
        validate: (value) => validateInteger(value, "edad", 0, 120)
    },
    sexoPerfil: {
        validate: (value) => validateRequiredSelect(value, "sexo")
    },
    pesoPerfil: {
        validate: (value) => validateOptionalNumber(value, "peso", 1, 400)
    },
    alturaPerfil: {
        validate: (value) => validateOptionalNumber(value, "altura", 30, 250)
    },
    telefonoPerfil: {
        validate: (value) => validateOptionalPhone(value, "telefono")
    },
    correoPerfil: {
        validate: (value) => validateOptionalEmail(value, "correo electronico")
    },
    observacionesPerfil: {
        validate: (value) => validateOptionalText(value, "observaciones", {
            min: 3,
            max: 300,
            pattern: /^[A-Za-z\u00C0-\u017F0-9.,;:/#()\- ]+$/,
            patternMessage: "Observaciones contiene caracteres no permitidos."
        })
    }
});

function actualizarTextosModo() {
    if (!isEditMode) {
        return;
    }

    titulo.textContent = "Editar perfil personal";
    btnGuardar.textContent = "Guardar cambios";
}

function cargarFormulario(perfil) {
    document.getElementById("nombrePerfil").value = perfil.nombre || "";
    document.getElementById("edadPerfil").value = perfil.edad ?? "";
    document.getElementById("sexoPerfil").value = perfil.sexo || "";
    document.getElementById("pesoPerfil").value = perfil.peso ?? "";
    document.getElementById("alturaPerfil").value = perfil.altura ?? "";
    document.getElementById("telefonoPerfil").value = perfil.telefono || "";
    document.getElementById("correoPerfil").value = perfil.correo || "";
    document.getElementById("antecedentesDiabetesPerfil").value = perfil.antecedentesDiabetes || "";
    document.getElementById("actividadFisicaPerfil").value = perfil.actividadFisica || "";
    document.getElementById("observacionesPerfil").value = perfil.observaciones || "";
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        return;
    }

    actualizarTextosModo();

    if (!isEditMode) {
        const ref = collection(db, "users", user.uid, "perfiles");
        const snapshot = await getDocs(ref);

        if (snapshot.size >= MAX_PERFILES) {
            alert(`Has alcanzado el límite de ${MAX_PERFILES} perfiles. No puedes agregar más.`);
            window.location.href = "persona_dashboard.html";
        }
        return;
    }

    const perfilRef = doc(db, "users", user.uid, "perfiles", perfilId);
    const perfilSnap = await getDoc(perfilRef);

    if (!perfilSnap.exists()) {
        alert("Perfil no encontrado");
        window.location.href = "persona_dashboard.html";
        return;
    }

    cargarFormulario(perfilSnap.data());
});

formPerfil.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validator.validateAll()) {
        return;
    }

    const user = auth.currentUser;
    const nombre = document.getElementById("nombrePerfil").value.trim();
    const edad = Number(document.getElementById("edadPerfil").value);
    const sexo = document.getElementById("sexoPerfil").value;
    const peso = document.getElementById("pesoPerfil").value;
    const altura = document.getElementById("alturaPerfil").value;
    const telefono = document.getElementById("telefonoPerfil").value.trim();
    const correo = document.getElementById("correoPerfil").value.trim();
    const antecedentesDiabetes = document.getElementById("antecedentesDiabetesPerfil").value;
    const actividadFisica = document.getElementById("actividadFisicaPerfil").value;
    const observaciones = document.getElementById("observacionesPerfil").value.trim();
    const pesoNumero = peso ? Number(peso) : null;
    const alturaNumero = altura ? Number(altura) : null;

    const data = {
        nombre,
        edad,
        sexo,
        peso: pesoNumero,
        altura: alturaNumero,
        imc: calcularIMC(pesoNumero, alturaNumero),
        telefono,
        correo,
        antecedentesDiabetes,
        actividadFisica,
        observaciones,
        updatedAt: new Date()
    };

    if (isEditMode) {
        await setDoc(doc(db, "users", user.uid, "perfiles", perfilId), data, { merge: true });
        window.location.href = `perfil_persona.html?id=${perfilId}`;
        return;
    }

    await addDoc(collection(db, "users", user.uid, "perfiles"), {
        ...data,
        createdAt: new Date()
    });

    window.location.href = "persona_dashboard.html";
});
