document.addEventListener("DOMContentLoaded", () => {
  fetch("asset/PHP/check_session.php", { credentials: "same-origin" })
    .then(res => res.json())
    .then(data => {
      if (data.connected) {
        // Par exemple afficher le prénom dans un élément #userStatus
        const userStatus = document.getElementById("userStatus");
        if (userStatus) {
          userStatus.textContent = `Connecté en tant que ${data.user.prenom}`;
        }
        // Afficher éléments réservés aux connectés
        document.body.classList.add("connected");
      } else {
        // Non connecté, message ou redirection
        const userStatus = document.getElementById("userStatus");
        if (userStatus) {
          userStatus.textContent = "Vous n'êtes pas connecté.";
        }
        // Optionnel : rediriger vers login ou masquer certains éléments
      }
    })
    .catch(err => {
      console.error("Erreur check session :", err);
    });
});
