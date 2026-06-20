import { auth, db } from "./configurationFirebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    attachValidation,
    validateOptionalNumber,
    validateOptionalText,
    setFormFeedback,
    validateInteger,
    validateRequiredNumber,
    validateRequiredSelect,
    validateRequiredText
} from "./formValidation.js";

const params = new URLSearchParams(window.location.search);
const tipo = params.get("tipo");
const personaId = params.get("id");
const clinicaId = params.get("clinica");

const nombreInput = document.getElementById("name");

const glucoseInput = document.getElementById("glucose");
const hba1cInput = document.getElementById("hba1c");

const hipertensionInput = document.getElementById("hipertension");
const dificultadCaminarInput = document.getElementById("dificultad_caminar");

const ageInput = document.getElementById("age");
const sexInput = document.getElementById("sex");

const bmiInput = document.getElementById("bmi");
const pesoInput = document.getElementById("peso");
const estaturaInput = document.getElementById("estatura");

const insulinInput = document.getElementById("insulin");

const trigliceridosInput = document.getElementById("trigliceridos");
const hdlInput = document.getElementById("hdl");
const ldlInput = document.getElementById("ldl");

const uricAcidInput = document.getElementById("uric_acid");

const saludMentalInput = document.getElementById("malas_salud_mental");

const educacionInput = document.getElementById("educacion");
const ingresosInput = document.getElementById("ingresos");

const actividadFisicaInput = document.getElementById("actividad_fisica");
const fumaInput = document.getElementById("fuma");
const frutasInput = document.getElementById("frutas");
const verdurasInput = document.getElementById("verduras");
const alcoholInput = document.getElementById("alcohol");
const seguroMedicoInput = document.getElementById("seguro_medico");
const noConsultaInput = document.getElementById("no_consulta");

const saveStatus = document.getElementById("saveStatus");
const pdfStatus = document.getElementById("pdfStatus");
const registroForm = document.getElementById("registroForm");
const btnVolver = document.getElementById("btnVolver");
const validator = attachValidation(registroForm, {
    nombrePerfil: {
        validate: (value) => validateRequiredText(value, "Nombre Completo", { min: 3, max: 80 })
    },
    glucose: {
        validate: (value) => validateOptionalNumber(value, "Glucosa", { min: 30, max: 600 })
    },
    hba1c: {
        validate: (value) => validateOptionalNumber(value, "HbA1c", { min: 2, max: 20 })
    },
    age: {
        validate: (value) => validateOptionalNumber(value, "Edad", { min: 0, max: 120 })
    },
    peso: {
        validate: (value) => validateOptionalNumber(value, "Peso", { min: 1, max: 300 })
    },
    estatura: {
        validate: (value) => validateOptionalNumber(value, "Estatura", { min: 50, max: 250 })
    },
    insulin: {
        validate: (value) => validateOptionalNumber(value, "Insulina", { min: 1, max: 500 })
    },
    trigliceridos: {
        validate: (value) => validateOptionalNumber(value, "Triglicéridos", { min: 20, max: 600 })
    },
    hdl: {
        validate: (value) => validateOptionalNumber(value, "Colesterol HDL", { min: 20, max: 120 })
    },
    ldl: {
        validate: (value) => validateOptionalNumber(value, "Colesterol LDL", { min: 30, max: 300 })
    },
    uric_acid: {
        validate: (value) => validateOptionalNumber(value, "Ácido úrico", { min: 2, max: 12 })
    },
    malas_salud_mental: {
        validate: (value) => validateOptionalNumber(value, "Días de mala salud mental", { min: 0, max: 30 })
    },
    observacionesPerfil: {
        validate: (value) => validateOptionalText(value, "Observaciones", {
            min: 3,
            max: 300,
            pattern: /^[A-Za-z\u00C0-\u017F0-9.,;:/#()\- ]+$/,
            patternMessage: "Observaciones contiene caracteres no permitidos."
        })
    }
});

function optionalNumber(value) {
    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const num = Number(value);
    return isNaN(num) ? null : num;
}



let personaCache = null;

if (!tipo || !personaId || (tipo === "paciente" && !clinicaId)) {
    alert("Contexto inválido");
    window.location.href = "persona_dashboard.html";
}

function getRegistroRef(user) {
    if (tipo === "paciente") {
        return doc(
            db,
            "users", user.uid,
            "clinicas", clinicaId,
            "pacientes", personaId,
            "registro_clinico", "actual"
        );
    }

    return doc(
        db,
        "users", user.uid,
        "perfiles", personaId,
        "registro_clinico", "actual"
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

    return doc(db, "users", user.uid, "perfiles", personaId, "registro_clinico", "actual");
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


function calcularIMC(peso, estatura) {

    if (!isDigit(peso) || !isDigit(estatura)) {
        return null;
    }

    return (peso / ((estatura / 100) ** 2)).toFixed(2);
}

function isDigit(value) {
    return !isNaN(value) && !isNaN(parseFloat(value));
}

function actualizarInputs(datos) {

    if (datos.nombre) {
        nombreInput.value = datos.nombre;
    }

    if (datos.edad) {
        ageInput.value = datos.edad;
    }

    if (datos.estatura) {
        estaturaInput.value = datos.estatura;
    }

    if (datos.peso) {
        pesoInput.value = datos.peso;
    }

    if (datos.acido_urico) {
        uricAcidInput.value = datos.acido_urico;
    }

    if (datos.col_hdl) {
        hdlInput.value = datos.col_hdl;
    }

    if (datos.col_ldl) {
        ldlInput.value = datos.col_ldl;
    }

    if (datos.glucosa) {
        glucoseInput.value = datos.glucosa;
    }

    if (datos.hba1c) {
        hba1cInput.value = datos.hba1c;
    }

    if (datos.imc) {
        bmiInput.value = datos.imc;
    }

    if (datos.insulina) {
        insulinInput.value = datos.insulina;
    }

    if (datos.trigliceridos) {
        trigliceridosInput.value = datos.trigliceridos;
    }

    if (datos.seguro_medico !== undefined) {
        seguroMedicoInput.value = datos.seguro_medico === 1 ? "true" : datos.seguro_medico === 0 ? "false" : "";
    }

    if (datos.dificultad_caminar !== undefined) {
        dificultadCaminarInput.value = datos.dificultad_caminar === 1 ? "true" : datos.dificultad_caminar === 0 ? "false" : "";
    }

    if (datos.educacion !== undefined) {
        educacionInput.value = datos.educacion === 1 ? "1" :
            datos.educacion === 2 ? "2" :
                datos.educacion === 3 ? "3" :
                    datos.educacion === 4 ? "4" :
                        datos.educacion === 5 ? "5" :
                            datos.educacion === 6 ? "6" : "";
    }

    if (datos.frutas !== undefined) {
        frutasInput.value = datos.frutas === 1 ? "true" : datos.frutas === 0 ? "false" : "";
    }

    if (datos.hipertension !== undefined) {
        hipertensionInput.value = datos.hipertension === 1 ? "true" : datos.hipertension === 0 ? "false" : "";
    }

    if (datos.alcohol !== undefined) {
        alcoholInput.value = datos.alcohol === 1 ? "true" : datos.alcohol === 0 ? "false" : "";
    }

    if (datos.ingresos !== undefined) {
        ingresosInput.value = datos.ingresos === 1 ? "1" :
            datos.ingresos === 2 ? "2" :
                datos.ingresos === 3 ? "3" :
                    datos.ingresos === 4 ? "4" :
                        datos.ingresos === 5 ? "5" : "";
                            datos.ingresos === 6 ? "6" : "";
                                datos.ingresos === 7 ? "7" : "";
                                    datos.ingresos === 8 ? "8" : "";
    }

    if (datos.salud_mental !== undefined) {
        saludMentalInput.value = datos.salud_mental;
    }

    if (datos.actividad_fisica !== undefined) {
        actividadFisicaInput.value = datos.actividad_fisica === 1 ? "true" : datos.actividad_fisica === 0 ? "false" : "";
    }

    if (datos.fuma !== undefined) {
        fumaInput.value = datos.fuma === 1 ? "true" : datos.fuma === 0 ? "false" : "";
    }

    if (datos.verduras !== undefined) {
        verdurasInput.value = datos.verduras === 1 ? "true" : datos.verduras === 0 ? "false" : "";
    }

    if (datos.sexo) {
        sexInput.value = datos.sexo;
    }

    if (datos.no_consulta !== undefined) {
        noConsultaInput.value = datos.no_consulta === 1 ? "true" : datos.no_consulta === 0 ? "false" : "";
    }

    
}

async function actualizarPersona(user, data) {
  await setDoc(
    getPersonaRef(user),
    {
      nombre: data.nombre ?? null,
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
        edad: persona.clinico.edad,
        estatura: persona.clinico.Estatura,
        peso: persona.clinico.Peso,
        acido_urico: persona.clinico.ac_urico,
        col_hdl: persona.clinico.col_hdl,
        col_ldl: persona.clinico.col_ldl,
        glucosa: persona.clinico.glu_suero,
        hba1c: persona.clinico.hb1ac,
        imc: persona.clinico.imc,
        insulina: persona.clinico.insulina,
        trigliceridos: persona.clinico.trig,
        seguro_medico: persona.conductual.AnyHealthcare,
        dificultad_caminar: persona.conductual.DiffWalk,
        educacion: persona.conductual.Education,
        frutas: persona.conductual.Fruits,
        hipertension: persona.conductual.HighBP,
        alcohol: persona.conductual.HvyAlcoholConsump,
        ingresos: persona.conductual.Income,
        salud_mental: persona.conductual.MentHlth,
        no_consulta: persona.conductual.NoDocbcCost,
        actividad_fisica: persona.conductual.PhysActivity,
        sexo: persona.conductual.Sex === 1 ? "Masculino" : persona.conductual.Sex === 0 ? "Femenino" : "",
        fuma: persona.conductual.Smoker,
        verduras: persona.conductual.Veggies
    };

    actualizarInputs(datosBase);
    return persona;
}

function extraerTexto(texto, regex, grupo = 1) {
    const match = texto.match(regex);
    return match ? match[grupo].trim() : null;
}

function extraerNumero(texto, regex, grupo = 1) {
    const match = texto.match(regex);
    if (!match) return null;
    const valor = match[grupo].replace(",", ".");
    return Number.parseFloat(valor);
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
    const sexoRaw = extraerTexto(texto, /Sexo[:\s]*(Masculino|Femenino|M|F|Otro)/i);
    const presionMatch = texto.match(/(TA|PA|Presi[o\u00F3]n arterial|Tensi[o\u00F3]n arterial)[:\s]*(\d{2,3})[\/\-](\d{2,3})/i);

    return {
        nombre: extraerTexto(
            texto,
            /(Nombre del paciente|Nombre|Paciente)[:\s]*([A-Za-z\u00C0-\u017F\s]+)/i,
            2
        ),
        edad: extraerNumero(texto, /Edad[:\s]*(\d{1,3})/i),
        sexo: normalizarSexo(sexoRaw),
        imc: extraerNumero(texto, /(IMC|Índice de masa corporal|\u00CDndice de masa corporal)[:\s]*([\d.,]+)/i, 2),
        glucosa: extraerNumero(texto, /Glucosa(?: en ayuno)?[:\s]*(\d{2,3})/i),
        presion_sistolica: presionMatch ? Number(presionMatch[2]) : "",
        antecedentes_familiares_diabetes: /(antecedentes.*diabetes|familia.*diabetes)/i.test(texto),
        hipertension: /hipertensi[o\u00F3]n/i.test(texto),
        actividad_fisica: extraerTexto(texto, /Actividad f[i\u00ED]sica[:\s]*(Sedentario|Moderado|Activo|Alta|Baja)/i),
        alcohol: extraerTexto(texto, /Alcohol[:\s]*(No|Ocasional|Frecuente|Nunca|S\u00ED)/i)
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
        pdfStatus.innerText = "Datos extraídos del PDF. Revisa la información antes de guardar.";
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

    const registroSnap = await getDoc(getRegistroRef(user));
    if (registroSnap.exists()) {
        actualizarInputs(registroSnap.data());
    }
});

function sanitize(obj) {
  Object.keys(obj).forEach(key => {
    if (obj[key] === undefined) {
      obj[key] = null;
    }
  });
  return obj;
}

registroForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const user = auth.currentUser;

    let imcFinal = optionalNumber(
        bmiInput.value
    );

    if (!imcFinal || imcFinal <= 0) {

        imcFinal = calcularIMC(
            pesoInput.value,
            estaturaInput.value
        );
        console.log("IMC Final: ", imcFinal);
        console.log("Peso: ", pesoInput.value, "Estatura: ", estaturaInput.value, "IMC Calculado: ", calcularIMC(pesoInput.value, estaturaInput.value));
    }

    const data = {

        nombre: nombreInput.value || null,

        clinico: {
            // =========================
            // MODELO CLÍNICO
            // =========================

            edad: optionalNumber(ageInput.value),

            Peso: optionalNumber(pesoInput.value),

            Estatura: optionalNumber(estaturaInput.value),

            imc: imcFinal,

            glu_suero: optionalNumber(glucoseInput.value),

            hb1ac: optionalNumber(hba1cInput.value),

            insulina: optionalNumber(insulinInput.value),

            trig: optionalNumber(
                trigliceridosInput.value
            ),

            col_hdl: optionalNumber(hdlInput.value),

            col_ldl: optionalNumber(ldlInput.value),

            ac_urico: optionalNumber(
                uricAcidInput.value
            ),

            sexo_Hombre: sexInput.value === "Masculino" ? 1 : sexInput.value === "Femenino" ? 0 : null,

            sexo_Mujer: sexInput.value === "Femenino" ? 1 : sexInput.value === "Masculino" ? 0 : null
        },

        conductual: {
            // =========================
            // MODELO CONDUCTUAL
            // =========================

            PhysActivity:
                actividadFisicaInput.value === "true" ? 1 : actividadFisicaInput.value === "false" ? 0 : null,

            Smoker:
                fumaInput.value === "true" ? 1 : fumaInput.value === "false" ? 0 : null,

            HighBP:
                hipertensionInput.value === "true" ? 1 : hipertensionInput.value === "false" ? 0 : null,

            Fruits:
                frutasInput.value === "true" ? 1 : frutasInput.value === "false" ? 0 : null,

            BMI:
                imcFinal,

            Sex:
                sexInput.value === "Masculino" ? 1 :
                sexInput.value === "Femenino" ? 0 : null,


            Age:
                optionalNumber(ageInput.value),

            Veggies:
                verdurasInput.value === "true" ? 1 : verdurasInput.value === "false" ? 0 : null,

            HvyAlcoholConsump:
                alcoholInput.value === "true" ? 1 : alcoholInput.value === "false" ? 0 : null,

            DiffWalk:
                dificultadCaminarInput.value === "true" ? 1 : dificultadCaminarInput.value === "false" ? 0 : null,

            MentHlth: optionalNumber(
                saludMentalInput.value
            ),

            AnyHealthcare:
                seguroMedicoInput.value === "true" ? 1 : seguroMedicoInput.value === "false" ? 0 : null,

            NoDocbcCost:
                noConsultaInput.value === "true" ? 1 : noConsultaInput.value === "false" ? 0 : null,


            Education:
                educacionInput.value === "1" ? 1 :
                educacionInput.value === "2" ? 2 : 
                educacionInput.value === "3" ? 3 :
                educacionInput.value === "4" ? 4 :
                educacionInput.value === "5" ? 5 :
                educacionInput.value === "6" ? 6 : null,

            Income:
                ingresosInput.value === "1" ? 1 :
                ingresosInput.value === "2" ? 2 :
                ingresosInput.value === "3" ? 3 :
                ingresosInput.value === "4" ? 4 :
                ingresosInput.value === "5" ? 5 :
                ingresosInput.value === "6" ? 6 :
                ingresosInput.value === "7" ? 7 :
                ingresosInput.value === "8" ? 8 : null
        },

        updatedAt: new Date()
    };

    console.log("Datos a guardar:", data);

    try {

        await setDoc(
            getRegistroRef(user),
            data
        );

        await actualizarPersona(
            user,
            data
        );

        saveStatus.innerText =
            "Registro clínico guardado correctamente.";

        setTimeout(() => {
            saveStatus.innerText = "";
            btnVolver.click();
        }, 500);

    } catch (error) {

        console.error(error);

        saveStatus.innerText =
            "Error al guardar el registro.";
    }
});



btnVolver.onclick = () => {
    if (tipo === "paciente") {
        window.location.href = `paciente.html?id=${personaId}&clinica=${clinicaId}`;
        return;
    }

    window.location.href = `perfil_persona.html?id=${personaId}`;
};

document.getElementById("pdfFile")?.addEventListener("change", procesarPDF);
