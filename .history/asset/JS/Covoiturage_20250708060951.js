let trajets = [];
let trajetSelectionne = null;

document.addEventListener("DOMContentLoaded", function () {
    const formAjoutContainer = document.getElementById("formAjoutContainer");
    const trajetForm = document.getElementById("trajetForm");
    const searchForm = document.getElementById("searchForm");
    const searchResults = document.getElementById("searchResults");

    // Appel serveur pour récupérer les trajets
    fetch("./asset/PHP/get_trajets.php")
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                trajets = data.trajets;
                afficherTousLesTrajets();
            } else {
                alert("Impossible de récupérer les trajets.");
            }
        })
        .catch(err => {
            console.error("Erreur récupération trajets :", err);
        });

    // Affichage du formulaire d'ajout si connecté (tu peux garder ta logique)
    const estConnecte = localStorage.getItem("userEmail") !== null;
    if (estConnecte && formAjoutContainer) {
        formAjoutContainer.classList.remove("d-none");
    }

    // Gestion ajout trajet (à adapter pour appeler l'API serveur si tu souhaites stocker en base)
    if (trajetForm) {
        trajetForm.addEventListener("submit", function (e) {
            e.preventDefault();
            // Exemple simplifié, tu peux faire un fetch POST vers un endpoint PHP pour enregistrer le trajet en base
            alert("Fonction d'ajout non implémentée côté serveur");
        });
    }

    // Recherche (filtrage côté client sur trajets récupérés)
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

// Les fonctions d'affichage restent identiques à celles que tu as déjà.
