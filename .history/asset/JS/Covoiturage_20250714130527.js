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
      console.log(data);
      const tableau = document.getElementById('liste-trajets');
      if (!tableau || !data.all_trajets) return;

      tableau.innerHTML = '';
      data.all_trajets.forEach(trajet => {
        const col = document.createElement('div');
col.className = 'col-md-4 mb-4';
col.innerHTML = `
  <div class="card shadow-sm">
    <div class="card-body">
      <h5 class="card-title">${trajet.depart} → ${trajet.arrivee}</h5>
      <p class="card-text">
        <strong>Date :</strong> ${trajet.date}<br>
        <strong>Heure :</strong> ${trajet.heure}<br>
        <strong>Places :</strong> ${trajet.places}
      </p>
      <button class="btn btn-success w-100" onclick="confirmerReservation(${trajet.id})">
        Réserver
      </button>
    </div>
  </div>
`;
tableau.appendChild(col);

      });
    })
    .catch(err => console.error('Erreur chargement trajets:', err));
});

function confirmerReservation(trajetId) {
  if (!confirm('Confirmer votre réservation ?')) return;

  fetch('asset/PHP/reserver.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trajet_id: trajetId, places: 1 })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || 'Réservation effectuée');
      location.reload();
    })
    .catch(err => console.error('Erreur réservation:', err));
}
