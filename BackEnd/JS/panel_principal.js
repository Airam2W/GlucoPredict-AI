import { auth } from "./configurationFirebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const db = getFirestore();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../../index.html";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    window.user = userSnap.data();
    console.log("Usuario actual:", window.user);
    
    if (window.user.tipo === "GRATIS") {
      document.getElementById("pagaButton").style.display = "block";
    }
  } else {
    console.log("No existe documento para este usuario en Firestore");
  }
});

// Botones
document.getElementById("btnClinicas").onclick = () =>
  window.location.href = "../../FrontEnd/HTML/medico_dashboard.html";

document.getElementById("btnPerfiles").onclick = () =>
  window.location.href = "../../FrontEnd/HTML/persona_dashboard.html";

document.getElementById("logoutBtn").onclick = () => auth.signOut();

document.getElementById("pagaButton").onclick = () =>
  window.location.href = "../../FrontEnd/HTML/paga.html?where=boton";