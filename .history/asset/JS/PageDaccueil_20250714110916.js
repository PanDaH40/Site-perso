document.getElementById("searchForm").addEventListener("submit", function (e) {
  e.preventDefault(); // empêche l'envoi du formulaire classique

    document.addEventListener("DOMContentLoaded", () => {
    const userStatus = document.getElementById("userStatus");

    fetch("./asset/PHP/check_session.php", { credentials: "same-origin" })
      .then(res => res.json())
      .then(data => {
        if (data.connected) {
          userStatus.textContent = `Connecté en tant que ${data.user.prenom}`;
          userStatus.classList.remove("text-muted");
          userStatus.classList.add("text-success");
        } else {
          userStatus.textContent = "Non connecté";
          userStatus.classList.remove("text-success");
          userStatus.classList.add("text-muted");
        }
      })
      .catch(err => {
        console.error("Erreur session:", err);
        userStatus.textContent = "Erreur session";
        userStatus.classList.add("text-danger");
      });
  });
  
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