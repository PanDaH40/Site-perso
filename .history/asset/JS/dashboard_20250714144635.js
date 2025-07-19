document.addEventListener("DOMContentLoaded", () => {
  const userStatus = document.getElementById("userStatus");
  const proposesBody = document.querySelector("#trajets-proposes tbody");
  const reservesBody = document.querySelector("#trajets-reserves tbody");
  const editModal = new bootstrap.Modal(document.getElementById("editTrajetModal"));
  const editForm = document.getElementById("editTrajetForm");

  // Vérifier la session utilisateur
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
      if (userStatus) userStatus.textContent = "Erreur lors de la vérification de la session.";
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
        (data.trajets_proposes || []).forEach(t => {
          // Liste des réservataires avec places
          const noms = Array.isArray(t.reservataires) && t.reservataires.length
            ? t.reservataires.map(r => `${r.prenom} ${r.nom} (${r.places_reservees})`).join(', ')
            : 'Aucune réservation';

          const statutConducteur = t.total_reservations > 0
            ? `${t.total_reservations} place(s) réservée(s): ${noms}`
            : 'Aucune réservation';

          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${t.date} ${t.heure}</td>
            <td>${t.depart}</td>
            <td>${t.arrivee}</td>
            <td>${t.places}</td>
            <td>${statutConducteur}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary" data-id="${t.id}" data-action="edit">✏️</button>
              <button class="btn btn-sm btn-outline-danger" data-id="${t.id}" data-action="delete">🗑️</button>
            </td>
          `;
          proposesBody.appendChild(row);
        });

        // Trajets réservés
        (data.trajets_reserves || []).forEach(t => {
          const statutPassager = t.statut_passager || `Réservé ${t.places_reservees} place(s)`;
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${t.date} ${t.heure}</td>
            <td>${t.depart}</td>
            <td>${t.arrivee}</td>
            <td>${t.conducteur_prenom} ${t.conducteur_nom}</td>
            <td>${statutPassager}</td>
            <td><button class="btn btn-sm btn-outline-warning" data-id="${t.id}" data-action="cancel">❌ Annuler</button></td>
          `;
          reservesBody.appendChild(row);
        });
      })
      .catch(err => {
        console.error("Erreur fetch trajets :", err);
        alert("Erreur lors du chargement des trajets.");
      });
  }

  // Gestion des actions éditer/supprimer/annuler
  document.body.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const row = btn.closest('tr');

    if (action === 'edit' && editForm) {
      const cells = row.querySelectorAll('td');
      editForm.trajetId.value = id;
      editForm.editDate.value = cells[0].textContent.split(' ')[0];
      editForm.editHeure.value = cells[0].textContent.split(' ')[1];
      editForm.editDepart.value = cells[1].textContent;
      editForm.editArrivee.value = cells[2].textContent;
      editForm.editPlaces.value = cells[3].textContent;
      editModal.show();
    }

    if (action === 'delete' && confirm('Voulez-vous vraiment supprimer ce trajet ?')) {
      fetch('./asset/PHP/delete_trajet.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      .then(res => res.json())
      .then(d => { if (d.success) chargerTrajets(); else alert('Erreur suppression : ' + d.error); });
    }

    if (action === 'cancel' && confirm('Voulez-vous annuler votre réservation ?')) {
      fetch('./asset/PHP/annuler_reservation.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      .then(res => res.json())
      .then(d => { if (d.success) chargerTrajets(); else alert('Erreur annulation : ' + d.error); });
    }
  });

  // Soumission du formulaire de modification
  if (editForm) {
    editForm.addEventListener('submit', e => {
      e.preventDefault();
      fetch('./asset/PHP/update_trajet.php', {
        method: 'POST',
        body: new FormData(editForm)
      })
      .then(res => res.json())
      .then(d => { if (d.success) { editModal.hide(); chargerTrajets(); } else alert('Erreur modification : ' + d.error); })
      .catch(err => { console.error('Erreur update :', err); alert('Erreur serveur.'); });
    });
  }
});
