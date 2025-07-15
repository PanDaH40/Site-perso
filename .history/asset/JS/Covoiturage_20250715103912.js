// asset/JS/Covoiturage.js
// Gestion de l'ajout, de l'affichage des trajets et de la réservation, avec intégration du champ prix

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('trajetForm');
  const listeTrajets = document.getElementById('liste-trajets');
  const btnConfirmer = document.getElementById('btnConfirmerReservation');
  let tousLesTrajets = [];

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

      if (data.places <= 0 || data.prix < 0) {
        return alert('Veuillez saisir un nombre de places et un prix valides.');
      }

      try {
        const res = await fetch('asset/PHP/trajets.php', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          alert('Trajet ajouté avec succès.');
          form.reset();
          loadTrajets();
        } else {
          alert(result.error || 'Données invalides');
        }
      } catch (err) {
        console.error('Erreur ajout trajet:', err);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  }

  // Fonction pour afficher la liste des trajets
  function afficher(trajets) {
    listeTrajets.innerHTML = '';
    trajets.forEach(t => {
      const placesRestantes = t.places - (t.total_reservations || 0);
      const col = document.createElement('div');
      col.className = 'col-md-4 mb-4';
      col.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">${t.depart} &rarr; ${t.arrivee}</h5>
            <p class="card-text">
              Date: ${t.date}<br>
              Heure: ${t.heure}<br>
              Places restantes: ${placesRestantes}<br>
              <strong>Prix: ${t.prix.toFixed(2)} €</strong>
            </p>
            <button
              class="btn btn-success btn-reserver"
              data-id="${t.id}"
              data-restantes="${placesRestantes}"
            >Réserver</button>
          </div>
        </div>
      `;
      listeTrajets.appendChild(col);
    });

    // Attacher les événements de réservation
    document.querySelectorAll('.btn-reserver').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const rest = btn.getAttribute('data-restantes');
        document.getElementById('modalBody').innerHTML = `
          <p>Places disponibles: ${rest}</p>
          <div class="mb-3">
            <label for="nbPlaces" class="form-label">Nombre de places à réserver :</label>
            <input type="number" class="form-control" id="nbPlaces" min="1" max="${rest}" value="1">
          </div>
        `;
        btnConfirmer.setAttribute('data-trajet-id', id);
        new bootstrap.Modal(document.getElementById('reservationModal')).show();
      });
    });
  }

  // Chargement initial des trajets (tous ou seulement proposés selon paramètre)
  async function loadTrajets() {
    try {
      const url = new URL('asset/PHP/trajets.php', window.location.href);
      // si on veut tous les trajets, ajouter ?all=1
      if (window.location.search.includes('all=1')) {
        url.searchParams.set('all', '1');
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const trajets = data.all_trajets || data.trajetsProposes || [];
      tousLesTrajets = trajets;
      afficher(trajets);
    } catch (err) {
      console.error('Erreur chargement trajets:', err);
    }
  }

  loadTrajets();

  // Confirmation de réservation dans le modal
  if (btnConfirmer) {
    btnConfirmer.addEventListener('click', async () => {
      const trajetId = btnConfirmer.getAttribute('data-trajet-id');
      const places = parseInt(document.getElementById('nbPlaces').value, 10);
      try {
        const res = await fetch('asset/PHP/reserver.php', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ trajet_id: trajetId, places })
        });
        const result = await res.json();
        if (result.success) {
          alert(result.message || 'Réservation confirmée');
          loadTrajets();
        } else {
          alert(result.error || 'Erreur réservation');
        }
      } catch (err) {
        console.error('Erreur réservation:', err);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  }
});
