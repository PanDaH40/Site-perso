// asset/JS/Covoiturage.js
// Gestion de l'ajout, de l'affichage public et de la réservation des trajets

// Chargement du document
window.addEventListener('DOMContentLoaded', () => {
  const form         = document.getElementById('trajetForm');
  const listeTrajets = document.getElementById('liste-trajets');
  const btnConfirmer = document.getElementById('btnConfirmerReservation');
  let selectedTrajetId = null;

  /**
   * Soumission d'un nouveau trajet (conducteur)
   */
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = {
        depart:  document.getElementById('depart').value.trim(),
        arrivee: document.getElementById('arrivee').value.trim(),
        date:    document.getElementById('date').value,
        heure:   document.getElementById('heure').value,
        places:  parseInt(document.getElementById('places').value, 10),
        prix:    parseFloat(document.getElementById('prix').value)
      };

      if (!data.depart || !data.arrivee || !data.date || !data.heure || data.places <= 0 || isNaN(data.prix) || data.prix < 0) {
        alert('Veuillez remplir tous les champs correctement.');
        return;
      }

      try {
        const response = await fetch('asset/PHP/trajets.php', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.error) {
          alert(result.error);
        } else {
          alert('Trajet ajouté avec succès !');
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
   * Chargement des trajets publics
   */
  async function loadTrajets() {
    try {
      const response = await fetch('asset/PHP/trajets.php?all=1', {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      if (data.error) {
        console.error('Chargement trajets erreur:', data.error);
      } else {
        afficherTrajets(data.all_trajets);
      }
    } catch (err) {
      console.error('Erreur chargement trajets:', err);
    }
  }

  /**
   * Affiche la liste de trajets
   * @param {Array} trajets
   */
  function afficherTrajets(trajets) {
    listeTrajets.innerHTML = '';
    trajets.forEach(t => {
      // places dans t.places a déjà été mis à jour côté serveur
      const placesRestantes = t.places;
      const card = document.createElement('div');
      card.className = 'col-md-4 mb-4';
      card.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">${t.depart} → ${t.arrivee}</h5>
            <p class="card-text">
              Date : ${t.date}<br>
              Heure : ${t.heure}<br>
              Places dispo : ${placesRestantes}<br>
              Prix : ${parseFloat(t.prix).toFixed(2)} €
            </p>
            <button class="btn btn-success btn-reserver"
                    data-id="${t.id}"
                    data-restantes="${placesRestantes}">
              Réserver
            </button>
          </div>
        </div>
      `;
      listeTrajets.appendChild(card);
    });

    document.querySelectorAll('.btn-reserver').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedTrajetId = btn.dataset.id;
        const rest = btn.dataset.restantes;
        console.log('Ouverture modal, places dispo:', rest);

        document.getElementById('modalBody').innerHTML = `
          <p>Places disponibles : ${rest}</p>
          <div class="mb-3">
            <label for="nbPlaces" class="form-label">
              Nombre de places à réserver :
            </label>
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
   * Soumission de la réservation
   */
  if (btnConfirmer) {
    btnConfirmer.addEventListener('click', async () => {
      const places = parseInt(document.getElementById('nbPlaces').value, 10);
      console.log('Réserver', places, 'places pour trajet', selectedTrajetId);
      if (!selectedTrajetId || places <= 0) {
        alert('Nombre de places invalide.');
        return;
      }

      try {
        const response = await fetch('asset/PHP/reserver.php', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ trajet_id: selectedTrajetId, places })
        });
        const result = await response.json();
        if (result.error) {
          alert(result.error);
        } else {
          alert(result.message || 'Réservation confirmée !');
          loadTrajets();
        }
      } catch (err) {
        console.error('Erreur réservation:', err);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  }

  // Initialisation
  loadTrajets();
});
