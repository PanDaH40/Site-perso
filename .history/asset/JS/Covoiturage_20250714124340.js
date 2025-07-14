document.addEventListener("DOMContentLoaded", () => {
  const userStatus = document.getElementById("userStatus");
  const trajetList = document.getElementById("trajetList");
  const formAjoutContainer = document.getElementById("formAjoutContainer");
  const searchForm = document.getElementById("searchForm");
  const resetFilters = document.getElementById("resetFilters");

  // Vérifier session utilisateur
  fetch("./asset/PHP/check_session.php", { credentials: "same-origin" })
    .then(res => res.json())
    .then(data => {
      if (data.connected) {
        if (userStatus) userStatus.textContent = `Connecté en tant que ${data.user.prenom}`;
        if (formAjoutContainer) formAjoutContainer.classList.remove("d-none");
      }
      chargerTrajets();
    })
    .catch(err => {
      console.error("Erreur session:", err);
    });

  function chargerTrajets(filtre = {}) {
    fetch("./asset/PHP/trajets.php?all=1", { credentials: "same-origin" })
      .then(res => res.json())
      .then(data => {
        if (!data.all_trajets || !Array.isArray(data.all_trajets)) return;

        const trajets = data.all_trajets.filter(t => {
          return (
            (!filtre.departure || t.depart.toLowerCase().includes(filtre.departure.toLowerCase())) &&
            (!filtre.arrival || t.arrivee.toLowerCase().includes(filtre.arrival.toLowerCase())) &&
            (!filtre.date || t.date === filtre.date) &&
            (!filtre.passengers || (t.places - t.total_reservations) >= parseInt(filtre.passengers))
          );
        });

        trajetList.innerHTML = "";
        if (trajets.length === 0) {
          trajetList.innerHTML = '<div class="col-12"><p class="text-center">Aucun trajet trouvé.</p></div>';
          return;
        }

        trajets.forEach(trajet => {
          const disponible = trajet.places - trajet.total_reservations;
          const card = document.createElement("div");
          card.className = "col-md-6 mb-3";
          card.innerHTML = `
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">${trajet.depart} → ${trajet.arrivee}</h5>
                <p class="card-text">
                  <strong>Date:</strong> ${trajet.date} à ${trajet.heure}<br>
                  <strong>Conducteur:</strong> ${trajet.conducteur_prenom} ${trajet.conducteur_nom}<br>
                  <strong>Places dispo:</strong> ${disponible} / ${trajet.places}
                </p>
                <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#reservationModal" onclick="ouvrirReservation(${trajet.id}, '${trajet.depart}', '${trajet.arrivee}', '${trajet.date}', '${trajet.heure}', ${disponible})">
                  Réserver
                </button>
              </div>
            </div>
          `;
          trajetList.appendChild(card);
        });
      })
      .catch(err => console.error("Erreur chargement trajets:", err));
  }

  if (searchForm) {
    searchForm.addEventListener("submit", e => {
      e.preventDefault();
      const filtre = {
        departure: document.getElementById("departure").value.trim(),
        arrival: document.getElementById("arrival").value.trim(),
        date: document.getElementById("date").value,
        passengers: document.getElementById("passengers").value
      };
      chargerTrajets(filtre);
    });
  }

  if (resetFilters) {
    resetFilters.addEventListener("click", () => {
      document.getElementById("departure").value = "";
      document.getElementById("arrival").value = "";
      document.getElementById("date").value = "";
      document.getElementById("passengers").value = "";
      chargerTrajets();
    });
  }
});

function ouvrirReservation(id, depart, arrivee, date, heure, dispo) {
  const modalBody = document.getElementById("modalBody");
  const modal = document.getElementById("reservationModal");
  modal.dataset.trajetId = id;

  modalBody.innerHTML = `
    <p><strong>Trajet:</strong> ${depart} → ${arrivee}</p>
    <p><strong>Date:</strong> ${date} à ${heure}</p>
    <p><strong>Places disponibles:</strong> ${dispo}</p>
  `;
  document.getElementById("nbPlaces").max = dispo;
}

function confirmerReservation() {
  const nbPlaces = parseInt(document.getElementById("nbPlaces").value, 10);
  const modal = document.getElementById("reservationModal");
  const trajetId = modal.dataset.trajetId;

  if (!nbPlaces || nbPlaces <= 0) {
    alert("Veuillez entrer un nombre de places valide.");
    return;
  }

  fetch("./asset/PHP/reserver.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ trajet_id: trajetId, places: nbPlaces })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Réservation effectuée avec succès.");
        bootstrap.Modal.getInstance(document.getElementById("reservationModal")).hide();
        document.getElementById("searchForm").dispatchEvent(new Event("submit"));
      } else {
        alert("Erreur : " + data.error);
      }
    })
    .catch(err => {
      console.error("Erreur lors de la réservation :", err);
      alert("Erreur serveur lors de la réservation.");
    });
}
