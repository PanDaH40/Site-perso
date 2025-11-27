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
    document.querySelectorAll('#logoutBtn').forEach(btn =>
      btn.addEventListener('click', () => {
        fetch('/PHP/logout.php', { method: 'POST', credentials: 'include' })
          .then(() => window.location.href = 'PageDaccueil.html')
          .catch(() => alert('Erreur lors de la déconnexion'));
      })
    );
  }

  setupValidationModal() {
    const validationModal = document.getElementById('validationFormModal');
    if (!validationModal) return;

    this.modalInstance = new bootstrap.Modal(validationModal);

    document.getElementById('switchSignalement').onclick = (e) => {
      e.preventDefault();
      this.isSignalement = !this.isSignalement;
      document.getElementById('bloc-valider-trajet').style.display = this.isSignalement ? "none" : "";
      document.getElementById('bloc-signalement').style.display = this.isSignalement ? "" : "none";
      document.getElementById('switchSignalement').textContent = this.isSignalement
        ? "Retour à la validation" : "Signaler un problème";
      document.getElementById('validation-feedback').textContent = "";
    };

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

    // SIGNALER PROBLÈME
    if (this.isSignalement) {
      const commentaire = document.getElementById('commentaire-probleme').value.trim();
      if (commentaire.length < 10) {
        feedbackEl.textContent = "Merci d'expliquer le problème (au moins 10 caractères)";
        return;
      }

      try {
        const res = await fetch('/PHP/valider_trajet_passager.php', {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            reservation_id,
            action: "probleme",
            commentaire
          })
        });

        const data = await res.json();
        if (data.success) {
          feedbackEl.textContent = "Signalement envoyé.";
          setTimeout(() => {
            this.modalInstance.hide();
            this.chargerTrajetsAValider();
          }, 1500);
        } else {
          feedbackEl.textContent = data.error;
        }

      } catch {
        feedbackEl.textContent = "Erreur technique.";
      }
      return;
    }

    // VALIDATION NORMALE
    const note = document.getElementById('note').value;
    const avis = document.getElementById('avis').value.trim();

    if (!note) {
      feedbackEl.textContent = "Merci de donner une note.";
      return;
    }

    try {
      const res = await fetch('/PHP/valider_trajet_passager.php', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reservation_id, action: "valider", note, avis })
      });

      const data = await res.json();
      if (data.success) {
        feedbackEl.textContent = "Merci pour votre retour.";
        setTimeout(() => {
          this.modalInstance.hide();
          this.chargerTrajetsAValider();
          this.chargerDashboard();
        }, 1500);
      } else {
        feedbackEl.textContent = data.error;
      }

    } catch {
      feedbackEl.textContent = "Erreur serveur.";
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

      if (!data.date || !data.heure || !data.depart || !data.arrivee || isNaN(data.places) || isNaN(data.jetons)) {
        alert("Merci de remplir correctement tous les champs.");
        return;
      }

      try {
        const res = await fetch('/PHP/update_trajet.php', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data)
        });

        const result = await res.json();
        if (result.success) {
          alert("Trajet modifié.");
          bootstrap.Modal.getInstance(document.getElementById('editTrajetModal')).hide();
          this.chargerDashboard();
        } else {
          alert(result.error);
        }

      } catch {
        alert("Erreur réseau.");
      }
    });
  }

  mettreAJourNotificationMessages() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;

    fetch('/PHP/get_messages_recus.php', { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        badge.textContent = d.totalNonLus || 0;
        badge.style.display = d.totalNonLus > 0 ? "inline-block" : "none";
      });
  }

  chargerDashboard() {
    fetch('/PHP/trajets.php?dashboard=1', { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.error) return alert(data.error);

        this.afficherStats(data);
        this.afficherTrajetsProposes(data.trajets_proposes || []);
        this.afficherTrajetsReserves(data.trajets_reserves || []);
        this.afficherDemandesReservations(data.demandes_en_attente || []);

        this.trajetsProposesMemo = data.trajets_proposes || [];

        if (data.user_prenom && document.getElementById('userFirstName'))
          document.getElementById('userFirstName').textContent = data.user_prenom;
      });
  }

  afficherStats(data) {
    document.getElementById('statProposes').textContent = data.trajets_proposes.length;
    document.getElementById('statReserves').textContent = data.trajets_reserves.length;

    let places = 0;
    data.trajets_reserves.forEach(t => places += parseInt(t.places_reservees || 0));

    document.getElementById('statPlaces').textContent = places;
  }

  afficherTrajetsProposes(trajets) {
    const tbody = document.getElementById('trajets-proposes');
    tbody.innerHTML = "";

    const now = new Date();
    trajets = trajets.filter(tr => new Date(tr.date + "T" + tr.heure) > now);

    if (trajets.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center">Aucun trajet proposé</td></tr>`;
      return;
    }

    trajets.forEach(trajet => {
      const trEl = document.createElement('tr');

      const placesDispo = trajet.places - (parseInt(trajet.total_reservations) || 0);

      let btnEtat = "";
      if (trajet.etat_trajet === "planifie") {
        btnEtat = `<button class="btn btn-success btn-start" data-id="${trajet.id}">Démarrer</button>`;
      } else if (trajet.etat_trajet === "en_cours") {
        btnEtat = `<button class="btn btn-warning btn-end" data-id="${trajet.id}">Arrivée</button>`;
      } else {
        btnEtat = `<span class="badge bg-secondary">Terminé</span>`;
      }

      trEl.innerHTML = `
        <td>${this.formatDateHeure(trajet.date, trajet.heure)}</td>
        <td>${trajet.depart}</td>
        <td>${trajet.arrivee}</td>
        <td>${placesDispo} / ${trajet.places}</td>
        <td>${trajet.jetons}</td>
        <td><span class="badge bg-info">${trajet.statut_conducteur ?? ""}</span></td>
        <td>
          <button class="btn btn-outline-primary btn-modifier" data-id="${trajet.id}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-outline-danger btn-supprimer" data-id="${trajet.id}"><i class="bi bi-trash"></i></button>
          ${btnEtat}
        </td>
      `;

      tbody.appendChild(trEl);
    });

    this.attachTrajetsProposesListeners();
  }

  attachTrajetsProposesListeners() {
    const tbody = document.getElementById('trajets-proposes');

    tbody.querySelectorAll('.btn-modifier').forEach(btn => {
      btn.onclick = () => this.ouvrirModification(btn.dataset.id);
    });

    tbody.querySelectorAll('.btn-supprimer').forEach(btn => {
      btn.onclick = () => this.supprimerTrajet(btn.dataset.id);
    });

    tbody.querySelectorAll('.btn-start').forEach(btn => {
      btn.onclick = () => this.changerEtatTrajet(btn.dataset.id, "en_cours");
    });

    tbody.querySelectorAll('.btn-end').forEach(btn => {
      btn.onclick = () => this.changerEtatTrajet(btn.dataset.id, "termine");
    });
  }

  afficherTrajetsReserves(trajets) {
    const tbody = document.getElementById('trajets-reserves');
    tbody.innerHTML = "";

    if (!trajets.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">Aucun trajet réservé</td></tr>`;
      return;
    }

    trajets.forEach(t => {
      const trEl = document.createElement('tr');
      trEl.innerHTML = `
        <td>${this.formatDateHeure(t.date, t.heure)}</td>
        <td>${t.depart}</td>
        <td>${t.arrivee}</td>
        <td>${this.renderConducteurCell(t)}</td>
        <td><span class="badge bg-success">${t.statut_passager}</span></td>
        <td><button class="btn btn-danger btn-annuler" data-id="${t.reservation_id}">Annuler</button></td>
      `;
      tbody.appendChild(trEl);
    });

    tbody.querySelectorAll('.btn-annuler').forEach(btn => {
      btn.onclick = () => this.annulerReservation(btn.dataset.id);
    });
  }

  afficherDemandesReservations(demandes) {
    const container = document.getElementById('demandes-reservations-section');

    if (!demandes.length) {
      container.innerHTML = `<p class="text-muted">Aucune demande en attente.</p>`;
      return;
    }

    let html = `
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Passager</th><th>Date</th><th>Heure</th>
            <th>Départ</th><th>Arrivée</th>
            <th>Places</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    demandes.forEach(d => {
      html += `
        <tr>
          <td>${d.passager_prenom} ${d.passager_nom}</td>
          <td>${d.date}</td>
          <td>${d.heure}</td>
          <td>${d.depart}</td>
          <td>${d.arrivee}</td>
          <td>${d.places_reservees}</td>
          <td>
            <button class="btn btn-success btn-accepter" data-id="${d.reservation_id}">Accepter</button>
            <button class="btn btn-danger btn-refuser" data-id="${d.reservation_id}">Refuser</button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;

    container.querySelectorAll('.btn-accepter').forEach(btn =>
      btn.onclick = () => this.accepterReservation(btn.dataset.id)
    );

    container.querySelectorAll('.btn-refuser').forEach(btn =>
      btn.onclick = () => this.refuserReservation(btn.dataset.id)
    );
  }

  accepterReservation(resId) {
    const fd = new FormData();
    fd.append("reservation_id", resId);
    fd.append("action", "accepter");

    fetch('/PHP/valider_reservation.php', {
      method: "POST",
      body: fd,
      credentials: "include"
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) this.chargerDashboard();
        else alert(d.error);
      })
      .catch(() => alert("Erreur réseau"));
  }

  refuserReservation(resId) {
    const fd = new FormData();
    fd.append("reservation_id", resId);
    fd.append("action", "refuser");

    fetch('/PHP/valider_reservation.php', {
      method: "POST",
      body: fd,
      credentials: "include"
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) this.chargerDashboard();
        else alert(d.error);
      });
  }

  supprimerTrajet(id) {
    if (!confirm("Supprimer ce trajet ?")) return;

    const fd = new FormData();
    fd.append("id", id);

    fetch('/PHP/delete_trajet.php', {
      method: "POST",
      body: fd,
      credentials: "include"
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) this.chargerDashboard();
        else alert(d.error);
      });
  }

  annulerReservation(id) {
    if (!confirm("Annuler la réservation ?")) return;

    const fd = new FormData();
    fd.append("id", id);

    fetch('/PHP/annuler_reservation.php', {
      method: "POST",
      body: fd,
      credentials: "include"
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) this.chargerDashboard();
        else alert(d.error);
      });
  }

  changerEtatTrajet(id, etat) {
    fetch('/PHP/update_trajet_etat.php', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            trajet_id: id,
            etat: etat
        })
    })
    .then(r => r.json())
    .then(d => {
        if (d.success) {
            alert("Trajet mis à jour : " + d.etat);
            this.chargerDashboard();
            this.chargerTrajetsAValider();
        } else {
            alert(d.error || "Erreur lors de la mise à jour");
        }
    })
    .catch(() => alert("Erreur réseau lors de la mise à jour"));
}


  renderConducteurCell(t) {
    const avatar = t.conducteur_avatar
      ? (t.conducteur_avatar.startsWith('/') ? t.conducteur_avatar : "asset/Images/" + t.conducteur_avatar)
      : "asset/Images/default_03.png";

    return `
      <div class="d-flex align-items-center">
        <img src="${avatar}" style="width:36px;height:36px;border-radius:50%;object-fit:cover" class="me-2" />
        ${t.conducteur_prenom} ${t.conducteur_nom}
      </div>
    `;
  }

  formatDateHeure(date, heure) {
    return new Date(date + "T" + heure).toLocaleString("fr-FR", {
      weekday: "short", day: "2-digit", month: "short"
    }) + " " + heure;
  }

  ouvrirModification(id) {
    const t = this.trajetsProposesMemo.find(x => x.id == id);
    if (!t) return alert("Trajet introuvable.");

    document.getElementById('trajetId').value = t.id;
    document.getElementById('editDate').value = t.date;
    document.getElementById('editHeure').value = t.heure;
    document.getElementById('editDepart').value = t.depart;
    document.getElementById('editArrivee').value = t.arrivee;
    document.getElementById('editPlaces').value = t.places;
    document.getElementById('editJetons').value = t.jetons;

    new bootstrap.Modal(document.getElementById('editTrajetModal')).show();
  }

  async chargerTrajetsAValider() {
    const res = await fetch('/PHP/get_trajets_a_valider.php', { credentials: "include" });
    const data = await res.json();

    const container = document.getElementById('trajets-a-valider');
    if (!container) return;

    container.innerHTML = "";

    if (!data.trajets_a_valider || !data.trajets_a_valider.length) {
      container.textContent = "Aucun trajet à valider.";
      return;
    }

    data.trajets_a_valider.forEach(t => {
      const div = document.createElement('div');
      div.className = "trajet-validation p-3 border rounded mb-3";

      div.innerHTML = `
        <p><strong>Date :</strong> ${t.date} ${t.heure}<br>
        <strong>De :</strong> ${t.depart} <strong>À :</strong> ${t.arrivee}</p>
        <button class="btn btn-success btn-valider" data-id="${t.reservation_id}">
          Valider ou Signaler
        </button>
      `;

      div.querySelector('.btn-valider').onclick = () =>
        this.ouvrirModalValidation(t.reservation_id);

      container.appendChild(div);
    });
  }

  ouvrirModalValidation(id) {
    document.getElementById('reservationIdValider').value = id;
    this.isSignalement = false;

    document.getElementById('bloc-valider-trajet').style.display = "";
    document.getElementById('bloc-signalement').style.display = "none";

    document.getElementById('switchSignalement').textContent = "Signaler un problème";

    document.getElementById('note').value = "";
    document.getElementById('avis').value = "";
    document.getElementById('commentaire-probleme').value = "";
    document.getElementById('validation-feedback').textContent = "";

    new bootstrap.Modal(document.getElementById('validationFormModal')).show();
  }
}

const dashboardManager = new DashboardManager();
