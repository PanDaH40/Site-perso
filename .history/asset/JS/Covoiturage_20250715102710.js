document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('trajetForm');
  const listeTrajets = document.getElementById('liste-trajets');
  const btnConfirmer = document.getElementById('btnConfirmerReservation');
  let tousLesTrajets = [];

  // Soumission du formulaire d'ajout de trajet via le modal
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      // Collecte des données à partir du formulaire
      const data = {
        depart: document.getElementById('depart').value.trim(),
        arrivee: document.getElementById('arrivee').value.trim(),
        date: document.getElementById('date').value,
        heure: document.getElementById('heure').value,
        places: parseInt(document.getElementById('places').value, 10),
        prix: parseFloat(document.getElementById('prix').value)
      };

      if (data.places <= 0 || data.prix < 0) {
      return alert('Veuillez saisir un nombre de places et un prix valides.');
    }

      console.log('Envoi ajoute trajet:', data);
      fetch('asset/PHP/trajets.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(resp => {
        if (resp.success) {
          alert('Trajet ajouté avec succès.');
          location.reload();
        } else {
          alert(resp.error || 'Données invalides');
        }
      })
      .catch(err => console.error('Erreur ajout trajet:', err));
    });
  }

  // Fonction pour afficher les trajets
  function afficher(trajets) {
    listeTrajets.innerHTML = '';
    trajets.forEach(t => {
      const placesRestantes = t.places - t.total_reservations;
      const col = document.createElement('div');
      col.className = 'col-md-4 mb-4';
      col.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5>${t.depart} → ${t.arrivee}</h5>
            <p>Date: ${t.date}<br>Heure: ${t.heure}<br>Places dispos: ${placesRestantes}</p>
            <button class="btn btn-success btn-reserver" data-id="${t.id}" data-restantes="${placesRestantes}">Réserver</button>
          </div>
        </div>
      `;
      listeTrajets.appendChild(col);
    });
    // Lier le clic sur chaque bouton "Réserver"
    document.querySelectorAll('.btn-reserver').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const rest = btn.dataset.restantes;
        document.getElementById('modalBody').innerHTML = `
          <p>Places disponibles: ${rest}</p>
        `;
        btnConfirmer.setAttribute('data-trajet-id', id);
        new bootstrap.Modal(document.getElementById('reservationModal')).show();
      });
    });
  }

  // Chargement initial des trajets
  fetch('asset/PHP/trajets.php?all=1')
    .then(r => r.json())
    .then(d => {
      tousLesTrajets = d.all_trajets;
      afficher(tousLesTrajets);
    })
    .catch(err => console.error('Erreur chargement trajets:', err));



  // Confirmation de réservation dans le modal
  if (btnConfirmer) {
    btnConfirmer.addEventListener('click', () => {
      const trajetId = btnConfirmer.getAttribute('data-trajet-id');
      const places = parseInt(document.getElementById('nbPlaces').value, 10);
      fetch('asset/PHP/reserver.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ trajet_id: trajetId, places })
      })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          alert(res.message || 'Réservation confirmée');
          location.reload();
        } else {
          alert(res.error || 'Erreur réservation');
        }
      })
      .catch(err => console.error('Erreur réservation:', err));
    });
  }
});
