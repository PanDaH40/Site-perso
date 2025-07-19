document.addEventListener("DOMContentLoaded", function () {
  // Affiche le nom complet de l'utilisateur depuis PHP
  const welcomeMsg = document.getElementById("welcomeMsg");

  fetch("./asset/PHP/user.php", { credentials: "same-origin" })
    .then(res => res.json())
    .then(data => {
      if (data.nom_complet) {
        welcomeMsg.textContent = `Bienvenue, ${data.nom_complet} !`;
      } else {
        // Si pas connecté, redirige vers la page de connexion
        window.location.href = "PageConnection.html";
      }
    })
    .catch(() => {
      welcomeMsg.textContent = "Bienvenue !";
    });

  // Gestion de la déconnexion
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

  // Données simulées (à remplacer par appels API en production)
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

  // Remplissage des trajets proposés
  const proposesBody = document.querySelector("#trajets-proposes tbody");
  if (proposesBody) {
    proposesBody.innerHTML = ""; // Vide d’abord au cas où
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

  // Remplissage des trajets réservés
  const reservesBody = document.querySelector("#trajets-reserves tbody");
  if (reservesBody) {
    reservesBody.innerHTML = "";
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

  // Affichage des messages
  const messagesDiv = document.querySelector("#messages");
  if (messagesDiv) {
    messagesDiv.innerHTML = "";
    data.messages.forEach(msg => {
      messagesDiv.innerHTML += `<p><strong>${msg.auteur} :</strong> ${msg.contenu}</p>`;
    });
  }
});
