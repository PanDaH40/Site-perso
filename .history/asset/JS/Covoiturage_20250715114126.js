// asset/JS/Covoiturage.js
// Gestion de l'ajout, de l'affichage public et de la réservation des trajets

// Lors du chargement du document
document.addEventListener('DOMContentLoaded', () => {
  const form          = document.getElementById('trajetForm');
  const listeTrajets  = document.getElementById('liste-trajets');
  const btnConfirmer  = document.getElementById('btnConfirmerReservation');
  let selectedTrajetId = null;

  /**
   * 1) Soumettre un nouveau trajet (conducteur)
   */
  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();

      // Récupérer les données du formulaire
      const data = {
        depart:  document.getElementById('depart').value.trim(),
        arrivee: document.getElementById('arrivee').value.trim(),
        date:    document.getElementById('date').value,
        heure:   document.getElementById('heure').value,
        places:  parseInt(document.getElementById('places').value, 10),
        prix:    parseFloat(document.getElementById('prix').value)
      };

      // Validation basique
      if (!data.depart || !data.arrivee || !data.date || !data.heure ||
          data.places <= 0 || isNaN(data.prix) || data.prix < 0) {
        alert('Veuillez remplir tous les champs correctement.');
        return;
      }

      // Envoi au serveur
      try {
        const response = await fetch('asset/PHP/trajets.php', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
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
      } catch (error) {
        console.error('Erreur ajout trajet:', error);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  }

  /**
   * 2) Charger les trajets publics
   */
  async function loadTrajets() {
    try {
      const response = await fetch('asset/PHP/trajets.php?all=1', { credentials: 'include' });
      const data = await response.json();
      if (data.error) {
        console.error(data.error);
      } else {
        afficherTrajets(data.all_trajets);
      }
    } catch (error) {
      console.error('Erreur chargement trajets:', error);
    }
  }

  /**
   * 3) Afficher les trajets dans la grille
   * @param {Array} trajets
   */
  function afficherTrajets(trajets) {
    listeTrajets.innerHTML = '';
    trajets.forEach(t => {
      const placesRestantes = t.places - (t.total_reservations || 0);
      const card = document.createElement('div');
      card.className = 'col-md-4 mb-4';
      card.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">${t.depart} → ${t.arrivee}</h5>
            <p class="card-text">
              Date: ${t.date}<br>
              Heure: ${t.heure}<br>
              Places dispo: ${placesRestantes}<br>
              Prix: ${parseFloat(t.prix).toFixed(2)} €
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

    // Attacher l'événement aux boutons Réserver
    document.querySelectorAll('.btn-reserver').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedTrajetId = btn.getAttribute('data-id');
        const rest = btn.getAttribute('data-restantes');

        // Peupler le modal avec un seul champ de saisie
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

        // Ouvrir le modal
        new bootstrap.Modal(document.getElementById('reservationModal')).show();
      });
    });
  }

  /**
   * 4) Soumettre la réservation
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trajet_id: selectedTrajetId, places })
        });
        const result = await response.json();
        if (result.error) {
          alert(result.error);
        } else {
          alert(result.message || 'Réservation confirmée !');
          loadTrajets();
        }
      } catch (error) {
        console.error('Erreur réservation:', error);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  }

  // Lancement initial
  loadTrajets();
});
