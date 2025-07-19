document.addEventListener("DOMContentLoaded", () => {
  // --- Mise à jour du badge notification messages (cloche) ---
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

  // --- Cacher ou afficher boutons Profil & Messagerie selon session ---
  const btnProfil = document.getElementById("btnProfil");
  const btnMessages = document.getElementById("btnMessages");

  fetch('asset/PHP/check_session.php', { credentials: "include" })
    .then(res => res.json())
    .then(data => {
      if (data.connected) {
        if (btnProfil) btnProfil.style.display = "";
        if (btnMessages) btnMessages.style.display = "";
        mettreAJourNotificationMessages();
      } else {
        if (btnProfil) btnProfil.style.display = "none";
        if (btnMessages) btnMessages.style.display = "none";
        const notifBadge = document.getElementById('notif-badge');
        if (notifBadge) notifBadge.style.display = 'none';
      }
    })
    .catch(() => {
      if (btnProfil) btnProfil.style.display = "none";
      if (btnMessages) btnMessages.style.display = "none";
      const notifBadge = document.getElementById('notif-badge');
      if (notifBadge) notifBadge.style.display = 'none';
    });

  // --- Vérifie si utilisateur est conducteur avant d'afficher formulaire ---
  fetch('asset/PHP/get_profile.php', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      const formAjout = document.getElementById("formAjoutContainer");
      if (!formAjout) return;
      if (!data.cond_prenom && !data.roleConducteur) {
        formAjout.style.display = "none";
        const info = document.createElement('div');
        info.className = "alert alert-warning text-center";
        info.innerHTML = `Vous devez activer le rôle <b>Conducteur</b> dans votre <a href='Profile.html'>profil</a> pour ajouter un trajet.`;
        formAjout.parentNode.insertBefore(info, formAjout);
      } else {
        formAjout.style.display = "";
      }
    })
    .catch(() => {
      const formAjout = document.getElementById("formAjoutContainer");
      if (formAjout) formAjout.style.display = "none";
    });

  // --- Charger et afficher trajets ---
  chargerTrajets();

  // --- Gestion formulaire recherche ---
  const searchForm = document.getElementById("searchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", e => {
      e.preventDefault();
      rechercherTrajets();
    });
  }

  // --- Gestion formulaire ajout trajet ---
  const trajetForm = document.getElementById("trajetForm");
  if (trajetForm) {
    trajetForm.addEventListener("submit", e => {
      e.preventDefault();
      ajouterTrajet();
    });
  }
});

// -------- Fonctions auxiliaires --------

function chargerTrajets() {
  fetch('asset/PHP/trajets.php?all=1', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        afficherTrajets(data);
      } else if (data.all_trajets) {
        afficherTrajets(data.all_trajets);
      } else {
        afficherAucunTrajet();
      }
    })
    .catch(() => afficherAucunTrajet());
}

function afficherTrajets(trajets) {
  window.lastTrajetsListe = trajets;
  const liste = document.getElementById("liste-trajets");
  if (!liste) return;
  liste.innerHTML = "";

  if (!trajets.length) {
    afficherAucunTrajet();
    return;
  }

  trajets.forEach(trajet => {
    const conducteurId = trajet.conducteur_id || "";
    const imgSrc = trajet.conducteur_avatar
      ? (trajet.conducteur_avatar.startsWith('asset/')
        ? trajet.conducteur_avatar
        : "asset/Images/" + trajet.conducteur_avatar)
      : "asset/Images/default_03.png";

    const placesRestantes = (parseInt(trajet.places) || 0) - (parseInt(trajet.total_reservations) || 0);

    // Critère écologique (exemple)
    const typeCarburant = (trajet.carburant || "").toLowerCase();
    const estEcologique = ((parseInt(trajet.nb_passagers) || 0) >= 2) ||
      ['electric', 'électrique', 'hybride'].includes(typeCarburant);

    const badgeEcoHtml = estEcologique
      ? `<span class="badge bg-success float-end" title="Trajet écologique">🍃 Écologique</span>`
      : '';

    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4 mb-4";

    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            <a href="ProfilePublic.html?id=${conducteurId}" title="Voir le profil du conducteur">
              <img src="${imgSrc}" alt="Photo du conducteur" class="rounded-circle border me-3" style="width:48px; height:48px; object-fit:cover; cursor:pointer;">
            </a>
            <div class="w-100">
              <div class="fw-bold">${trajet.conducteur_prenom} ${trajet.conducteur_nom} ${badgeEcoHtml}</div>
              <div class="text-muted small">Conducteur</div>
            </div>
          </div>
          <div class="mb-2">
            <span class="fw-semibold">Départ&nbsp;:</span> ${trajet.depart}
            ${trajet.depart_precis ? `<br><small class="text-muted">${trajet.depart_precis}</small>` : ""}
          </div>
          <div class="mb-2">
            <span class="fw-semibold">Arrivée&nbsp;:</span> ${trajet.arrivee}
            ${trajet.arrivee_precis ? `<br><small class="text-muted">${trajet.arrivee_precis}</small>` : ""}
          </div>
          <div class="mb-2"><span class="fw-semibold">Date&nbsp;:</span> ${trajet.date} à ${trajet.heure}</div>
          <div class="mb-2"><span class="fw-semibold">Prix&nbsp;:</span> ${trajet.prix} €</div>
          <div class="mb-2"><span class="fw-semibold">Places dispo&nbsp;:</span> ${placesRestantes}</div>
        </div>
        <div class="card-footer bg-transparent border-0">
          <button class="btn btn-success w-100 btn-reserver" data-trajet-id="${trajet.id}" ${placesRestantes <= 0 ? "disabled" : ""}>Réserver</button>
        </div>
      </div>
    `;

    liste.appendChild(col);
  });

  document.querySelectorAll(".btn-reserver").forEach(btn => {
    btn.addEventListener("click", function () {
      const trajetId = this.getAttribute("data-trajet-id");
      ouvrirModalReservation(trajetId);
    });
  });
}

function afficherAucunTrajet() {
  const liste = document.getElementById("liste-trajets");
  if (!liste) return;
  liste.innerHTML = `
    <div class="col-12">
      <div class="alert alert-info text-center">
        Aucun trajet disponible pour le moment.
      </div>
    </div>
  `;
}

// Affiche message date alternative juste avant la liste trajets
function afficherDateAlternative(dateAlt) {
  let msgEl = document.getElementById('dateAlternativeMsg');
  if (!msgEl) {
    msgEl = document.createElement('div');
    msgEl.id = 'dateAlternativeMsg';
    msgEl.className = 'alert alert-info text-center';
    msgEl.style.marginBottom = '1rem';
    const container = document.querySelector('.container');
    if (container) container.insertBefore(msgEl, document.getElementById('liste-trajets'));
  }
  msgEl.style.display = 'block';
  msgEl.textContent = `Aucun trajet disponible à cette date. Essayez plutôt le ${dateAlt}.`;
}

function ouvrirModalReservation(trajetId) {
  let trajets
