import { auth, db } from "./configurationFirebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const params = new URLSearchParams(window.location.search);
const tipo = params.get("tipo");
const personaId = params.get("id");
const clinicaId = params.get("clinica");

const nombreInput = document.getElementById("name");
const ageInput = document.getElementById("age");
const sexInput = document.getElementById("sex");
const bmiInput = document.getElementById("bmi");
const glucoseInput = document.getElementById("glucose");
const bpInput = document.getElementById("bp");
const familyInput = document.getElementById("family");
const hypertensionInput = document.getElementById("hypertension");
const activityInput = document.getElementById("activity");
const alcoholInput = document.getElementById("alcohol");
const saveStatus = document.getElementById("saveStatus");
const pdfStatus = document.getElementById("pdfStatus");
const historialForm = document.getElementById("historialForm");
const btnVolver = document.getElementById("btnVolver");

let personaCache = null;

if (!tipo || !personaId || (tipo === "paciente" && !clinicaId)) {
    alert("Contexto invalido");
    window.location.href = "panel_principal.html";
}

function getHistorialRef(user) {
    if (tipo === "paciente") {
        return doc(
            db,
            "users", user.uid,
            "clinicas", clinicaId,
            "pacientes", personaId,
            "historial_clinico", "actual"
        );
    }

    return doc(
        db,
        "users", user.uid,
        "perfiles", personaId,
        "historial_clinico", "actual"
    );
}

function getPersonaRef(user) {
    if (tipo === "paciente") {
        return doc(
            db,
            "users", user.uid,
            "clinicas", clinicaId,
            "pacientes", personaId
        );
    }

    return doc(db, "users", user.uid, "perfiles", personaId);
}

function normalizarSexo(valor) {
    const texto = String(valor || "").trim().toLowerCase();

    if (!texto) {
        return "";
    }
    if (texto === "m" || texto === "masculino") {
        return "Masculino";
    }
    if (texto === "f" || texto === "femenino") {
        return "Femenino";
    }
    return "Otro";
}

function normalizarActividad(valor) {
    const texto = String(valor || "").trim().toLowerCase();

    if (!texto) {
        return "";
    }
    if (["alta", "activo"].includes(texto)) {
        return "activo";
    }
    if (["moderada", "moderado"].includes(texto)) {
        return "moderado";
    }
    if (["baja", "sedentario"].includes(texto)) {
        return "sedentario";
    }
    return "";
}

function calcularIMC(peso, alturaCm) {
    const pesoNum = Number(peso);
    const alturaNum = Number(alturaCm);

    if (!pesoNum || !alturaNum) {
        return null;
    }

    const alturaMetros = alturaNum / 100;
    return Number((pesoNum / (alturaMetros * alturaMetros)).toFixed(1));
}

function actualizarInputs(datos) {
    if (datos.nombre) {
        nombreInput.value = datos.nombre;
    }
    if (datos.edad !== undefined && datos.edad !== null && datos.edad !== "") {
        ageInput.value = datos.edad;
    }
    if (datos.sexo) {
        sexInput.value = normalizarSexo(datos.sexo);
    }
    if (datos.imc !== undefined && datos.imc !== null && datos.imc !== "") {
        bmiInput.value = datos.imc;
    }
    if (datos.glucosa !== undefined && datos.glucosa !== null && datos.glucosa !== "") {
        glucoseInput.value = datos.glucosa;
    }
    if (datos.presion_sistolica !== undefined && datos.presion_sistolica !== null && datos.presion_sistolica !== "") {
        bpInput.value = datos.presion_sistolica;
    }

    if (typeof datos.antecedentes_familiares_diabetes === "boolean") {
        familyInput.checked = datos.antecedentes_familiares_diabetes;
    }
    if (typeof datos.hipertension === "boolean") {
        hypertensionInput.checked = datos.hipertension;
    }
    if (datos.actividad_fisica) {
        activityInput.value = normalizarActividad(datos.actividad_fisica);
    }
    if (datos.alcohol) {
        alcoholInput.value = String(datos.alcohol).trim().toLowerCase();
    }
}

async function actualizarPersona(user, data) {
    await setDoc(
        getPersonaRef(user),
        {
            nombre: data.nombre,
            edad: data.edad,
            sexo: data.sexo,
            imc: data.imc,
            updatedAt: new Date()
        },
        { merge: true }
    );
}

async function cargarDatosPersona(user) {
    const personaSnap = await getDoc(getPersonaRef(user));
    if (!personaSnap.exists()) {
        return null;
    }

    const persona = personaSnap.data();
    const datosBase = {
        nombre: persona.nombre,
        edad: persona.edad,
        sexo: persona.sexo,
        imc: persona.imc ?? calcularIMC(persona.peso, persona.altura)
    };

    if (tipo === "perfil") {
        datosBase.antecedentes_familiares_diabetes = String(persona.antecedentesDiabetes || "").toLowerCase() === "si";
        datosBase.actividad_fisica = persona.actividadFisica;
    }

    actualizarInputs(datosBase);
    return persona;
}

function extraerTexto(texto, regex, grupo = 1) {
    const match = texto.match(regex);
    return match ? match[grupo].trim() : "";
}

function extraerNumero(texto, regex, grupo = 1) {
    const match = texto.match(regex);
    return match ? Number.parseFloat(match[grupo]) : "";
}

async function leerPDF(file) {
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    let texto = "";

    for (let pagina = 1; pagina <= pdf.numPages; pagina += 1) {
        const page = await pdf.getPage(pagina);
        const content = await page.getTextContent();
        texto += `${content.items.map((item) => item.str).join(" ")}\n`;
    }

    return texto;
}

function extraerDatos(texto) {
    const sexoRaw = extraerTexto(texto, /Sexo[:\s]+(Masculino|Femenino|M|F|Otro)/i);
    const presionMatch = texto.match(/(TA|PA|Presion arterial|Presi[oó]n arterial)[:\s]+(\d{2,3})\/(\d{2,3})/i);

    return {
        nombre: extraerTexto(
            texto,
            /(Nombre del paciente|Nombre|Paciente)[:\s]+([A-Za-zÁÉÍÓÚÑ\s]+)/i,
            2
        ),
        edad: extraerNumero(texto, /Edad[:\s]+(\d{1,3})/i),
        sexo: normalizarSexo(sexoRaw),
        imc: extraerNumero(texto, /(IMC|Indice de masa corporal|Índice de masa corporal)[:\s]+([\d.]+)/i, 2),
        glucosa: extraerNumero(texto, /Glucosa(?: en ayuno)?[:\s]+(\d{2,3})/i),
        presion_sistolica: presionMatch ? Number(presionMatch[2]) : "",
        antecedentes_familiares_diabetes: /antecedentes.*diabetes/i.test(texto),
        hipertension: /hipertensi[oó]n/i.test(texto),
        actividad_fisica: extraerTexto(texto, /Actividad f[ií]sica[:\s]+(Sedentario|Moderado|Activo)/i),
        alcohol: extraerTexto(texto, /Alcohol[:\s]+(No|Ocasional|Frecuente)/i)
    };
}

async function procesarPDF(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    pdfStatus.innerText = "Leyendo PDF...";

    try {
        const texto = await leerPDF(file);
        actualizarInputs(extraerDatos(texto));
        pdfStatus.innerText = "Datos extraidos del PDF. Revisa la informacion antes de guardar.";
    } catch (error) {
        console.error("Error al procesar PDF:", error);
        pdfStatus.innerText = "Error al procesar el PDF.";
    }
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../../index.html";
        return;
    }

    personaCache = await cargarDatosPersona(user);

    const historialSnap = await getDoc(getHistorialRef(user));
    if (historialSnap.exists()) {
        actualizarInputs(historialSnap.data());
    }
});

historialForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    const imcCalculado = bmiInput.value || !personaCache
        ? Number(bmiInput.value)
        : calcularIMC(personaCache.peso, personaCache.altura);

    const data = {
        nombre: nombreInput.value.trim(),
        edad: Number(ageInput.value),
        sexo: sexInput.value,
        imc: imcCalculado || null,
        glucosa: Number(glucoseInput.value),
        presion_sistolica: Number(bpInput.value),
        antecedentes_familiares_diabetes: familyInput.checked,
        hipertension: hypertensionInput.checked,
        actividad_fisica: activityInput.value,
        alcohol: alcoholInput.value,
        updatedAt: new Date()
    };

    await setDoc(getHistorialRef(user), data);
    await actualizarPersona(user, data);

    saveStatus.innerText = "Historial clinico guardado correctamente.";
});

btnVolver.onclick = () => {
    if (tipo === "paciente") {
        window.location.href = `paciente.html?id=${personaId}&clinica=${clinicaId}`;
        return;
    }

    window.location.href = `perfil_persona.html?id=${personaId}`;
};

document.getElementById("pdfFile")?.addEventListener("change", procesarPDF);
