document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('trajetForm');
  const searchForm = document.getElementById('searchForm');
  const listeTrajets = document.getElementById('liste-trajets');

  let tousLesTrajets = []; // Sauvegarde globale

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const depart = document.getElementById('depart').value.trim();
      const arrivee = document.getElementById('arrivee').value.trim();
      const date = document.getElementById('date').value;
      const heure = document.getElementById('heure').value;
      const places = parseInt(document.getElementById('places').value, 10);

      if (!depart || !arrivee || !date || !heure || isNaN(places) || places <= 0) {
        alert('Veuillez remplir tous les champs correctement.');
        return;
      }

      fetch('asset/PHP/trajets.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depart, arrivee, date, heure, places })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert('Trajet ajouté avec succès.');
            location.reload();
          } else {
            alert(data.error || 'Erreur lors de l\'ajout.');
          }
        })
        .catch(err => console.error('Erreur ajout trajet:', err));
    });
  }

  if (searchForm) {
    // Ajouter bouton de réinitialisation
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn btn-outline-secondary ms-2';
    resetBtn.textContent = 'Réinitialiser';
    resetBtn.addEventListener('click', () => {
      document.getElementById('departure').value = '';
      document.getElementById('arrival').value = '';
      document.getElementById('dateSearch').value = '';
      document.getElementById('passengers').value = '';
      afficherTrajets(tousLesTrajets);
    });
    searchForm.querySelector('.col-auto').appendChild(resetBtn);

    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const dep = document.getElementById('departure').value.trim().toLowerCase();
      const arr = document.getElementById('arrival').value.trim().toLowerCase();
      const date = document.getElementById('dateSearch').value;
      const passengers = parseInt(document.getElementById('passengers').value, 10);

      const resultatsFiltres = tousLesTrajets.filter(trajet => {
        const placesRestantes = trajet.places - trajet.total_reservations;
        return (
          (!dep || trajet.depart.toLowerCase().includes(dep)) &&
          (!arr || trajet.arrivee.toLowerCase().includes(arr)) &&
          (!date || trajet.date === date) &&
          (!passengers || placesRestantes >= passengers)
        );
      });

      afficherTrajets(resultatsFiltres);
    });
  }

  function afficherTrajets(data) {
    listeTrajets.innerHTML = '';
    data.forEach(trajet => {
      const placesRestantes = trajet.places - trajet.total_reservations;
      const col = document.createElement('div');
      col.className = 'col-md-4 mb-4';
      col.innerHTML = `
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title">${trajet.depart} → ${trajet.arrivee}</h5>
            <p class="card-text">
              <strong>Date :</strong> ${trajet.date}<br>
              <strong>Heure :</strong> ${trajet.heure}<br>
              <strong>Places disponibles :</strong> ${placesRestantes}
            </p>
            <button class="btn btn-success w-100 btn-reserver"
              data-id="${trajet.id}"
              data-depart="${trajet.depart}"
              data-arrivee="${trajet.arrivee}"
              data-date="${trajet.date}"
              data-heure="${trajet.heure}"
              data-restantes="${placesRestantes}">
              Réserver
            </button>
          </div>
        </div>
      `;
      listeTrajets.appendChild(col);
    });

    document.querySelectorAll('.btn-reserver').forEach(button => {
      button.addEventListener('click', () => {
        confirmerReservation(
          button.dataset.id,
          button.dataset.depart,
          button.dataset.arrivee,
          button.dataset.date,
          button.dataset.heure,
          button.dataset.restantes
        );
      });
    });
  }

  fetch('asset/PHP/trajets.php?all=1')
    .then(res => res.json())
    .then(data => {
      tousLesTrajets = data.all_trajets || [];
      afficherTrajets(tousLesTrajets);
    })
    .catch(err => console.error('Erreur chargement trajets:', err));
});
