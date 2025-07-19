// asset/JS/Covoiturage.js
// Gestion de l'ajout, de l'affichage public et de la réservation des trajets

window.addEventListener('DOMContentLoaded', () => {
  const form         = document.getElementById('trajetForm');
  const listeTrajets = document.getElementById('liste-trajets');
  const btnConfirmer = document.getElementById('btnConfirmerReservation');
  let selectedTrajetId = null;

  // 1) Soumission d'un nouveau trajet (conducteur)
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
        const resp = await fetch('asset/PHP/trajets.php', {
          method: 'POST', credentials: 'include', cache: 'no-store',
          headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
        });
        const result = await resp.json();
        if (result.error) return alert(result.error);
        alert('Trajet ajouté !');
        form.reset();
        loadTrajets();
      } catch (err) {
        console.error('Erreur ajout trajet:', err);
        alert('Erreur réseau, réessayez.');
      }
    });
  }

  // 2) Chargement des trajets publics
  async function loadTrajets() {
    try {
      const resp = await fetch('asset/PHP/trajets.php?all=1', {credentials: 'include', cache: 'no-store'});
      const data = await resp.json();
      if (data.error) return console.error(data.error);
      afficherTrajets(data.all_trajets);
    } catch (err) {
      console.error('Erreur chargement trajets:', err);
    }
  }

  // 3) Affichage des trajets
  function afficherTrajets(trajets) {
    listeTrajets.innerHTML = '';
    trajets.forEach(t => {
      const card = document.createElement('div');
      card.className = 'col-md-4 mb-4';
      card.innerHTML = `
        <div class="card" data-id="${t.id}">
          <div class="card-body">
            <h5 class="card-title">${t.depart} → ${t.arrivee}</h5>
            <p class="card-text" id="places-${t.id}">
              Date: ${t.date}<br>
              Heure: ${t.heure}<br>
              Places dispo: ${t.places}<br>
              Prix: ${parseFloat(t.prix).toFixed(2)} €
            </p>
            <button class="btn btn-success btn-reserver"
                    data-id="${t.id}" data-restantes="${t.places}">
              Réserver
            </button>
          </div>
        </div>
      `;
      listeTrajets.appendChild(card);
    });
    // 4) Liaison des boutons Réserver
    document.querySelectorAll('.btn-reserver').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedTrajetId = btn.dataset.id;
        const rest = btn.dataset.restantes;
        document.getElementById('modalBody').innerHTML = `
          <p>Places disponibles: ${rest}</p>
          <div class="mb-3">
            <label for="nbPlaces" class="form-label">Nombre de places :</label>
            <input type="number" id="nbPlaces" class="form-control" min="1" max="${rest}" value="1">
          </div>
        `;
        new bootstrap.Modal(document.getElementById('reservationModal')).show();
      });
    });
  }

  // 5) Soumission de la réservation
  if (btnConfirmer) {
    btnConfirmer.addEventListener('click', async () => {
      const places = parseInt(document.getElementById('nbPlaces').value, 10);
      if (!selectedTrajetId || places <= 0) return alert('Nombre de places invalide.');
      try {
        const resp = await fetch('asset/PHP/reserver.php', {
          method: 'POST', credentials: 'include', cache: 'no-store',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ trajet_id: selectedTrajetId, places })
        });
        const result = await resp.json();
        if (result.error) return alert(result.error);
        alert(result.message);
        // Mettre à jour l'affichage sans tout recharger
        document.querySelector(`#places-${selectedTrajetId}`).innerHTML =
          `Date: ...<br>Heure: ...<br>Places dispo: ${result.places_restantes}`;
        // ou recharger la liste: loadTrajets();
      } catch (err) {
        console.error('Erreur réservation:', err);
        alert('Erreur réseau, réessayez.');
      }
    });
  }

  // Initialisation
  loadTrajets();
});
