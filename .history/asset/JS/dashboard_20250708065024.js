document.addEventListener("DOMContentLoaded", () => {
  const formAjoutContainer = document.getElementById("formAjoutContainer");
  const trajetForm = document.getElementById("trajetForm");

  // Afficher formulaire si utilisateur connecté
  if (formAjoutContainer) {
    // Ici tu peux vérifier via localStorage ou mieux, avec le PHP côté serveur qui protège la page.
    formAjoutContainer.classList.remove("d-none");
  }

  // Gérer ajout trajet
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
            // Recharge la liste des trajets (fonction à créer)
            chargerTrajets();
          } else {
            alert("Erreur : " + (data.error || "Erreur inconnue"));
          }
        })
        .catch(err => {
          console.error("Erreur ajout trajet :", err);
          alert("Erreur lors de l'ajout du trajet.");
        });
    });
  }

  // Exemple simple de fonction pour charger les trajets (reprends ton code d'affichage)
  function chargerTrajets() {
    // Ton fetch GET sur trajets.php, affichage dans tableau...
    // (tu peux reprendre la fonction de ton dashboard.js)
  }

  // Charge initialement les trajets
  chargerTrajets();
});
