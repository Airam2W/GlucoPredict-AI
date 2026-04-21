import { auth, db } from "./configurationFirebase.js";
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { MAX_PACIENTES } from "./reestrinccionesLicencia.js";
import {
    attachValidation,
    validateBloodType,
    validateInteger,
    validateOptionalEmail,
    validateOptionalNumber,
    validateOptionalPhone,
    validateOptionalText,
    validateRequiredSelect,
    validateRequiredText
} from "./formValidation.js";

onAuthStateChanged(auth, async (user) => {
    const params = new URLSearchParams(window.location.search);
    const clinicaId = params.get("clinica");
    const ref = collection(db, "users", user.uid, "clinicas", clinicaId, "pacientes");
    const snapshot = await getDocs(ref);
    const numeroPacientes = snapshot.size;

    console.log("Número de pacientes registrados:", numeroPacientes);
    console.log("Límite máximo de pacientes:", MAX_PACIENTES);

    if (numeroPacientes >= MAX_PACIENTES) {
        alert(`Has alcanzado el límite de ${MAX_PACIENTES} pacientes. No puedes agregar más.`);
        window.location.href = `clinica.html?id=${clinicaId}`;
    }
});

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
const clinicaId = params.get("clinica");

const btnVolver = document.getElementById("btnVolver");
const formPaciente = document.getElementById("formPaciente");
const validator = attachValidation(formPaciente, {
    nombrePaciente: {
        validate: (value) => validateRequiredText(value, "nombre completo", { min: 3, max: 80 })
    },
    edadPaciente: {
        validate: (value) => validateInteger(value, "edad", 0, 120)
    },
    sexoPaciente: {
        validate: (value) => validateRequiredSelect(value, "sexo")
    },
    pesoPaciente: {
        validate: (value) => validateOptionalNumber(value, "peso", 1, 400)
    },
    alturaPaciente: {
        validate: (value) => validateOptionalNumber(value, "altura", 30, 250)
    },
    telefonoPaciente: {
        validate: (value) => validateOptionalPhone(value, "telefono")
    },
    correoPaciente: {
        validate: (value) => validateOptionalEmail(value, "correo electronico")
    },
    contactoEmergenciaPaciente: {
        validate: (value) => validateOptionalText(value, "contacto de emergencia", { min: 3, max: 80 })
    },
    tipoSangrePaciente: {
        validate: (value) => validateBloodType(value)
    },
    observacionesPaciente: {
        validate: (value) => validateOptionalText(value, "observaciones", {
            min: 3,
            max: 300,
            pattern: /^[A-Za-z\u00C0-\u017F0-9.,;:/#()\- ]+$/,
            patternMessage: "Observaciones contiene caracteres no permitidos."
        })
    }
});

if (!clinicaId) {
    alert("Clinica no encontrada");
    window.location.href = "medico_dashboard.html";
}

btnVolver.onclick = () => {
    window.location.href = `clinica.html?id=${clinicaId}`;
};

formPaciente.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validator.validateAll()) {
        return;
    }

    const user = auth.currentUser;
    const nombre = document.getElementById("nombrePaciente").value.trim();
    const edad = Number(document.getElementById("edadPaciente").value);
    const sexo = document.getElementById("sexoPaciente").value;
    const peso = document.getElementById("pesoPaciente").value;
    const altura = document.getElementById("alturaPaciente").value;
    const telefono = document.getElementById("telefonoPaciente").value.trim();
    const correo = document.getElementById("correoPaciente").value.trim();
    const contactoEmergencia = document.getElementById("contactoEmergenciaPaciente").value.trim();
    const tipoSangre = document.getElementById("tipoSangrePaciente").value.trim();
    const observaciones = document.getElementById("observacionesPaciente").value.trim();
    const pesoNumero = peso ? Number(peso) : null;
    const alturaNumero = altura ? Number(altura) : null;

    await addDoc(
        collection(db, "users", user.uid, "clinicas", clinicaId, "pacientes"),
        {
            nombre,
            edad,
            sexo,
            peso: pesoNumero,
            altura: alturaNumero,
            imc: calcularIMC(pesoNumero, alturaNumero),
            telefono,
            correo,
            contactoEmergencia,
            tipoSangre,
            observaciones,
            createdAt: new Date()
        }
    );

    window.location.href = `clinica.html?id=${clinicaId}`;
});
