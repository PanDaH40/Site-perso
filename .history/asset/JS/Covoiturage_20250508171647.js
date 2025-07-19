let trajets = JSON.parse(localStorage.getItem("trajets")) || [];
let trajetSelectionne = null;

document.addEventListener("DOMContentLoaded", function () {
    const formAjoutContainer = document.getElementById("formAjoutContainer");
    const trajetForm = document.getElementById("trajetForm");
    const searchForm = document.getElementById("searchForm");
    const searchResults = document.getElementById("searchResults");

    // Affichage de tous les trajets si l'utilisateur est connecté
    const estConnecte = localStorage.getItem("userEmail") !== null;
    if (estConnecte && formAjoutContainer) {
        formAjoutContainer.classList.remove("d-none");
    }

    afficherTousLesTrajets();

    // Formulaire d'ajout de trajet
    if (trajetForm) {
        trajetForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const trajet = {
                depart: document.getElementById("depart").value,
                arrivee: document.getElementById("arrivee").value,
                conducteur: document.getElementById("conducteur").value,
                date: document.getElementById("date").value,
                heure: document.getElementById("heure").value,
                places: parseInt(document.getElementById("places").value),
            };

            trajets.push(trajet);
            localStorage.setItem("trajets", JSON.stringify(trajets));
            afficherTousLesTrajets();
            trajetForm.reset();
        });
    }

    // Formulaire de recherche de trajet
    if (searchForm) {
        searchForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const departure = document.getElementById("departure").value.trim().toLowerCase();
            const arrival = document.getElementById("arrival").value.trim().toLowerCase();
            const date = document.getElementById("date").value;
            const passengers = parseInt(document.getElementById("passengers").value);

            const results = trajets.filter(t =>
                (t.depart.toLowerCase().includes(departure) || departure === "") &&
                (t.arrivee.toLowerCase().includes(arrival) || arrival === "") &&
                (t.date === date || !date) &&
                (t.places >= passengers || !passengers)
            );

            afficherResultatsRecherche(results);
        });
    }
});

// Fonction pour afficher tous les trajets
function afficherTousLesTrajets() {
    const trajetList = document.getElementById("trajetList");
    if (!trajetList) return;
    trajetList.innerHTML = "";

    trajets.forEach((trajet, index) => {
        if (trajet.places > 0) {
            afficherTrajet(trajet, index);
        }
    });
}

// Fonction pour afficher un trajet spécifique
function afficherTrajet(trajet, index) {
    const trajetList = document.getElementById("trajetList");
    if (!trajetList) return;
    const col = document.createElement("div");
    col.className = "col-md-4 mb-4";

    col.innerHTML = `
        <div class="card h-100 shadow">
            <div class="card-body">
                <h5 class="card-title">${trajet.depart} → ${trajet.arrivee}</h5>
                <p class="card-text">
                    <strong>Conducteur :</strong> ${trajet.conducteur}<br>
                    <strong>Date :</strong> ${trajet.date}<br>
                    <strong>Heure :</strong> ${trajet.heure}<br>
                    <strong>Places disponibles :</strong> ${trajet.places}
                </p>
                <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#reservationModal" onclick="ouvrirModal(${index})">
                    Réserver
                </button>
            </div>
        </div>
    `;

    trajetList.appendChild(col);
}

// Fonction pour afficher les résultats de la recherche
function afficherResultatsRecherche(results) {
    const searchResults = document.getElementById("searchResults");
    if (!searchResults) return;
    searchResults.innerHTML = "";

    if (results.length === 0) {
        searchResults.innerHTML = `<div class="alert alert-warning">Aucun trajet ne correspond à votre recherche.</div>`;
        return;
    }

    results.forEach((trajet, index) => {
        const card = document.createElement("div");
        card.className = "card shadow mb-3";
        card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${trajet.depart} → ${trajet.arrivee}</h5>
                <p class="card-text">
                    <strong>Date :</strong> ${trajet.date}<br>
                    <strong>Conducteur :</strong> ${trajet.conducteur}<br>
                    <strong>Places disponibles :</strong> ${trajet.places}
                </p>
                <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#reservationModal" onclick="ouvrirModal(${index})">Réserver</button>
            </div>
        `;
        searchResults.appendChild(card);
    });
}

// Ouvrir le modal de réservation
function ouvrirModal(index) {
    trajetSelectionne = index;
    const modalBody = document.getElementById("modalBody");
    const trajet = trajets[index];

    if (!modalBody) return;

    modalBody.innerHTML = `
        <p>Trajet de <strong>${trajet.depart}</strong> à <strong>${trajet.arrivee}</strong></p>
        <p>Le <strong>${trajet.date}</strong> à <strong>${trajet.heure}</strong></p>
        <p>Conducteur : <strong>${trajet.conducteur}</strong></p>
        <p>Places restantes : <strong>${trajet.places}</strong></p>
        <div class="form-group mt-3">
            <label for="nbPlacesReservees">Nombre de places à réserver :</label>
            <input type="number" id="nbPlacesReservees" class="form-control" min="1" max="${trajet.places}" value="1">
        </div>
    `;
}

// Confirmer la réservation et mettre à jour le nombre de places
function confirmerReservation() {
    const nbPlacesDemandees = parseInt(document.getElementById("nbPlacesReservees").value);

    if (isNaN(nbPlacesDemandees) || nbPlacesDemandees <= 0) {
        alert("Veuillez entrer un nombre valide de places.");
        return;
    }

    const trajet = trajets[trajetSelectionne];

    if (nbPlacesDemandees > trajet.places) {
        alert(`Désolé, il ne reste que ${trajet.places} place(s) disponible(s).`);
        return;
    }

    trajet.places -= nbPlacesDemandees;
    localStorage.setItem("trajets", JSON.stringify(trajets));
    afficherTousLesTrajets();

    const modalElement = document.getElementById("reservationModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();
}
