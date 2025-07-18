// asset/JS/Covoiturage.js
// Gestion de l'ajout, de l'affichage des trajets et des réservations

window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('trajetForm');
  const listeTrajets = document.getElementById('liste-trajets');
  const btnConfirmer = document.getElementById('btnConfirmerReservation');
  let selectedTrajetId = null;

  /**
   * 1) Ajout d'un trajet par le conducteur
   */
  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();

      const data = {
        depart: document.getElementById('depart').value.trim(),
        arrivee: document.getElementById('arrivee').value.trim(),
        date: document.getElementById('date').value,
        heure: document.getElementById('heure').value,
        places: parseInt(document.getElementById('places').value, 10),
        prix: parseFloat(document.getElementById('prix').value)
      };

      // Validation des champs
      if (!data.depart || !data.arrivee || !data.date || !data.heure ||
          data.places <= 0 || isNaN(data.prix) || data.prix < 0) {
        alert('Veuillez remplir tous les champs correctement.');
        return;
      }

      try {
        const response = await fetch('asset/PHP/trajets.php', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.error) {
          alert(result.error);
        } else {
          alert('Trajet ajouté avec succès!');
          form.reset();
          loadTrajets();
        }
      } catch (err) {
        console.error('Erreur ajout trajet:', err);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  }

  /**
   * 2) Chargement et affichage des trajets publics
   */
  async function loadTrajets() {
    try {
      const response = await fetch('asset/PHP/trajets.php?all=1', {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      if (data.error) {
        console.error('Erreur chargement trajets :', data.error);
        return;
      }
      afficherTrajets(data.all_trajets);
    } catch (err) {
      console.error('Erreur chargement trajets :', err);
    }
  }

  /**
   * 3) Construction de la grille de trajets
   * @param {Array} trajets
   */
  function afficherTrajets(trajets) {
  listeTrajets.innerHTML = '';
  if (!trajets.length) {
    listeTrajets.innerHTML = '<p>Aucun trajet disponible.</p>';
    return;
  }

  trajets.forEach(t => {
    // Calcul exact des places restantes
    const placesRestantes = t.places - (t.total_reservations || 0);

    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    col.innerHTML = `
      <div class="card h-100">
        <div class="card-header d-flex align-items-center">
          <img src="${t.conducteur_avatar || '/default-avatar.png'}"
               alt="Avatar ${t.conducteur_prenom} ${t.conducteur_nom}"
               class="rounded-circle me-2"
               style="width:40px;height:40px;object-fit:cover;cursor:pointer;"
               data-id="${t.conducteur_id}">
          <strong>${t.conducteur_prenom} ${t.conducteur_nom}</strong>
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${t.depart} → ${t.arrivee}</h5>
          <p class="card-text mb-3">
            📅 ${t.date} 🕒 ${t.heure}<br>
            🚗 Places dispo : ${placesRestantes}<br>
            💶 Prix : ${parseFloat(t.prix).toFixed(2)} €
          </p>
          <button class="btn btn-success mt-auto btn-reserver"
                  data-id="${t.id}"
                  data-restantes="${placesRestantes}">
            Réserver
          </button>
        </div>
      </div>`;
    listeTrajets.appendChild(col);
  });

  // Clic sur avatar → profil conducteur
  document.querySelectorAll('.card-header img').forEach(img => {
    img.addEventListener('click', () => {
      window.location.href = `Profile.html?user=${img.dataset.id}`;
    });
  });

  // Clic sur Réserver → modal
  document.querySelectorAll('.btn-reserver').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedTrajetId = btn.dataset.id;
      const rest = btn.dataset.restantes;
      document.getElementById('modalBody').innerHTML = `
        <p>Places disponibles : ${rest}</p>
        <div class="mb-3">
          <label for="nbPlaces" class="form-label">Nombre de places :</label>
          <input type="number"
                 id="nbPlaces"
                 class="form-control"
                 min="1"
                 max="${rest}"
                 value="1">
        </div>`;
      new bootstrap.Modal(document.getElementById('reservationModal')).show();
    });
  });
}

    // Liaison des boutons Réserver
    document.querySelectorAll('.btn-reserver').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedTrajetId = btn.dataset.id;
        const rest = btn.dataset.restantes;
        document.getElementById('modalBody').innerHTML = `
          <p>Places disponibles : ${rest}</p>
          <div class="mb-3">
            <label for="nbPlaces" class="form-label">Nombre de places :</label>
            <input type="number"
                   id="nbPlaces"
                   class="form-control"
                   min="1"
                   max="${rest}"
                   value="1">
          </div>
        `;
        new bootstrap.Modal(document.getElementById('reservationModal')).show();
      });
    });
  }

  /**
   * 4) Envoi de la réservation au serveur
   */
  if (btnConfirmer) {
    btnConfirmer.addEventListener('click', async () => {
      const places = parseInt(document.getElementById('nbPlaces').value, 10);
      if (!selectedTrajetId || places <= 0) {
        alert('Nombre de places invalide.');
        return;
      }
      try {
        const response = await fetch('asset/PHP/reserver.php', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trajet_id: selectedTrajetId, places })
        });
        const result = await response.json();
        if (result.error) {
          alert(result.error);
        } else {
          alert(result.message);
          loadTrajets();
        }
      } catch (err) {
        console.error('Erreur réservation :', err);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  }

  // Lancement initial
  loadTrajets();
});
