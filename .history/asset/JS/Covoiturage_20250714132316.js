document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('trajetForm');

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

  // Charger les trajets existants
  fetch('asset/PHP/trajets.php?all=1')
    .then(res => res.json())
    .then(data => {
      const tableau = document.getElementById('liste-trajets');
      if (!tableau || !data.all_trajets) return;

      tableau.innerHTML = '';

      data.all_trajets.forEach(trajet => {
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
        tableau.appendChild(col);
      });

      // Attacher les événements sur les boutons "Réserver"
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
    })
    .catch(err => console.error('Erreur chargement trajets:', err));
});

// Fonction appelée lors du clic sur un bouton "Réserver"
function confirmerReservation(id, depart, arrivee, date, heure, placesDisponibles) {
  const btnConfirmer = document.getElementById('btnConfirmerReservation');
  btnConfirmer.setAttribute('data-trajet-id', id);

  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <p><strong>Départ :</strong> ${depart}</p>
    <p><strong>Arrivée :</strong> ${arrivee}</p>
    <p><strong>Date :</strong> ${date}</p>
    <p><strong>Heure :</strong> ${heure}</p>
    <p><strong>Places disponibles :</strong> ${placesDisponibles}</p>
  `;

  const modal = new bootstrap.Modal(document.getElementById('reservationModal'));
  modal.show();
}

// Traitement du clic sur le bouton de confirmation dans le modal
document.getElementById('btnConfirmerReservation').addEventListener('click', () => {
  const trajetId = document.getElementById('btnConfirmerReservation').getAttribute('data-trajet-id');
  const places = parseInt(document.getElementById('nbPlaces').value, 10);

  if (!trajetId || isNaN(places) || places <= 0) {
    alert('Veuillez entrer un nombre de places valide.');
    return;
  }

  fetch('asset/PHP/reserver.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trajet_id: trajetId, places })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(data.message || 'Réservation effectuée');
        location.reload();
      } else {
        alert(data.error || 'Erreur lors de la réservation');
      }
    })
    .catch(err => console.error('Erreur réservation:', err));
});
