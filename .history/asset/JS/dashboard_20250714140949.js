document.addEventListener("DOMContentLoaded", () => {
  const userStatus = document.getElementById("userStatus");
  const proposesBody = document.querySelector("#trajets-proposes tbody");
  const reservesBody = document.querySelector("#trajets-reserves tbody");
  const editModal = new bootstrap.Modal(document.getElementById("editTrajetModal"));
  const editForm = document.getElementById("editTrajetForm");

  // Vérifie la session utilisateur
  fetch("./asset/PHP/check_session.php", { credentials: "same-origin" })
    .then(res => res.json())
    .then(data => {
      if (data.connected) {
        userStatus.textContent = `Connecté en tant que ${data.user.prenom}`;
        chargerTrajets();
      } else {
        userStatus.textContent = "Vous n'êtes pas connecté.";
      }
    })
    .catch(err => {
      console.error("Erreur check session :", err);
      userStatus.textContent = "Erreur de session.";
    });

  // Charge les trajets proposés et réservés
  function chargerTrajets() {
    proposesBody.innerHTML = "";
    reservesBody.innerHTML = "";

    fetch("./asset/PHP/trajets.php", { credentials: "same-origin" })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert("Erreur : " + data.error);
          return;
        }

        // Trajets proposés
        data.trajets_proposes.forEach(t => {
          // Récupérer les réservataires pour ce trajet
          const nomsReservataires = t.reservataires || "Aucun";
          const statut = t.total_reservations > 0
            ? `${t.total_reservations} place(s) réservée(s)<br><strong>Par :</strong> ${nomsReservataires}`
            : "Aucune réservation";

          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${t.date} ${t.heure}</td>
            <td>${t.depart}</td>
            <td>${t.arrivee}</td>
            <td>${t.places}</td>
            <td>${statut}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary me-1" data-id="${t.id}" data-action="edit">✏️</button>
              <button class="btn btn-sm btn-outline-danger" data-id="${t.id}" data-action="delete">🗑️</button>
            </td>
          `;
          proposesBody.appendChild(row);
        });

        // Trajets réservés
        data.trajets_reserves.forEach(t => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${t.date} ${t.heure}</td>
            <td>${t.depart}</td>
            <td>${t.arrivee}</td>
            <td>${t.conducteur_prenom} ${t.conducteur_nom}</td>
            <td>${t.statut}</td>
            <td><button class="btn btn-sm btn-outline-warning" data-id="${t.id}" data-action="cancel">❌ Annuler</button></td>
          `;
          reservesBody.appendChild(row);
        });
      })
      .catch(err => {
        console.error("Erreur fetch trajets:", err);
        alert("Erreur chargement : " + err.message);
      });
  }

  // Management of events and edit form omitted for brevity...
});
