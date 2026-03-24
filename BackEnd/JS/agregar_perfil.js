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

const formPerfil = document.getElementById("formPerfil");

formPerfil.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    const nombre = document.getElementById("nombrePerfil").value.trim();
    const edad = Number(document.getElementById("edadPerfil").value);
    const sexo = document.getElementById("sexoPerfil").value;
    const peso = document.getElementById("pesoPerfil").value;
    const altura = document.getElementById("alturaPerfil").value;
    const telefono = document.getElementById("telefonoPerfil").value.trim();
    const correo = document.getElementById("correoPerfil").value.trim();
    const antecedentesDiabetes = document.getElementById("antecedentesDiabetesPerfil").value;
    const actividadFisica = document.getElementById("actividadFisicaPerfil").value;
    const observaciones = document.getElementById("observacionesPerfil").value.trim();
    const pesoNumero = peso ? Number(peso) : null;
    const alturaNumero = altura ? Number(altura) : null;

    await addDoc(collection(db, "users", user.uid, "perfiles"), {
        nombre,
        edad,
        sexo,
        peso: pesoNumero,
        altura: alturaNumero,
        imc: calcularIMC(pesoNumero, alturaNumero),
        telefono,
        correo,
        antecedentesDiabetes,
        actividadFisica,
        observaciones,
        createdAt: new Date()
    });

    window.location.href = "persona_dashboard.html";
});
