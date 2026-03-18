const API_URL = "https://expertsystem-glucopredict-ai.onrender.com";

export async function calcularRiesgo(historial) {
    const response = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(historial)
    });

    const data = await response.json();
    return data.historial.porcentajeRiesgo;
}

export async function obtenerExplicacionesMedica(historial) {
    const response = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(historial)
    });

    const data = await response.json();
    return data.historial.explicacion_medica || [];
}

export async function obtenerExplicacionesGeneral(historial) {
    const response = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(historial)
    });

    const data = await response.json();
    return data.historial.explicacion_general || [];
}

export async function obtenerRecomendaciones(historial) {
    const response = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(historial)
    });

    const data = await response.json();
    return data.historial.recomendaciones || [];
}

export async function obtenerRecomendacionesImpacto(historial) {
    const response = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(historial)
    });

    const data = await response.json();
    return data.historial.recomendaciones_con_impacto || [];
}