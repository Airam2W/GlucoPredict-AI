import { db } from "./configurationFirebase.js";
import {
    collection,
    deleteDoc,
    doc,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function eliminarHistorialActual(rutaBase) {
    await deleteDoc(doc(db, ...rutaBase, "historial_clinico", "actual"));
}

export async function deletePacienteCompleto(userId, clinicaId, pacienteId) {
    await eliminarHistorialActual([
        "users", userId,
        "clinicas", clinicaId,
        "pacientes", pacienteId
    ]);

    await deleteDoc(doc(
        db,
        "users", userId,
        "clinicas", clinicaId,
        "pacientes", pacienteId
    ));
}

export async function deletePerfilCompleto(userId, perfilId) {
    await eliminarHistorialActual([
        "users", userId,
        "perfiles", perfilId
    ]);

    await deleteDoc(doc(db, "users", userId, "perfiles", perfilId));
}

export async function deleteClinicaCompleta(userId, clinicaId) {
    const pacientesRef = collection(
        db,
        "users", userId,
        "clinicas", clinicaId,
        "pacientes"
    );

    const pacientesSnap = await getDocs(pacientesRef);

    for (const pacienteDoc of pacientesSnap.docs) {
        await deletePacienteCompleto(userId, clinicaId, pacienteDoc.id);
    }

    await deleteDoc(doc(db, "users", userId, "clinicas", clinicaId));
}
