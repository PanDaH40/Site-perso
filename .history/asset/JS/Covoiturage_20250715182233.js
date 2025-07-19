document.addEventListener("DOMContentLoaded", () => {
    chargerTrajets();

    // Gestion du formulaire de recherche
    const searchForm = document.getElementById("searchForm");
    if (searchForm) {
        searchForm.addEventListener("submit", function (e) {
            e.preventDefault();
            rechercherTrajets();
        });
    }

    // Gestion du formulaire d'ajout de trajet
    const trajetForm = document.getElementById("trajetForm");
    if (trajetForm) {
        trajetForm.addEventListener("submit", function (e) {
            e.preventDefault();
            ajouterTrajet();
        });
    }
});

// ----------- 1. Charger et afficher les trajets -----------

function chargerTrajets() {
    fetch('asset/PHP/trajets.php?all=1')
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
        .catch(err => {
            afficherAucunTrajet();
        });
}

function afficherTrajets(trajets) {
    const liste = document.getElementById("liste-trajets");
    liste.innerHTML = "";

    if (!trajets.length) {
        afficherAucunTrajet();
        return;
    }

    trajets.forEach(trajet => {
        const imgSrc = trajet.conducteur_avatar
            ? (trajet.conducteur_avatar.startsWith('/')
                ? trajet.conducteur_avatar
                : "asset/Images/" + trajet.conducteur_avatar)
            : "asset/Images/default_03.png";

        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4 mb-4";

        const placesRestantes = (parseInt(trajet.places) || 0) - (parseInt(trajet.total_reservations) || 0);

        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <img src="${imgSrc}" alt="Photo du conducteur" class="rounded-circle border me-3" style="width:48px; height:48px; object-fit:cover;">
                        <div>
                            <div class="fw-bold">${trajet.conducteur_prenom} ${trajet.conducteur_nom}</div>
                            <div class="text-muted small">Conducteur</div>
                        </div>
                    </div>
                    <div class="mb-2"><span class="fw-semibold">Départ&nbsp;:</span> ${trajet.depart}</div>
                    <div class="mb-2"><span class="fw-semibold">Arrivée&nbsp;:</span> ${trajet.arrivee}</div>
                    <div class="mb-2"><span class="fw-semibold">Date&nbsp;:</span> ${trajet.date} à ${trajet.heure}</div>
                    <div class="mb-2"><span class="fw-semibold">Prix&nbsp;:</span> ${trajet.prix} €</div>
                    <div class="mb-2"><span class="fw-semibold">Places dispo&nbsp;:</span> ${placesRestantes}</div>
                </div>
                <div class="card-footer bg-transparent border-0">
                    <button class="btn btn-success w-100 btn-reserver" data-trajet-id="${trajet.id}">Réserver</button>
                </div>
            </div>
        `;

        liste.appendChild(col);
    });

    // Gestion du bouton Réserver
    document.querySelectorAll(".btn-reserver").forEach(btn => {
        btn.addEventListener("click", function () {
            const trajetId = this.getAttribute("data-trajet-id");
            ouvrirModalReservation(trajetId);
        });
    });
}

function afficherAucunTrajet() {
    const liste = document.getElementById("liste-trajets");
    liste.innerHTML = `
        <div class="col-12">
            <div class="alert alert-info text-center">
                Aucun trajet disponible pour le moment.
            </div>
        </div>
    `;
}

// ----------- 2. Modal de réservation (exemple) -----------

// ---------------------- GESTION MODALE & RESERVATION ----------------------

function ouvrirModalReservation(trajetId) {
    // Cherche les infos du trajet dans la dernière liste affichée
    let trajets = window.lastTrajetsListe || [];
    let trajet = trajets.find(t => t.id == trajetId);
    let maxPlaces = trajet ? ((parseInt(trajet.places) || 0) - (parseInt(trajet.total_reservations) || 0)) : 1;
    if (maxPlaces < 1) maxPlaces = 1;

    // Affiche le formulaire dans la modale
    const modalBody = document.getElementById("modalBody");
    modalBody.innerHTML = `
      <form id="reservationForm">
        <div class="mb-3">
          <label for="nbPlacesReserve" class="form-label">Nombre de places à réserver :</label>
          <input type="number" id="nbPlacesReserve" class="form-control" value="1" min="1" max="${maxPlaces}" required>
          <input type="hidden" id="trajetIdReserve" value="${trajetId}">
          <small class="form-text text-muted">Maximum : ${maxPlaces} place(s) disponible(s)</small>
        </div>
      </form>
    `;

    // Ouvre la modale Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('reservationModal'));
    modal.show();

    // Lors du clic sur "Confirmer"
    document.getElementById("btnConfirmerReservation").onclick = function () {
        const places = parseInt(document.getElementById("nbPlacesReserve").value);
        if (!places || places < 1 || places > maxPlaces) {
            alert("Choisissez un nombre de places valide !");
            return;
        }
        // Appel AJAX
        fetch('asset/PHP/reserver.php', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
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
                chargerTrajets(); // recharge la liste à jour
            } else {
                alert(data.error || "Erreur lors de la réservation");
            }
        });
    };
}


function afficherTrajets(trajets) {
    window.lastTrajetsListe = trajets; // <--- Pour garder la liste en mémoire pour la modale

// ----------- 3. Recherche de trajets -----------

function rechercherTrajets() {
    const depart = document.getElementById("departure").value.trim();
    const arrivee = document.getElementById("arrival").value.trim();
    const date = document.getElementById("dateSearch").value.trim();
    const places = document.getElementById("passengers").value.trim();

    let url = 'asset/PHP/trajets.php?all=1';
    if (depart)  url += '&depart=' + encodeURIComponent(depart);
    if (arrivee) url += '&arrivee=' + encodeURIComponent(arrivee);
    if (date)    url += '&date=' + encodeURIComponent(date);
    if (places)  url += '&places=' + encodeURIComponent(places);

    fetch(url)
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

// ----------- 4. Ajout d'un trajet -----------

function ajouterTrajet() {
    const depart = document.getElementById("depart").value.trim();
    const arrivee = document.getElementById("arrivee").value.trim();
    const date = document.getElementById("date").value.trim();
    const heure = document.getElementById("heure").value.trim();
    const places = document.getElementById("places").value.trim();
    const prix = document.getElementById("prix").value.trim();

    if (!depart || !arrivee || !date || !heure || !places || !prix) return;

    fetch("asset/PHP/trajets.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depart, arrivee, date, heure, places, prix })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            chargerTrajets();
            document.getElementById("trajetForm").reset();
        } else {
            alert("Erreur lors de l'ajout du trajet !");
        };
    })
    .catch(() => alert("Erreur lors de l'ajout du trajet !"));
}
