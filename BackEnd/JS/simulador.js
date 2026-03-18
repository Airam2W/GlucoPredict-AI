import { auth, db } from "./configurationFirebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { calcularRiesgo, obtenerRecomendacionesImpacto } from "./prediccion.js";

/* -----------------------------
   PARAMETROS
----------------------------- */
const params = new URLSearchParams(window.location.search);
const tipo = params.get("tipo");
const id = params.get("id");
const clinica = params.get("clinica");

/* -----------------------------
   DOM
----------------------------- */
const nombreEl = document.getElementById("nombre");
const riesgoActualEl = document.getElementById("riesgoActual");
const btnSimular = document.getElementById("btnSimular");
const tiempoSelect = document.getElementById("tiempo");
const interpretacionEl = document.getElementById("interpretacion");
const riesgoFinalEl = document.getElementById("riesgoFinal");
const recomendacionesEl = document.getElementById("recomendacionesEl");

let historialBase = null;
let chart = null;

/* -----------------------------
   REFERENCIAS
----------------------------- */
function getHistorialRef(user) {
    if (tipo === "paciente") {
        return doc(
            db,
            "users", user.uid,
            "clinicas", clinica,
            "pacientes", id,
            "historial_clinico", "actual"
        );
    }

    return doc(
        db,
        "users", user.uid,
        "perfiles", id,
        "historial_clinico", "actual"
    );
}

function getPersonaRef(user) {
    if (tipo === "paciente") {
        return doc(
            db,
            "users", user.uid,
            "clinicas", clinica,
            "pacientes", id
        );
    }

    return doc(
        db,
        "users", user.uid,
        "perfiles", id
    );
}

/* -----------------------------
   CARGA DATOS
----------------------------- */
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../../index.html";
        return;
    }

    const personaSnap = await getDoc(getPersonaRef(user));
    if (personaSnap.exists()) {
        nombreEl.innerText = personaSnap.data().nombre;
    }

    const histSnap = await getDoc(getHistorialRef(user));
    if (histSnap.exists()) {
        historialBase = histSnap.data();

        const riesgo = await calcularRiesgo(historialBase);
        riesgoActualEl.innerText = riesgo;
    }

    const recomendaciones = await obtenerRecomendacionesImpacto(historialBase);
        recomendaciones.forEach(r => {
        const label = document.createElement("label");
        label.style.display = "flex";
        label.style.alignItems = "center"; // centra verticalmente
        label.style.gap = "8px";           // espacio entre checkbox y texto

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = r.recommendation;

        // asigna 10% del espacio al checkbox
        checkbox.style.flex = "0 0 10%";

        const text = document.createElement("span");
        text.textContent = r.recommendation.charAt(0).toUpperCase() + r.recommendation.slice(1);

        // asigna 90% del espacio al texto
        text.style.flex = "1 1 90%";

        label.appendChild(checkbox);
        label.appendChild(text);
        recomendacionesEl.appendChild(label);

        impacto[r.recommendation] = { riesgo: r.impact };
    });
});

/* -----------------------------
   IMPACTOS
----------------------------- */
const impacto = {

};

/* -----------------------------
   SIMULACION
----------------------------- */
async function simular() {
    const semanas = Number(tiempoSelect.value);

    const acciones = Array.from(
        document.querySelectorAll("#recomendacionesEl input:checked")
    ).map(el => el.value);

    let data = { ...historialBase };
    let resultados = [];

    for (let i = 0; i < semanas; i++) {
        let riesgo = await calcularRiesgo(data);

        acciones.forEach(a => {
            if (impacto[a] && impacto[a].riesgo) {
                riesgo -= impacto[a].riesgo * (1 - Math.exp(-i / semanas));
            }
        });

        riesgo = Math.max(0, riesgo); // nunca negativo
        resultados.push(riesgo);
    }

    mostrarGrafica(resultados);

    const cambio = resultados[resultados.length - 1] - resultados[0];
    interpretacionEl.innerText =
        cambio < 0
            ? `El riesgo podría disminuir aproximadamente ${Math.abs(cambio).toFixed(1)}% en ${semanas} semanas.`
            : `El riesgo podría aumentar aproximadamente ${cambio.toFixed(1)}%.`;

    riesgoFinalEl.innerText += "Riesgo final previsto: " + resultados[resultados.length - 1].toFixed(1) + "%.";
}

/* -----------------------------
   GRAFICA
----------------------------- */
function mostrarGrafica(data) {
    const ctx = document.getElementById("graficaRiesgo");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: data.map((_, i) => `Semana ${i + 1}`),
            datasets: [{
                label: "Riesgo (%)",
                data: data,
                borderColor: "#1976D2",
                fill: false,
                tension: 0.3
            }]
        }
    });
}

/* -----------------------------
   EVENTOS
----------------------------- */
btnSimular.onclick = simular;

document.getElementById("btnVolver").onclick = () => {
    if (tipo === "paciente") {
        window.location.href = `paciente.html?id=${id}&clinica=${clinica}`;
    } else {
        window.location.href = `perfil_persona.html?id=${id}`;
    }
};