document.addEventListener("DOMContentLoaded", () => {
  const userStatus = document.getElementById("userStatus");
  const proposesBody = document.querySelector("#trajets-proposes tbody");
  const reservesBody = document.querySelector("#trajets-reserves tbody");

  // Vérification de la connexion utilisateur
  fetch("./asset/PHP/check_session.php", { credentials: "same-origin" })
    .then(res => res.json())
    .then(data => {
      if (data.connected) {
        if (userStatus) {
          userStatus.textContent = `Connecté en tant que ${data.user.prenom}`;
        }
        chargerTrajets();
      } else {
        if (userStatus) {
          userStatus.textContent = "Vous n'êtes pas connecté. Veuillez vous connecter pour accéder au dashboard.";
        }
        // Optionnel : Redirection si nécessaire
        // window.location.href = "login.html";
      }
    })
    .catch(err => {
      console.error("Erreur check session :", err);
      if (userStatus) userStatus.textContent = "Erreur lors de la vérification de la connexion.";
    });

  function chargerTrajets() {
    if (proposesBody) proposesBody.innerHTML = "";
    if (reservesBody) reservesBody.innerHTML = "";

    fetch("./asset/PHP/trajets.php", { credentials: "same-origin" })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert("Erreur : " + data.error);
          return;
        }

        // Affichage des trajets proposés
        if (proposesBody && Array.isArray(data.trajets_proposes)) {
          if (data.trajets_proposes.length === 0) {
            proposesBody.innerHTML = `<tr><td colspan="5">Aucun trajet proposé.</td></tr>`;
          } else {
            data.trajets_proposes.forEach(t => {
              proposesBody.innerHTML += `
                <tr>
                  <td>${t.date} ${t.heure}</td>
                  <td>${t.depart}</td>
                  <td>${t.arrivee}</td>
                  <td>${t.places}</td>
                  <td>${t.statut}</td>
                </tr>`;
            });
          }
        }

        // Affichage des trajets réservés
        if (reservesBody && Array.isArray(data.trajets_reserves)) {
          if (data.trajets_reserves.length === 0) {
            reservesBody.innerHTML = `<tr><td colspan="5">Aucun trajet réservé.</td></tr>`;
          } else {
            data.trajets_reserves.forEach(t => {
              reservesBody.innerHTML += `
                <tr>
                  <td>${t.date} ${t.heure}</td>
                  <td>${t.depart}</td>
                  <td>${t.arrivee}</td>
                  <td>${t.conducteur_prenom} ${t.conducteur_nom}</td>
                  <td>${t.statut}</td>
                </tr>`;
            });
          }
        }
      })
      .catch(err => {
        console.error("Erreur fetch trajets:", err);
        alert("Erreur lors du chargement des trajets.");
      });
  }
});
