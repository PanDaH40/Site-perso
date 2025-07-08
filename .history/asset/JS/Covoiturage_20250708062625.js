let trajets = [];
let trajetSelectionne = null;

document.addEventListener("DOMContentLoaded", () => {
  const formAjoutContainer = document.getElementById("formAjoutContainer");
  const trajetForm = document.getElementById("trajetForm");
  const searchForm = document.getElementById("searchForm");
  const searchResults = document.getElementById("searchResults");

  // Fonction pour afficher tous les trajets
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
        <strong>${t.date} ${t.heure || ""}</strong> : ${t.depart} → ${t.arrivee} | Places disponibles : ${t.places}
      `;
      searchResults.appendChild(div);
    });
  }

  // Fonction pour afficher les résultats filtrés
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
        <strong>${t.date} ${t.heure || ""}</strong> : ${t.depart} → ${t.arrivee} | Places disponibles : ${t.places}
      `;
      searchResults.appendChild(div);
    });
  }

  // Charger les trajets depuis le serveur
  function chargerTrajets() {
    fetch("./asset/PHP/trajets.php", { credentials: "same-origin" })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert("Erreur : " + data.error);
          return;
        }
        trajets = data.trajets_proposes || [];
        afficherTousLesTrajets();
      })
      .catch(err => {
        console.error("Erreur récupération trajets :", err);
        alert("Impossible de récupérer les trajets.");
      });
  }

  chargerTrajets();

  // Afficher le formulaire d'ajout si utilisateur connecté (exemple avec localStorage)
  const estConnecte = localStorage.getItem("userEmail") !== null;
  if (estConnecte && formAjoutContainer) {
    formAjoutContainer.classList.remove("d-none");
  }

  // Gestion du formulaire d'ajout via fetch POST
  if (trajetForm) {
    trajetForm.addEventListener("submit", e => {
      e.preventDefault();

      const formData = new FormData(trajetForm);

      fetch("./asset/PHP/trajets.php", {
        method: "POST",
        body: formData,
        credentials: "same-origin"
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("Trajet ajouté avec succès !");
            trajetForm.reset();
            chargerTrajets(); // Recharge la liste après ajout
          } else {
            alert("Erreur ajout trajet : " + (data.error || "Erreur inconnue"));
          }
        })
        .catch(err => {
          console.error("Erreur ajout trajet :", err);
          alert("Erreur lors de l'ajout du trajet.");
        });
    });
  }

  // Recherche avec filtrage côté client sur trajets chargés
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
});
