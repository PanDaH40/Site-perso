let trajets = [];
let trajetSelectionne = null;

document.addEventListener("DOMContentLoaded", () => {
  const formAjoutContainer = document.getElementById("formAjoutContainer");
  const trajetForm = document.getElementById("trajetForm");
  const searchForm = document.getElementById("searchForm");
  const searchResults = document.getElementById("searchResults");

  // Récupérer les trajets depuis le serveur
  fetch("./asset/PHP/get_trajets.php", { credentials: "same-origin" })
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

  // Afficher le formulaire d'ajout si utilisateur connecté
  const estConnecte = localStorage.getItem("userEmail") !== null;
  if (estConnecte && formAjoutContainer) {
    formAjoutContainer.classList.remove("d-none");
  }

  // Gestion du formulaire d'ajout de trajet (à adapter avec API serveur)
  if (trajetForm) {
    trajetForm.addEventListener("submit", e => {
      e.preventDefault();
      alert("Fonction d'ajout non implémentée côté serveur");
      // Ici tu peux faire un fetch POST vers un endpoint PHP pour ajouter un trajet
    });
  }

  // Recherche avec filtrage côté client
  if (searchForm) {
    searchForm.addEventListener("submit", e => {
      e.preventDefault();

      const departure = document.getElementById("departure").value.trim().toLowerCase();
      const arrival = document.getElementById("arrival").value.trim().toLowerCase();
      const date = document.getElementById("date").value;
      const passengers = parseInt(document.getElementById("passengers").value);

      const results = trajets.filter(t =>
        (departure === "" || t.depart.toLowerCase().includes(departure)) &&
        (arrival === "" || t.arrivee.toLowerCase().includes(arrival)) &&
        (date === "" || t.date === date) &&
        (isNaN(passengers) || t.places >= passengers)
      );

      afficherResultatsRecherche(results);
    });
  }

  // Afficher tous les trajets récupérés (à adapter selon ta structure HTML)
  function afficherTousLesTrajets() {
    if (!searchResults) return;
    searchResults.innerHTML = "";

    if (trajets.length === 0) {
      searchResults.innerHTML = "<p>Aucun trajet disponible.</p>";
      return;
    }

    trajets.forEach(t => {
      const div = document.createElement("div");
      div.classList.add("trajet-item");
      div.innerHTML = `
        <strong>${t.date} ${t.heure}</strong> : ${t.depart} → ${t.arrivee} | Places disponibles : ${t.places}
      `;
      searchResults.appendChild(div);
    });
  }

  // Affiche les résultats de recherche
  function afficherResultatsRecherche(results) {
    if (!searchResults) return;
    searchResults.innerHTML = "";

    if (results.length === 0) {
      searchResults.innerHTML = "<p>Aucun trajet ne correspond à votre recherche.</p>";
      return;
    }

    results.forEach(t => {
      const div = document.createElement("div");
      div.classList.add("trajet-item");
      div.innerHTML = `
        <strong>${t.date} ${t.heure}</strong> : ${t.depart} → ${t.arrivee} | Places disponibles : ${t.places}
      `;
      searchResults.appendChild(div);
    });
  }
});
