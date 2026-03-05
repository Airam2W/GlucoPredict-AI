import { auth, db } from "./configurationFirebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { calcularRiesgo, obtenerExplicaciones, obtenerRecomendaciones } from "./prediccion.js";

/* -----------------------------
   PARAMETROS URL
----------------------------- */
const params = new URLSearchParams(window.location.search);
const pacienteId = params.get("id");
const clinicaId = params.get("clinica");

if (!pacienteId || !clinicaId) {
    alert("Paciente o clinica no validos");
    window.location.href = "panel_principal.html";
}

/* -----------------------------
   DOM
----------------------------- */
const nombreEl = document.getElementById("nombrePaciente");
const edadEl = document.getElementById("edadPaciente");
const sexoEl = document.getElementById("sexoPaciente");
const pesoEl = document.getElementById("pesoPaciente");
const alturaEl = document.getElementById("alturaPaciente");
const telefonoEl = document.getElementById("telefonoPaciente");
const correoEl = document.getElementById("correoPaciente");
const contactoEmergenciaEl = document.getElementById("contactoEmergenciaPaciente");
const tipoSangreEl = document.getElementById("tipoSangrePaciente");
const observacionesEl = document.getElementById("observacionesPaciente");
const estadoHistorialEl = document.getElementById("estadoHistorial");
const riesgoEl = document.getElementById("riesgoPrediccion");
const explicacionesEl = document.getElementById("explicacionesPrediccion");
const recomendacionesEl = document.getElementById("recomendacionesPrediccion");
const btnHistorial = document.getElementById("btnHistorial");
const btnVolver = document.getElementById("btnVolver");

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
           DATOS DEL PACIENTE
        ----------------------------- */
        const pacienteRef = doc(
            db,
            "users", user.uid,
            "clinicas", clinicaId,
            "pacientes", pacienteId
        );

        const pacienteSnap = await getDoc(pacienteRef);

        if (!pacienteSnap.exists()) {
            alert("Paciente no encontrado");
            window.location.href = `clinica.html?id=${clinicaId}`;
            return;
        }

        const paciente = pacienteSnap.data();

        nombreEl.innerText = textoSeguro(paciente.nombre);
        edadEl.innerText = textoSeguro(paciente.edad);
        sexoEl.innerText = textoSeguro(paciente.sexo);
        pesoEl.innerText = textoSeguro(paciente.peso, " kg");
        alturaEl.innerText = textoSeguro(paciente.altura, " cm");
        telefonoEl.innerText = textoSeguro(paciente.telefono);
        correoEl.innerText = textoSeguro(paciente.correo);
        contactoEmergenciaEl.innerText = textoSeguro(paciente.contactoEmergencia);
        tipoSangreEl.innerText = textoSeguro(paciente.tipoSangre);
        observacionesEl.innerText = textoSeguro(paciente.observaciones);

        /* -----------------------------
           HISTORIAL CLINICO
        ----------------------------- */
        const historialRef = doc(
            db,
            "users", user.uid,
            "clinicas", clinicaId,
            "pacientes", pacienteId,
            "historial_clinico", "actual"
        );

        const historialSnap = await getDoc(historialRef);

        if (!historialSnap.exists()) {
            estadoHistorialEl.innerText = "No registrado";
            riesgoEl.innerText = "-";
            return;
        }

        estadoHistorialEl.innerText = "Registrado";

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
        console.error("Error cargando paciente:", error);
        alert("Error al cargar el perfil del paciente");
    }
});

/* -----------------------------
   NAVEGACION
----------------------------- */
btnHistorial.onclick = () => {
    window.location.href =
        `historial_clinico.html?tipo=paciente&clinica=${clinicaId}&id=${pacienteId}`;
};

btnVolver.onclick = () => {
    window.location.href = `clinica.html?id=${clinicaId}`;
};
