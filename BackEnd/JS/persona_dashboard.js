import { auth, db } from "./configurationFirebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { deletePerfilCompleto } from "./crud_helpers.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { MAX_PERFILES } from "./reestrinccionesLicencia.js";

const lista = document.getElementById("listaPerfiles");

const btnAgregarPerfil = document.getElementById("btnAgregarPerfil");

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

    const numeroPerfiles = snapshot.size;
    console.log(`Número de perfiles: ${numeroPerfiles}`);

    if (numeroPerfiles >= MAX_PERFILES) {
        // Reestringir acceso a características de usuario no PAGA
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            window.user = userSnap.data();
            console.log("Usuario actual:", window.user);
            console.log("Tipo de usuario:", window.user.tipo);
            
            if (window.user.tipo !== "PAGA") {
                btnAgregarPerfil.title = "Solo disponible maximo 3 perfiles para usuarios no PAGA. Actualiza a PAGA para agregar más.";
                btnAgregarPerfil.style.backgroundColor = "var(--disabled-bg)";
                btnAgregarPerfil.style.cursor = "not-allowed";
                btnAgregarPerfil.onclick = () => {
                    const respuesta = confirm("Solo disponible maximo 3 perfiles para usuarios no PAGA. ¿Deseas ir a la página de pago?");
                    if (respuesta) {
                        // El usuario presionó "Aceptar"
                        window.location.href = "../../FrontEnd/HTML/paga.html?where=perfiles";
                    } else {
                        // El usuario presionó "Cancelar"
                        console.log("El usuario decidió no ir a la página de pago");
                    }
                };
                
            }
        } else {
            console.log("No existe documento para este usuario en Firestore");
        }
    }

    lista.innerHTML = "";

    if (snapshot.empty) {
        lista.innerHTML = "<li>No hay perfiles registrados</li>";
        return;
    }

    snapshot.forEach((docSnap) => {
        lista.appendChild(crearItemPerfil(user, docSnap.id, docSnap.data()));
    });
});


btnAgregarPerfil.onclick = () => {
    window.location.href = "agregar_perfil.html";
};
