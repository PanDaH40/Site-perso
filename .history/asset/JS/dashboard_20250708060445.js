document.addEventListener("DOMContentLoaded", function () {
  const welcomeMsg = document.getElementById("welcomeMsg");

  fetch("./asset/PHP/user.php", { credentials: "same-origin" })
    .then(res => res.json())
    .then(data => {
      if (data.nom_complet) {
        welcomeMsg.textContent = `Bienvenue, ${data.nom_complet} !`;
      } else {
        window.location.href = "PageConnection.html";
      }
    })
    .catch(() => {
      welcomeMsg.textContent = "Bienvenue !";
    });

  // Déconnexion
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

  // Récupérer trajets depuis le serveur
  fetch("./asset/PHP/get_trajets.php", { credentials: "same-origin" })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        console.error(data.error);
        return;
      }

      // Trajets proposés
      const proposesBody = document.querySelector("#trajets-proposes tbody");
      if (proposesBody) {
        proposesBody.innerHTML = "";
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

      // Trajets réservés
      const reservesBody = document.querySelector("#trajets-reserves tbody");
      if (reservesBody) {
        reservesBody.innerHTML = "";
        data.trajets_reserves.forEach(trajet => {
          const conducteurNomComplet = `${trajet.conducteur_prenom} ${trajet.conducteur_nom}`;
          reservesBody.innerHTML += `
            <tr>
              <td>${trajet.date}</td>
              <td>${trajet.depart}</td>
              <td>${trajet.arrivee}</td>
              <td>${conducteurNomComplet}</td>
              <td>${trajet.statut}</td>
            </tr>`;
        });
      }
    })
    .catch(err => console.error("Erreur fetch trajets:", err));
});
