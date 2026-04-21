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
const pacienteId = params.get("id");
const isEditMode = Boolean(pacienteId);

const btnVolver = document.getElementById("btnVolver");
const formPaciente = document.getElementById("formPaciente");
const titulo = document.getElementById("tituloPaciente");
const btnGuardar = document.getElementById("btnGuardarPaciente");
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

function actualizarTextosModo() {
    if (!isEditMode) {
        return;
    }

    titulo.textContent = "Editar paciente";
    btnGuardar.textContent = "Guardar cambios";
}

function cargarFormulario(paciente) {
    document.getElementById("nombrePaciente").value = paciente.nombre || "";
    document.getElementById("edadPaciente").value = paciente.edad ?? "";
    document.getElementById("sexoPaciente").value = paciente.sexo || "";
    document.getElementById("pesoPaciente").value = paciente.peso ?? "";
    document.getElementById("alturaPaciente").value = paciente.altura ?? "";
    document.getElementById("telefonoPaciente").value = paciente.telefono || "";
    document.getElementById("correoPaciente").value = paciente.correo || "";
    document.getElementById("contactoEmergenciaPaciente").value = paciente.contactoEmergencia || "";
    document.getElementById("tipoSangrePaciente").value = paciente.tipoSangre || "";
    document.getElementById("observacionesPaciente").value = paciente.observaciones || "";
}

btnVolver.onclick = () => {
    window.location.href = `clinica.html?id=${clinicaId}`;
};

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        return;
    }

    actualizarTextosModo();

    if (!isEditMode) {
        const ref = collection(db, "users", user.uid, "clinicas", clinicaId, "pacientes");
        const snapshot = await getDocs(ref);

        if (snapshot.size >= MAX_PACIENTES) {
            alert(`Has alcanzado el límite de ${MAX_PACIENTES} pacientes. No puedes agregar más.`);
            window.location.href = `clinica.html?id=${clinicaId}`;
        }
        return;
    }

    const pacienteRef = doc(db, "users", user.uid, "clinicas", clinicaId, "pacientes", pacienteId);
    const pacienteSnap = await getDoc(pacienteRef);

    if (!pacienteSnap.exists()) {
        alert("Paciente no encontrado");
        window.location.href = `clinica.html?id=${clinicaId}`;
        return;
    }

    cargarFormulario(pacienteSnap.data());
});

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

    const data = {
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
        updatedAt: new Date()
    };

    if (isEditMode) {
        await setDoc(
            doc(db, "users", user.uid, "clinicas", clinicaId, "pacientes", pacienteId),
            data,
            { merge: true }
        );
        window.location.href = `paciente.html?id=${pacienteId}&clinica=${clinicaId}`;
        return;
    }

    await addDoc(
        collection(db, "users", user.uid, "clinicas", clinicaId, "pacientes"),
        {
            ...data,
            createdAt: new Date()
        }
    );

    window.location.href = `clinica.html?id=${clinicaId}`;
});
