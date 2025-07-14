let trajets = [];
let trajetSelectionne = null;

document.addEventListener("DOMContentLoaded", () => {
  const formAjoutContainer = document.getElementById("formAjoutContainer");
  const trajetForm = document.getElementById("trajetForm");
  const searchForm = document.getElementById("searchForm");
  const searchResults = document.getElementById("searchResults");
  const trajetList = document.getElementById("trajetList");
  const modal = new bootstrap.Modal(document.getElementById("reservationModal"));

  function afficherTousLesTrajets() {
    if (!trajetList) return;
    trajetList.innerHTML = "";

    if (trajets.length === 0) {
      trajetList.innerHTML = "<p class='text-muted'>Aucun trajet proposé pour le moment.</p>";
      return;
    }

    trajets.forEach((t, index) => {
      const div = document.createElement("div");
      div.classList.add("col-12", "mb-3");
      div.innerHTML = `
        <div class="card p-3">
          <strong>${t.date} ${t.heure || ""}</strong><br>
          ${t.depart} → ${t.arrivee} <br>
          Places disponibles : ${t.places}<br>
          <button class="btn btn-outline-primary btn-sm mt-2" onclick="ouvrirReservation(${index})">Réserver</button>
        </div>
      `;
      trajetList.appendChild(div);
    });
  }

  window.ouvrirReservation = function(index) {
    trajetSelectionne = trajets[index];
    const details = `${trajetSelectionne.date} ${trajetSelectionne.heure || ""}<br>${trajetSelectionne.depart} → ${trajetSelectionne.arrivee}<br>Places disponibles : ${trajetSelectionne.places}`;
    document.getElementById("modalBody").innerHTML = details;
    modal.show();
  };

  window.confirmerReservation = function() {
    if (!trajetSelectionne) return;

    const nbPlaces = parseInt(document.getElementById("nbPlaces").value);
    if (isNaN(nbPlaces) || nbPlaces <= 0) {
      alert("Veuillez entrer un nombre de places valide.");
      return;
    }

    const formData = new FormData();
    formData.append("trajet_id", trajetSelectionne.id);
    formData.append("places", nbPlaces);

    fetch("./asset/PHP/reserver.php", {
      method: "POST",
      body: formData,
      credentials: "same-origin"
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Réservation confirmée !");
          modal.hide();
          chargerTrajets();
        } else {
          alert("Erreur lors de la réservation : " + (data.error || "Erreur inconnue"));
        }
      })
      .catch(err => {
        console.error("Erreur lors de la réservation :", err);
        alert("Erreur réseau");
      });
  };

  function chargerTrajets() {
    fetch("./asset/PHP/trajets.php", { credentials: "same-origin" })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert("Erreur : " + data.error);
          return;
        }
        trajets = data.trajets_proposes || [];
        console.table(trajets); // debug
        afficherTousLesTrajets();
      })
      .catch(err => {
        console.error("Erreur récupération trajets :", err);
        alert("Impossible de récupérer les trajets.");
      });
  }

  chargerTrajets();

  const estConnecte = localStorage.getItem("userEmail") !== null;
  if (estConnecte && formAjoutContainer) {
    formAjoutContainer.classList.remove("d-none");
  }

  if (trajetForm) {
    trajetForm.addEventListener("submit", e => {
      e.preventDefault();

      const formData = new FormData(trajetForm);

      fetch("./asset/PHP/trajets.php", {
        method: "POST",
        body: formData,
        credentials: "same-origin"
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("Trajet ajouté avec succès !");
            trajetForm.reset();
            chargerTrajets();
          } else {
            alert("Erreur ajout trajet : " + (data.error || "Erreur inconnue"));
          }
        })
        .catch(err => {
          console.error("Erreur ajout trajet :", err);
          alert("Erreur lors de l'ajout du trajet.");
        });
    });
  }
});
