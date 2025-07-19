document.addEventListener("DOMContentLoaded", () => {
  const userStatus = document.getElementById("userStatus");
  const proposesBody = document.querySelector("#trajets-proposes tbody");
  const reservesBody = document.querySelector("#trajets-reserves tbody");
  const editModal = new bootstrap.Modal(document.getElementById("editTrajetModal"));
  const editForm = document.getElementById("editTrajetForm");

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

        if (proposesBody && Array.isArray(data.trajets_proposes)) {
          if (data.trajets_proposes.length === 0) {
            proposesBody.innerHTML = `<tr><td colspan="6">Aucun trajet proposé.</td></tr>`;
          } else {
            data.trajets_proposes.forEach(t => {
              const statut = t.total_reservations > 0
                ? `${t.total_reservations} places réservées<br><strong>Par :</strong> ${t.reservataires || '-'}` +
                  `<br><button class="btn btn-sm btn-outline-success mt-1" data-id="${t.id}" data-action="valider">Valider</button>` +
                  ` <button class="btn btn-sm btn-outline-danger mt-1" data-id="${t.id}" data-action="refuser">Refuser</button>`
                : 'Aucune réservation';

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
          }
        }

        if (reservesBody && Array.isArray(data.trajets_reserves)) {
          if (data.trajets_reserves.length === 0) {
            reservesBody.innerHTML = `<tr><td colspan="6">Aucun trajet réservé.</td></tr>`;
          } else {
            data.trajets_reserves.forEach(t => {
              const row = document.createElement("tr");
              row.innerHTML = `
                <td>${t.date} ${t.heure}</td>
                <td>${t.depart}</td>
                <td>${t.arrivee}</td>
                <td>${t.conducteur_prenom} ${t.conducteur_nom}</td>
                <td>${t.statut}</td>
                <td>
                  <button class="btn btn-sm btn-outline-warning" data-id="${t.id}" data-action="cancel">❌ Annuler</button>
                </td>
              `;
              reservesBody.appendChild(row);
            });
          }
        }
      })
      .catch(err => {
        console.error("Erreur fetch trajets:", err);
        alert("Erreur lors du chargement des trajets.");
      });
  }

  document.body.addEventListener("click", e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const row = btn.closest("tr");

    if (action === "edit") {
      const cells = row.querySelectorAll("td");
      document.getElementById("trajetId").value = id;
      document.getElementById("editDate").value = cells[0].textContent.split(" ")[0];
      document.getElementById("editHeure").value = cells[0].textContent.split(" ")[1];
      document.getElementById("editDepart").value = cells[1].textContent;
      document.getElementById("editArrivee").value = cells[2].textContent;
      document.getElementById("editPlaces").value = cells[3].textContent;
      editModal.show();
    }

    if (action === "delete") {
      if (confirm("Voulez-vous vraiment supprimer ce trajet ?")) {
        fetch("./asset/PHP/delete_trajet.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) chargerTrajets();
            else alert("Erreur suppression : " + data.error);
          });
      }
    }

    if (action === "cancel") {
      if (confirm("Voulez-vous annuler votre réservation ?")) {
        fetch("./asset/PHP/annuler_reservation.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) chargerTrajets();
            else alert("Erreur annulation : " + data.error);
          });
      }
    }

    if (action === "valider" || action === "refuser") {
      fetch(`./asset/PHP/${action}_reservation.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trajet_id: id })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) chargerTrajets();
          else alert(`Erreur ${action} : ` + data.error);
        })
        .catch(() => alert("Erreur serveur"));
    }
  });

  if (editForm) {
    editForm.addEventListener("submit", e => {
      e.preventDefault();
      const formData = new FormData(editForm);

      fetch("./asset/PHP/update_trajet.php", {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            editModal.hide();
            chargerTrajets();
          } else {
            alert("Erreur modification : " + data.error);
          }
        })
        .catch(err => alert("Erreur serveur."));
    });
  }
});
