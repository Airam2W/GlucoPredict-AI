import { auth, db } from "./configurationFirebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { calcularRiesgo, obtenerExplicacionesMedica, obtenerRecomendaciones } from "./prediccion.js";
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
    alert("Paciente o clinica no validos");
    window.location.href = "panel_principal.html";
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
const btnEliminarPaciente = document.getElementById("btnEliminarPaciente");
const fechaPrediccionEl = document.getElementById("fechaPrediccion");

let riesgoChartInstance = null;
let factoresChartInstance = null;

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

                return { riesgo, explicaciones, recomendaciones };
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
        Presion: historial.presion_sistolica >= 140 ? 10 : historial.presion_sistolica >= 120 ? 5 : 0,
        Antecedentes: historial.antecedentes_familiares_diabetes ? 20 : 0,
        Actividad: historial.actividad_fisica ? historial.actividad_fisica === "sedentario" ? 10 : 0 : 0
    };

    const colores = Object.keys(factores).map((factor) => {
        switch (factor) {
            case "IMC":
                if (historial.imc >= 30) return "red";
                if (historial.imc >= 25) return "yellow";
                return "green";
            case "Glucosa":
                if (historial.glucosa >= 126) return "red";
                if (historial.glucosa >= 100) return "yellow";
                return "green";
            case "Presion":
                if (historial.presion_sistolica >= 140) return "red";
                if (historial.presion_sistolica >= 120) return "yellow";
                return "green";
            case "Actividad":
                return historial.actividad_fisica === "sedentario" ? "red" : "green";
            default:
                return "#1976D2";
        }
    });

    factoresChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(factores),
            datasets: [{
                label: "Impacto en el riesgo (%)",
                data: Object.values(factores),
                backgroundColor: colores
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../../index.html";
        return;
    }

    // Reestringir acceso a características de usuario no PAGA
    const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            window.user = userSnap.data();
            console.log("Usuario actual:", window.user);
            console.log("Tipo de usuario:", window.user.tipo);
            
            if (window.user.tipo !== "PAGA") {
                btnSimular.title = "Solo disponible para usuarios PAGA";
                btnSimular.style.backgroundColor = "#ccc";
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
            "historial_clinico", "actual"
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
                    ultimaPrediccion.fecha
                );
            }

            const nueva = await obtenerNuevaPrediccion(historial);

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
                    { seconds: Date.now() / 1000 }
                );

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
                        { seconds: Date.now() / 1000 }
                    );

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
                riesgoEl.style.color = "#000";
            }

            const explicaciones = await obtenerExplicacionesMedica(historial);
            explicacionesEl.innerHTML = "";
            explicaciones.forEach((explicacion) => {
                const p = document.createElement("p");
                p.classList.add("explicacion-item");
                p.innerText = `🔍 Analisis: ${explicacion}`;
                explicacionesEl.appendChild(p);
            });

            const recomendaciones = await obtenerRecomendaciones(historial);
            recomendacionesEl.innerHTML = "";
            recomendaciones.forEach((recomendacion) => {
                const p = document.createElement("p");
                p.classList.add("recomendacion-item");
                p.innerText = `💡 Recomendacion: ${recomendacion}`;
                recomendacionesEl.appendChild(p);
            });

            crearGraficaRiesgo(riesgo);
            crearGraficaFactores(historial);
        }

        btnEliminarPaciente.onclick = async () => {
            const confirmado = window.confirm(`Eliminar al paciente ${paciente.nombre || "seleccionado"}?`);
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



export function mostrarPrediccion(riesgo, explicaciones, recomendaciones, fecha) {
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
    window.location.href = `historial_clinico.html?tipo=paciente&clinica=${clinicaId}&id=${pacienteId}`;
};

btnVolver.onclick = () => {
    window.location.href = `clinica.html?id=${clinicaId}`;
};

btnSimular.onclick = () => {
    window.location.href = `simulador.html?tipo=paciente&id=${pacienteId}&clinica=${clinicaId}`;
};
