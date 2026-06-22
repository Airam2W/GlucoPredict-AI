import { auth, db } from "./configurationFirebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { prediccionClinica, prediccionConductual, obtenerMetricas, obtenerEYRA } from "./prediccion.js";
import { deletePerfilCompleto } from "./crud_helpers.js";
import {
    collection,
    getDocs,
    addDoc,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const perfilId = params.get("id");

if (!perfilId) {
    alert("Perfil no válido");
    window.location.href = "persona_dashboard.html";
}

const nombreEl = document.getElementById("nombrePerfil");
const edadEl = document.getElementById("edadPerfil");
const sexoEl = document.getElementById("sexoPerfil");
const observacionesEl = document.getElementById("observacionesPerfil");
const historialEl = document.getElementById("estadoHistorial");
const prediccionClinicaEl = document.getElementById("prediccionClinica");
const prediccionConductualEl = document.getElementById("prediccionConductual");
const analisisEl = document.getElementById("analisisTexto");
const mensajeEl = document.getElementById("mensaje");
const explicacionesEl = document.getElementById("explicacionesPrediccion");
const recomendacionesEl = document.getElementById("recomendacionesPrediccion");
const btnHistorial = document.getElementById("btnHistorial");
const btnSimular = document.getElementById("btnSimular");
const btnEditarPerfil = document.getElementById("btnEditarPerfil");
const btnVolver = document.getElementById("btnVolver");
const btnEliminarPerfil = document.getElementById("btnEliminarPerfil");
const fechaPrediccionEl = document.getElementById("fechaPrediccion");

const historialPrediccionesEl = document.getElementById("historialPredicciones");

let riesgoChartInstance = null;
let factoresChartInstance = null;

function renderHistorialPredicciones(lista) {

    historialPrediccionesEl.innerHTML = "";

    lista.forEach(pred => {

        const item = document.createElement("div");
        item.style.padding = "6px";
        item.style.borderBottom = "1px solid var(--border)";

        const fechaFormateada = pred.fecha?.toDate
            ? pred.fecha.toDate().toLocaleString()
            : "Fecha no disponible";

        let iconoClinico = "O";
        if (pred.predictClinica < 30) {
            iconoClinico = "🟢";
        } else if (pred.predictClinica < 60) {
            iconoClinico = "🟡";
        } else {
            iconoClinico = "🔴";
        }

        let iconoConductual = "O";
        if (pred.predictConductual < 30) {
            iconoConductual = "🟢";
        } else if (pred.predictConductual < 60) {
            iconoConductual = "🟡";
        } else {
            iconoConductual = "🔴";
        }

        item.innerHTML = `
            <strong>${fechaFormateada}</strong><br>
            <small style="font-weight: bold;">Riesgo Clínico:</small> <span style="font-size: 14px;">${pred.predictClinica}% ${iconoClinico}</span><br>
            <small style="font-weight: bold;">Riesgo Conductual:</small> <span style="font-size: 14px;">${pred.predictConductual}% ${iconoConductual}</span>
        `;

        historialPrediccionesEl.appendChild(item);
        const lineaSeparadora = document.createElement("hr");
        lineaSeparadora.style.margin = "4px 0";
        //Si es el último elemento, no agregar la línea separadora
        if (pred !== lista[lista.length - 1]) {
            historialPrediccionesEl.appendChild(lineaSeparadora);
        }
    });
}

function cssVar(name, fallback = "") {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
}

function chartTextColor() {
    return cssVar("--text", "#0f172a");
}

function chartGridColor() {
    return cssVar("--border", "rgba(15, 23, 42, 0.12)");
}

function themedScaleOptions(extra = {}) {
    return {
        ...extra,
        ticks: { ...(extra.ticks || {}), color: chartTextColor() },
        grid: { ...(extra.grid || {}), color: chartGridColor() }
    };
}

function applyChartTheme(chart) {
    if (!chart) return;

    chart.options.color = chartTextColor();

    if (chart.options.plugins?.legend?.labels) {
        chart.options.plugins.legend.labels.color = chartTextColor();
    }

    if (chart.options.scales) {
        Object.keys(chart.options.scales).forEach((key) => {
            chart.options.scales[key] = themedScaleOptions(chart.options.scales[key]);
        });
    }

    if (chart.config.type === "doughnut" && Array.isArray(chart.data.datasets?.[0]?.backgroundColor)) {
        chart.data.datasets[0].backgroundColor[1] = cssVar("--chart-empty", "#E0E0E0");
    }

    chart.update();
}

window.addEventListener("glucopredict-theme-change", () => {
    applyChartTheme(riesgoChartInstance);
    applyChartTheme(factoresChartInstance);
});


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function obtenerNuevaPrediccion(historial) {
    try {
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject("timeout"), 7000)
        );

        const resultado = await Promise.race([
            (async () => {
                const predictClinica = await prediccionClinica(historial.clinico);
                const predictConductual = await prediccionConductual(historial.conductual);
                await sleep(500);
                const eyra = await obtenerEYRA(historial);
                const analisis = eyra.analisis || ["Error"];
                const explicaciones = eyra.explicaciones || ["Error"];
                const recomendaciones = eyra.recomendaciones || ["Error"];
                await sleep(500);
                const metricas = await obtenerMetricas(historial);

                return { predictClinica, predictConductual, analisis, explicaciones, recomendaciones, metricas, historialSnapshot: historial };
            })(),
            timeout
        ]);

        return resultado;

    } catch (e) {
        console.warn("API lenta o falló:", e);
        return null;
    }
}

let radarChart = null;
let riskBarChart = null;

export function crearGraficas(metricas) {
    // =====================================================
    // GRÁFICA CLÍNICA (Barras verticales)
    // =====================================================
    const radarCtx = document.getElementById("radarChart");
    if (radarChart) radarChart.destroy();

    radarChart = new Chart(radarCtx, {
        type: "bar",
        data: {
            labels: metricas.radar.values.map(v => v.label),
            datasets: [{
                label: "Valores clínicos",
                data: metricas.radar.values.map(v => v.value),
                backgroundColor: metricas.radar.values.map(v => {
                    if (v.impact === "alto") return "#f87171"; // rojo coral
                    if (v.impact === "medio") return "#fbbf24"; // amarillo cálido
                    return "#34d399"; // verde suave
                }),
                borderRadius: 6, // bordes redondeados
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: Math.max(...metricas.radar.values.map(v => v.value || 0)) + 20,
                    ticks: {
                        color: isDarkTheme() ? "#d8d8d8" : "#374151", // gris moderno
                        font: { size: 14, family: "Inter, sans-serif" }
                    },
                    grid: {
                        color: isDarkTheme() ? "#374151" : "#e5e7eb" // líneas suaves
                    }
                },
                x: {
                    ticks: {
                        color: isDarkTheme() ? "#d8d8d8" : "#374151",
                        font: { size: 14, family: "Inter, sans-serif" }
                    },
                    grid: { display: false }
                }
            },
            plugins: {
                tooltip: {
                    backgroundColor: "#111827", // fondo oscuro
                    titleColor: "#f9fafb",
                    bodyColor: "#f9fafb",
                    callbacks: {
                        label: ctx => {
                            const factor = metricas.radar.values[ctx.dataIndex];
                            return `${factor.label}: ${factor.value} ${factor.unit} (${factor.impact})`;
                        }
                    }
                },
                legend: {
                    labels: {
                        color: isDarkTheme() ? "#d8d8d8" : "#374151",
                        font: { size: 14, family: "Inter, sans-serif" }
                    }
                }
            }
        }
    });

    // =====================================================
    // GRÁFICA CONDUCTUAL (Barras horizontales)
    // =====================================================
    const barCtx = document.getElementById("riskBarChart");
    if (riskBarChart) riskBarChart.destroy();

    riskBarChart = new Chart(barCtx, {
        type: "bar",
        data: {
            labels: metricas.risk_factors.map(f => f.name),
            datasets: [{
                label: "Hábitos",
                data: metricas.risk_factors.map(f => {
                    if (f.impact === "alto") return 3;
                    if (f.impact === "medio") return 2;
                    return 1;
                }),
                backgroundColor: metricas.risk_factors.map(f => {
                    if (f.impact === "alto") return "#f87171";
                    if (f.impact === "medio") return "#fbbf24";
                    return "#34d399";
                }),
                borderRadius: 6,
                barThickness: 30
            }]
        },
        options: {
            indexAxis: "y",
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#111827",
                    titleColor: "#f9fafb",
                    bodyColor: "#f9fafb",
                    callbacks: {
                        label: ctx => {
                            const factor = metricas.risk_factors[ctx.dataIndex];
                            return `${factor.name}: ${factor.impact}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: 0,
                    max: 3,
                    ticks: {
                        callback: v => ["", "Bajo", "Medio", "Alto"][v],
                        color: isDarkTheme() ? "#d8d8d8" : "#374151",
                        font: { size: 14, family: "Inter, sans-serif" }
                    },
                    grid: { color: isDarkTheme() ? "#374151" : "#e5e7eb" }
                },
                y: {
                    ticks: {
                        color: isDarkTheme() ? "#d8d8d8" : "#374151",
                        font: { size: 14, family: "Inter, sans-serif" }
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

function isDarkTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark";
}

function textoSeguro(valor, sufijo = "") {
    if (valor === null || valor === undefined || valor === "") {
        return "-";
    }
    return `${valor}${sufijo}`;
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../../index.html";
        return;
    }

    // Restringir acceso a características de usuario no PAGA
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        window.user = userSnap.data();
        console.log("Usuario actual:", window.user);
        console.log("Tipo de usuario:", window.user.tipo);

        if (window.user.tipo !== "PAGA") {
            btnSimular.title = "Solo disponible para usuarios PAGA";
            btnSimular.style.backgroundColor = "var(--disabled-bg)";
            btnSimular.style.cursor = "not-allowed";
            btnSimular.onclick = () => {
                const respuesta = confirm("Simulador solo disponible para usuarios PAGA. ¿Deseas ir a la página de pago?");
                if (respuesta) {
                    // El usuario presionó "Aceptar"
                    window.location.href = "../../FrontEnd/HTML/paga.html?where=paciente";
                } else {
                    // El usuario presionó "Cancelar"
                    console.log("El usuario decidió no ir a la página de pago");
                }
            };
        }

        // SIMULADOR DESHABILITADO POR EL MOMENTO
        btnSimular.title = "Simulador en desarrollo";
        btnSimular.style.backgroundColor = "var(--disabled-bg)";
        btnSimular.style.cursor = "not-allowed";
        btnSimular.onclick = () => {
            alert("El simulador está en desarrollo. ¡Próximamente!");
        }
    } else {
        console.log("No existe documento para este usuario en Firestore");
    }

    try {
        const perfilRef = doc(db, "users", user.uid, "perfiles", perfilId);
        const perfilSnap = await getDoc(perfilRef);

        if (!perfilSnap.exists()) {
            alert("Perfil no encontrado");
            return;
        }

        const perfil = perfilSnap.data();

        nombreEl.innerText = textoSeguro(perfil.nombre);
        edadEl.innerText = textoSeguro(perfil.edad, " años");
        sexoEl.innerText = textoSeguro(perfil.sexo);
        observacionesEl.innerText = perfil.observaciones || "Sin observaciones";

        const historialRef = doc(db, "users", user.uid, "perfiles", perfilId, "registro_clinico", "actual");
        const historialSnap = await getDoc(historialRef);

        if (!historialSnap.exists()) {
            historialEl.innerText = "No registrado ⏳";
            prediccionClinicaEl.innerText = "-";
            prediccionConductualEl.innerText = "-";
        } else {
            historialEl.innerText = "Registrado ✅";

            const historial = historialSnap.data();


            const prediccionesRef = collection(
                db,
                "users", user.uid,
                "perfiles", perfilId,
                "predicciones"
            );

            const q = query(prediccionesRef, orderBy("fecha", "desc"), limit(1));
            const snapshot = await getDocs(q);

            let ultimaPrediccion = null;

            if (!snapshot.empty) {
                ultimaPrediccion = snapshot.docs[0].data();

                // Mostrar inmediatamente ⚡
                mostrarPrediccion(
                    ultimaPrediccion.predictClinica,
                    ultimaPrediccion.predictConductual,
                    ultimaPrediccion.analisis,
                    ultimaPrediccion.explicaciones,
                    ultimaPrediccion.recomendaciones,
                    ultimaPrediccion.metricas,
                    ultimaPrediccion.fecha
                );

                //crearGraficas(ultimaPrediccion.metricas);

                // Mostrar historial de predicciones
                const historialQ = query(prediccionesRef, orderBy("fecha", "desc"));
                const historialSnapshot = await getDocs(historialQ);

                let predicciones = historialSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                renderHistorialPredicciones(predicciones);
                console.log("Numero de predicciones en historial:", predicciones.length);
            }

            // Mostrar skeleton loaders mientras carga
            if (!ultimaPrediccion) {
                prediccionClinicaEl.innerHTML = '<span class="spinner-loader"></span>';
                prediccionConductualEl.innerHTML = '<span class="spinner-loader"></span>';
                analisisEl.innerHTML = '<p class="analisis-item"><span class="spinner-loader"></span> Analizando datos clínicos y conductuales...</p>';
                explicacionesEl.innerHTML = '<p class="explicacion-item"><span class="spinner-loader"></span> Analizando datos clínicos y buscando patrones...</p>';
                recomendacionesEl.innerHTML = '<p class="recomendacion-item"><span class="spinner-loader"></span> Generando plan de acción personalizado...</p>';
            }
            const nueva = await obtenerNuevaPrediccion(historial);

            console.log("Predicción obtenida:", nueva);

            if (!nueva) {
                // Si ya hay predicción previa, no hacer nada
                if (!ultimaPrediccion) {
                    prediccionClinicaEl.innerText = "No se pudo obtener predicción. Intenta actualizar la página más tarde.";
                    prediccionConductualEl.innerText = "No se pudo obtener predicción. Intenta actualizar la página más tarde.";
                }
                return;
            }

            // Si NO hay predicción previa
            if (!ultimaPrediccion) {

                mostrarPrediccion(
                    nueva.predictClinica,
                    nueva.predictConductual,
                    nueva.analisis,
                    nueva.explicaciones,
                    nueva.recomendaciones,
                    nueva.metricas,
                    { seconds: Date.now() / 1000 }
                );

                //crearGraficas(nueva.metricas);

                await addDoc(prediccionesRef, {
                    ...nueva,
                    fecha: new Date()
                });

            } else {

                // Comparar
                const cambio =
                    nueva.historialSnapshot.clinico !== ultimaPrediccion.historialSnapshot.clinico ||
                    nueva.historialSnapshot.conductual !== ultimaPrediccion.historialSnapshot.conductual;

                if (cambio) {
                    mostrarPrediccion(
                        nueva.predictClinica,
                        nueva.predictConductual,
                        nueva.analisis,
                        nueva.explicaciones,
                        nueva.recomendaciones,
                        nueva.metricas,
                        { seconds: Date.now() / 1000 }
                    );

                    await addDoc(prediccionesRef, {
                        ...nueva,
                        fecha: new Date()
                    });
                }
            }

        }

        btnEliminarPerfil.onclick = async () => {
            const confirmado = window.confirm(`¿Eliminar el perfil ${perfil.nombre || "seleccionado"}?`);
            if (!confirmado) {
                return;
            }

            await deletePerfilCompleto(user.uid, perfilId);
            window.location.href = "persona_dashboard.html";
        };
    } catch (error) {
        console.error("Error cargando perfil:", error);
        alert("Error al cargar el perfil");
    }
});


export function mostrarPrediccion(prediccionClinica, prediccionConductual, analisis, explicaciones, recomendaciones, metricas, fecha) {

    // Predicción clínica
    if (prediccionClinica < 30) {
        prediccionClinicaEl.innerText = `${prediccionClinica}% (Bajo)`;
        prediccionClinicaEl.style.color = "#4CAF50";
        document.getElementById("iconoClinico").innerText = "🟢";
    } else if (prediccionClinica < 60) {
        prediccionClinicaEl.innerText = `${prediccionClinica}% (Moderado)`;
        prediccionClinicaEl.style.color = "#FFC107";
        document.getElementById("iconoClinico").innerText = "🟡";
    } else {
        prediccionClinicaEl.innerText = `${prediccionClinica}% (Alto)`;
        prediccionClinicaEl.style.color = "#F44336";
        document.getElementById("iconoClinico").innerText = "🔴";
    }

    // Predicción conductual
    if (prediccionConductual < 30) {
        prediccionConductualEl.innerText = `${prediccionConductual}% (Bajo)`;
        prediccionConductualEl.style.color = "#4CAF50";
        document.getElementById("iconoConductual").innerText = "🟢";
    } else if (prediccionConductual < 60) {
        prediccionConductualEl.innerText = `${prediccionConductual}% (Moderado)`;
        prediccionConductualEl.style.color = "#FFC107";
        document.getElementById("iconoConductual").innerText = "🟡";
    } else {
        prediccionConductualEl.innerText = `${prediccionConductual}% (Alto)`;
        prediccionConductualEl.style.color = "#F44336";
        document.getElementById("iconoConductual").innerText = "🔴";
    }

    // Analisis
    analisisEl.innerHTML = "";
    analisisEl.innerText = analisis;
    mensajeEl.innerText = "Este análisis es informativo y no sustituye la valoración de un médico.\nPor favor, consulta a un profesional de la salud para obtener un diagnóstico y tratamiento adecuado.";


    // Explicaciones
    explicacionesEl.innerHTML = "";
    explicaciones.forEach((explicacion) => {
        const p = document.createElement("p");
        p.classList.add("explicacion-item");
        p.innerText = `${explicacion}`;
        explicacionesEl.appendChild(p);
    });


    // Recomendaciones
    recomendacionesEl.innerHTML = "";
    recomendaciones.forEach((recomendacion) => {
        const p = document.createElement("p");
        p.classList.add("recomendacion-item");
        p.innerText = `${recomendacion}`;
        recomendacionesEl.appendChild(p);
    });

    // Fecha
    if (fecha) {
        let fechaObj;

        // 🔥 Timestamp Firestore
        if (typeof fecha.toDate === "function") {
            fechaObj = fecha.toDate();
        }
        // 🔥 Objeto con seconds
        else if (fecha.seconds) {
            fechaObj = new Date(fecha.seconds * 1000);
        }
        // 🔥 Date normal o string
        else {
            fechaObj = new Date(fecha);
        }

        fechaPrediccionEl.innerText =
            "Última predicción: " + fechaObj.toLocaleString();
    }

    if (metricas) {
        crearGraficas(metricas);
    }
}

btnHistorial.onclick = () => {
    window.location.href = `registro_clinico.html?tipo=perfil&id=${perfilId}`;
};

btnSimular.onclick = () => {
    window.location.href = `simulador.html?tipo=perfil&id=${perfilId}`;
};

btnVolver.onclick = () => {
    window.location.href = "persona_dashboard.html";
};

btnEditarPerfil.onclick = () => {
    window.location.href = `agregar_perfil.html?id=${perfilId}`;
};
