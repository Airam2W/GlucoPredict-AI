const API_URL = "https://expertsystem-glucopredict-ai.onrender.com";

export async function prediccionClinica(historial) {
    const response = await fetch(`${API_URL}/api/clinic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(historial)
    });

    const data = await response.json();
    return data.clinic_result || {};
}

export async function prediccionConductual(historial) {
    const response = await fetch(`${API_URL}/api/conductual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(historial)
    });

    const data = await response.json();
    return data.conductual_result || {};
}

export async function obtenerMetricas(historial) {
    const response = await fetch(`${API_URL}/api/metricas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(historial)
    });

    const data = await response.json();
    return data.metricas_result || {};
}

/*
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

export async function obtenerMetricas(historial) {
    const response = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(historial)
    });

    const data = await response.json();
    return data.historial.metricas || {};
}
    */