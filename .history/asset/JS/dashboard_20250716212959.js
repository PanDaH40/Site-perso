let trajetsProposesMemo = []; // Variable globale pour stocker les trajets proposés

document.addEventListener('DOMContentLoaded', () => {
  chargerDashboard();

  // Met à jour la notification messages (badge sur la cloche)
  mettreAJourNotificationMessages();

  // Logout
  document.querySelectorAll('#logoutBtn').forEach(btn =>
    btn.addEventListener('click', () => {
      fetch('asset/PHP/logout.php', { method: 'POST', credentials: 'include' })
        .then(() => window.location.href = 'PageDaccueil.html');
    })
  );

  // Formulaire modification trajet
  const editForm = document.getElementById('editTrajetForm');
  if (editForm) {
    editForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const id = document.getElementById('trajetId').value;
      const date = document.getElementById('editDate').value;
      const heure = document.getElementById('editHeure').value;
      const depart = document.getElementById('editDepart').value;
      const arrivee = document.getElementById('editArrivee').value;
      const places = document.getElementById('editPlaces').value;
      const prix = document.getElementById('editPrix').value;

      fetch('asset/PHP/update_trajet.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id, date, heure, depart, arrivee, places, prix }),
        credentials: 'include'
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          bootstrap.Modal.getInstance(document.getElementById('editTrajetModal')).hide();
          chargerDashboard();
        } else {
          alert(data.error || "Erreur lors de la modification");
        }
      });
    });
  }

  // Mise à jour périodique de la notification messages (toutes les 30 sec)
  setInterval(mettreAJourNotificationMessages, 30000);
});

// --- Mise à jour notification messages ---
function mettreAJourNotificationMessages() {
  const notifBadge = document.getElementById('notif-badge');
  if (!notifBadge) return;

  fetch('asset/PHP/get_messages_recus.php', { credentials: 'include' })
    .then(res => {
      if (!res.ok) throw new Error('Erreur réseau');
      return res.json();
    })
    .then(data => {
      const totalNonLus = data.totalNonLus || 0;
      if (totalNonLus > 0) {
        notifBadge.textContent = totalNonLus;
        notifBadge.style.display = 'inline-block';
      } else {
        notifBadge.style.display = 'none';
      }
    })
    .catch(() => {
      notifBadge.style.display = 'none';
    });
}

// --- Chargement et affichage dashboard ---
function chargerDashboard() {
  fetch('asset/PHP/trajets.php?dashboard=1', { credentials: 'include' })
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      afficherStats(data);
      afficherTrajetsProposes(data.trajets_proposes || []);
      afficherTrajetsReserves(data.trajets_reserves || []);
      afficherDemandesReservations(data.demandes_en_attente || []);

      trajetsProposesMemo = data.trajets_proposes || [];
      if (data.user_prenom && document.getElementById('userFirstName'))
        document.getElementById('userFirstName').textContent = data.user_prenom;
    })
    .catch(() => alert("Erreur lors du chargement du dashboard"));
}

// --- Affiche demandes de réservation en attente (conducteur uniquement) ---
function afficherDemandesReservations(demandes) {
  const container = document.getElementById('demandes-reservations-section');
  if (!container) return;

  if (!demandes.length) {
    container.innerHTML = '<p class="text-muted">Aucune demande de réservation en attente.</p>';
    return;
  }

  let html = `
    <h3>Demandes de réservation en attente</h3>
    <table class="table table-sm table-bordered">
      <thead>
        <tr>
          <th>Passager</th>
          <th>Date</th>
          <th>Heure</th>
          <th>Départ</th>
          <th>Arrivée</th>
          <th>Places demandées</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  demandes.forEach(dem => {
    html += `
      <tr>
        <td>${dem.passager_prenom} ${dem.passager_nom}</td>
        <td>${formatDateHeure(dem.date, dem.heure).split(' ')[1]}</td>
        <td>${dem.heure}</td>
        <td>${dem.depart}</td>
        <td>${dem.arrivee}</td>
        <td>${dem.places_reservees}</td>
        <td>
          <button class="btn btn-success btn-sm me-1" onclick="accepterReservation(${dem.reservation_id})">Accepter</button>
          <button class="btn btn-danger btn-sm" onclick="refuserReservation(${dem.reservation_id})">Refuser</button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// --- Accepter une demande ---
function accepterReservation(reservationId) {
  fetch('asset/PHP/valider_reservation.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ reservation_id: reservationId, action: 'accepter' }),
    credentials: 'include'
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      alert('Réservation acceptée.');
      chargerDashboard();
    } else {
      alert(data.error || 'Erreur lors de l\'acceptation.');
    }
  })
  .catch(() => alert('Erreur réseau.'));
}

// --- Refuser une demande ---
function refuserReservation(reservationId) {
  fetch('asset/PHP/valider_reservation.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ reservation_id: reservationId, action: 'refuser' }),
    credentials: 'include'
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      alert('Réservation refusée.');
      chargerDashboard();
    } else {
      alert(data.error || 'Erreur lors du refus.');
    }
  })
  .catch(() => alert('Erreur réseau.'));
}

// --- Le reste de tes fonctions ... (afficherTrajetsProposes, afficherTrajetsReserves, etc.) restent identiques ---
