class TrajetsManager {
  constructor() {
    this.basePath = '/asset/PHP/';
    this.LIST_ENDPOINT = 'trajets.php';
    this.ADD_ENDPOINT = 'trajets.php';
    this.lastTrajetsListe = [];

    document.addEventListener('DOMContentLoaded', () => {
      this.init();
    });
  }

  init() {
    this.afficherAucunTrajetInitial();
    this.recupererParamsUrl();
    this.setupEventListeners();
  }

  // Affiche un message initial invitant à remplir le formulaire
  afficherAucunTrajetInitial() {
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

  // Affiche un message quand aucun trajet n'est disponible
  afficherAucunTrajet() {
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

  // Récupère les paramètres URL pour pré-remplissage et recherche auto
  recupererParamsUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const depart = urlParams.get('depart');
    const arrivee = urlParams.get('arrivee');
    const date = urlParams.get('date');
    const places = urlParams.get('places');

    if (depart && arrivee && date) {
      const inputDepart = document.getElementById("searchDepart");
      const inputArrivee = document.getElementById("searchArrivee");
      const inputDate = document.getElementById("searchDate");
      const inputPlaces = document.getElementById("searchPlaces");

      if (inputDepart) inputDepart.value = depart;
      if (inputArrivee) inputArrivee.value = arrivee;
      if (inputDate) inputDate.value = date;
      if (places && inputPlaces) inputPlaces.value = places;

      this.rechercherTrajets();
    }
  }

  // Configure les écouteurs d'événements
  setupEventListeners() {
    // Formulaire recherche
    const searchForm = document.getElementById("searchForm");
    if (searchForm) {
      searchForm.addEventListener("submit", e => {
        e.preventDefault();
        this.rechercherTrajets();
      });
    }

    // Formulaire ajout trajet
    const trajetForm = document.getElementById("trajetForm");
    if (trajetForm) {
      trajetForm.addEventListener("submit", e => {
        e.preventDefault();
        this.ajouterTrajet();
      });
    }

    // Délégation pour boutons réserver (après affichage des trajets)
    document.getElementById("liste-trajets")?.addEventListener("click", e => {
      if (e.target && e.target.classList.contains("btn-reserver")) {
        const trajetId = e.target.getAttribute("data-trajet-id");
        this.ouvrirModalReservation(trajetId);
      }
    });
  }

  // Affiche la liste des trajets
  afficherTrajets(trajets) {
    this.lastTrajetsListe = trajets;
    const liste = document.getElementById("liste-trajets");
    if (!liste) return;

    liste.innerHTML = "";

    if (!trajets.length) {
      this.afficherAucunTrajet();
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

      // Critère écologique 
      const typeCarburant = (trajet.carburant || "").toLowerCase();
      const estEcologique = ['electric', 'électrique', 'hybride'].includes(typeCarburant);
      const badgeEcoHtml = estEcologique
        ? `<span class="badge bg-success float-end" title="Trajet écologique">🍃 Écologique</span>`
        : '';

      // Désactivation si pas d'id MySQL (id === 0)
      const disableReserv = (placesRestantes <= 0) || (trajet.id === 0);

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
                <div class="fw-bold">${trajet.conducteur_prenom ?? ''} ${trajet.conducteur_nom ?? ''} ${badgeEcoHtml}</div>
                <div class="text-muted small">Conducteur</div>
              </div>
            </div>
            <div class="mb-2"><span class="fw-semibold">Départ&nbsp;:</span> ${trajet.depart}</div>
            <div class="mb-2"><span class="fw-semibold">Arrivée&nbsp;:</span> ${trajet.arrivee}</div>
            <div class="mb-2"><span class="fw-semibold">Date&nbsp;:</span> ${trajet.date} à ${trajet.heure}</div>
            <div class="mb-2"><span class="fw-semibold">Jetons&nbsp;:</span> ${trajet.jetons}</div>
            <div class="mb-2"><span class="fw-semibold">Places dispo&nbsp;:</span> ${placesRestantes}</div>
          </div>
          <div class="card-footer bg-transparent border-0">
            <button
              class="btn btn-success w-100 btn-reserver"
              data-trajet-id="${trajet.id}"
              ${disableReserv ? "disabled" : ""}
              title="${trajet.id === 0 ? "Réservation indisponible pour ce trajet (non synchronisé MySQL)" : ""}"
            >Réserver</button>
          </div>
        </div>
      `;

      liste.appendChild(col);
    });
  }

  // Ouvre la modal de réservation avec confirmation
  ouvrirModalReservation(trajetId) {
    const trajet = this.lastTrajetsListe.find(t => t.id == trajetId);

    if (!trajet) {
      alert("Trajet introuvable.");
      return;
    }

    if (trajet.id === 0) {
      alert("Réservation indisponible pour ce trajet (non synchronisé MySQL).");
      return;
    }

    let maxPlaces = (parseInt(trajet.places) || 0) - (parseInt(trajet.total_reservations) || 0);
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

    // Gestion du clic sur le bouton confirmer réservation
    const btnConfirmer = document.getElementById("btnConfirmerReservation");
    btnConfirmer.replaceWith(btnConfirmer.cloneNode(true)); // Supprime anciens listeners
    const btnConfirmerNew = document.getElementById("btnConfirmerReservation");

    btnConfirmerNew.onclick = () => {
      const places = parseInt(document.getElementById("nbPlacesReserve").value);
      if (!places || places < 1 || places > maxPlaces) {
        alert("Choisissez un nombre de places valide !");
        return;
      }

      const jetonsParPlace = parseFloat(trajet.jetons) || 0;
      const commission = 2; // commission fixe (à adapter)
      const totalCredits = (jetonsParPlace * places) + commission;

      if (!confirm(`Vous allez dépenser ${totalCredits} jetons (prix trajet + commission).\nConfirmez-vous ?`)) return;
      if (!confirm("Êtes-vous sûr de vouloir confirmer cette réservation ?")) return;

      fetch(this.basePath + 'reserver.php', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ trajet_id: trajetId, places })
      })
      .then(r => r.json())
      .then(data => {
        modal.hide();
        if (data.success) {
          alert("Réservation effectuée !");
          this.rechercherTrajets();
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

  // Recherche des trajets selon critères
  rechercherTrajets() {
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
      alert("Veuillez renseigner le départ, l'arrivée et la date pour la recherche.");
      return;
    }

    let url = this.basePath + this.LIST_ENDPOINT + '?all=1';
    url += '&depart=' + encodeURIComponent(depart);
    url += '&arrivee=' + encodeURIComponent(arrivee);
    url += '&date=' + encodeURIComponent(date);
    if (places)   url += '&places_min=' + encodeURIComponent(places);
    if (jetonsMax) url += '&jetons_max=' + encodeURIComponent(jetonsMax);
    if (noteMin)  url += '&note_min=' + encodeURIComponent(noteMin);

    fetch(url, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`Erreur réseau ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data.all_trajets) && data.all_trajets.length > 0) {
          this.afficherTrajets(data.all_trajets);
        } else if (data.date_alternative) {
          this.afficherAucunTrajet();
          if (dateAltMsg) {
            dateAltMsg.style.display = "block";
            dateAltMsg.innerHTML = `
              Aucun trajet disponible à cette date.<br>
              Essayez plutôt le <a href="#" id="changerDateAlternative">${data.date_alternative}</a>.
            `;
            const lienDateAlt = document.getElementById("changerDateAlternative");
            if (lienDateAlt) {
              lienDateAlt.addEventListener("click", (e) => {
                e.preventDefault();
                const parts = data.date_alternative.split('/');
                if(parts.length === 3) {
                  const dateFormatee = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
                  document.getElementById("searchDate").value = dateFormatee;
                  this.rechercherTrajets();
                }
              });
            }
          }
        } else {
          this.afficherAucunTrajet();
        }
      })
      .catch(() => {
        this.afficherAucunTrajet();
      });
  }

  // Ajout d’un nouveau trajet
  ajouterTrajet() {
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

    fetch(this.basePath + this.ADD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ depart, arrivee, date, heure, places, jetons })
    })
      .then(res => {
        if (!res.ok) throw new Error(`Erreur réseau ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.success) {
          document.getElementById("trajetForm")?.reset();
          this.rechercherTrajets();
        } else {
          alert(data.error || "Erreur lors de l'ajout du trajet !");
        }
      })
      .catch(() => alert("Erreur réseau lors de l'ajout du trajet !"));
  }
}

// Instanciation pour lancer le script
const trajetsManager = new TrajetsManager();
