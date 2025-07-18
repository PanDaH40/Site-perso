// Covoiturage.js

document.addEventListener("DOMContentLoaded", () => {
    chargerTrajets();

    // Formulaire de recherche
    const searchForm = document.getElementById("searchForm");
    if (searchForm) {
        searchForm.addEventListener("submit", function (e) {
            e.preventDefault();
            rechercherTrajets();
        });
    }

    // Formulaire d'ajout de trajet
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
        .catch(() => afficherAucunTrajet());
}

function afficherTrajets(trajets) {
    const liste = document.getElementById("liste-trajets");
    liste.innerHTML = "";

    if (!trajets.length) {
        afficherAucunTrajet();
        return;
    }

    trajets.forEach(trajet => {
        const placesDispo = trajet.places - (trajet.total_reservations || 0);

        const imgSrc = trajet.conducteur_avatar
            ? "asset/Images/" + trajet.conducteur_avatar
            : "asset/Images/default_03.png";

        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4 mb-4";

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
                    <div class="mb-2"><span class="fw-semibold">Places dispo&nbsp;:</span> ${placesDispo}</div>
                </div>
                <div class="card-footer bg-transparent border-0">
                    <button class="btn btn-success w-100 btn-reserver" 
                        data-trajet-id="${trajet.id}" 
                        data-places-dispo="${placesDispo}"
                        ${placesDispo < 1 ? "disabled" : ""}>
                        Réserver
                    </button>
                </div>
            </div>
        `;

        liste.appendChild(col);
    });

    // Bouton réserver
    document.querySelectorAll(".btn-reserver").forEach(btn => {
        btn.addEventListener("click", function () {
            const trajetId = this.getAttribute("data-trajet-id");
            const placesDispo = this.getAttribute("data-places-dispo");
            ouvrirModalReservation(trajetId, placesDispo);
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

// ----------- 2. Modal de réservation AVEC nombre de places -----------

function ouvrirModalReservation(trajetId, placesDispo) {
    const modalBody = document.getElementById("modalBody");
    placesDispo = parseInt(placesDispo) || 1;

    modalBody.innerHTML = `
        <p>Réservation pour le trajet #${trajetId}</p>
        <div class="mt-3">
            <label for="nbPlacesReservees" class="form-label">Nombre de places à réserver</label>
            <input type="number" class="form-control" id="nbPlacesReservees" min="1" max="${placesDispo}" value="1">
            <div class="form-text">Places disponibles : ${placesDispo}</div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('reservationModal'));
    modal.show();

    document.getElementById("btnConfirmerReservation").onclick = function () {
        const nbPlaces = parseInt(document.getElementById("nbPlacesReservees").value) || 1;
        if (nbPlaces > placesDispo || nbPlaces < 1) {
            alert("Nombre de places invalide !");
            return;
        }

        fetch("asset/PHP/reserver.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                trajet_id: trajetId,
                places: nbPlaces
            })
        })
        .then(res => res.json())
        .then(data => {
            modal.hide();
            if (data.success) {
                alert("Réservation confirmée !");
                chargerTrajets(); // Met à jour la liste et le nombre de places
            } else {
                alert(data.error || "Erreur lors de la réservation !");
            }
        })
        .catch(() => {
            modal.hide();
            alert("Erreur lors de la réservation !");
        });
    };
}

// ----------- 3. Recherche de trajets -----------

function rechercherTrajets() {
    const depart = document.getElementById("departure").value.trim();
    const arrivee = document.getElementById("arrival").value.trim();
    const date = document.getElementById("dateSearch").value.trim();
    const passengers = document.getElementById("passengers").value.trim();

    const params = new URLSearchParams();
    if (depart) params.append("depart", depart);
    if (arrivee) params.append("arrivee", arrivee);
    if (date) params.append("date", date);
    if (passengers) params.append("places", passengers);

    let url = 'asset/PHP/trajets.php?all=1';
    if ([...params].length > 0) {
        url += '&' + params.toString();
    }

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
        .catch(() => {
            afficherAucunTrajet();
        });
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

    // Si ton PHP accepte POST JSON :
    const data = {
        depart: depart,
        arrivee: arrivee,
        date: date,
        heure: heure,
        places: places,
        prix: prix
    };

    fetch("asset/PHP/trajets.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            chargerTrajets();
            document.getElementById("trajetForm").reset();
        } else {
            alert("Erreur lors de l'ajout du trajet !");
        }
    })
    .catch(() => alert("Erreur lors de l'ajout du trajet !"));
}
