document.getElementById("searchForm").addEventListener("submit", function (e) {
  e.preventDefault(); // empêche l'envoi du formulaire classique

  // Récupération des valeurs
  const departure = document.getElementById("departure").value.trim();
  const arrival = document.getElementById("arrival").value.trim();
  const date = document.getElementById("date").value;
  const passengers = document.getElementById("passengers").value;

  // Vérification des champs
  if (departure && arrival && date && passengers) {
    // Redirection vers la page de résultats
    window.location.href = "PageCovoiturage.html";
  } else {
    alert("Veuillez remplir tous les champs du formulaire.");
  }
});