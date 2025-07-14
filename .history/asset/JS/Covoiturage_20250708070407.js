document.addEventListener("DOMContentLoaded", () => {
  const trajetForm = document.getElementById("trajetForm");

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
            // Optionnel: recharger la page ou recharger les trajets
            // window.location.reload();
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
});
