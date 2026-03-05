import { auth, db } from "./configurationFirebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* -------------------------------------------------
   CONTEXTO
------------------------------------------------- */
const params = new URLSearchParams(window.location.search);
const tipo = params.get("tipo");          // "paciente" | "perfil"
const personaId = params.get("id");
const clinicaId = params.get("clinica");

const nombreInput = document.getElementById("name");
const ageInput = document.getElementById("age");
const sexInput = document.getElementById("sex");
const bmiInput = document.getElementById("bmi");
const glucoseInput = document.getElementById("glucose");
const bpInput = document.getElementById("bp");
const family = document.getElementById("family");
const hypertension = document.getElementById("hypertension");
const activity = document.getElementById("activity");
const alcohol = document.getElementById("alcohol");

if (!tipo || !personaId) {
    alert("Contexto inválido");
    window.location.href = "panel_principal.html";
}

/* -------------------------------------------------
   REFERENCIA FIRESTORE
------------------------------------------------- */
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

async function getPersonaRef(user) {
    if (tipo === "paciente") {
        return doc(
            db,
            "users", user.uid,
            "clinicas", clinicaId,
            "pacientes", personaId
        );
    }

    return doc(
        db,
        "users", user.uid,
        "perfiles", personaId
    );
}

async function actualizarPersona(user, data) {
    const personaRef = await getPersonaRef(user);

    await setDoc(
        personaRef,
        {
            nombre: data.nombre,
            edad: data.edad,
            sexo: data.sexo,
            updatedAt: new Date()
        },
        { merge: true }
    );
}


/* -------------------------------------------------
   CARGAR HISTORIAL EXISTENTE
------------------------------------------------- */
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../../index.html";
        return;
    }

    /* -----------------------------
       CARGAR DATOS PERSONALES
    ----------------------------- */
    const personaSnap = await getDoc(await getPersonaRef(user));
    if (personaSnap.exists()) {
        const persona = personaSnap.data();

        if (persona.nombre) nombreInput.value = persona.nombre;
        if (persona.edad) ageInput.value = persona.edad;
        if (persona.sexo) sexInput.value = persona.sexo;
    }

    /* -----------------------------
       CARGAR HISTORIAL (SI EXISTE)
    ----------------------------- */
    const snap = await getDoc(getHistorialRef(user));
    if (snap.exists()) {
        actualizarInputs(snap.data());
    }
});

/* -------------------------------------------------
   GUARDAR HISTORIAL
------------------------------------------------- */
document.getElementById("historialForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

const data = {
    nombre: nombreInput.value.trim(),
    edad: Number(ageInput.value),
    sexo: sexInput.value,
    imc: Number(bmiInput.value),
    glucosa: Number(glucoseInput.value),
    presion_sistolica: Number(bpInput.value),
    antecedentes_familiares_diabetes: family.checked,
    hipertension: hypertension.checked,
    actividad_fisica: activity.value,
    alcohol: alcohol.value,
    updatedAt: new Date()
};

    await setDoc(getHistorialRef(user), data);
    await actualizarPersona(user, data);

    saveStatus.innerText = "Historial clínico y datos personales guardados correctamente.";
});

/* -------------------------------------------------
   BOTÓN VOLVER
------------------------------------------------- */
document.getElementById("btnVolver").onclick = () => {
    if (tipo === "paciente") {
        window.location.href = `paciente.html?id=${personaId}&clinica=${clinicaId}`;
    } else {
        window.location.href = `perfil_persona.html?id=${personaId}`;
    }
};

/* -------------------------------------------------
   PDF → TEXTO
------------------------------------------------- */
async function leerPDF(file) {
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    let texto = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        texto += content.items.map(i => i.str).join(" ") + "\n";
    }
    return texto;
}

/* -------------------------------------------------
   REGEX CLÍNICOS (MX)
------------------------------------------------- */
function extraerDatos(texto) {

    const num = (r) => {
        const m = texto.match(r);
        return m ? parseFloat(m[1]) : "";
    };

    const txt = (r) => {
        const m = texto.match(r);
        return m ? m[1].trim() : "";
    };

    const sexoRaw = txt(/Sexo[:\s]+(Masculino|Femenino|M|F)/i);
    const sexo =
        sexoRaw.toUpperCase().startsWith("M") ? "M" :
        sexoRaw.toUpperCase().startsWith("F") ? "F" : "";

    // Presión arterial (120/80 → sistólica = 120)
    const presionMatch = texto.match(/(TA|PA|Presi[oó]n arterial)[:\s]+(\d{2,3})\/(\d{2,3})/i);

    return {
        nombre: txt(/(Nombre|Paciente|Nombre del paciente)[:\s]+([A-Za-zÁÉÍÓÚÑ\s]+)/i),
        edad: num(/Edad[:\s]+(\d{1,3})/i),
        sexo,
        imc: num(/(IMC|Índice de masa corporal)[:\s]+([\d.]+)/i),
        glucosa: num(/Glucosa(?: en ayuno)?[:\s]+(\d{2,3})/i),
        presion_sistolica: presionMatch ? Number(presionMatch[2]) : "",
        antecedentes_familiares_diabetes: /antecedentes.*diabetes/i.test(texto),
        hipertension: /hipertensi[oó]n/i.test(texto),
        actividad_fisica: txt(/Actividad f[ií]sica[:\s]+(Sedentario|Moderado|Activo)/i),
        alcohol: txt(/Alcohol[:\s]+(No|Ocasional|Frecuente)/i)
    };
}

/* -------------------------------------------------
   PROCESAR PDF
------------------------------------------------- */
async function procesarPDF(e) {
    const file = e.target.files[0];
    if (!file) return;

    pdfStatus.innerText = "Leyendo PDF...";
    try {
        const texto = await leerPDF(file);
        const datos = extraerDatos(texto);
        actualizarInputs(datos);
        pdfStatus.innerText = "Datos extraídos del PDF. Por favor revisa y guarda.";
    } catch (error) {
        console.error("Error al procesar PDF:", error);
        pdfStatus.innerText = "Error al procesar el PDF.";
    }
}

/* -------------------------------------------------
   ACTUALIZAR INPUTS
------------------------------------------------- */
function actualizarInputs(d) {
   if (d.nombre) document.getElementById("name").value = d.nombre;
    if (d.edad) document.getElementById("age").value = d.edad;
    if (d.sexo) document.getElementById("sex").value = d.sexo;
    if (d.imc) document.getElementById("bmi").value = d.imc;
    if (d.glucosa) document.getElementById("glucose").value = d.glucosa;
    if (d.presion_sistolica) document.getElementById("bp").value = d.presion_sistolica;

    document.getElementById("family").checked = !!d.antecedentes_familiares_diabetes;
    document.getElementById("hypertension").checked = !!d.hipertension;

    if (d.actividad_fisica) document.getElementById("activity").value = d.actividad_fisica.toLowerCase();
    if (d.alcohol) document.getElementById("alcohol").value = d.alcohol.toLowerCase();
}

/* -------------------------------------------------
   EVENTOS
------------------------------------------------- */
document.getElementById("pdfFile")
    ?.addEventListener("change", procesarPDF);