document.addEventListener("DOMContentLoaded", function () {
  // Affichage du nom dans un élément HTML avec id 'welcomeMsg'
  const welcomeMsg = document.getElementById("welcomeMsg");
  if (welcomeMsg) {
    // Ici on suppose que PHP a injecté le nom dans un data-attribute
    const userName = welcomeMsg.dataset.username || "";
    welcomeMsg.textContent = `Bienvenue, ${userName} !`;
  }

  // Bouton déconnexion
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      fetch('logout.php')
        .then(() => {
          window.location.href = 'PageConnection.html'; // redirige après déconnexion
        })
        .catch(() => {
          alert("Erreur lors de la déconnexion.");
        });
    });
  }
});
