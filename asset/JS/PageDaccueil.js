document.addEventListener("DOMContentLoaded", () => {
  const basePath = '/PHP/';

  const userStatus = document.getElementById("userStatus");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginBtn = document.getElementById("loginBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");
  const btnProfil = document.getElementById("btnProfil");
  const btnMessages = document.getElementById("btnMessages");
  const notifMessages = document.getElementById("notif-messages");
  const notifBadge = document.getElementById("notif-badge");
  const adminBtn = document.getElementById("btn-admin");

  const form = document.getElementById("searchForm");
  const resetBtn = document.getElementById("resetFilters");

  /* ----------------------------------------------------
     MASQUER ÉLÉMENTS SI NON CONNECTÉ
  ---------------------------------------------------- */
  function masquerElementsUtilisateur() {
    logoutBtn?.classList.add("d-none");
    dashboardBtn?.classList.add("d-none");
    btnProfil?.classList.add("d-none");
    btnMessages?.classList.add("d-none");
    notifMessages?.classList.add("d-none");
    notifBadge?.classList.add("d-none");
    adminBtn?.classList.add("d-none");
  }

  /* ----------------------------------------------------
     AFFICHER ÉLÉMENTS SI CONNECTÉ
  ---------------------------------------------------- */
  function afficherElementsUtilisateur() {
    logoutBtn?.classList.remove("d-none");
    dashboardBtn?.classList.remove("d-none");
    btnProfil?.classList.remove("d-none");
    btnMessages?.classList.remove("d-none");
    notifMessages?.classList.remove("d-none");
  }

  /* ----------------------------------------------------
     CHECK SESSION
  ---------------------------------------------------- */
  fetch(basePath + "check_session.php", { credentials: "include" })
    .then(res => res.json())
    .then(data => {
      console.log("Session:", data);

      if (data.connected) {
        userStatus.textContent = `Connecté en tant que ${data.user.prenom}`;
        userStatus.classList.remove("text-muted");
        userStatus.classList.add("text-success");

        loginBtn?.classList.add("d-none");

        afficherElementsUtilisateur();
        mettreAJourNotificationMessages();

        // Afficher bouton admin si admin == 1
        if (adminBtn) {
          if (data.user.admin == 1) {
            adminBtn.classList.remove("d-none");
          } else {
            adminBtn.classList.add("d-none");
          }
        }

      } else {
        userStatus.textContent = "Non connecté";
        userStatus.classList.replace("text-success", "text-muted");
        loginBtn?.classList.remove("d-none");
        masquerElementsUtilisateur();
      }
    })
    .catch(err => {
      console.error("Erreur session:", err);
      userStatus.textContent = "Erreur session";
      userStatus.classList.add("text-danger");
      loginBtn?.classList.remove("d-none");
      masquerElementsUtilisateur();
    });

  /* ----------------------------------------------------
     FORMULAIRE DE RECHERCHE
  ---------------------------------------------------- */
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      form.reset();
    });
  }

  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();

      const depart = document.getElementById("departure").value.trim();
      const arrivee = document.getElementById("arrival").value.trim();
      const date = document.getElementById("date").value;
      let places = document.getElementById("passengers").value;

      if (places === "4+") places = "4";

      if (!depart || !arrivee || !date || !places) {
        alert("Veuillez remplir tous les champs du formulaire.");
        return;
      }

      const params = new URLSearchParams({
        depart,
        arrivee,
        date,
        places_min: places
      }).toString();

      window.location.href = "PageCovoiturage.html?" + params;
    });
  }

  /* ----------------------------------------------------
     DÉCONNEXION
  ---------------------------------------------------- */
  logoutBtn?.addEventListener("click", () => {
    fetch(basePath + "logout.php", {
      method: "POST",
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          location.reload();
        } else {
          alert("Erreur lors de la déconnexion.");
        }
      })
      .catch(() => alert("Erreur lors de la déconnexion."));
  });

  /* ----------------------------------------------------
     NOTIFICATIONS MESSAGES
  ---------------------------------------------------- */
  function mettreAJourNotificationMessages() {
    if (!notifBadge) return;

    fetch(basePath + 'get_messages_recus.php', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Erreur réseau');
        return res.json();
      })
      .then(data => {
        const totalNonLus = data.totalNonLus || 0;
        notifBadge.textContent = totalNonLus;
        notifBadge.style.display = totalNonLus > 0 ? "inline-block" : "none";
      })
      .catch(() => {
        notifBadge.style.display = "none";
      });
  }

  setInterval(mettreAJourNotificationMessages, 30000);
});
