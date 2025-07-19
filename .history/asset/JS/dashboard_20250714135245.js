document.addEventListener("DOMContentLoaded", () => {
  const userStatus = document.getElementById("userStatus");
  const proposesBody = document.querySelector("#trajets-proposes tbody");
  const reservesBody = document.querySelector("#trajets-reserves tbody");
  const editModal = new bootstrap.Modal(document.getElementById("editTrajetModal"));
  const editForm = document.getElementById("editTrajetForm");

  // Vérification de la session
  fetch("./asset/PHP/check_session.php", { credentials: "same-origin" })
    .then(res => res.json())
    .then(data => {
      if (data.connected) {
        // Affiche le statut
        if (userStatus) userStatus.textContent = `Connecté en tant que ${data.user.prenom}`;
        // Charge les données
        chargerTrajets();
      } else {
        if (userStatus) userStatus.textContent = "Vous n'êtes pas connecté. Veuillez vous connecter.";
      }
    })
    .catch(err => {
      console.error("Erreur check session :", err);
      if (userStatus) userStatus.textContent = "Erreur lors de la vérification de la connexion.";
    });

  // Fonction pour charger trajets
  function chargerTrajets() {
    if (proposesBody) proposesBody.innerHTML = "";
    if (reservesBody) reservesBody.innerHTML = "";

    fetch("./asset/PHP/trajets.php", { credentials: "same-origin" })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert("Erreur : " + data.error);
          return;
        }
        // Proposés
        data.trajets_proposes.forEach(t => {
          const row = document.createElement("tr");
          // ... construit ton row ...
          proposesBody.append(row);
        });
        // Réservés
        data.trajets_reserves.forEach(t => {
          const row = document.createElement("tr");
          // ... construit ton row ...
          reservesBody.append(row);
        });
      })
      .catch(err => {
        console.error("Erreur fetch trajets:", err);
        alert("Erreur lors du chargement des trajets.");
      });
  }

  // Gestion des actions edit/delete/cancel
  document.body.addEventListener("click", e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    // ... le reste de tes handlers ...
  });

  // Form edit
  if (editForm) {
    editForm.addEventListener("submit", e => {
      e.preventDefault();
      // ... update ...
    });
  }
});