document.addEventListener("DOMContentLoaded", function () {
  // --- Affichage du nom/prénom de l'utilisateur ---
  const welcomeMsg = document.getElementById("welcomeMsg");
  if (welcomeMsg) {
    fetch("./asset/PHP/user.php", { credentials: "same-origin" })
      .then(res => res.json())
      .then(data => {
        if (!data.error && data.nom && data.prenom) {
          welcomeMsg.textContent = `Bienvenue, ${data.prenom} ${data.nom} !`;
        } else {
          // Pas connecté, redirection vers la page de connexion
          window.location.href = "PageConnection.html";
        }
      })
      .catch(() => {
        welcomeMsg.textContent = "Bienvenue ! `Bienvenue, ${data.prenom} ${data.nom} !`";
      });
  }

  // --- Déconnexion ---
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      fetch("./asset/PHP/logout.php", { credentials: "same-origin" })
        .then(() => {
          window.location.href = "PageConnection.html";
        })
        .catch(() => {
          alert("Erreur lors de la déconnexion.");
        });
    });
  }

  // --- Données simulées (trajets + messages) ---
  const data = {
    trajets_proposes: [
      { date: "10/07", depart: "Paris", arrivee: "Rouen", places: 2, statut: "Confirmé" },
      { date: "14/07", depart: "Orléans", arrivee: "Tours", places: 3, statut: "En attente" }
    ],
    trajets_reserves: [
      { date: "12/07", depart: "Lyon", arrivee: "Clermont", conducteur: "A. Martin", statut: "Confirmé" }
    ],
    messages: [
      { auteur: "Marc", contenu: "Est-ce que tu passes par Dijon ?" },
      { auteur: "Sophie", contenu: "Merci pour le trajet d'hier 🙏" }
    ]
  };

  // --- Remplissage des trajets proposés ---
  const proposesBody = document.querySelector("#trajets-proposes tbody");
  if (proposesBody) {
    data.trajets_proposes.forEach(trajet => {
      proposesBody.innerHTML += `
        <tr>
          <td>${trajet.date}</td>
          <td>${trajet.depart}</td>
          <td>${trajet.arrivee}</td>
          <td>${trajet.places}</td>
          <td>${trajet.statut}</td>
        </tr>`;
    });
  }

  // --- Remplissage des trajets réservés ---
  const reservesBody = document.querySelector("#trajets-reserves tbody");
  if (reservesBody) {
    data.trajets_reserves.forEach(trajet => {
      reservesBody.innerHTML += `
        <tr>
          <td>${trajet.date}</td>
          <td>${trajet.depart}</td>
          <td>${trajet.arrivee}</td>
          <td>${trajet.conducteur}</td>
          <td>${trajet.statut}</td>
        </tr>`;
    });
  }

  // --- Affichage des messages ---
  const messagesDiv = document.querySelector("#messages");
  if (messagesDiv) {
    data.messages.forEach(msg => {
      messagesDiv.innerHTML += `<p><strong>${msg.auteur} :</strong> ${msg.contenu}</p>`;
    });
  }
});
