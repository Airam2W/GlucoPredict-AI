# riskModel.py

from .facts import FACTS
from .inference import infer_risk

def predict_risk(historial):

    for f in FACTS:
        if f not in historial:
            historial[f] = 0

    resultado = infer_risk(historial)

    return resultado