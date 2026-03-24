import { auth, db } from "./configurationFirebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { calcularRiesgo, obtenerExplicacionesGeneral, obtenerRecomendaciones } from "./prediccion.js";
import { deletePerfilCompleto } from "./crud_helpers.js";

const params = new URLSearchParams(window.location.search);
const perfilId = params.get("id");

if (!perfilId) {
    alert("Perfil no valido");
    window.location.href = "panel_principal.html";
}

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
const btnSimular = document.getElementById("btnSimular");
const btnVolver = document.getElementById("btnVolver");
const btnEliminarPerfil = document.getElementById("btnEliminarPerfil");

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

    try {
        const perfilRef = doc(db, "users", user.uid, "perfiles", perfilId);
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

        const historialRef = doc(db, "users", user.uid, "perfiles", perfilId, "historial_clinico", "actual");
        const historialSnap = await getDoc(historialRef);

        if (!historialSnap.exists()) {
            historialEl.innerText = "No registrado";
            riesgoEl.innerText = "-";
        } else {
            historialEl.innerText = "Registrado";

            const historial = historialSnap.data();
            const riesgo = await calcularRiesgo(historial);
            riesgoEl.style.color = "#000";

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
            }

            const explicaciones = await obtenerExplicacionesGeneral(historial);
            explicacionesEl.innerHTML = "";
            explicaciones.forEach((explicacion) => {
                const p = document.createElement("p");
                p.classList.add("explicacion-item");
                p.innerText = `Analisis: ${explicacion}`;
                explicacionesEl.appendChild(p);
            });

            const recomendaciones = await obtenerRecomendaciones(historial);
            recomendacionesEl.innerHTML = "";
            recomendaciones.forEach((recomendacion) => {
                const p = document.createElement("p");
                p.classList.add("recomendacion-item");
                p.innerText = `Recomendacion: ${recomendacion}`;
                recomendacionesEl.appendChild(p);
            });

            crearGraficaRiesgo(riesgo);
            crearGraficaFactores(historial);
        }

        btnEliminarPerfil.onclick = async () => {
            const confirmado = window.confirm(`Eliminar el perfil ${perfil.nombre || "seleccionado"}?`);
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

btnHistorial.onclick = () => {
    window.location.href = `historial_clinico.html?tipo=perfil&id=${perfilId}`;
};

btnSimular.onclick = () => {
    window.location.href = `simulador.html?tipo=perfil&id=${perfilId}`;
};

btnVolver.onclick = () => {
    window.location.href = "persona_dashboard.html";
};
