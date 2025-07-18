// Covoiturage.js

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

// ----------- 1. Charger et afficher les trajets (automatique public/privé) -----------

function chargerTrajets() {
    fetch('asset/PHP/trajets.php')
        .then(res => res.json())
        .then(data => {
            // Dashboard (connecté)
            if (data.trajets_proposes || data.trajets_reserves) {
                afficherDashboard(data.trajets_proposes || [], data.trajets_reserves || []);
            }
            // Si déconnecté : liste publique
            else if (data.error && data.error === "Utilisateur non connecté") {
                fetch('asset/PHP/trajets.php?all=1')
                    .then(res => res.json())
                    .then(dataPub => {
                        if (Array.isArray(dataPub)) {
                            afficherTrajets(dataPub);
                        } else if (dataPub.all_trajets) {
                            afficherTrajets(dataPub.all_trajets);
                        } else {
                            afficherAucunTrajet();
                        }
                    });
            }
            // Si déjà la liste publique
            else if (Array.isArray(data)) {
                afficherTrajets(data);
            } else if (data.all_trajets) {
                afficherTrajets(data.all_trajets);
            } else {
                afficherAucunTrajet();
            }
        })
        .catch(() => afficherAucunTrajet());
}

// ----------- 2. Affichage tableau de trajets -----------

function afficherTrajets(trajets) {
    const liste = document.getElementById("liste-trajets");
    liste.innerHTML = "";

    if (!trajets.length) {
        afficherAucunTrajet();
        return;
    }

    trajets.forEach(trajet => {
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
                            <div class="fw-bold">${trajet.conducteur_prenom ? trajet.conducteur_prenom : ""} ${trajet.conducteur_nom ? trajet.conducteur_nom : ""}</div>
                            <div class="text-muted small">Conducteur</div>
                        </div>
                    </div>
                    <div class="mb-2"><span class="fw-semibold">Départ&nbsp;:</span> ${trajet.depart}</div>
                    <div class="mb-2"><span class="fw-semibold">Arrivée&nbsp;:</span> ${trajet.arrivee}</div>
                    <div class="mb-2"><span class="fw-semibold">Date&nbsp;:</span> ${trajet.date} à ${trajet.heure}</div>
                    <div class="mb-2"><span class="fw-semibold">Prix&nbsp;:</span> ${trajet.prix} €</div>
                    <div class="mb-2"><span class="fw-semibold">Places dispo&nbsp;:</span> ${trajet.places - (trajet.total_reservations || 0)}</div>
                </div>
                <div class="card-footer bg-transparent border-0">
                    <button class="btn btn-success w-100 btn-reserver" data-trajet-id="${trajet.id}">Réserver</button>
                </div>
            </div>
        `;

        liste.appendChild(col);
    });

    // Bouton réserver
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

// ----------- 3. Affichage dashboard (connecté) -----------

function afficherDashboard(trajetsProposes, trajetsReserves) {
    const liste = document.getElementById("liste-trajets");
    liste.innerHTML = "";

    if (trajetsProposes.length) {
        const titreProposes = document.createElement("div");
        titreProposes.innerHTML = `<h4 class="mt-3 mb-3">Mes trajets proposés</h4>`;
        liste.appendChild(titreProposes);
        afficherTrajets(trajetsProposes);
    }
    if (trajetsReserves.length) {
        const titreReserves = document.createElement("div");
        titreReserves.innerHTML = `<h4 class="mt-4 mb-3">Mes trajets réservés</h4>`;
        liste.appendChild(titreReserves);
        afficherTrajets(trajetsReserves);
    }
    if (!trajetsProposes.length && !trajetsReserves.length) {
        afficherAucunTrajet();
    }
}

// ----------- 4. Modal de réservation -----------

function ouvrirModalReservation(trajetId) {
    const modalBody = document.getElementById("modalBody");
    modalBody.innerHTML = `<p>Réservation pour le trajet #${trajetId}</p>`;

    const modal = new bootstrap.Modal(document.getElementById('reservationModal'));
    modal.show();

    document.getElementById("btnConfirmerReservation").onclick = function () {
        // Ici tu mets ta logique AJAX de réservation réelle
        modal.hide();
        alert("Réservation envoyée !");
    };
}

// ----------- 5. Recherche de trajets (automatique public/privé) -----------

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

    // 1. Essaye recherche "connecté"
    fetch('asset/PHP/trajets.phpall=1&?' + params.toString())
        .then(res => res.json())
        .then(data => {
            if (data.trajets_proposes || data.trajets_reserves) {
                afficherDashboard(data.trajets_proposes || [], data.trajets_reserves || []);
            } else if (data.error && data.error === "Utilisateur non connecté") {
                // 2. Sinon, tente recherche publique
                fetch('asset/PHP/trajets.php?all=1&' + params.toString())
                    .then(res => res.json())
                    .then(dataPub => {
                        if (Array.isArray(dataPub)) {
                            afficherTrajets(dataPub);
                        } else if (dataPub.all_trajets) {
                            afficherTrajets(dataPub.all_trajets);
                        } else {
                            afficherAucunTrajet();
                        }
                    });
            } else if (Array.isArray(data)) {
                afficherTrajets(data);
            } else if (data.all_trajets) {
                afficherTrajets(data.all_trajets);
            } else {
                afficherAucunTrajet();
            }
        })
        .catch(() => afficherAucunTrajet());
}

// ----------- 6. Ajout d'un trajet -----------

function ajouterTrajet() {
    const depart = document.getElementById("depart").value.trim();
    const arrivee = document.getElementById("arrivee").value.trim();
    const date = document.getElementById("date").value.trim();
    const heure = document.getElementById("heure").value.trim();
    const places = document.getElementById("places").value.trim();
    const prix = document.getElementById("prix").value.trim();

    // Simple validation
    if (!depart || !arrivee || !date || !heure || !places || !prix) return;

    // Adaptation pour POST JSON (correspond au PHP actuel)
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
