// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
  chargerDashboard();

  // Exemple gestion déconnexion (à adapter selon ton système)
  document.querySelectorAll('#logoutBtn').forEach(btn =>
    btn.addEventListener('click', () => {
      // Déconnecte, puis redirige vers l'accueil ou la page de login
      fetch('asset/PHP/logout.php', { method: 'POST' })
        .then(() => window.location.href = 'PageDaccueil.html');
    })
  );
});

// ---------------------- Chargement du dashboard ----------------------

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

      // Affiche le prénom de l'utilisateur si dispo (optionnel)
      if (window.userFirstName && document.getElementById('userFirstName'))
        document.getElementById('userFirstName').textContent = window.userFirstName;
    })
    .catch(() => alert("Erreur lors du chargement du dashboard"));
}

// ---------------------- Statistiques ----------------------

function afficherStats(data) {
  document.getElementById('statProposes').textContent = (data.trajets_proposes || []).length;
  document.getElementById('statReserves').textContent = (data.trajets_reserves || []).length;
  // Calcul places réservées total :
  let places = 0;
  (data.trajets_reserves || []).forEach(tr => { places += parseInt(tr.places_reservees || 0); });
  document.getElementById('statPlaces').textContent = places;
}

// ---------------------- Trajets proposés ----------------------
function afficherTrajetsProposes(trajets) {
  const tbody = document.getElementById('trajets-proposes');
  tbody.innerHTML = '';

  if (!trajets.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Aucun trajet proposé</td></tr>`;
    return;
  }

  trajets.forEach(trajet => {
    const trEl = document.createElement('tr');
    const placesDispo = trajet.places - (trajet.total_reservations || 0);

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

// ---------------------- Trajets réservés ----------------------
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
    <div class="conductor-info">
      <img src="${avatar}" class="conductor-avatar me-2" alt="">
      <span>${trajet.conducteur_prenom} ${trajet.conducteur_nom}</span>
    </div>
  `;
}


// -------- Formatage date/heure --------

function formatDateHeure(date, heure) {
  if (!date) return '';
  // Format FR court
  const d = new Date(date + 'T' + (heure || '00:00:00'));
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }) 
    + ' ' + (heure || '');
}

// ---------------------- Actions ----------------------

// Ouvre la modal de modification (à compléter selon ton flux)
function ouvrirModification(trajetId) {
  // TODO : pré-remplir la modal avec les infos du trajet
  // document.getElementById('trajetId').value = trajetId;
  // ... afficher la modal ...
  alert("Fonction modification à implémenter");
}

// Suppression de trajet proposé (à compléter selon ton flux)
function supprimerTrajet(trajetId) {
  if (!confirm("Supprimer ce trajet ?")) return;
  fetch('asset/PHP/supprimer_trajet.php', {
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

// Annuler une réservation (exemple générique)
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
