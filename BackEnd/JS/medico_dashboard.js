import { auth, db } from "./configurationFirebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { deleteClinicaCompleta } from "./crud_helpers.js";

const lista = document.getElementById("listaClinicas");

function crearItemClinica(user, clinicaId, clinica) {
    const li = document.createElement("li");
    const telefonoTexto = clinica.telefono ? ` | Tel: ${clinica.telefono}` : "";

    const descripcion = document.createElement("span");
    descripcion.textContent = `${clinica.nombre || "Clinica sin nombre"}${telefonoTexto}`;

    const acciones = document.createElement("div");
    acciones.className = "list-actions";

    const link = document.createElement("a");
    link.href = `clinica.html?id=${clinicaId}`;
    link.textContent = "Ver";

    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.className = "danger-button";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.addEventListener("click", async () => {
        const confirmado = window.confirm(`Eliminar la clinica ${clinica.nombre || "seleccionada"}?`);
        if (!confirmado) {
            return;
        }

        await deleteClinicaCompleta(user.uid, clinicaId);
        li.remove();

        if (!lista.children.length) {
            lista.innerHTML = "<li>No tienes clinicas registradas</li>";
        }
    });

    acciones.append(link, btnEliminar);
    li.append(descripcion, acciones);
    return li;
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../../index.html";
        return;
    }

    lista.innerHTML = "";

    const ref = collection(db, "users", user.uid, "clinicas");
    const snapshot = await getDocs(ref);

    if (snapshot.empty) {
        lista.innerHTML = "<li>No tienes clinicas registradas</li>";
        return;
    }

    snapshot.forEach((docSnap) => {
        lista.appendChild(crearItemClinica(user, docSnap.id, docSnap.data()));
    });
});
