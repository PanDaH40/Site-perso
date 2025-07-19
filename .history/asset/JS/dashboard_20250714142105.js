document.addEventListener("DOMContentLoaded", () => {
  const userStatus = document.getElementById("userStatus");
  const proposesBody = document.querySelector("#trajets-proposes tbody");
  const reservesBody = document.querySelector("#trajets-reserves tbody");
  const editModal = new bootstrap.Modal(document.getElementById("editTrajetModal"));
  const editForm = document.getElementById("editTrajetForm");

  // Vérifier session
  fetch("./asset/PHP/check_session.php", { credentials: "same-origin" })
    .then(res => res.json())
    .then(data => {
      if (data.connected) {
        userStatus.textContent = `Connecté en tant que ${data.user.prenom}`;
        chargerTrajets();
      } else {
        userStatus.textContent = "Non connecté";
      }
    })
    .catch(err => {
      console.error("Erreur session:", err);
      userStatus.textContent = "Erreur session";
    });

  // Charge trajets
  function chargerTrajets() {
    proposesBody.innerHTML = "";
    reservesBody.innerHTML = "";

    fetch("./asset/PHP/trajets.php", { credentials: "same-origin" })
      .then(res => res.json())
      .then(data => {
        // Proposés
        data.trajets_proposes.forEach(t => {
          const statut = t.statut_conducteur;
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${t.date} ${t.heure}</td>
            <td>${t.depart}</td>
            <td>${t.arrivee}</td>
            <td>${t.places}</td>
            <td>${statut}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary" data-id="${t.id}" data-action="edit">✏️</button>
              <button class="btn btn-sm btn-outline-danger" data-id="${t.id}" data-action="delete">🗑️</button>
            </td>
          `;
          proposesBody.appendChild(row);
        });

        // Réservés
        data.trajets_reserves.forEach(t => {
          const statut = t.statut_passager;
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${t.date} ${t.heure}</td>
            <td>${t.depart}</td>
            <td>${t.arrivee}</td>
            <td>${t.conducteur_prenom} ${t.conducteur_nom}</td>
            <td>${statut}</td>
            <td><button class="btn btn-sm btn-outline-warning" data-id="${t.id}" data-action="cancel">❌ Annuler</button></td>
          `;
          reservesBody.appendChild(row);
        });
      })
      .catch(err => console.error("Erreur fetch:", err));
  }

  // Actions edit/delete/cancel
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

    if (action === "delete" && confirm("Supprimer?")) {
      fetch("./asset/PHP/delete_trajet.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      .then(res => res.json())
      .then(d => { if (d.success) chargerTrajets(); else alert(d.error); });
    }

    if (action === "cancel" && confirm("Annuler?")) {
      fetch("./asset/PHP/annuler_reservation.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      .then(res => res.json())
      .then(d => { if (d.success) chargerTrajets(); else alert(d.error); });
    }
  });

  // Form edit submit
  if (editForm) {
    editForm.addEventListener("submit", e => {
      e.preventDefault();
      fetch("./asset/PHP/update_trajet.php", { method: "POST", body: new FormData(editForm) })
        .then(res => res.json())
        .then(d => { if (d.success) { editModal.hide(); chargerTrajets(); } else alert(d.error); });
    });
  }
});
