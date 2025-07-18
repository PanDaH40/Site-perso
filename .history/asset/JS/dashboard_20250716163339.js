// dashboard.js

let trajetsProposesMemo = [];

document.addEventListener('DOMContentLoaded', () => {
  chargerDashboard();

  document.querySelectorAll('#logoutBtn').forEach(btn =>
    btn.addEventListener('click', () => {
      fetch('asset/PHP/logout.php', { method: 'POST' })
        .then(() => window.location.href = 'PageDaccueil.html');
    })
  );

  // Gestion du formulaire de modification
  document.getElementById('editTrajetForm').addEventListener('submit', function(e) {
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
      body: JSON.stringify({ id, date, heure, depart, arrivee, places, prix })
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
});

// -------- Chargement du dashboard --------

function chargerDashboard() {
  fetch('asset/PHP/trajets.php?dashboard=1')
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      afficherStats(data);
      afficherTrajetsProposes(data.trajets_proposes || []);
      afficherTrajetsReserves(data.trajets_reserves || []);
      trajetsProposesMemo = data.trajets_proposes || [];
      if (window.userFirstName && document.getElementById('userFirstName'))
        document.getElementById('userFirstName').textContent = window.userFirstName;
    })
    .catch(() => alert("Erreur lors du chargement du dashboard"));
}

// -------- Statistiques --------

function afficherStats(data) {
  document.getElementById('statProposes').textContent = (data.trajets_proposes || []).length;
  document.getElementById('statReserves').textContent = (data.trajets_reserves || []).length;
  let places = 0;
  (data.trajets_reserves || []).forEach(tr => { places += parseInt(tr.places_reservees || 0); });
  document.getElementById('statPlaces').textContent = places;
}

// -------- Trajets proposés --------

function afficherTrajetsProposes(trajets) {
  const tbody = document.getElementById('trajets-proposes');
  tbody.innerHTML = '';

  // Filtrage : futurs SEULEMENT (optionnel si déjà filtré côté PHP)
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
          : `<span class="badge badge-complet">Complet</span> / ${trajet.places}`
        }
      </td>
      <td>${trajet.prix} €</td>
      <td>
        <span class="badge badge-en-cours">${trajet.statut_conducteur || ''}</span>
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

// -------- Trajets réservés --------

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
        <span class="badge badge-en-cours">${trajet.statut_passager || ''}</span>
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

// -------- Affichage conducteur (photo, nom) --------

function renderConducteurCell(trajet) {
  let avatar = trajet.conducteur_avatar 
    ? (trajet.conducteur_avatar.startsWith('/')
        ? trajet.conducteur_avatar
        : 'asset/Images/' + trajet.conducteur_avatar)
    : 'asset/Images/default_03.png';
  return `
    <div class="conductor-info d-flex align-items-center">
      <img src="${avatar}" class="conductor-avatar me-2" style="width:36px;height:36px;object-fit:cover;border-radius:50%;border:1.5px solid #ddd;">
      <span>${trajet.conducteur_prenom ? trajet.conducteur_prenom : ''} ${trajet.conducteur_nom ? trajet.conducteur_nom : ''}</span>
    </div>
  `;
}

// -------- Formatage date/heure --------

function formatDateHeure(date, heure) {
  if (!date) return '';
  const d = new Date(date + 'T' + (heure || '00:00:00'));
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }) 
    + ' ' + (heure || '');
}

// -------- Modification d'un trajet --------

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

// -------- Suppression de trajet --------

function supprimerTrajet(trajetId) {
  if (!confirm("Supprimer ce trajet ?")) return;
  fetch('asset/PHP/delete_trajet.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ id: trajetId })
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

// -------- Annuler une réservation --------

function annulerReservation(trajetId) {
  if (!confirm("Annuler cette réservation ?")) return;
  fetch('asset/PHP/annuler_reservation.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ id: trajetId })
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
