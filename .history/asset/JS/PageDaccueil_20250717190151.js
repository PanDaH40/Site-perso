document.addEventListener("DOMContentLoaded", () => {
  const basePath = '/TPCovoiturage/asset/PHP/';
  const userStatus = document.getElementById("userStatus");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginBtn = document.getElementById("loginBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");
  const btnProfil = document.getElementById("btnProfil");
  const btnMessages = document.getElementById("btnMessages");
  const notifMessages = document.getElementById("notif-messages");
  const notifBadge = document.getElementById("notif-badge");
  const form = document.getElementById("searchForm");
  const resetBtn = document.getElementById("resetFilters");

  // Fonction pour cacher les éléments liés à l'utilisateur connecté
  function masquerElementsUtilisateur() {
    if (logoutBtn) logoutBtn.classList.add("d-none");
    if (dashboardBtn) dashboardBtn.classList.add("d-none");
    if (btnProfil) btnProfil.style.display = "none";
    if (btnMessages) btnMessages.style.display = "none";
    if (notifMessages) notifMessages.style.display = "none";
    if (notifBadge) notifBadge.style.display = "none";
  }

  function afficherElementsUtilisateur() {
    if (logoutBtn) logoutBtn.classList.remove("d-none");
    if (dashboardBtn) dashboardBtn.classList.remove("d-none");
    if (btnProfil) btnProfil.style.display = "";
    if (btnMessages) btnMessages.style.display = "";
    if (notifMessages) notifMessages.style.display = "inline-block";
  }

  // Vérifie si l'utilisateur est connecté
  fetch(basePath + "check_session.php", { credentials: "same-origin" })
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
      form.reset();
      let liste = document.getElementById("liste-trajets");
      if (liste) liste.innerHTML = '';
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      fetch(basePath + "logout.php", {
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

  // **Recherche et affichage des trajets**
  if (form) {
  form.addEventListener("submit", e => {
    e.preventDefault();
    const departure = document.getElementById("departure").value.trim();
    const arrival = document.getElementById("arrival").value.trim();
    const date = document.getElementById("date").value;
    let passengers = document.getElementById("passengers").value;
    if (passengers === "4+") passengers = "4";

    if (departure && arrival && date && passengers) {
      // On construit l’URL avec les paramètres dans le query string
      const params = new URLSearchParams({
        depart: departure,
        arrivee: arrival,
        date: date,
        places_min: passengers
      });
      window.location.href = `PageCovoiturage.html?${params.toString()}`;
    } else {
      alert("Veuillez remplir tous les champs du formulaire.");
    }
  });
}

      // Construction de l’URL de recherche
      let url = basePath + "trajets.php?all=1";
      url += "&depart=" + encodeURIComponent(depart);
      url += "&arrivee=" + encodeURIComponent(arrivee);
      url += "&date=" + encodeURIComponent(date);
      if (places) url += "&places_min=" + encodeURIComponent(places);

      fetch(url, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.all_trajets) && data.all_trajets.length) {
            afficherTrajets(data.all_trajets);
          } else if (data.date_alternative) {
            afficherDateAlternative(data.date_alternative);
          } else {
            afficherTrajets([]);
          }
        })
        .catch(() => afficherTrajets([]));
    });
  }

  // Affiche la liste des trajets
  function afficherTrajets(trajets) {
    let liste = document.getElementById("liste-trajets");
    if (!liste) {
      liste = document.createElement('div');
      liste.id = "liste-trajets";
      liste.className = "row justify-content-center mt-4";
      document.querySelector(".parallax2 .container").appendChild(liste);
    }
    liste.innerHTML = "";

    if (!trajets.length) {
      liste.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info text-center">
            Aucun trajet disponible pour votre recherche.
          </div>
        </div>
      `;
      return;
    }

    trajets.forEach(trajet => {
      const placesRestantes = (parseInt(trajet.places) || 0) - (parseInt(trajet.total_reservations) || 0);
      const conducteur = trajet.conducteur_prenom ? `${trajet.conducteur_prenom} ${trajet.conducteur_nom}` : "";
      const imgSrc = trajet.conducteur_avatar ? "asset/Images/" + trajet.conducteur_avatar : "asset/Images/default_03.png";

      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4 mb-4";
      col.innerHTML = `
        <div class="card shadow h-100">
          <div class="card-body">
            <div class="d-flex align-items-center mb-2">
              <img src="${imgSrc}" alt="Conducteur" class="rounded-circle border me-2" style="width:40px;height:40px;">
              <span class="fw-bold">${conducteur}</span>
            </div>
            <div><b>Départ :</b> ${trajet.depart}</div>
            <div><b>Arrivée :</b> ${trajet.arrivee}</div>
            <div><b>Date :</b> ${trajet.date} à ${trajet.heure}</div>
            <div><b>Jetons :</b> ${trajet.jetons}</div>
            <div><b>Places dispo :</b> ${placesRestantes}</div>
          </div>
        </div>
      `;
      liste.appendChild(col);
    });
  }

  // Affiche une date alternative si aucun trajet
  function afficherDateAlternative(date) {
    let liste = document.getElementById("liste-trajets");
    if (!liste) {
      liste = document.createElement('div');
      liste.id = "liste-trajets";
      liste.className = "row justify-content-center mt-4";
      document.querySelector(".parallax2 .container").appendChild(liste);
    }
    liste.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning text-center">
          Aucun trajet trouvé pour cette date.<br>
          Essayez la date du <b>${date}</b> !
        </div>
      </div>
    `;
  }

  // Badge notifications messages
  function mettreAJourNotificationMessages() {
    if (!notifBadge) return;
    fetch(basePath + 'get_messages_recus.php', { credentials: 'include' })
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

  // Mise à jour périodique badge notifications
  setInterval(mettreAJourNotificationMessages, 30000);

  // Aucun trajet visible par défaut à l’ouverture de la page
  let liste = document.getElementById("liste-trajets");
  if (liste) liste.innerHTML = '';
});
