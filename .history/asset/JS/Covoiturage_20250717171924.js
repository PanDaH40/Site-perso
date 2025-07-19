let trajetsProposesMemo = []; // Variable globale pour stocker les trajets proposés

document.addEventListener('DOMContentLoaded', () => {
  chargerDashboard();

  // Met à jour la notification messages (badge sur la cloche)
  mettreAJourNotificationMessages();

  // Charger les trajets à valider (passager)
  chargerTrajetsAValider();

  // Logout
  document.querySelectorAll('#logoutBtn').forEach(btn =>
    btn.addEventListener('click', () => {
      fetch('asset/PHP/logout.php', { method: 'POST', credentials: 'include' })
        .then(() => window.location.href = 'PageDaccueil.html')
        .catch(() => alert('Erreur lors de la déconnexion'));
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
      const jetons = document.getElementById('editJetons').value;

      fetch('asset/PHP/update_trajet.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id, date, heure, depart, arrivee, places, jetons }),
        credentials: 'include'
      })
      .then(res => {
        if (!res.ok) throw new Error('Erreur réseau');
        return res.json();
      })
      .then(data => {
        if (data.success) {
          bootstrap.Modal.getInstance(document.getElementById('editTrajetModal')).hide();
          chargerDashboard();
        } else {
          alert(data.error || "Erreur lors de la modification");
        }
      })
      .catch(() => alert("Erreur réseau lors de la modification"));
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
  fetch('/TPCovoiturage/asset/PHP/trajets.php?dashboard=1', { credentials: 'include' })
    .then(res => {
      if (!res.ok) throw new Error('Erreur réseau');
      return res.json();
    })
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
  if (!tbody) return;
  tbody.innerHTML = '';

  const now = new Date();
  trajets = trajets.filter(trajet => {
    const dt = new Date(trajet.date + 'T' + (trajet.heure || '00:00:00'));
    return dt > now;
  });

  if (!trajets.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Aucun trajet proposé</td></tr>`;
    return;
  }

  trajets.forEach(trajet => {
    const trEl = document.createElement('tr');
    const placesDispo = trajet.places - (parseInt(trajet.total_reservations) || 0);

    // Boutons d'état selon etat_trajet
    let btnEtatHTML = '';
    if (trajet.etat_trajet === 'planifie') {
      btnEtatHTML = `<button class="btn btn-sm btn-success btn-start" data-id="${trajet.id}">Démarrer</button>`;
    } else if (trajet.etat_trajet === 'en_cours') {
      btnEtatHTML = `<button class="btn btn-sm btn-warning btn-end" data-id="${trajet.id}">Arrivée à destination</button>`;
    } else if (trajet.etat_trajet === 'termine') {
      btnEtatHTML = `<span class="badge bg-secondary">Terminé</span>`;
    }

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
      <td>${trajet.jetons}</td>
      <td>
        <span class="badge bg-info">${trajet.statut_conducteur || ''}</span>
      </td>
      <td class="text-center actions-btns">
        <button class="btn btn-sm btn-outline-primary me-1 btn-modifier" title="Modifier" data-id="${trajet.id}">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-supprimer" title="Supprimer" data-id="${trajet.id}">
          <i class="bi bi-trash"></i>
        </button>
        ${btnEtatHTML}
      </td>
    `;

    tbody.appendChild(trEl);
  });

  // Ajouter les listeners après création
  tbody.querySelectorAll('.btn-modifier').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      ouvrirModification(id);
    });
  });
  tbody.querySelectorAll('.btn-supprimer').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      supprimerTrajet(id);
    });
  });

  tbody.querySelectorAll('.btn-start').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      changerEtatTrajet(id, 'en_cours');
    });
  });
  tbody.querySelectorAll('.btn-end').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      changerEtatTrajet(id, 'termine');
    });
  });
}

// --- Trajets réservés ---
function afficherTrajetsReserves(trajets) {
  const tbody = document.getElementById('trajets-reserves');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!trajets.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Aucun trajet réservé</td></tr>`;
    return;
  }

  trajets.forEach(trajet => {
    const reservationId = trajet.reservation_id ?? null;
    if (!reservationId) {
      console.warn('Pas d’id réservation pour ce trajet réservé', trajet);
      return;
    }
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
        <button class="btn btn-sm btn-outline-danger btn-annuler" title="Annuler la réservation" data-id="${reservationId}">
          <i class="bi bi-x-circle"></i>
        </button>
      </td>
    `;
    tbody.appendChild(trEl);
  });

  // Ajouter listeners annuler réservation
  tbody.querySelectorAll('.btn-annuler').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      annulerReservation(id);
    });
  });
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
          <button class="btn btn-success btn-sm btn-accepter me-1" data-id="${dem.reservation_id}">Accepter</button>
          <button class="btn btn-danger btn-sm btn-refuser" data-id="${dem.reservation_id}">Refuser</button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;

  // Ajouter listeners accepter/refuser
  container.querySelectorAll('.btn-accepter').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      accepterReservation(id);
    });
  });
  container.querySelectorAll('.btn-refuser').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      refuserReservation(id);
    });
  });
}

// --- Accepter une demande ---
function accepterReservation(reservationId) {
  fetch('asset/PHP/valider_reservation.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ reservation_id: reservationId, action: 'accepter' }),
    credentials: 'include'
  })
  .then(res => {
    if (!res.ok) throw new Error('Erreur réseau');
    return res.json();
  })
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
  .then(res => {
    if (!res.ok) throw new Error('Erreur réseau');
    return res.json();
  })
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
  document.getElementById('editJetons').value = trajet.jetons;

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
  .then(res => {
    if (!res.ok) throw new Error('Erreur réseau');
    return res.json();
  })
  .then(data => {
    if (data.success) {
      chargerDashboard();
    } else {
      alert(data.error || "Erreur lors de la suppression");
    }
  })
  .catch(() => alert('Erreur réseau lors de la suppression'));
}

// --- Annuler une réservation ---
// Attention : ici il faut envoyer l'id de la réservation, pas du trajet
function annulerReservation(reservationId) {
  if (!confirm("Annuler cette réservation ?")) return;
  fetch('asset/PHP/annuler_reservation.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ id: reservationId }),
    credentials: 'include'
  })
  .then(res => {
    if (!res.ok) throw new Error('Erreur réseau');
    return res.json();
  })
  .then(data => {
    if (data.success) {
      chargerDashboard();
    } else {
      alert(data.error || "Erreur lors de l'annulation");
    }
  })
  .catch(() => alert('Erreur réseau lors de l\'annulation'));
}

// --- Changer état trajet (démarrer / terminer) ---
function changerEtatTrajet(trajetId, nouvelEtat) {
  fetch('asset/PHP/update_trajet_etat.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ trajet_id: trajetId, etat: nouvelEtat }),
    credentials: 'include'
  })
  .then(res => {
    if (!res.ok) throw new Error('Erreur réseau');
    return res.json();
  })
  .then(data => {
    if (data.success) {
      alert(`Trajet mis à jour : ${data.etat}`);
      chargerDashboard();
      chargerTrajetsAValider(); // Mise à jour des trajets à valider aussi
    } else {
      alert(data.error || 'Erreur lors de la mise à jour');
    }
  })
  .catch(() => alert('Erreur réseau lors de la mise à jour'));
}

// --- Charger et afficher les trajets à valider par le passager ---
async function chargerTrajetsAValider() {
  try {
    const res = await fetch('asset/PHP/get_trajets_a_valider.php', { credentials: 'include' });
    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return;
    }

    const container = document.getElementById('trajets-a-valider');
    if (!container) return;
    container.innerHTML = '';

    if (!data.trajets_a_valider || data.trajets_a_valider.length === 0) {
      container.textContent = 'Aucun trajet à valider pour l’instant.';
      return;
    }

    data.trajets_a_valider.forEach(trajet => {
      const div = document.createElement('div');
      div.className = 'trajet-validation mb-3 p-3 border rounded';

      div.innerHTML = `
        <p><strong>Date:</strong> ${trajet.date} ${trajet.heure}<br>
        <strong>De:</strong> ${trajet.depart} <strong>À:</strong> ${trajet.arrivee}</p>
        <button class="btn btn-success btn-valider" data-reservation-id="${trajet.reservation_id}">Valider ce trajet</button>
      `;

      container.appendChild(div);
    });

    container.querySelectorAll('.btn-valider').forEach(btn => {
      btn.addEventListener('click', async () => {
        const reservationId = btn.getAttribute('data-reservation-id');
        try {
          const resVal = await fetch('asset/PHP/valider_trajet_passager.php', {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ reservation_id: reservationId })
          });
          const result = await resVal.json();
          if (result.success) {
            alert(result.message);
            chargerTrajetsAValider();
            chargerDashboard();
          } else {
            alert(result.error || 'Erreur lors de la validation.');
          }
        } catch {
          alert('Erreur réseau lors de la validation.');
        }
      });
    });
  } catch (e) {
    alert('Erreur lors du chargement des trajets à valider.');
    console.error(e);
  }
}
