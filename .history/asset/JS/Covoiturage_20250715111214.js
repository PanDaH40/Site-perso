// asset/JS/Covoiturage.js
// Gestion de l'ajout, de l'affichage et de la réservation des trajets
// Intègre le champ prix et utilise les endpoints de trajets.php sous /TPCovoiturage/

document.addEventListener('DOMContentLoaded', () => {
  const form       = document.getElementById('trajetForm');
  const listeTrajets = document.getElementById('liste-trajets');
  const btnConfirmer = document.getElementById('btnConfirmerReservation');

  // Soumission du formulaire d'ajout de trajet via le modal
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
      if (!data.depart || !data.arrivee || !data.date || !data.heure || data.places <= 0 || data.prix < 0) {
        return alert('Veuillez remplir tous les champs et saisir des valeurs valides.');
      }
      try {
        const res = await fetch('/TPCovoiturage/asset/PHP/trajets.php', {
          method: 'POST',
          credentials: 'include',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.error) return alert(result.error);
        alert('Trajet ajouté avec succès.');
        form.reset();
        loadTrajets();
      } catch (err) {
        console.error('Erreur ajout trajet:', err);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  }

  // Affichage des trajets publics
  function afficher(trajets) {
    listeTrajets.innerHTML = '';
    trajets.forEach(t => {
      const placesRestantes = t.places - (t.total_reservations || 0);
      const col = document.createElement('div');
      col.className = 'col-md-4 mb-4';
      col.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5>${t.depart} → ${t.arrivee}</h5>
            <p>
              Date: ${t.date}<br>
              Heure: ${t.heure}<br>
              Places disponibles: ${placesRestantes}<br>
              <strong>Prix: ${parseFloat(t.prix).toFixed(2)} €</strong>
            </p>
            <button class="btn btn-success btn-reserver" data-id="${t.id}" data-restantes="${placesRestantes}">Réserver</button>
          </div>
        </div>
      `;
      listeTrajets.appendChild(col);
    });

    document.querySelectorAll('.btn-reserver').forEach(btn => {
      btn.addEventListener('click', () => {
        const id   = btn.getAttribute('data-id');
        const rest = btn.getAttribute('data-restantes');
        document.getElementById('modalBody').innerHTML = `
          <p>Places disponibles: ${rest}</p>
          <div class="mb-3">
            <label for="nbPlaces" class="form-label">Nombre de places à réserver :</label>
            <input type="number" id="nbPlaces" class="form-control" min="1" max="${rest}" value="1">
          </div>
        `;
        btnConfirmer.setAttribute('data-trajet-id', id);
        new bootstrap.Modal(document.getElementById('reservationModal')).show();
      });
    });
  }

  // Chargement initial
  async function loadTrajets() {
    try {
      const res = await fetch('/TPCovoiturage/asset/PHP/trajets.php?all=1', { credentials: 'include' });
      const data = await res.json();
      if (data.error) return console.error(data.error);
      afficher(data.all_trajets);
    } catch (err) {
      console.error('Erreur chargement trajets:', err);
    }
  }
  loadTrajets();

  // Confirmation de réservation
  if (btnConfirmer) {
    btnConfirmer.addEventListener('click', async () => {
      const trajetId = btnConfirmer.getAttribute('data-trajet-id');
      const places   = parseInt(document.getElementById('nbPlaces').value, 10);
      if (places <= 0) return alert('Nombre de places invalide.');
      try {
        const res = await fetch('/TPCovoiturage/asset/PHP/reserver.php', {
          method: 'POST',
          credentials: 'include',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ trajet_id: trajetId, places })
        });
        const result = await res.json();
        if (result.error) return alert(result.error);
        alert(result.message || 'Réservation confirmée.');
        loadTrajets();
      } catch (err) {
        console.error('Erreur réservation:', err);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  }
});
