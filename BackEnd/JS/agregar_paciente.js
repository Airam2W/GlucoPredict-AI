import { auth, db } from "./configurationFirebase.js";
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

function calcularIMC(peso, alturaCm) {
    const pesoNum = Number(peso);
    const alturaNum = Number(alturaCm);

    if (!pesoNum || !alturaNum) {
        return null;
    }

    const alturaMetros = alturaNum / 100;
    return Number((pesoNum / (alturaMetros * alturaMetros)).toFixed(1));
}

const params = new URLSearchParams(window.location.search);
const clinicaId = params.get("clinica");

const btnVolver = document.getElementById("btnVolver");
const formPaciente = document.getElementById("formPaciente");

if (!clinicaId) {
    alert("Clinica no encontrada");
    window.location.href = "medico_dashboard.html";
}

btnVolver.onclick = () => {
    window.location.href = `clinica.html?id=${clinicaId}`;
};

formPaciente.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    const nombre = document.getElementById("nombrePaciente").value.trim();
    const edad = Number(document.getElementById("edadPaciente").value);
    const sexo = document.getElementById("sexoPaciente").value;
    const peso = document.getElementById("pesoPaciente").value;
    const altura = document.getElementById("alturaPaciente").value;
    const telefono = document.getElementById("telefonoPaciente").value.trim();
    const correo = document.getElementById("correoPaciente").value.trim();
    const contactoEmergencia = document.getElementById("contactoEmergenciaPaciente").value.trim();
    const tipoSangre = document.getElementById("tipoSangrePaciente").value.trim();
    const observaciones = document.getElementById("observacionesPaciente").value.trim();
    const pesoNumero = peso ? Number(peso) : null;
    const alturaNumero = altura ? Number(altura) : null;

    await addDoc(
        collection(db, "users", user.uid, "clinicas", clinicaId, "pacientes"),
        {
            nombre,
            edad,
            sexo,
            peso: pesoNumero,
            altura: alturaNumero,
            imc: calcularIMC(pesoNumero, alturaNumero),
            telefono,
            correo,
            contactoEmergencia,
            tipoSangre,
            observaciones,
            createdAt: new Date()
        }
    );

    window.location.href = `clinica.html?id=${clinicaId}`;
});
