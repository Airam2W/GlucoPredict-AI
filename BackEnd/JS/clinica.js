import { auth, db } from "./configurationFirebase.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { deleteClinicaCompleta, deletePacienteCompleto } from "./crud_helpers.js";

const params = new URLSearchParams(window.location.search);
const clinicaId = params.get("id");

const nombreClinica = document.getElementById("nombreClinica");
const direccionClinica = document.getElementById("direccionClinica");
const telefonoClinica = document.getElementById("telefonoClinica");
const correoClinica = document.getElementById("correoClinica");
const responsableClinica = document.getElementById("responsableClinica");
const especialidadClinica = document.getElementById("especialidadClinica");
const horarioClinica = document.getElementById("horarioClinica");
const listaPacientes = document.getElementById("listaPacientes");
const btnAgregarPaciente = document.getElementById("btnAgregarPaciente");
const btnEliminarClinica = document.getElementById("btnEliminarClinica");

if (!clinicaId) {
    alert("Clinica no encontrada");
    window.location.href = "medico_dashboard.html";
}

function textoSeguro(valor, prefijo = "") {
    if (!valor) {
        return `${prefijo}-`;
    }
    return `${prefijo}${valor}`;
}

function crearItemPaciente(user, pacienteId, paciente) {
    const li = document.createElement("li");
    const edadTexto = paciente.edad ? ` (Edad: ${paciente.edad})` : "";

    const descripcion = document.createElement("span");
    descripcion.textContent = `${paciente.nombre || "Paciente sin nombre"}${edadTexto}`;

    const acciones = document.createElement("div");
    acciones.className = "list-actions";

    const link = document.createElement("a");
    link.href = `paciente.html?id=${pacienteId}&clinica=${clinicaId}`;
    link.textContent = "Ver perfil";

    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.className = "danger-button";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.addEventListener("click", async () => {
        const confirmado = window.confirm(`Eliminar al paciente ${paciente.nombre || "seleccionado"}?`);
        if (!confirmado) {
            return;
        }

        await deletePacienteCompleto(user.uid, clinicaId, pacienteId);
        li.remove();

        if (!listaPacientes.children.length) {
            listaPacientes.innerHTML = "<li>No hay pacientes registrados</li>";
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

    const clinicaRef = doc(db, "users", user.uid, "clinicas", clinicaId);
    const clinicaSnap = await getDoc(clinicaRef);

    if (!clinicaSnap.exists()) {
        alert("Clinica no encontrada");
        return;
    }

    const clinica = clinicaSnap.data();
    nombreClinica.textContent = `Clinica: ${clinica.nombre}`;
    direccionClinica.textContent = textoSeguro(clinica.direccion, "Direccion: ");
    telefonoClinica.textContent = textoSeguro(clinica.telefono, "Telefono: ");
    correoClinica.textContent = textoSeguro(clinica.correo, "Correo: ");
    responsableClinica.textContent = textoSeguro(clinica.responsable, "Responsable medico: ");
    especialidadClinica.textContent = textoSeguro(clinica.especialidad, "Especialidad: ");
    horarioClinica.textContent = textoSeguro(clinica.horario, "Horario: ");

    const pacientesRef = collection(db, "users", user.uid, "clinicas", clinicaId, "pacientes");
    const snapshot = await getDocs(pacientesRef);
    listaPacientes.innerHTML = "";

    if (snapshot.empty) {
        listaPacientes.innerHTML = "<li>No hay pacientes registrados</li>";
    } else {
        snapshot.forEach((docSnap) => {
            listaPacientes.appendChild(crearItemPaciente(user, docSnap.id, docSnap.data()));
        });
    }

    btnEliminarClinica.onclick = async () => {
        const confirmado = window.confirm(`Eliminar la clinica ${clinica.nombre || "seleccionada"} y todos sus pacientes?`);
        if (!confirmado) {
            return;
        }

        await deleteClinicaCompleta(user.uid, clinicaId);
        window.location.href = "medico_dashboard.html";
    };
});

btnAgregarPaciente.onclick = () => {
    window.location.href = `agregar_paciente.html?clinica=${clinicaId}`;
};
