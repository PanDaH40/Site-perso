document.addEventListener("DOMContentLoaded", () => {
  const userStatus = document.getElementById("userStatus");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginBtn = document.getElementById("loginBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");
  const form = document.getElementById("searchForm");
  const resetBtn = document.getElementById("resetFilters");

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    // Supprimer les paramètres de l'URL
    const cleanURL = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanURL);

    // Recharger la page sans filtres
    window.location.reload();
  });
}


  // Vérifie si l'utilisateur est connecté
  fetch("./asset/PHP/check_session.php", { credentials: "same-origin" })
    .then(res => res.json())
    .then(data => {
      if (data.connected) {
        userStatus.textContent = `Connecté en tant que ${data.user.prenom}`;
        userStatus.classList.remove("text-muted");
        userStatus.classList.add("text-success");

        if (logoutBtn) logoutBtn.classList.remove("d-none");
        if (loginBtn) loginBtn.classList.add("d-none");
        if (dashboardBtn) dashboardBtn.classList.remove("d-none");
      } else {
        userStatus.textContent = "Non connecté";
        userStatus.classList.remove("text-success");
        userStatus.classList.add("text-muted");

        if (logoutBtn) logoutBtn.classList.add("d-none");
        if (loginBtn) loginBtn.classList.remove("d-none");
        if (dashboardBtn) dashboardBtn.classList.add("d-none");
      }
    })
    .catch(err => {
      console.error("Erreur session:", err);
      userStatus.textContent = "Erreur session";
      userStatus.classList.add("text-danger");
    });

  // Déconnexion
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      fetch("./asset/PHP/logout.php", {
        method: "POST",
        credentials: "same-origin"
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            location.reload(); // ou window.location.href = "PageDaccueil.html";
          } else {
            alert("Erreur lors de la déconnexion.");
          }
        })
        .catch(err => {
          console.error("Erreur logout:", err);
          alert("Erreur lors de la déconnexion.");
        });
    });
  }

  // Soumission du formulaire de recherche
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();

      const departure = document.getElementById("departure").value.trim();
      const arrival = document.getElementById("arrival").value.trim();
      const date = document.getElementById("date").value;
      const passengers = document.getElementById("passengers").value;

      if (departure && arrival && date && passengers) {
        window.location.href = "PageCovoiturage.html";
      } else {
        alert("Veuillez remplir tous les champs du formulaire.");
      }
    });
  }
});
