import { auth, db } from "./configurationFirebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { deletePerfilCompleto } from "./crud_helpers.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { MAX_PERFILES } from "./restriccionesLicencia.js";

const lista = document.getElementById("listaPerfiles");

const btnAgregarPerfil = document.getElementById("btnAgregarPerfil");

function crearItemPerfil(user, perfilId, data) {
    const li = document.createElement("li");
    li.className = "perfil-card";

    // Encabezado con nombre a la izquierda y flecha a la derecha
    const header = document.createElement("div");
    header.className = "perfil-header";

    const nombre = document.createElement("strong");
    nombre.textContent = data.nombre || "Perfil sin nombre";

    const arrow = document.createElement("span");
    arrow.className = "perfil-arrow";
    arrow.textContent = "▼"; // cerrado por defecto

    const btnVer = document.createElement("button");
    btnVer.textContent = "Ver";
    btnVer.className = "primary-button";
    btnVer.addEventListener("click", () => {
        localStorage.setItem("perfilId", perfilId);
        window.location.href = `perfil_persona.html?id=${perfilId}`;
    });

    const headerRight = document.createElement("div");
    headerRight.className = "perfil-header-right";
    headerRight.append(arrow, btnVer);

    header.append(nombre, headerRight);

    // Contenido oculto por defecto
    const content = document.createElement("div");
    content.className = "perfil-content hidden";

    const linea = document.createElement("hr");

    const edadTexto = data.edad ? `<strong>Edad:</strong> ${data.edad} años` : "Edad no especificada";
    const sexoTexto = data.sexo ? `<strong>Sexo:</strong> ${data.sexo}` : "Sexo no especificado";
    const observacionesTexto = data.observaciones ? `<strong>Observaciones:</strong> ${data.observaciones}` : "Sin observaciones";
    const fechaTexto = data.createdAt ? `<strong>Creado el:</strong> ${new Date(data.createdAt.seconds * 1000).toLocaleDateString()} a las ${new Date(data.createdAt.seconds * 1000).toLocaleTimeString()}` : "Fecha de creación no especificada";

    const info = document.createElement("div");
    info.className = "perfil-info";
    info.innerHTML = `
        <p>${edadTexto}</p>
        <p>${sexoTexto}</p>
        <p>${observacionesTexto}</p>
        <p>${fechaTexto}</p>
    `;

    const acciones = document.createElement("div");
    acciones.className = "perfil-actions";

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.className = "danger-button";
    btnEliminar.addEventListener("click", async () => {
        const confirmado = window.confirm(`¿Eliminar el perfil ${data.nombre || "seleccionado"}?`);
        if (!confirmado) return;
        await deletePerfilCompleto(user.uid, perfilId);
        li.remove();
        if (!lista.children.length) {
            lista.innerHTML = "<li>No hay perfiles registrados</li>";
        }
    });

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.className = "primary-button";
    btnEditar.addEventListener("click", () => {
        window.location.href = `agregar_perfil.html?id=${perfilId}`;
    });

    acciones.append(btnEditar, btnEliminar);
    content.append(linea, info, acciones);

    // Toggle expandir/colapsar
    header.addEventListener("click", () => {
        content.classList.toggle("hidden");
        arrow.textContent = content.classList.contains("hidden") ? "▼" : "▲";
    });

    li.append(header, content);
    return li;
}

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "../../index.html";
        return;
    }

    document.getElementById("btnComun").title = "Modulo de la Seccion para Medicos en desarrollo. ¡Próximamente!";
    document.getElementById("btnComun").style.backgroundColor = "var(--disabled-bg)";
    document.getElementById("btnComun").style.cursor = "not-allowed";
    document.getElementById("btnComun").onclick = () => {
        alert("Modulo de la Seccion para Medicos en desarrollo. ¡Próximamente!");
    };

    const ref = collection(db, "users", user.uid, "perfiles");
    const snapshot = await getDocs(ref);

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        window.user = userSnap.data();
        console.log("Usuario actual:", window.user);

        if (window.user.tipo === "GRATIS") {
            document.getElementById("pagaButton").style.display = "block";
            console.log("Usuario tipo GRATIS, mostrando botón de pago");
        }
    } else {
        console.log("No existe documento para este usuario en Firestore");
    }

    const numeroPerfiles = snapshot.size;
    console.log(`Número de perfiles: ${numeroPerfiles}`);

    if (numeroPerfiles >= MAX_PERFILES) {
        // Restringir acceso a características de usuario no PAGA
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            window.user = userSnap.data();
            console.log("Usuario actual:", window.user);
            console.log("Tipo de usuario:", window.user.tipo);

            if (window.user.tipo !== "PAGA") {
                btnAgregarPerfil.title = "Solo disponible máximo 3 perfiles para usuarios no PAGA. Actualiza a PAGA para agregar más.";
                btnAgregarPerfil.style.backgroundColor = "var(--disabled-bg)";
                btnAgregarPerfil.style.cursor = "not-allowed";
                btnAgregarPerfil.onclick = () => {
                    const respuesta = confirm("Solo disponible máximo 3 perfiles para usuarios no PAGA. ¿Deseas ir a la página de pago?");
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

document.getElementById("logoutBtn").onclick = () => auth.signOut();

/*
document.getElementById("btnComun").onclick = async () => {
    const user = auth.currentUser;
    if (!user) {
        console.error("No hay usuario autenticado");
        return;
    }

    const userRef = doc(db, "users", user.uid);

    try {
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();

            if (userData.uso === "comun") {
                await updateDoc(userRef, { uso: "medico" });
                window.location.href = "medico_dashboard.html";
            } else {
                console.log("El usuario no es 'comun', no se actualiza");
            }
        } else {
            console.log("No existe documento para este usuario en Firestore");
        }
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
    }
};
*/



document.getElementById("pagaButton").onclick = () =>
    window.location.href = "../../FrontEnd/HTML/paga.html?where=perfiles";