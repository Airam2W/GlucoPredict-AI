import { auth, db } from "./configurationFirebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { calcularRiesgo, obtenerRecomendacionesImpacto } from "./prediccion.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const interpretacionRiesgoEl = document.getElementById("interpretacionRiesgo");
const riesgoFinalEl = document.getElementById("riesgoFinal");

const interpretacionIMCEl = document.getElementById("interpretacionIMC");
const imcFinalEl = document.getElementById("imcFinal");

const interpretacionGlucosaEl = document.getElementById("interpretacionGlucosa");
const glucosaFinalEl = document.getElementById("glucosaFinal");

const recomendacionesEl = document.getElementById("recomendacionesEl");

const historialPrediccionesEl = document.getElementById("historialPredicciones");

const graficasEl = document.getElementById("graficasEl");

/* ----------------------------- */
let historialBase = null;

let chartRiesgo = null;
let chartIMC = null;
let chartGlucosa = null;

let prediccionSeleccionada = null;

/* -----------------------------
   IMPACTOS
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

function getPrediccionesRef(user) {
    if (tipo === "paciente") {
        return collection(
            db,
            "users", user.uid,
            "clinicas", clinica,
            "pacientes", id,
            "predicciones"
        );
    }

    return collection(
        db,
        "users", user.uid,
        "perfiles", id,
        "predicciones"
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

    // 🔥 guardar impacto
    recomendaciones.forEach(r => {
        impacto[r.recommendation] = generarImpacto(r);
    });

    // 🔥 render inicial
    renderRecomendaciones(
        recomendaciones.map(r => r.recommendation)
    );

    // 🔥 CARGAR HISTORIAL DE PREDICCIONES
    const predSnap = await getDocs(getPrediccionesRef(user));

    let predicciones = [];

    predSnap.forEach(doc => {
        predicciones.push({
            id: doc.id,
            ...doc.data()
        });
    });

    // Ordenar por fecha (más reciente primero)
    predicciones.sort((a, b) => b.fecha?.toDate() - a.fecha?.toDate());

    // Renderizar
    renderHistorialPredicciones(predicciones);
});

function resetearRecomendaciones() {
    // 🔥 limpiar impacto
    Object.keys(impacto).forEach(k => delete impacto[k]);
}

function renderRecomendaciones(lista) {

    recomendacionesEl.innerHTML = ""; // limpiar

    lista.forEach(r => {

        const label = document.createElement("label");
        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.gap = "8px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = r;

        // 🔥 estilos que ya tenías
        checkbox.style.flex = "0 0 10%";

        const text = document.createElement("span");
        text.textContent = r.charAt(0).toUpperCase() + r.slice(1);

        // 🔥 estilos que ya tenías
        text.style.flex = "1 1 90%";

        label.appendChild(checkbox);
        label.appendChild(text);

        recomendacionesEl.appendChild(label);
    });
}

/* -----------------------------
    HISTORIAL DE PREDICCIONES
----------------------------- */

function renderHistorialPredicciones(lista) {

    historialPrediccionesEl.innerHTML = "";

    lista.forEach(pred => {

        const item = document.createElement("div");
        item.style.padding = "6px";
        item.style.borderBottom = "1px solid #eee";
        item.style.cursor = "pointer";

        const fechaFormateada = pred.fecha?.toDate
            ? pred.fecha.toDate().toLocaleString()
            : "Fecha no disponible";

        let icono = "O";
        if (pred.riesgo < 30) {
            icono = "🟢";
        } else if (pred.riesgo < 60) {
            icono = "🟡";
        } else {
            icono = "🔴";
        }

        item.innerHTML = `
            <strong>${icono} ${fechaFormateada}</strong><br>
            <small>Riesgo: ${pred.riesgo}%</small>
        `;

        item.onclick = () => seleccionarPrediccion(pred, item);

        historialPrediccionesEl.appendChild(item);
    });
}

function normalizarTexto(texto) {
        return texto
            ?.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s]/gi, "")
            .trim();
    }

function seleccionarPrediccion(pred, element) {

    prediccionSeleccionada = pred;

    // Vaciar las graficas
    vaciarGrafica();

    //Vaciar recomendaciones anteriores
    resetearRecomendaciones();

    // 🔹 actualizar riesgo
    riesgoActualEl.innerText = pred.riesgo;

    // 🔹 UI selección
    Array.from(historialPrediccionesEl.children).forEach(el => {
        el.style.background = "";
    });
    element.style.background = "#e3f2fd";

    // 🔥 limpiar impacto anterior
    Object.keys(impacto).forEach(k => delete impacto[k]);

    // 🔥 render recomendaciones
    renderRecomendaciones(pred.recomendaciones || []);

    // 🔥 reconstruir impacto basado en esas recomendaciones
    (pred.recomendaciones || []).forEach(r => {

        // Usar la funcion de generarImpacto para cada recomendación, asumiendo que el formato de las recomendaciones en la predicción es el mismo que el de las recomendaciones originales
        const impactoGenerado = generarImpacto({ recommendation: r, impact: 10 }); // Puedes ajustar el valor de impacto según tus necesidades

        impacto[r] = impactoGenerado;
    });

    document.querySelectorAll("#recomendacionesEl input")
    .forEach(i => i.checked = false);
}

/* -----------------------------
   GENERAR IMPACTO
----------------------------- */
function generarImpacto(r) {
    const base = r.impact || 10;

    return {
        imc: -0.02 * base,
        glucosa: -0.3 * base,
        presion_sistolica: -0.15 * base,
        peso: 0.5 + (base / 40)
    };
}


function mapearAccionesDesdePrediccion(pred) {

    const normalizar = (txt) => txt
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/gi, "")
        .trim();

    const recomendacionesPred = (pred.recomendaciones || []).map(normalizar);

    return Object.keys(impacto).filter(key => {
        const keyNorm = normalizar(key);

        return recomendacionesPred.some(rec =>
            rec.includes(keyNorm) || keyNorm.includes(rec)
        );
    });
}

/* -----------------------------
   SIMULACION
----------------------------- */
async function simular() {

    graficasEl.style.display = "block";

    if (!historialBase) return;

    const semanas = Number(tiempoSelect.value);

    let acciones = Array.from(
        document.querySelectorAll("#recomendacionesEl input:checked")
    ).map(el => el.value);

    if (acciones.length === 0) {
        console.log("⚠️ No hay acciones seleccionadas");
    }

    console.log("Acciones seleccionadas: ", acciones);

    console.log("Acciones seleccionadas:", acciones);
    console.log("Impacto disponible:", impacto);

    let riesgoInicial;

    if (prediccionSeleccionada?.historialSnapshot) {
        riesgoInicial = await calcularRiesgo(prediccionSeleccionada.historialSnapshot);
    } else {
        riesgoInicial = await calcularRiesgo(historialBase);
    }
    

    let data = prediccionSeleccionada?.historialSnapshot
    ? { ...prediccionSeleccionada.historialSnapshot }
    : { ...historialBase };

    let riesgoData = [];
    let imcData = [];
    let glucosaData = [];

    for (let i = 0; i < semanas; i++) {

        if (i === 0) {
            riesgoData.push(riesgoInicial);
            imcData.push(data.imc || 0);
            glucosaData.push(data.glucosa || 0);
            continue;
        }

        const impactoFiltrado = {};

        acciones.forEach(a => {
            if (impacto[a]) {
                impactoFiltrado[a] = impacto[a];
            }
        });

        acciones.forEach(a => {

            const efecto = impactoFiltrado[a];
            if (!efecto) return;

            const adherencia = Math.exp(-i / 10);
            const factorTiempo = 1 - Math.exp(-i / 4);

            Object.keys(efecto).forEach(key => {

                if (key === "peso") return;

                if (data[key] !== undefined) {

                    data[key] += efecto[key] * factorTiempo * adherencia * (efecto.peso || 1);

                    if (key === "imc") data[key] = Math.max(18.5, data[key]);
                    if (key === "glucosa") data[key] = Math.max(70, data[key]);
                }
            });
        });

        /* SINERGIA */
        if (acciones.length >= 2) {
            if (data.imc) data.imc -= 0.05;
            if (data.glucosa) data.glucosa -= 1;
        }

        let riesgo = await calcularRiesgo(data);
        riesgo = Math.max(riesgo, 5);

        riesgoData.push(riesgo);
        imcData.push(data.imc || 0);
        glucosaData.push(data.glucosa || 0);
    }

    mostrarGraficaRiesgo(riesgoData);
    mostrarGraficaIMC(imcData);
    mostrarGraficaGlucosa(glucosaData);

    interpretarResultados(riesgoData, imcData, glucosaData, semanas);
}

/* -----------------------------
   GRAFICAS
----------------------------- */
function crearLineaChart(ctx, data, label, color) {
    return new Chart(ctx, {
        type: "line",
        data: {
            labels: data.map((_, i) => `Semana ${i + 1}`),
            datasets: [{
                label,
                data,
                borderColor: color,
                tension: 0.3
            }]
        }
    });
}

function mostrarGraficaRiesgo(data) {
    if (chartRiesgo) chartRiesgo.destroy();
    chartRiesgo = crearLineaChart("graficaRiesgo", data, "Riesgo (%)", "#1976D2");
}

function mostrarGraficaIMC(data) {
    if (chartIMC) chartIMC.destroy();
    chartIMC = crearLineaChart("graficaIMC", data, "IMC", "#4CAF50");
}

function mostrarGraficaGlucosa(data) {
    if (chartGlucosa) chartGlucosa.destroy();
    chartGlucosa = crearLineaChart("graficaGlucosa", data, "Glucosa", "#F44336");
}

/* -----------------------------
   INTERPRETACION
----------------------------- */
function interpretarResultados(riesgo, imc, glucosa, semanas) {

    const rCambio = riesgo.at(-1) - riesgo[0];
    interpretacionRiesgoEl.innerText =
        rCambio <= 0
            ? `El riesgo disminuye ${Math.abs(rCambio).toFixed(1)}% en ${semanas} semanas.`
            : `El riesgo aumenta ${rCambio.toFixed(1)}%.`;

    riesgoFinalEl.innerText = `Riesgo final: ${riesgo.at(-1).toFixed(1)}%`;

    const imcCambio = imc.at(-1) - imc[0];
    interpretacionIMCEl.innerText =
        `Su IMC ${imcCambio < 0 ? "disminuye" : "aumenta"} ${Math.abs(imcCambio).toFixed(2)} en ${semanas} semanas.`;
    imcFinalEl.innerText = `IMC final: ${imc.at(-1).toFixed(2)}`;

    const gCambio = glucosa.at(-1) - glucosa[0];
    interpretacionGlucosaEl.innerText =
        `Su glucosa ${gCambio < 0 ? "disminuye" : "aumenta"} ${Math.abs(gCambio).toFixed(1)} en ${semanas} semanas.`;
    glucosaFinalEl.innerText = `Glucosa final: ${glucosa.at(-1).toFixed(1)} mg/dL`;
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
    vaciarGrafica();    
};

function vaciarGrafica() {

    graficasEl.style.display = "none";

    [chartRiesgo, chartIMC, chartGlucosa].forEach(c => {
        if (c) c.destroy();
    });

    interpretacionRiesgoEl.innerText = "";
    riesgoFinalEl.innerText = "";

    interpretacionIMCEl.innerText = "";
    imcFinalEl.innerText = "";

    interpretacionGlucosaEl.innerText = "";
    glucosaFinalEl.innerText = "";

    //resetearRecomendaciones();

    document.querySelectorAll("#recomendacionesEl input").forEach(i => i.checked = false);
}