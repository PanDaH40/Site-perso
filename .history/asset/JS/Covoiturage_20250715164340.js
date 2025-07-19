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
                    <div class="mb-2"><span class="fw-semibold">Places dispo&nbsp;:</span> ${trajet.places - (trajet.total_reservations || 0)}</div>
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

// ----------- 2. Modal de réservation (simplifié) -----------

function ouvrirModalReservation(trajetId) {
    // Ici tu peux charger les détails du trajet et ouvrir la modal Bootstrap
    // Pour l’exemple, on affiche juste le trajet ID dans la modal
    const modalBody = document.getElementById("modalBody");
    modalBody.innerHTML = `<p>Réservation pour le trajet #${trajetId}</p>`;

    // Ouvre la modal Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('reservationModal'));
    modal.show();

    // (Optionnel) gérer la confirmation
    document.getElementById("btnConfirmerReservation").onclick = function () {
        // Appelle ici ton endpoint de réservation AJAX
        // ...
        modal.hide();
        alert("Réservation envoyée !");
    };
}

// ----------- 3. Recherche de trajets -----------

function rechercherTrajets() {
    const depart = document.getElementById("departure").value.trim();
    const arrivee = document.getElementById("arrival").value.trim();
    const date = document.getElementById("dateSearch").value.trim();
    const passengers = document.getElementById("passengers").value.trim();

    // Crée un objet de recherche
    const params = new URLSearchParams();
    if (depart) params.append("depart", depart);
    if (arrivee) params.append("arrivee", arrivee);
    if (date) params.append("date", date);
    if (passengers) params.append("places", passengers);

    fetch('asset/PHP/trajets.php?all=1' + params.toString())
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

    // Simple validation
    if (!depart || !arrivee || !date || !heure || !places || !prix) return;

    const formData = new FormData();
    formData.append("depart", depart);
    formData.append("arrivee", arrivee);
    formData.append("date", date);
    formData.append("heure", heure);
    formData.append("places", places);
    formData.append("prix", prix);

    fetch("asset/PHP/trajets.php", {
        method: "POST",
        body: formData
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
