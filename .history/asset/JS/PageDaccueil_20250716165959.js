document.addEventListener("DOMContentLoaded", () => {
  const userStatus = document.getElementById("userStatus");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginBtn = document.getElementById("loginBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");
  const btnProfil = document.getElementById("btnProfil");       // bouton Profil
  const btnMessages = document.getElementById("btnMessages");   // bouton Messages
  const notifMessages = document.getElementById("notif-messages"); // conteneur cloche notif
  const notifBadge = document.getElementById("notif-badge");    // badge sur la cloche
  const form = document.getElementById("searchForm");
  const resetBtn = document.getElementById("resetFilters");

  // Fonction pour cacher tous les éléments liés à l'utilisateur connecté
  function masquerElementsUtilisateur() {
    if (logoutBtn) logoutBtn.classList.add("d-none");
    if (dashboardBtn) dashboardBtn.classList.add("d-none");
    if (btnProfil) btnProfil.style.display = "none";
    if (btnMessages) btnMessages.style.display = "none";
    if (notifMessages) notifMessages.style.display = "none";
    if (notifBadge) notifBadge.style.display = "none";
  }

  // Fonction pour afficher les éléments utilisateur
  function afficherElementsUtilisateur() {
    if (logoutBtn) logoutBtn.classList.remove("d-none");
    if (dashboardBtn) dashboardBtn.classList.remove("d-none");
    if (btnProfil) btnProfil.style.display = "";
    if (btnMessages) btnMessages.style.display = "";
    if (notifMessages) notifMessages.style.display = "inline-block";
  }

  // Vérifie si l'utilisateur est connecté
  fetch("./asset/PHP/check_session.php", { credentials: "same-origin" })
    .then(res => res.json())
    .then(data => {
      if (data.connected) {
        userStatus.textContent = `Connecté en tant que ${data.user.prenom}`;
        userStatus.classList.remove("text-muted");
        userStatus.classList.add("text-success");

        if (loginBtn) loginBtn.classList.add("d-none");

        afficherElementsUtilisateur();
        mettreAJourNotificationMessages();
      } else {
        userStatus.textContent = "Non connecté";
        userStatus.classList.remove("text-success");
        userStatus.classList.add("text-muted");

        if (loginBtn) loginBtn.classList.remove("d-none");

        masquerElementsUtilisateur();
      }
    })
    .catch(err => {
      console.error("Erreur session:", err);
      userStatus.textContent = "Erreur session";
      userStatus.classList.add("text-danger");
      if (loginBtn) loginBtn.classList.remove("d-none");
      masquerElementsUtilisateur();
    });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const cleanURL = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanURL);
      window.location.reload();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      fetch("./asset/PHP/logout.php", {
        method: "POST",
        credentials: "same-origin"
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          location.reload();
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

  // Mise à jour périodique badge notifications
  setInterval(mettreAJourNotificationMessages, 30000);

  function mettreAJourNotificationMessages() {
    if (!notifBadge) return;
    fetch('asset/PHP/get_messages_recus.php')
      .then(res => {
        if (!res.ok) throw new Error('Erreur réseau');
        return res.json();
      })
      .then(data => {
        const totalNonLus = data.totalNonLus || 0;
        if (totalNonLus > 0) {
          notifBadge.textContent = totalNonLus;
          notifBadge.style.display = 'inline-block';
        } else {
          notifBadge.style.display = 'none';
        }
      })
      .catch(() => {
        notifBadge.style.display = 'none';
      });
  }
});
