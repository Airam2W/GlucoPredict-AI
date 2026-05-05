import { auth, db } from "./configurationFirebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { deleteClinicaCompleta } from "./crud_helpers.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { MAX_CLINICAS } from "./reestrinccionesLicencia.js";

const lista = document.getElementById("listaClinicas");



const btnAgregarClinica = document.getElementById("btnAgregarClinica");

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

    const numeroClinicas = snapshot.size;
    console.log("Número de clínicas:", numeroClinicas);

    if (numeroClinicas >= MAX_CLINICAS) {
        // Reestringir acceso a características de usuario no PAGA
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            window.user = userSnap.data();
            console.log("Usuario actual:", window.user);
            console.log("Tipo de usuario:", window.user.tipo);
            
            if (window.user.tipo !== "PAGA") {
                btnAgregarClinica.title = "Solo disponible maximo 1 clínica para usuarios no PAGA. Actualiza a PAGA para agregar más.";
                btnAgregarClinica.style.backgroundColor = "var(--disabled-bg)";
                btnAgregarClinica.style.cursor = "not-allowed";
                btnAgregarClinica.onclick = () => {
                    const respuesta = confirm("Solo disponible maximo 1 clínica para usuarios no PAGA. ¿Deseas ir a la página de pago?");
                    if (respuesta) {
                        // El usuario presionó "Aceptar"
                        window.location.href = "../../FrontEnd/HTML/paga.html?where=clinicas";
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


    if (snapshot.empty) {
        lista.innerHTML = "<li>No tienes clinicas registradas</li>";
        return;
    }

    snapshot.forEach((docSnap) => {
        lista.appendChild(crearItemClinica(user, docSnap.id, docSnap.data()));
    });
});

btnAgregarClinica.onclick = () => {
    window.location.href = "agregar_clinica.html";
}
