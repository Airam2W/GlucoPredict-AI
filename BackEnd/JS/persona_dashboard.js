import { auth, db } from "./configurationFirebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { deletePerfilCompleto } from "./crud_helpers.js";

const lista = document.getElementById("listaPerfiles");

function crearItemPerfil(user, perfilId, data) {
    const li = document.createElement("li");
    const edadTexto = data.edad ? `Edad: ${data.edad}` : "Edad: -";
    const sexoTexto = data.sexo ? ` | Sexo: ${data.sexo}` : "";

    const descripcion = document.createElement("span");
    descripcion.innerHTML = `<strong>${data.nombre || "Perfil sin nombre"}</strong> (${edadTexto}${sexoTexto})`;

    const acciones = document.createElement("div");
    acciones.className = "list-actions";

    const link = document.createElement("a");
    link.href = `perfil_persona.html?id=${perfilId}`;
    link.textContent = "Ver";
    link.addEventListener("click", () => {
        localStorage.setItem("perfilId", perfilId);
    });

    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.className = "danger-button";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.addEventListener("click", async () => {
        const confirmado = window.confirm(`Eliminar el perfil ${data.nombre || "seleccionado"}?`);
        if (!confirmado) {
            return;
        }

        await deletePerfilCompleto(user.uid, perfilId);
        li.remove();

        if (!lista.children.length) {
            lista.innerHTML = "<li>No hay perfiles registrados</li>";
        }
    });

    acciones.append(link, btnEliminar);
    li.append(descripcion, acciones);
    return li;
}

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "../../index.html";
        return;
    }

    const ref = collection(db, "users", user.uid, "perfiles");
    const snapshot = await getDocs(ref);

    lista.innerHTML = "";

    if (snapshot.empty) {
        lista.innerHTML = "<li>No hay perfiles registrados</li>";
        return;
    }

    snapshot.forEach((docSnap) => {
        lista.appendChild(crearItemPerfil(user, docSnap.id, docSnap.data()));
    });
});
