import { auth, db } from "./configurationFirebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { calcularRiesgo, obtenerExplicaciones, obtenerRecomendaciones } from "./prediccion.js";

/* -----------------------------
   PARAMETROS URL
----------------------------- */
const params = new URLSearchParams(window.location.search);
const perfilId = params.get("id");

if (!perfilId) {
    alert("Perfil no valido");
    window.location.href = "panel_principal.html";
}

/* -----------------------------
   DOM
----------------------------- */
const nombreEl = document.getElementById("nombrePerfil");
const edadEl = document.getElementById("edadPerfil");
const sexoEl = document.getElementById("sexoPerfil");
const pesoEl = document.getElementById("pesoPerfil");
const alturaEl = document.getElementById("alturaPerfil");
const telefonoEl = document.getElementById("telefonoPerfil");
const correoEl = document.getElementById("correoPerfil");
const antecedentesDiabetesEl = document.getElementById("antecedentesDiabetesPerfil");
const actividadFisicaEl = document.getElementById("actividadFisicaPerfil");
const observacionesEl = document.getElementById("observacionesPerfil");
const historialEl = document.getElementById("estadoHistorial");
const riesgoEl = document.getElementById("riesgoPrediccion");
const explicacionesEl = document.getElementById("explicacionesPrediccion");
const recomendacionesEl = document.getElementById("recomendacionesPrediccion");

const btnHistorial = document.getElementById("btnHistorial");

let riesgoChartInstance = null;
let factoresChartInstance = null;

function crearGraficaRiesgo(riesgo) {
    const ctx = document.getElementById("riesgoChart");

    if (riesgoChartInstance) {
        riesgoChartInstance.destroy();
    }

    riesgoChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Riesgo", "Restante"],
            datasets: [{
                data: [riesgo, 100 - riesgo],
                backgroundColor: [
                    riesgo < 30 ? "#4CAF50" : riesgo < 60 ? "#FFC107" : "#F44336",
                    "#E0E0E0"
                ],
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.raw}%`
                    }
                }
            },
            cutout: "70%"
        }
    });
}

function crearGraficaFactores(historial) {
    const ctx = document.getElementById("factoresChart");

    if (factoresChartInstance) {
        factoresChartInstance.destroy();
    }

    const factores = {
        Edad: historial.edad >= 45 ? 15 : 0,
        IMC: historial.imc >= 30 ? 20 : historial.imc >= 25 ? 10 : 0,
        Glucosa: historial.glucosa >= 126 ? 30 : historial.glucosa >= 100 ? 15 : 0,
        Presión: historial.presion_sistolica >= 140 ? 10 : 0,
        Antecedentes: historial.antecedentes_familiares_diabetes ? 20 : 0
    };

    factoresChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(factores),
            datasets: [{
                label: "Impacto en el riesgo (%)",
                data: Object.values(factores),
                backgroundColor: "#1976D2"
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 30
                }
            }
        }
    });
}


function textoSeguro(valor, sufijo = "") {
    if (valor === null || valor === undefined || valor === "") {
        return "-";
    }
    return `${valor}${sufijo}`;
}

/* -----------------------------
   AUTENTICACION + CARGA
----------------------------- */
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../../index.html";
        return;
    }

    try {
        /* -----------------------------
           PERFIL
        ----------------------------- */
        const perfilRef = doc(
            db,
            "users", user.uid,
            "perfiles", perfilId
        );

        const perfilSnap = await getDoc(perfilRef);

        if (!perfilSnap.exists()) {
            alert("Perfil no encontrado");
            return;
        }

        const perfil = perfilSnap.data();

        nombreEl.innerText = textoSeguro(perfil.nombre);
        edadEl.innerText = textoSeguro(perfil.edad);
        sexoEl.innerText = textoSeguro(perfil.sexo);
        pesoEl.innerText = textoSeguro(perfil.peso, " kg");
        alturaEl.innerText = textoSeguro(perfil.altura, " cm");
        telefonoEl.innerText = textoSeguro(perfil.telefono);
        correoEl.innerText = textoSeguro(perfil.correo);
        antecedentesDiabetesEl.innerText = textoSeguro(perfil.antecedentesDiabetes);
        actividadFisicaEl.innerText = textoSeguro(perfil.actividadFisica);
        observacionesEl.innerText = textoSeguro(perfil.observaciones);

        /* -----------------------------
           HISTORIAL CLINICO
        ----------------------------- */
        const historialRef = doc(
            db,
            "users", user.uid,
            "perfiles", perfilId,
            "historial_clinico", "actual"
        );

        const historialSnap = await getDoc(historialRef);

        if (!historialSnap.exists()) {
            historialEl.innerText = "No registrado";
            riesgoEl.innerText = "-";
            return;
        }

        historialEl.innerText = "Registrado";

        const historial = historialSnap.data();

        /* -----------------------------
           PREDICCION
        ----------------------------- */
        const riesgo = await calcularRiesgo(historial);
        riesgoEl.innerText = riesgo + "%";
        const explicaciones = await obtenerExplicaciones(historial);
        explicacionesEl.innerHTML = "";
        explicaciones.forEach(explicacion => {
            const li = document.createElement("li");
            li.innerText = "- " + explicacion;
            explicacionesEl.appendChild(li);
        });
        const recomendaciones = await obtenerRecomendaciones(historial);
        recomendacionesEl.innerHTML = "";
        recomendaciones.forEach(recomendacion => {
            const li = document.createElement("li");
            li.innerText = "- " + recomendacion;
            recomendacionesEl.appendChild(li);
        });
        
        //crearGraficaRiesgo(riesgo);
        //crearGraficaFactores(historial);

    } catch (error) {
        console.error("Error cargando perfil:", error);
        alert("Error al cargar el perfil");
    }
});

/* -----------------------------
   NAVEGACION
----------------------------- */
btnHistorial.onclick = () => {
    window.location.href =
        `historial_clinico.html?tipo=perfil&id=${perfilId}`;
};
