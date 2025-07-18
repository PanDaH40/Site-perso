document.addEventListener("DOMContentLoaded", () => {
  const basePath = '/TPCovoiturage/asset/PHP/'; // ADAPTE CE CHEMIN SELON TON PROJET

  // --- Mise à jour du badge notification messages (cloche) ---
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

  // --- Cacher ou afficher boutons Profil & Messagerie selon session ---
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

  // --- Vérifie si utilisateur est conducteur avant d'afficher formulaire ---
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

  // --- Fonction chargement trajets ---
  function chargerTrajets() {
    fetch(basePath + 'trajets.php?all=1', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.all_trajets)) {
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

  // --- Charger et afficher les trajets à valider par le passager ---
  async function chargerTrajetsAValider() {
    try {
      const res = await fetch(basePath + 'get_trajets_a_valider.php', { credentials: 'include' });
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
            const resVal = await fetch(basePath + 'valider_trajet_passager.php', {
              method: 'POST',
              credentials: 'include',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ reservation_id: reservationId })
            });
            const result = await resVal.json();
            if (result.success) {
              alert(result.message);
              chargerTrajetsAValider(); // recharge la liste après validation
              chargerDashboard();       // recharge le dashboard au cas où ça impacte l'affichage
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

  // --- Ouvre modal réservation ---
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
          chargerTrajets();
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

  // --- Rechercher trajets ---
  function rechercherTrajets() {
    const depart = document.getElementById("searchDepart")?.value.trim() || "";
    const arrivee = document.getElementById("searchArrivee")?.value.trim() || "";
    const date = document.getElementById("searchDate")?.value.trim() || "";
    const places = document.getElementById("searchPlaces")?.value.trim() || "";
    const jetonsMax = document.getElementById("searchJetonsMax")?.value.trim() || "";
    const noteMin = document.getElementById("searchNoteMin")?.value.trim() || "";

    const dateAltMsg = document.getElementById("dateAlternativeMsg");
    dateAltMsg.style.display = "none";
    dateAltMsg.textContent = "";

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
        if (Array.isArray(data.all_trajets) && data.all_trajets.length) {
          afficherTrajets(data.all_trajets);
        } else if (data.date_alternative) {
          afficherAucunTrajet();
          dateAltMsg.style.display = "block";
          dateAltMsg.textContent = "Aucun trajet disponible à cette date. Date alternative proposée : " + data.date_alternative;
        } else {
          afficherAucunTrajet();
        }
      })
      .catch(() => {
        afficherAucunTrajet();
      });
  }

  // --- Ajouter un trajet ---
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
          chargerTrajets();
          document.getElementById("trajetForm")?.reset();
        } else {
          alert(data.error || "Erreur lors de l'ajout du trajet !");
        }
      })
      .catch(() => alert("Erreur réseau lors de l'ajout du trajet !"));
  }

});
