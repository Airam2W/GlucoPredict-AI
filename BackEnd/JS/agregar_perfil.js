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
import { MAX_PERFILES } from "./restriccionesLicencia.js";
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

function calcularIMC(peso, estatura) {

    if (!isDigit(peso) || !isDigit(estatura)) {
        return null;
    }

    return (peso / ((estatura / 100) ** 2)).toFixed(2);
}

function isDigit(value) {
    return !isNaN(value) && !isNaN(parseFloat(value));
}

function optionalNumber(value) {
    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const num = Number(value);
    return isNaN(num) ? null : num;
}

const params = new URLSearchParams(window.location.search);
const perfilId = params.get("id");
const isEditMode = Boolean(perfilId);

const formPerfil = document.getElementById("formPerfil");
const titulo = document.getElementById("tituloPerfil");
const btnGuardar = document.getElementById("btnGuardarPerfil");
const validator = attachValidation(formPerfil, {
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

function actualizarTextosModo() {
    if (!isEditMode) {
        return;
    }

    titulo.textContent = "Editar perfil personal";
    btnGuardar.textContent = "Guardar cambios";
}

function cargarFormulario(perfil) {
    // Ocultar todos los labels excepto nombrePerfil y observacionesPerfil
    document.getElementById("nombrePerfil").value = perfil.nombre || "";
    document.getElementById("observacionesPerfil").value = perfil.observaciones || "";

    const labels = document.getElementsByTagName("label");
    for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const forAttr = label.getAttribute("for");

        // Si el label NO corresponde a nombrePerfil ni observacionesPerfil → ocultar
        if (forAttr !== "nombrePerfil" && forAttr !== "observacionesPerfil") {
            label.style.display = "none";
        }
    }

    // También ocultar los inputs/selects asociados
    const idsToHide = [
        "glucose", "hba1c", "hipertension", "dificultad_caminar",
        "age", "sex", "peso", "estatura", "insulin", "trigliceridos",
        "hdl", "ldl", "uric_acid", "actividad_fisica", "fuma",
        "frutas", "verduras", "alcohol", "malas_salud_mental",
        "seguro_medico", "no_consulta", "educacion", "ingresos"
    ];

    idsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = "none";
        }
    });

    // Ocultar el segundo y tercer h3
    const h3s = document.getElementsByTagName("h3");
    if (h3s.length > 0) {
        h3s[1].style.display = "none";
    }
    if (h3s.length > 1) {
        h3s[2].style.display = "none";
    }

}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        return;
    }

    actualizarTextosModo();

    if (!isEditMode) {
        const ref = collection(db, "users", user.uid, "perfiles");
        const snapshot = await getDocs(ref);

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            window.user = userSnap.data();

            if (window.user.tipo !== "PAGA") {
                if (snapshot.size >= MAX_PERFILES) {
                    alert(`Has alcanzado el límite de ${MAX_PERFILES} perfiles. No puedes agregar más.`);
                    window.location.href = "persona_dashboard.html";
                }
            }
        }
        return;
    }

    const perfilRef = doc(db, "users", user.uid, "perfiles", perfilId, "registro_clinico", "actual");
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

    // Inputs
    const nombre = document.getElementById("nombrePerfil").value.trim();
    const edad = optionalNumber(document.getElementById("age").value.trim());
    const sexo = document.getElementById("sex").value;
    const peso = optionalNumber(document.getElementById("peso").value.trim());
    const estatura = optionalNumber(document.getElementById("estatura").value.trim());
    let imcFinal = calcularIMC(peso, estatura);

    const data = {
        nombre: nombre || null,

        clinico: {
            edad,
            Peso: peso,
            Estatura: estatura,
            imc: imcFinal,
            glu_suero: optionalNumber(document.getElementById("glucose").value.trim()),
            hb1ac: optionalNumber(document.getElementById("hba1c").value.trim()),
            insulina: optionalNumber(document.getElementById("insulin").value.trim()),
            trig: optionalNumber(document.getElementById("trigliceridos").value.trim()),
            col_hdl: optionalNumber(document.getElementById("hdl").value.trim()),
            col_ldl: optionalNumber(document.getElementById("ldl").value.trim()),
            ac_urico: optionalNumber(document.getElementById("uric_acid").value.trim()),
            sexo_Hombre: sexo === "Masculino" ? 1 : sexo === "Femenino" ? 0 : null,
            sexo_Mujer: sexo === "Femenino" ? 1 : sexo === "Masculino" ? 0 : null
        },

        conductual: {
            PhysActivity: document.getElementById("actividad_fisica").value === "true" ? 1 : document.getElementById("actividad_fisica").value === "false" ? 0 : null,
            Smoker: document.getElementById("fuma").value === "true" ? 1 : document.getElementById("fuma").value === "false" ? 0 : null,
            HighBP: document.getElementById("hipertension").value === "true" ? 1 : document.getElementById("hipertension").value === "false" ? 0 : null,
            Fruits: document.getElementById("frutas").value === "true" ? 1 : document.getElementById("frutas").value === "false" ? 0 : null,
            BMI: imcFinal,
            Sex: sexo === "Masculino" ? 1 : sexo === "Femenino" ? 0 : null,
            Age: edad,
            Veggies: document.getElementById("verduras").value === "true" ? 1 : document.getElementById("verduras").value === "false" ? 0 : null,
            HvyAlcoholConsump: document.getElementById("alcohol").value === "true" ? 1 : document.getElementById("alcohol").value === "false" ? 0 : null,
            DiffWalk: document.getElementById("dificultad_caminar").value === "true" ? 1 : document.getElementById("dificultad_caminar").value === "false" ? 0 : null,
            MentHlth: optionalNumber(document.getElementById("malas_salud_mental").value.trim()),
            AnyHealthcare: document.getElementById("seguro_medico").value === "true" ? 1 : document.getElementById("seguro_medico").value === "false" ? 0 : null,
            NoDocbcCost: document.getElementById("no_consulta").value === "true" ? 1 : document.getElementById("no_consulta").value === "false" ? 0 : null,
            Education: document.getElementById("educacion").value === "1" ? 1 :
                document.getElementById("educacion").value === "2" ? 2 :
                    document.getElementById("educacion").value === "3" ? 3 :
                        document.getElementById("educacion").value === "4" ? 4 :
                            document.getElementById("educacion").value === "5" ? 5 :
                                document.getElementById("educacion").value === "6" ? 6 : null,
            Income: document.getElementById("ingresos").value === "1" ? 1 :
                document.getElementById("ingresos").value === "2" ? 2 :
                    document.getElementById("ingresos").value === "3" ? 3 :
                        document.getElementById("ingresos").value === "4" ? 4 :
                            document.getElementById("ingresos").value === "5" ? 5 :
                                document.getElementById("ingresos").value === "6" ? 6 :
                                    document.getElementById("ingresos").value === "7" ? 7 :
                                        document.getElementById("ingresos").value === "8" ? 8 : null

        },

        observaciones: document.getElementById("observacionesPerfil").value.trim() || null,
        updatedAt: new Date()
    };

    try {
        if (isEditMode) {
            await setDoc(doc(db, "users", user.uid, "perfiles", perfilId, "registro_clinico", "actual"), {nombre: nombre || null, observaciones: data.observaciones || null}, { merge: true });
            await setDoc(doc(db, "users", user.uid, "perfiles", perfilId), { nombre: nombre || null, observaciones: data.observaciones || null }, { merge: true });
            window.location.href = `perfil_persona.html?id=${perfilId}`;
        } else {
            const perfilRef = await addDoc(
                collection(db, "users", user.uid, "perfiles"),
                {
                    nombre,
                    edad,
                    sexo,
                    observaciones: data.observaciones,
                    createdAt: new Date(),
                }
            );

            const perfilId = perfilRef.id; // aquí ya tienes el ID generado

            await setDoc(
                doc(db, "users", user.uid, "perfiles", perfilId, "registro_clinico", "actual"),
                {
                    ...data,
                    updatedAt: new Date()
                }
            );
            window.location.href = `persona_dashboard.html`;
        }
    } catch (error) {
        console.error(error);
        alert("Error al guardar el perfil");
    }
});
