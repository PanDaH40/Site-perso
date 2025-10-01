class DashboardManager {
  trajetsProposesMemo = [];
  modalInstance = null;
  isSignalement = false;

  constructor() {
    document.addEventListener('DOMContentLoaded', () => {
      this.init();
    });
  }

  init() {
    this.chargerDashboard();
    this.mettreAJourNotificationMessages();
    this.chargerTrajetsAValider();
    this.setupEventListeners();
    this.setupValidationModal();
    this.setupEditTrajetForm();
    setInterval(() => this.mettreAJourNotificationMessages(), 30000);
  }

  setupEventListeners() {
    // Déconnexion
    document.querySelectorAll('#logoutBtn').forEach(btn =>
      btn.addEventListener('click', () => {
        fetch('asset/PHP/logout.php', { method: 'POST', credentials: 'include' })
          .then(() => window.location.href = 'PageDaccueil.html')
          .catch(() => alert('Erreur lors de la déconnexion'));
      })
    );
  }

  setupValidationModal() {
    const validationModal = document.getElementById('validationFormModal');
    if (!validationModal) return;

    this.modalInstance = new bootstrap.Modal(validationModal);

    // Switch validation / signalement
    document.getElementById('switchSignalement').onclick = (e) => {
      e.preventDefault();
      this.isSignalement = !this.isSignalement;
      document.getElementById('bloc-valider-trajet').style.display = this.isSignalement ? "none" : "";
      document.getElementById('bloc-signalement').style.display = this.isSignalement ? "" : "none";
      document.getElementById('switchSignalement').textContent = this.isSignalement
        ? "Retour à la validation" : "Signaler un problème";
      document.getElementById('validation-feedback').textContent = "";
    };

    // Formulaire de validation / signalement
    document.getElementById('formValidationTrajet').onsubmit = async (e) => {
      e.preventDefault();
      await this.handleValidationFormSubmit();
    };
  }

  async handleValidationFormSubmit() {
    const feedbackEl = document.getElementById('validation-feedback');
    feedbackEl.textContent = "";
    const reservation_id = document.getElementById('reservationIdValider').value;
    if (!reservation_id) return;

    if (this.isSignalement) {
      const commentaire = document.getElementById('commentaire-probleme').value.trim();
      if (commentaire.length < 10) {
        feedbackEl.textContent = "Merci d'expliquer le problème (au moins 10 caractères)";
        return;
      }
      try {
        const res = await fetch('asset/PHP/valider_trajet_passager.php', {
          method: 'POST',
          credentials: 'include',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ reservation_id, action: 'probleme', commentaire })
        });
        const data = await res.json();
        if (data.success) {
          feedbackEl.textContent = "Votre signalement a bien été transmis à l'équipe.";
          setTimeout(() => { this.modalInstance.hide(); this.chargerTrajetsAValider(); }, 1500);
        } else {
          feedbackEl.textContent = data.error || "Erreur lors de l'envoi.";
        }
      } catch {
        feedbackEl.textContent = "Erreur technique lors de l'envoi.";
      }
      return;
    }

    // Validation normale avec note et avis
    const note = document.getElementById('note').value;
    if (!note) {
      feedbackEl.textContent = "Merci de donner une note.";
      document.getElementById('note').focus();
      return;
    }
    const avis = document.getElementById('avis').value.trim();

    try {
      const res = await fetch('asset/PHP/valider_trajet_passager.php', {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ reservation_id, action: 'valider', note, avis })
      });
      const data = await res.json();
      if (data.success) {
        feedbackEl.textContent = "Merci pour votre retour ! Le trajet est validé.";
        setTimeout(() => { this.modalInstance.hide(); this.chargerTrajetsAValider(); this.chargerDashboard(); }, 1500);
      } else {
        feedbackEl.textContent = data.error || "Erreur lors de la validation.";
      }
    } catch {
      feedbackEl.textContent = "Erreur technique lors de la validation.";
    }
  }

  setupEditTrajetForm() {
    const form = document.getElementById('editTrajetForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = {
        id: parseInt(form.trajetId.value, 10),
        date: form.editDate.value,
        heure: form.editHeure.value,
        depart: form.editDepart.value.trim(),
        arrivee: form.editArrivee.value.trim(),
        places: parseInt(form.editPlaces.value, 10),
        jetons: parseFloat(form.editJetons.value)
      };

      if (!data.date || !data.heure || !data.depart || !data.arrivee || isNaN(data.places) || data.places < 1 || isNaN(data.jetons) || data.jetons < 0) {
        alert('Merci de remplir correctement tous les champs.');
        return;
      }

      try {
        const res = await fetch('asset/PHP/update_trajet.php', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          alert('Trajet modifié avec succès');
          bootstrap.Modal.getInstance(document.getElementById('editTrajetModal')).hide();
          this.chargerDashboard();
        } else {
          alert(result.error || 'Erreur lors de la modification du trajet');
        }
      } catch (err) {
        alert('Erreur réseau lors de la modification');
        console.error(err);
      }
    });
  }

  mettreAJourNotificationMessages() {
    const notifBadge = document.getElementById('notif-badge');
    if (!notifBadge) return;

    fetch('asset/PHP/get_messages_recus.php', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const totalNonLus = data.totalNonLus || 0;
        notifBadge.textContent = totalNonLus;
        notifBadge.style.display = totalNonLus > 0 ? 'inline-block' : 'none';
      })
      .catch(() => { notifBadge.style.display = 'none'; });
  }

  chargerDashboard() {
    fetch('asset/PHP/trajets.php?dashboard=1', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }
        this.afficherStats(data);
        this.afficherTrajetsProposes(data.trajets_proposes || []);
        this.afficherTrajetsReserves(data.trajets_reserves || []);
        this.afficherDemandesReservations(data.demandes_en_attente || []);

        this.trajetsProposesMemo = data.trajets_proposes || [];
        if (data.user_prenom && document.getElementById('userFirstName'))
          document.getElementById('userFirstName').textContent = data.user_prenom;
      })
      .catch(() => alert("Erreur lors du chargement du dashboard"));
  }

  afficherStats(data) {
    document.getElementById('statProposes').textContent = (data.trajets_proposes || []).length;
    document.getElementById('statReserves').textContent = (data.trajets_reserves || []).length;
    let places = 0;
    (data.trajets_reserves || []).forEach(tr => { places += parseInt(tr.places_reservees || 0); });
    document.getElementById('statPlaces').textContent = places;
  }

  afficherTrajetsProposes(trajets) {
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

      let btnEtatHTML = '';
      if (trajet.etat_trajet === 'planifie') {
        btnEtatHTML = `<button class="btn btn-sm btn-success btn-start" data-id="${trajet.id}">Démarrer</button>`;
      } else if (trajet.etat_trajet === 'en_cours') {
        btnEtatHTML = `<button class="btn btn-sm btn-warning btn-end" data-id="${trajet.id}">Arrivée à destination</button>`;
      } else if (trajet.etat_trajet === 'termine') {
        btnEtatHTML = `<span class="badge bg-secondary">Terminé</span>`;
      }

      trEl.innerHTML = `
        <td>${this.formatDateHeure(trajet.date, trajet.heure)}</td>
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

    this.attachTrajetsProposesListeners();
  }

  attachTrajetsProposesListeners() {
    const tbody = document.getElementById('trajets-proposes');
    if (!tbody) return;

    tbody.querySelectorAll('.btn-modifier').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.ouvrirModification(id);
      });
    });
    tbody.querySelectorAll('.btn-supprimer').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.supprimerTrajet(id);
      });
    });
    tbody.querySelectorAll('.btn-start').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.changerEtatTrajet(id, 'en_cours');
      });
    });
    tbody.querySelectorAll('.btn-end').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.changerEtatTrajet(id, 'termine');
      });
    });
  }

  afficherTrajetsReserves(trajets) {
    const tbody = document.getElementById('trajets-reserves');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!trajets.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Aucun trajet réservé</td></tr>`;
      return;
    }

    trajets.forEach(trajet => {
      const reservationId = trajet.reservation_id ?? null;
      if (!reservationId) return;
      const trEl = document.createElement('tr');
      trEl.innerHTML = `
        <td>${this.formatDateHeure(trajet.date, trajet.heure)}</td>
        <td>${trajet.depart}</td>
        <td>${trajet.arrivee}</td>
        <td>${this.renderConducteurCell(trajet)}</td>
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

    tbody.querySelectorAll('.btn-annuler').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.annulerReservation(id);
      });
    });
  }

  afficherDemandesReservations(demandes) {
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
          <td>${this.formatDateHeure(dem.date, dem.heure).split(' ')[1]}</td>
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

    container.querySelectorAll('.btn-accepter').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.accepterReservation(id);
      });
    });
    container.querySelectorAll('.btn-refuser').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.refuserReservation(id);
      });
    });
  }

  accepterReservation(reservationId) {
    fetch('asset/PHP/valider_reservation.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ reservation_id: reservationId, action: 'accepter' }),
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Réservation acceptée.');
        this.chargerDashboard();
      } else {
        alert(data.error || 'Erreur lors de l\'acceptation.');
      }
    })
    .catch(() => alert('Erreur réseau.'));
  }

  refuserReservation(reservationId) {
    fetch('asset/PHP/valider_reservation.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ reservation_id: reservationId, action: 'refuser' }),
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Réservation refusée.');
        this.chargerDashboard();
      } else {
        alert(data.error || 'Erreur lors du refus.');
      }
    })
    .catch(() => alert('Erreur réseau.'));
  }

  renderConducteurCell(trajet) {
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

  formatDateHeure(date, heure) {
    if (!date) return '';
    const d = new Date(date + 'T' + (heure || '00:00:00'));
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }) 
      + ' ' + (heure || '');
  }

    ouvrirModification(trajetId) {
    const trajet = this.trajetsProposesMemo.find(tr => tr.id == trajetId);
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

  supprimerTrajet(trajetId) {
    if (!confirm("Supprimer ce trajet ? Cette action annulera toutes les réservations.")) return;

    fetch('asset/PHP/delete_trajet.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id: trajetId }),
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(data.message || "Trajet supprimé et participants notifiés.");
        this.chargerDashboard(); 
      } else {
        alert(data.error || "Erreur lors de la suppression.");
      }
    })
    .catch(() => alert("Erreur réseau lors de la suppression."));
  }

  annulerReservation(reservationId) {
    if (!confirm("Annuler cette réservation ?")) return;
    fetch('asset/PHP/annuler_reservation.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id: reservationId }),
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        this.chargerDashboard();
      } else {
        alert(data.error || "Erreur lors de l'annulation");
      }
    })
    .catch(() => alert('Erreur réseau lors de l\'annulation'));
  }

  changerEtatTrajet(trajetId, nouvelEtat) {
    fetch('asset/PHP/update_trajet_etat.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ trajet_id: trajetId, etat: nouvelEtat }),
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(`Trajet mis à jour : ${data.etat}`);
        this.chargerDashboard();
        this.chargerTrajetsAValider();
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    })
    .catch(() => alert('Erreur réseau lors de la mise à jour'));
  }

  async chargerTrajetsAValider() {
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
          <button class="btn btn-success btn-valider" data-reservation-id="${trajet.reservation_id}">Valider ou Signaler</button>
        `;
        container.appendChild(div);
      });
      container.querySelectorAll('.btn-valider').forEach(btn => {
        btn.addEventListener('click', () => {
          const reservationId = btn.getAttribute('data-reservation-id');
          this.ouvrirModalValidation(reservationId);
        });
      });
    } catch (e) {
      alert('Erreur lors du chargement des trajets à valider.');
      console.error(e);
    }
  }

  ouvrirModalValidation(reservation_id) {
    document.getElementById('reservationIdValider').value = reservation_id;
    document.getElementById('bloc-valider-trajet').style.display = "";
    document.getElementById('bloc-signalement').style.display = "none";
    document.getElementById('switchSignalement').textContent = "Signaler un problème";
    document.getElementById('note').value = "";
    document.getElementById('avis').value = "";
    document.getElementById('commentaire-probleme').value = "";
    document.getElementById('validation-feedback').textContent = "";
    if (window.bootstrap) {
      const modal = new bootstrap.Modal(document.getElementById('validationFormModal'));
      modal.show();
    }
  }
}

// Instanciation de la classe pour lancer le script
const dashboardManager = new DashboardManager();
