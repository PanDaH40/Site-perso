document.addEventListener("DOMContentLoaded", () => {
  const basePath = '/TPCovoiturage/asset/PHP/';

  // --- Message initial : demander à l’utilisateur de remplir le formulaire ---
  function afficherAucunTrajetInitial() {
    const liste = document.getElementById("liste-trajets");
    if (!liste) return;
    liste.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info text-center">
          <b>Veuillez remplir le formulaire ci-dessus</b> (départ, arrivée et date) pour afficher les itinéraires disponibles.
        </div>
      </div>
    `;
  }
  afficherAucunTrajetInitial();

  // --- Pré-remplissage si paramètres dans l’URL + recherche automatique ---
  const urlParams = new URLSearchParams(window.location.search);
  const depart = urlParams.get('depart');
  const arrivee = urlParams.get('arrivee');
  const date = urlParams.get('date');
  const places = urlParams.get('places');

  if (depart && arrivee && date) {
    // Pré-remplit le formulaire
    document.getElementById("searchDepart").value = depart;
    document.getElementById("searchArrivee").value = arrivee;
    document.getElementById("searchDate").value = date;
    if (places) document.getElementById("searchPlaces").value = places;
    // Lance automatiquement la recherche !
    rechercherTrajets();
  }

  // --- Mise à jour badge messages ---
  function mettreAJourNotificationMessages() {
    const notifBadge = document.getElementById('notif-badge');
    if (!notifBadge) return;

    fetch(basePath + 'get_messages_recus.php', { credentials: 'include' })
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

  // --- Gestion affichage profil/messages selon session ---
  const btnProfil = document.getElementById("btnProfil");
  const btnMessages = document.getElementById("btnMessages");
  fetch(basePath + 'check_session.php', { credentials: "include" })
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

  // --- Vérifie si utilisateur est conducteur avant d'afficher formulaire ajout ---
  fetch(basePath + 'get_profile.php', { credentials: 'include' })
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

  // --- Gestion formulaire recherche ---
  const searchForm = document.getElementById("searchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", e => {
      e.preventDefault();
      rechercherTrajets();
    });
  }

  // --- Gestion formulaire ajout trajet (conserve) ---
  const trajetForm = document.getElementById("trajetForm");
  if (trajetForm) {
    trajetForm.addEventListener("submit", e => {
      e.preventDefault();
      ajouterTrajet();
    });
  }

  // --- Affichage des trajets trouvés ---
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
      const estEcologique = ['electric', 'électrique', 'hybride'].includes(typeCarburant);

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
            </div>
            <div class="mb-2">
              <span class="fw-semibold">Arrivée&nbsp;:</span> ${trajet.arrivee}
            </div>
            <div class="mb-2"><span class="fw-semibold">Date&nbsp;:</span> ${trajet.date} à ${trajet.heure}</div>
            <div class="mb-2"><span class="fw-semibold">Jetons&nbsp;:</span> ${trajet.jetons} </div>
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

  // --- Ouvre modal réservation + double confirmation ---
  function ouvrirModalReservation(trajetId) {
    let trajets = window.lastTrajetsListe || [];
    let trajet = trajets.find(t => t.id == trajetId);
    let maxPlaces = trajet ? ((parseInt(trajet.places) || 0) - (parseInt(trajet.total_reservations) || 0)) : 1;
    if (maxPlaces < 1) maxPlaces = 1;

    const modalBody = document.getElementById("modalBody");
    if (!modalBody) return;
    modalBody.innerHTML = `
      <form id="reservationForm">
        <div class="mb-3">
          <label for="nbPlacesReserve" class="form-label">Nombre de places à réserver :</label>
          <input type="number" id="nbPlacesReserve" class="form-control" value="1" min="1" max="${maxPlaces}" required>
          <input type="hidden" id="trajetIdReserve" value="${trajetId}">
          <small class="form-text text-muted">Maximum: ${maxPlaces} place(s) disponible(s)</small>
        </div>
      </form>
    `;

    const modal = new bootstrap.Modal(document.getElementById('reservationModal'));
    modal.show();

    const btnConfirmer = document.getElementById("btnConfirmerReservation");
    btnConfirmer.replaceWith(btnConfirmer.cloneNode(true));
    const btnConfirmerNew = document.getElementById("btnConfirmerReservation");

    btnConfirmerNew.onclick = function () {
      const places = parseInt(document.getElementById("nbPlacesReserve").value);
      if (!places || places < 1 || places > maxPlaces) {
        alert("Choisissez un nombre de places valide !");
        return;
      }

      const jetonsParPlace = trajet ? parseFloat(trajet.jetons) : 0;
      const commission = 2; // commission fixe (à adapter si besoin)
      const totalCredits = (jetonsParPlace * places) + commission;

      if (!confirm(`Vous allez dépenser ${totalCredits} jetons (prix trajet + commission).\nConfirmez-vous ?`)) {
        return; // annule si refus
      }

      if (!confirm("Êtes-vous sûr de vouloir confirmer cette réservation ?")) {
        return; // annule si refus
      }

      fetch(basePath + 'reserver.php', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          trajet_id: trajetId,
          places: places
        })
      })
      .then(r => r.json())
      .then(data => {
        modal.hide();
        if (data.success) {
          alert("Réservation effectuée !");
          rechercherTrajets(); // recharge la liste en gardant les filtres
        } else {
          alert(data.error || "Erreur lors de la réservation");
        }
      })
      .catch(() => {
        modal.hide();
        alert("Erreur réseau lors de la réservation");
      });
    };
  }

  // --- Recherche de trajets ---
  function rechercherTrajets() {
    const depart = document.getElementById("searchDepart")?.value.trim() || "";
    const arrivee = document.getElementById("searchArrivee")?.value.trim() || "";
    const date = document.getElementById("searchDate")?.value.trim() || "";
    const places = document.getElementById("searchPlaces")?.value.trim() || "";
    const jetonsMax = document.getElementById("searchJetonsMax")?.value.trim() || "";
    const noteMin = document.getElementById("searchNoteMin")?.value.trim() || "";

    const dateAltMsg = document.getElementById("dateAlternativeMsg");
    if (dateAltMsg) {
      dateAltMsg.style.display = "none";
      dateAltMsg.textContent = "";
    }

    if (!depart || !arrivee || !date) {
      alert("Veuillez renseigner le départ, l’arrivée et la date pour la recherche.");
      return;
    }

    let url = basePath + 'trajets.php?all=1';
    url += '&depart=' + encodeURIComponent(depart);
    url += '&arrivee=' + encodeURIComponent(arrivee);
    url += '&date=' + encodeURIComponent(date);
    if (places) url += '&places_min=' + encodeURIComponent(places);
    if (jetonsMax) url += '&jetons_max=' + encodeURIComponent(jetonsMax);
    if (noteMin) url += '&note_min=' + encodeURIComponent(noteMin);

    fetch(url, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.all_trajets) && data.all_trajets.length > 0) {
          afficherTrajets(data.all_trajets);
        } else if (data.date_alternative) {
          afficherAucunTrajet();
          if (dateAltMsg) {
            dateAltMsg.style.display = "block";
            dateAltMsg.innerHTML = `
              Aucun trajet disponible à cette date.<br>
              Essayez plutôt le <a href="#" id="changerDateAlternative">${data.date_alternative}</a>.
            `;
            // Ajout d'un clic pour modifier la date de recherche automatiquement
            const lienDateAlt = document.getElementById("changerDateAlternative");
            if (lienDateAlt) {
              lienDateAlt.addEventListener("click", (e) => {
                e.preventDefault();
                // Format attendu yyyy-mm-dd pour input date
                const parts = data.date_alternative.split('/');
                if(parts.length === 3) {
                  const dateFormatee = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
                  document.getElementById("searchDate").value = dateFormatee;
                  rechercherTrajets();
                }
              });
            }
          }
        } else {
          afficherAucunTrajet();
        }
      })
      .catch(() => {
        afficherAucunTrajet();
      });
  }

  // --- Ajouter un trajet (inchangé) ---
  function ajouterTrajet() {
    const depart = document.getElementById("depart")?.value.trim() || "";
    const arrivee = document.getElementById("arrivee")?.value.trim() || "";
    const date = document.getElementById("date")?.value.trim() || "";
    const heure = document.getElementById("heure")?.value.trim() || "";
    const places = document.getElementById("places")?.value.trim() || "";
    const jetons = document.getElementById("jetons")?.value.trim() || "";

    if (!depart || !arrivee || !date || !heure || !places || !jetons) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    fetch(basePath + "trajets.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ depart, arrivee, date, heure, places, jetons })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Recharge UNIQUEMENT si tu veux que l’ajout affiche le trajet dans la vue conducteur (non sur la page publique par défaut)
          // rechercherTrajets(); // à activer si tu veux afficher les trajets après ajout
          document.getElementById("trajetForm")?.reset();
        } else {
          alert(data.error || "Erreur lors de l'ajout du trajet !");
        }
      })
      .catch(() => alert("Erreur réseau lors de l'ajout du trajet !"));
  }

});
