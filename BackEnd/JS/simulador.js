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
   IMPACTOS (DINAMICO)
----------------------------- */
const impacto = {};

/* -----------------------------
   REFERENCIAS
----------------------------- */
function getHistorialRef(user) {
    if (tipo === "paciente") {
        return doc(db, "users", user.uid, "clinicas", clinica, "pacientes", id, "historial_clinico", "actual");
    }
    return doc(db, "users", user.uid, "perfiles", id, "historial_clinico", "actual");
}

function getPersonaRef(user) {
    if (tipo === "paciente") {
        return doc(db, "users", user.uid, "clinicas", clinica, "pacientes", id);
    }
    return doc(db, "users", user.uid, "perfiles", id);
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
        label.style.alignItems = "center";
        label.style.gap = "8px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = r.recommendation;
        checkbox.style.flex = "0 0 10%";

        const text = document.createElement("span");
        text.textContent = r.recommendation.charAt(0).toUpperCase() + r.recommendation.slice(1);
        text.style.flex = "1 1 90%";

        label.appendChild(checkbox);
        label.appendChild(text);
        recomendacionesEl.appendChild(label);

        /* 🔥 IMPACTO INTELIGENTE */
        impacto[r.recommendation] = generarImpacto(r);
    });
});

/* -----------------------------
   GENERADOR DE IMPACTO INTELIGENTE
----------------------------- */
function generarImpacto(r) {
    const base = r.impact || 10;

    return {
        imc: -0.02 * base,
        glucosa: -0.3 * base,
        presion_sistolica: -0.15 * base,
        peso: 0.5 + (base / 40) // importancia
    };
}

/* -----------------------------
   SIMULACION PRO
----------------------------- */
async function simular() {

    if (!historialBase) return;

    const semanas = Number(tiempoSelect.value);

    const acciones = Array.from(
        document.querySelectorAll("#recomendacionesEl input:checked")
    ).map(el => el.value);

    let data = { ...historialBase };
    let resultados = [];

    for (let i = 0; i < semanas; i++) {

        /* 🔹 APLICAR EFECTOS */
        acciones.forEach(a => {

            const efecto = impacto[a];
            if (!efecto) return;

            const adherencia = Math.exp(-i / 10); // fatiga
            const factorTiempo = 1 - Math.exp(-i / 4);

            Object.keys(efecto).forEach(key => {

                if (key === "peso") return;

                if (data[key] !== undefined) {

                    data[key] += efecto[key] * factorTiempo * adherencia * (efecto.peso || 1);

                    /* 🔒 LIMITES REALISTAS */
                    if (key === "imc") data[key] = Math.max(18.5, data[key]);
                    if (key === "glucosa") data[key] = Math.max(70, data[key]);
                    if (key === "presion_sistolica") data[key] = Math.max(90, data[key]);
                }
            });
        });

        /* 🔥 SINERGIA */
        if (acciones.length >= 2) {
            if (data.imc) data.imc -= 0.05;
            if (data.glucosa) data.glucosa -= 1;
        }

        /* 🔹 RECALCULAR RIESGO REAL */
        let riesgo = await calcularRiesgo(data);

        /* 🔒 LIMITE MINIMO */
        riesgo = Math.max(riesgo, 5);

        resultados.push(riesgo);
    }

    mostrarGrafica(resultados);

    const cambio = resultados[resultados.length - 1] - resultados[0];

    interpretacionEl.innerText =
        cambio <= 0
            ? `El riesgo podría disminuir aproximadamente ${Math.abs(cambio).toFixed(1)}% en ${semanas} semanas.`
            : `El riesgo podría aumentar aproximadamente ${cambio.toFixed(1)}%.`;

    riesgoFinalEl.innerText =
        "Riesgo final previsto: " +
        resultados[resultados.length - 1].toFixed(1) + "%.";
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

document.getElementById("btnVaciarGrafica").onclick = () => {
    if (chart) {
        chart.destroy();
        chart = null;
    }
    interpretacionEl.innerText = "";
    riesgoFinalEl.innerText = "";
    Array.from(document.querySelectorAll("#recomendacionesEl input")).forEach(input => {
        input.checked = false;
    });
}