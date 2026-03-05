export async function calcularRiesgo(historial) {
    const response = await fetch("http://127.0.0.1:5000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(historial)
    });

    const data = await response.json();
    return data.historial.porcentajeRiesgo;
}

export async function obtenerExplicaciones(historial) {
    const response = await fetch("http://127.0.0.1:5000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(historial)
    });

    const data = await response.json();
    return data.historial.explicacion_medica || [];
}

export async function obtenerRecomendaciones(historial) {
    const response = await fetch("http://127.0.0.1:5000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(historial)
    });

    const data = await response.json();
    return data.historial.recomendaciones || [];
}