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
        userStatus.textContent = "Vous n'êtes pas connecté. Veuillez vous connecter pour accéder au dashboard.";
      }
    })
    .catch(err => {
      console.error("Erreur check session :", err);
      userStatus.textContent = "Erreur lors de la vérification de la connexion.";
    });

  // Charge les trajets proposés et réservés
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

        // Trajets proposés
        const proposes = data.trajets_proposes || [];
        if (proposes.length === 0) {
          proposesBody.innerHTML = `<tr><td colspan="6">Aucun trajet proposé.</td></tr>`;
        } else {
          proposes.forEach(t => {
            const statut = t.total_reservations > 0
              ? `${t.total_reservations} place(s) réservée(s)<br><strong>Par :</strong> ${t.reservataires}`
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
        }

        // Trajets réservés
        const reserves = data.trajets_reserves || [];
        if (reserves.length === 0) {
          reservesBody.innerHTML = `<tr><td colspan="6">Aucun trajet réservé.</td></tr>`;
        } else {
          reserves.forEach(t => {
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
        }
      })
      .catch(err => {
        console.error("Erreur fetch trajets:", err);
        alert("Erreur lors du chargement des trajets.");
      });
  }

  // Gestion des actions (edit, delete, cancel)
  document.body.addEventListener("click", e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const row = btn.closest("tr");

    if (action === "edit") {
      const cells = row.querySelectorAll("td");
      editForm.trajetId.value = id;
      editForm.editDate.value = cells[0].textContent.split(" ")[0];
      editForm.editHeure.value = cells[0].textContent.split(" ")[1];
      editForm.editDepart.value = cells[1].textContent;
      editForm.editArrivee.value = cells[2].textContent;
      editForm.editPlaces.value = cells[3].textContent;
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
          .then(d => {
            if (d.success) chargerTrajets();
            else alert("Erreur suppression : " + d.error);
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
          .then(d => {
            if (d.success) chargerTrajets();
            else alert("Erreur annulation : " + d.error);
          });
      }
    }
  });

  // Soumission du formulaire de modification
  if (editForm) {
    editForm.addEventListener("submit", e => {
      e.preventDefault();
      const formData = new FormData(editForm);

      fetch("./asset/PHP/update_trajet.php", {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(d => {
          if (d.success) {
            editModal.hide();
            chargerTrajets();
          } else {
            alert("Erreur modification : " + d.error);
          }
        })
        .catch(() => alert("Erreur serveur."));
    });
  }
});
