import { auth, db } from "./configurationFirebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { calcularRiesgo, obtenerExplicacionesMedica, obtenerRecomendaciones, obtenerMetricas } from "./prediccion.js";
import { deletePacienteCompleto } from "./crud_helpers.js";
import {
    collection,
    getDocs,
    addDoc,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
export const pacienteId = params.get("id");
export const clinicaId = params.get("clinica");

if (!pacienteId || !clinicaId) {
    alert("Paciente o clínica no válidos");
    window.location.href = "medico_dashboard.html";
}

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
export const riesgoEl = document.getElementById("riesgoPrediccion");
const explicacionesEl = document.getElementById("explicacionesPrediccion");
const recomendacionesEl = document.getElementById("recomendacionesPrediccion");
const btnHistorial = document.getElementById("btnHistorial");
const btnVolver = document.getElementById("btnVolver");
const btnSimular = document.getElementById("btnSimular");
const btnEditarPaciente = document.getElementById("btnEditarPaciente");
const btnEliminarPaciente = document.getElementById("btnEliminarPaciente");
const fechaPrediccionEl = document.getElementById("fechaPrediccion");

let riesgoChartInstance = null;
let factoresChartInstance = null;

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

export async function obtenerNuevaPrediccion(historial) {
    try {
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject("timeout"), 7000)
        );

        const resultado = await Promise.race([
            (async () => {
                const riesgo = await calcularRiesgo(historial);
                const explicaciones = await obtenerExplicacionesMedica(historial);
                const recomendaciones = await obtenerRecomendaciones(historial);
                const metricas = await obtenerMetricas(historial);

                return { riesgo, explicaciones, recomendaciones, metricas };
            })(),
            timeout
        ]);

        return resultado;

    } catch (e) {
        console.warn("API lenta o falló:", e);
        return null;
    }
}



function crearGraficaRiesgo(riesgo) {
    const ctx = document.getElementById("riesgoChart");

    if (riesgoChartInstance) {
        riesgoChartInstance.destroy();
    }

    riesgoChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Riesgo", "-"],
            datasets: [{
                data: [riesgo, 100 - riesgo],
                backgroundColor: [
                    riesgo < 30 ? "#4CAF50" : riesgo < 60 ? "#FFC107" : "#F44336",
                    cssVar("--chart-empty", "#E0E0E0")
                ],
                borderWidth: 0
            }]
        },
        options: {
            color: chartTextColor(),
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

function crearGraficaFactores(metricas) {
    const ctx = document.getElementById("factoresChart");

    if (factoresChartInstance) {
        factoresChartInstance.destroy();
    }

    if (!metricas || !Array.isArray(metricas)) {
        console.warn("Metricas invalidas:", metricas);
        return;
    }

    // 🔥 Convertir a impacto real (lo importante)
    const procesadas = metricas.map(m => {
        let impacto = 0;

        // 🔴 NUMÉRICOS (glucosa, hba1c, etc)
        if (typeof m.value === "number" && typeof m.threshold === "number") {
            if (m.value >= m.threshold) impacto = 30;
            else if (m.value >= m.threshold * 0.85) impacto = 15;
            else impacto = 5;
        }

        // 🧠 CATEGÓRICOS
        if (typeof m.value === "string") {
            if (m.value === "sedentario") impacto = 25;
            else if (m.value === "activo") impacto = 5;
        }

        // 🧬 BINARIOS
        if (m.value === 1 && m.threshold === 1) {
            impacto = 20;
        }

        return {
            label: m.factor.replace(/_/g, " ").toUpperCase(),
            impacto
        };
    })
    .filter(m => m.impacto > 0) // 🔥 limpiar ruido
    .sort((a, b) => b.impacto - a.impacto); // 🔥 ordenar

    const labels = procesadas.map(m => m.label);
    const data = procesadas.map(m => m.impacto);

    const colores = data.map(v => {
        if (v >= 25) return "#F44336"; // rojo
        if (v >= 15) return "#FFC107"; // amarillo
        return "#4CAF50"; // verde
    });

    factoresChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Impacto en el riesgo",
                data,
                backgroundColor: colores,
                borderRadius: 10,
                barThickness: 26
            }]
        },
        options: {
            indexAxis: "y", // 🔥 horizontal (MUY PRO)
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Impacto: ${ctx.raw}%`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 35,
                    ticks: { color: chartTextColor() },
                    grid: { color: chartGridColor() }
                },
                y: {
                    ticks: { color: chartTextColor() },
                    grid: { display: false }
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
        } else {
            console.log("No existe documento para este usuario en Firestore");
        }

    try {
        const pacienteRef = doc(db, "users", user.uid, "clinicas", clinicaId, "pacientes", pacienteId);
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

        const historialRef = doc(
            db,
            "users", user.uid,
            "clinicas", clinicaId,
            "pacientes", pacienteId,
            "registro_clinico", "actual"
        );

        const historialSnap = await getDoc(historialRef);

        if (!historialSnap.exists()) {
            estadoHistorialEl.innerText = "No registrado";
            riesgoEl.innerText = "-";
        } else {
            estadoHistorialEl.innerText = "Registrado";

            const historial = historialSnap.data();

            const prediccionesRef = collection(
                db,
                "users", user.uid,
                "clinicas", clinicaId,
                "pacientes", pacienteId,
                "predicciones"
            );

            const q = query(prediccionesRef, orderBy("fecha", "desc"), limit(1));
            const snapshot = await getDocs(q);

            let ultimaPrediccion = null;

            if (!snapshot.empty) {
                ultimaPrediccion = snapshot.docs[0].data();

                // Mostrar inmediatamente ⚡
                mostrarPrediccion(
                    ultimaPrediccion.riesgo,
                    ultimaPrediccion.explicaciones,
                    ultimaPrediccion.recomendaciones,
                    ultimaPrediccion.metricas,
                    ultimaPrediccion.fecha
                );

                crearGraficaFactores(ultimaPrediccion.metricas);
            }

            // Mostrar skeleton loaders mientras carga
            if (!ultimaPrediccion) {
                riesgoEl.innerHTML = '<span class="skeleton-text"></span>';
                explicacionesEl.innerHTML = '<p class="explicacion-item"><span class="spinner-loader"></span> Analizando datos clínicos y buscando patrones...</p>';
                recomendacionesEl.innerHTML = '<p class="recomendacion-item"><span class="spinner-loader"></span> Generando plan de acción personalizado...</p>';
            }

            const nueva = await obtenerNuevaPrediccion(historial);

            console.log("Predicción obtenida:", nueva);

            if (!nueva) {
                // Si ya hay predicción previa, no hacer nada
                if (!ultimaPrediccion) {
                    riesgoEl.innerText = "No se pudo obtener predicción";
                }
                return;
            }

            // Si NO hay predicción previa
            if (!ultimaPrediccion) {

                mostrarPrediccion(
                    nueva.riesgo,
                    nueva.explicaciones,
                    nueva.recomendaciones,
                    nueva.metricas,
                    { seconds: Date.now() / 1000 }
                );

                crearGraficaFactores(nueva.metricas);

                await addDoc(prediccionesRef, {
                    ...nueva,
                    historialSnapshot: historial, // 🔥 CLAVE
                    fecha: new Date()
                });

            } else {

                // Comparar
                const cambio =
                    nueva.riesgo !== ultimaPrediccion.riesgo ||
                    JSON.stringify(nueva.explicaciones) !== JSON.stringify(ultimaPrediccion.explicaciones) ||
                    JSON.stringify(nueva.recomendaciones) !== JSON.stringify(ultimaPrediccion.recomendaciones);

                if (cambio) {
                    mostrarPrediccion(
                        nueva.riesgo,
                        nueva.explicaciones,
                        nueva.recomendaciones,
                        nueva.metricas,
                        { seconds: Date.now() / 1000 }
                    );

                    crearGraficaFactores(nueva.metricas);

                    await addDoc(prediccionesRef, {
                        ...nueva,
                        historialSnapshot: historial,
                        fecha: new Date()
                    });
                }
            }

            const riesgo = await calcularRiesgo(historial);

            if (riesgo === null) {
                riesgoEl.innerText = "-";
            } else if (riesgo < 30) {
                riesgoEl.innerText = `${riesgo}% (Bajo)`;
                riesgoEl.style.color = "#4CAF50";
            } else if (riesgo < 60) {
                riesgoEl.innerText = `${riesgo}% (Moderado)`;
                riesgoEl.style.color = "#FFC107";
            } else if (riesgo >= 60) {
                riesgoEl.innerText = `${riesgo}% (Alto)`;
                riesgoEl.style.color = "#F44336";
            } else {
                riesgoEl.innerText = "Desconocido";
                riesgoEl.style.color = "var(--text)";
            }

            const explicaciones = await obtenerExplicacionesMedica(historial);
            explicacionesEl.innerHTML = "";
            explicaciones.forEach((explicacion) => {
                const p = document.createElement("p");
                p.classList.add("explicacion-item");
                p.innerText = `🔍 Análisis: ${explicacion}`;
                explicacionesEl.appendChild(p);
            });

            const recomendaciones = await obtenerRecomendaciones(historial);
            recomendacionesEl.innerHTML = "";
            recomendaciones.forEach((recomendacion) => {
                const p = document.createElement("p");
                p.classList.add("recomendacion-item");
                p.innerText = `💡 Recomendación: ${recomendacion}`;
                recomendacionesEl.appendChild(p);
            });

            crearGraficaRiesgo(riesgo);
            crearGraficaFactores(nueva.metricas);
        }

        btnEliminarPaciente.onclick = async () => {
            const confirmado = window.confirm(`¿Eliminar al paciente ${paciente.nombre || "seleccionado"}?`);
            if (!confirmado) {
                return;
            }

            await deletePacienteCompleto(user.uid, clinicaId, pacienteId);
            window.location.href = `clinica.html?id=${clinicaId}`;
        };
    } catch (error) {
        console.error("Error cargando paciente:", error);
        alert("Error al cargar el perfil del paciente");
    }
});



export function mostrarPrediccion(riesgo, explicaciones, recomendaciones, metricas, fecha) {
    // Riesgo
    if (riesgo < 30) {
        riesgoEl.innerText = `${riesgo}% (Bajo)`;
        riesgoEl.style.color = "#4CAF50";
    } else if (riesgo < 60) {
        riesgoEl.innerText = `${riesgo}% (Moderado)`;
        riesgoEl.style.color = "#FFC107";
    } else {
        riesgoEl.innerText = `${riesgo}% (Alto)`;
        riesgoEl.style.color = "#F44336";
    }

    // Fecha
    if (fecha) {
        const fechaFormateada = new Date(fecha.seconds * 1000).toLocaleString();
        fechaPrediccionEl.innerText = "Última predicción: " + fechaFormateada;
    }

    // Explicaciones
    explicacionesEl.innerHTML = "";
    explicaciones.forEach(e => {
        const p = document.createElement("p");
        p.innerText = "🔍 Análisis: " + e;
        explicacionesEl.appendChild(p);
    });

    // Recomendaciones
    recomendacionesEl.innerHTML = "";
    recomendaciones.forEach(r => {
        const p = document.createElement("p");
        p.innerText = "💡 Recomendación: " + r;
        recomendacionesEl.appendChild(p);
    });

    crearGraficaRiesgo(riesgo);
}





btnHistorial.onclick = () => {
    window.location.href = `registro_clinico.html?tipo=paciente&clinica=${clinicaId}&id=${pacienteId}`;
};

btnVolver.onclick = () => {
    window.location.href = `clinica.html?id=${clinicaId}`;
};

btnSimular.onclick = () => {
    window.location.href = `simulador.html?tipo=paciente&id=${pacienteId}&clinica=${clinicaId}`;
};

btnEditarPaciente.onclick = () => {
    window.location.href = `agregar_paciente.html?clinica=${clinicaId}&id=${pacienteId}`;
};
