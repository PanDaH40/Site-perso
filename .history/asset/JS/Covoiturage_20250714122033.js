document.addEventListener("DOMContentLoaded", () => {
  const userStatus = document.getElementById("userStatus");
  const searchForm = document.getElementById("searchForm");
  const resetFiltersBtn = document.getElementById("resetFilters");
  const trajetList = document.getElementById("trajetList");

  // Vérifie l’état de session
  fetch("./asset/PHP/check_session.php", { credentials: "same-origin" })
    .then(res => res.json())
    .then(data => {
      if (userStatus) {
        if (data.connected) {
          userStatus.textContent = `Connecté en tant que ${data.user.prenom}`;
          userStatus.classList.remove("text-muted");
          userStatus.classList.add("text-success");
        } else {
          userStatus.textContent = "Non connecté";
          userStatus.classList.remove("text-success");
          userStatus.classList.add("text-muted");
        }
      }
    })
    .catch(err => {
      console.error("Erreur session:", err);
      if (userStatus) {
        userStatus.textContent = "Erreur session";
        userStatus.classList.add("text-danger");
      }
    });

  // Chargement initial des trajets
  chargerTrajets();

  // Recherche filtrée
  if (searchForm) {
    searchForm.addEventListener("submit", e => {
      e.preventDefault();
      const filters = {
        departure: document.getElementById("departure").value.trim().toLowerCase(),
        arrival: document.getElementById("arrival").value.trim().toLowerCase(),
        date: document.getElementById("date").value,
        passengers: parseInt(document.getElementById("passengers").value)
      };
      chargerTrajets(filters);
    });
  }

  // Réinitialiser les filtres
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      document.getElementById("departure").value = "";
      document.getElementById("arrival").value = "";
      document.getElementById("date").value = "";
      document.getElementById("passengers").value = "";
      chargerTrajets(); // recharge tous les trajets
    });
  }

  // Fonction pour charger et filtrer les trajets
  function chargerTrajets(filters = {}) {
    fetch("./asset/PHP/trajets.php?all=1", { credentials: "same-origin" })
      .then(res => res.json())
      .then(data => {
        if (!data.all_trajets) return;
        trajetList.innerHTML = "";

        const trajets = data.all_trajets.filter(trajet => {
          if (filters.departure && !trajet.depart.toLowerCase().includes(filters.departure)) return false;
          if (filters.arrival && !trajet.arrivee.toLowerCase().includes(filters.arrival)) return false;
          if (filters.date && trajet.date !== filters.date) return false;
          if (filters.passengers && (trajet.places - trajet.total_reservations) < filters.passengers) return false;
          return true;
        });

        if (trajets.length === 0) {
          trajetList.innerHTML = `<p class="text-muted">Aucun trajet ne correspond à votre recherche.</p>`;
          return;
        }

        trajets.forEach(t => {
          const dispo = t.places - t.total_reservations;
          const card = document.createElement("div");
          card.className = "col-md-4 mb-4";
          card.innerHTML = `
            <div class="card h-100 shadow">
              <div class="card-body">
                <h5 class="card-title">${t.depart} → ${t.arrivee}</h5>
                <p class="card-text">
                  Date : ${t.date} à ${t.heure}<br>
                  Conducteur : ${t.conducteur_prenom} ${t.conducteur_nom}<br>
                  Places disponibles : ${dispo} / ${t.places}
                </p>
                <button class="btn btn-success w-100" data-bs-toggle="modal"
                        data-bs-target="#reservationModal"
                        data-id="${t.id}"
                        data-depart="${t.depart}"
                        data-arrivee="${t.arrivee}"
                        data-date="${t.date}"
                        data-heure="${t.heure}"
                        data-dispo="${dispo}">
                  Réserver
                </button>
              </div>
            </div>`;
          trajetList.appendChild(card);
        });
      })
      .catch(err => {
        console.error("Erreur chargement trajets:", err);
        trajetList.innerHTML = `<p class="text-danger">Erreur lors du chargement des trajets.</p>`;
      });
  }
});
