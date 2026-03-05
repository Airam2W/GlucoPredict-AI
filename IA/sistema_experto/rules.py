# rules.py

RULES = [

    # ------------------------
    # EDAD
    # ------------------------
    {
        "condition": lambda f: f["edad"] >= 45,
        "impact": 15,
        "explication_general": "La edad mayor a 45 años aumenta el riesgo de desarrollar diabetes.",
        "explication_medica": "Edad ≥ 45 años asociada a mayor resistencia a la insulina.",
        "recommendation": "Realizar chequeos médicos periódicos y mantener hábitos saludables.",
        "metric": {
            "factor": "edad",
            "value": lambda f: f["edad"] if "edad" in f else None,
            "threshold": 45
        }
    },

    # ------------------------
    # IMC
    # ------------------------
    {
        "condition": lambda f: f["imc"] >= 30,
        "impact": 20,
        "explication_general": "El sobrepeso u obesidad incrementa el riesgo de diabetes.",
        "explication_medica": "IMC ≥ 30 indica obesidad, factor clave en síndrome metabólico.",
        "recommendation": "Reducir peso mediante dieta balanceada y actividad física regular.",
        "metric": {
            "factor": "imc",
            "value": lambda f: f["imc"] if "imc" in f else None,
            "threshold": 30
        }
    },

    {
        "condition": lambda f: 25 <= f["imc"] < 30,
        "impact": 10,
        "explication_general": "El sobrepeso puede aumentar el riesgo de diabetes.",
        "explication_medica": "IMC entre 25 y 29.9 indica sobrepeso.",
        "recommendation": "Incrementar actividad física y mejorar alimentación.",
        "metric": {
            "factor": "imc",
            "value": lambda f: f["imc"] if "imc" in f else None,
            "threshold": 25
        }
    },

    # ------------------------
    # GLUCOSA
    # ------------------------
    {
        "condition": lambda f: f["glucosa"] >= 126,
        "impact": 30,
        "explication_general": "Los niveles altos de glucosa indican un riesgo elevado.",
        "explication_medica": "Glucosa en ayunas ≥ 126 mg/dL compatible con diabetes.",
        "recommendation": "Consultar inmediatamente con un profesional de salud.",
        "metric": {
            "factor": "glucosa",
            "value": lambda f: f["glucosa"] if "glucosa" in f else None,
            "threshold": 126
        }
    },

    {
        "condition": lambda f: 100 <= f["glucosa"] < 126,
        "impact": 15,
        "explication_general": "La glucosa elevada puede indicar prediabetes.",
        "explication_medica": "Glucosa en ayunas entre 100–125 mg/dL (prediabetes).",
        "recommendation": "Modificar hábitos y vigilar niveles de glucosa.",
        "metric": {
            "factor": "glucosa",
            "value": lambda f: f["glucosa"] if "glucosa" in f else None,
            "threshold": 100
        }
    },

    # ------------------------
    # PRESIÓN
    # ------------------------
    {
        "condition": lambda f: f["presion_sistolica"] >= 140,
        "impact": 10,
        "explication_general": "La presión alta se asocia a mayor riesgo metabólico.",
        "explication_medica": "Hipertensión sistólica ≥ 140 mmHg.",
        "recommendation": "Controlar presión arterial y reducir consumo de sal.",
        "metric": {
            "factor": "presion_sistolica",
            "value": lambda f: f["presion_sistolica"] if "presion_sistolica" in f else None,
            "threshold": 140
        }
    },

    # ------------------------
    # ANTECEDENTES
    # ------------------------
    {
        "condition": lambda f: f["antecedentes_familiares_diabetes"],
        "impact": 20,
        "explication_general": "Tener familiares con diabetes aumenta el riesgo personal.",
        "explication_medica": "Historia familiar positiva de DM2.",
        "recommendation": "Adoptar medidas preventivas desde edades tempranas.",
        "metric": {
            "factor": "antecedentes_familiares_diabetes",
            "value": 1,
            "threshold": 1
        }
    },

    # ------------------------
    # ACTIVIDAD FÍSICA
    # ------------------------
    {
        "condition": lambda f: f["actividad_fisica"] == "sedentario",
        "impact": 10,
        "explication_general": "La falta de actividad física aumenta el riesgo.",
        "explication_medica": "Sedentarismo asociado a resistencia a la insulina.",
        "recommendation": "Realizar al menos 150 minutos de actividad física por semana.",
        "metric": {
            "factor": "actividad_fisica",
            "value": "sedentario",
            "threshold": "moderado"
        }
    }
]