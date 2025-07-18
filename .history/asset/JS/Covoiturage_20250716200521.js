let trajetsProposesMemo = []; // Variable globale pour stocker les trajets proposés

document.addEventListener('DOMContentLoaded', () => {
  chargerDashboard();

  // Met à jour la notification messages (badge sur la cloche)
  mettreAJourNotificationMessages();

  // Logout
  document.querySelectorAll('#logoutBtn').forEach(btn =>
    btn.addEventListener('click', () => {
      fetch('asset/PHP/logout.php', { method: 'POST' })
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
      if (notifBadge) notifBadge.style.display = 'none';
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
      afficherDemandesReservations(data.demandes_reservations || []);

      trajetsProposesMemo = data.trajets_proposes || [];
      if (data.user_prenom && document.getElementById('userFirstName'))
        document.getElementById('userFirstName').textContent = data.user_prenom;
    })
    .catch(() => alert("Erreur lors du chargement du dashboard"));
}

// --- Statistiques ---
function afficherStats(data) {
  document.getElementById('statProposes').textContent = (data.trajets_proposes || []).length;
  document.getElementById('statReserves').textContent = (data.trajets_reserves || []).length;
  let places = 0;
  (data.trajets_reserves || []).forEach(tr => { places += parseInt(tr.places_reservees || 0); });
  document.getElementById('statPlaces').textContent = places;
}

// --- Trajets proposés ---
function afficherTrajetsProposes(trajets) {
  const tbody = document.getElementById('trajets-proposes');
  tbody.innerHTML = '';

  const now = new Date();
  trajets = trajets.filter(trajet => {
    const dt = new Date(trajet.date + 'T' + (trajet.heure || '00:00:00'));
    return dt > now;
  });

  if (!trajets.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Aucun trajet proposé</td></tr>`;
    return;
  }

  trajets.forEach(trajet => {
    const trEl = document.createElement('tr');
    const placesDispo = trajet.places - (parseInt(trajet.total_reservations) || 0);

    trEl.innerHTML = `
      <td>${formatDateHeure(trajet.date, trajet.heure)}</td>
      <td>${trajet.depart}</td>
      <td>${trajet.arrivee}</td>
      <td>
        ${placesDispo > 0 
          ? `<span class="fw-bold">${placesDispo}</span> / ${trajet.places}`
          : `<span class="badge bg-danger">Complet</span> / ${trajet.places}`
        }
      </td>
      <td>${trajet.prix} €</td>
      <td>
        <span class="badge bg-info">${trajet.statut_conducteur || ''}</span>
      </td>
      <td class="text-center actions-btns">
        <button class="btn btn-sm btn-outline-primary me-1" title="Modifier" onclick="ouvrirModification(${trajet.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" title="Supprimer" onclick="supprimerTrajet(${trajet.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(trEl);
  });
}

// --- Trajets réservés ---
function afficherTrajetsReserves(trajets) {
  const tbody = document.getElementById('trajets-reserves');
  tbody.innerHTML = '';

  if (!trajets.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Aucun trajet réservé</td></tr>`;
    return;
  }

  trajets.forEach(trajet => {
    const trEl = document.createElement('tr');
    trEl.innerHTML = `
      <td>${formatDateHeure(trajet.date, trajet.heure)}</td>
      <td>${trajet.depart}</td>
      <td>${trajet.arrivee}</td>
      <td>${renderConducteurCell(trajet)}</td>
      <td>
        <span class="badge bg-success">${trajet.statut_passager || ''}</span>
      </td>
      <td class="text-center actions-btns">
        <button class="btn btn-sm btn-outline-danger" title="Annuler la réservation" onclick="annulerReservation(${trajet.id})">
          <i class="bi bi-x-circle"></i>
        </button>
      </td>
    `;
    tbody.appendChild(trEl);
  });
}

// --- Affiche demandes de réservation en attente (conducteur uniquement) ---
function afficherDemandesReservations(demandes) {
  const container = document.getElementById('demandes-reservations-section');
  if (!container) return; // si pas présent dans le DOM

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
    body: JSON.stringify({ id: reservationId, action: 'accepter' }), // clé id ici conforme à valider_reservation.php
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
    body: JSON.stringify({ id: reservationId, action: 'refuser' }),
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

// --- Affichage conducteur (photo, nom) ---
function renderConducteurCell(trajet) {
  let avatar = trajet.conducteur_avatar 
    ? (trajet.conducteur_avatar.startsWith('asset/') || trajet.conducteur_avatar.startsWith('/')
        ? trajet.conducteur_avatar
        : 'asset/Images/' + trajet.conducteur_avatar)
    : 'asset/Images/default_03.png';
  return `
    <div class="conductor-info d-flex align-items-center">
      <img src="${avatar}" alt="Avatar conducteur" class="conductor-avatar me-2" style="width:36px;height:36px;object-fit:cover;border-radius:50%;border:1.5px solid #ddd;"
           onerror="this.onerror=null; this.src='asset/Images/default_03.png';" />
      <span>${trajet.conducteur_prenom || ''} ${trajet.conducteur_nom || ''}</span>
    </div>
  `;
}

// --- Formatage date/heure ---
function formatDateHeure(date, heure) {
  if (!date) return '';
  const d = new Date(date + 'T' + (heure || '00:00:00'));
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }) 
    + ' ' + (heure || '');
}

// --- Modifier un trajet ---
function ouvrirModification(trajetId) {
  const trajet = trajetsProposesMemo.find(tr => tr.id == trajetId);
  if (!trajet) {
    alert("Trajet non trouvé");
    return;
  }
  document.getElementById('trajetId').value = trajet.id;
  document.getElementById('editDate').value = trajet.date;
  document.getElementById('editHeure').value = trajet.heure;
  document.getElementById('editDepart').value = trajet.depart;
  document.getElementById('editArrivee').value = trajet.arrivee;
  document.getElementById('editPlaces').value = trajet.places;
  document.getElementById('editPrix').value = trajet.prix;

  const modal = new bootstrap.Modal(document.getElementById('editTrajetModal'));
  modal.show();
}

// --- Supprimer un trajet ---
function supprimerTrajet(trajetId) {
  if (!confirm("Supprimer ce trajet ?")) return;
  fetch('asset/PHP/delete_trajet.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ id: trajetId }),
    credentials: 'include'
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      chargerDashboard();
    } else {
      alert(data.error || "Erreur lors de la suppression");
    }
  });
}

// --- Annuler une réservation ---
function annulerReservation(trajetId) {
  if (!confirm("Annuler cette réservation ?")) return;
  fetch('asset/PHP/annuler_reservation.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ id: trajetId }),
    credentials: 'include'
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      chargerDashboard();
    } else {
      alert(data.error || "Erreur lors de l'annulation");
    }
  });
}
