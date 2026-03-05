from .rules import RULES

def infer_risk(facts):
    risk = 0
    explanations_general = []
    explanations_medical = []
    recommendations = []
    metrics = []

    for rule in RULES:
        try:
            if rule["condition"](facts):
                risk += rule["impact"]

                explanations_general.append(rule["explication_general"])
                explanations_medical.append(rule["explication_medica"])
                recommendations.append(rule["recommendation"])

                # Copiamos la métrica y evaluamos si "value" es una función
                metric = rule["metric"].copy()
                if callable(metric["value"]):
                    metric["value"] = metric["value"](facts)
                metrics.append(metric)

        except Exception:
            continue

    return {
        "porcentajeRiesgo": min(risk, 100),
        "explicacion_general": explanations_general,
        "explicacion_medica": explanations_medical,
        "recomendaciones": list(set(recommendations)),
        "metricas": metrics
    }