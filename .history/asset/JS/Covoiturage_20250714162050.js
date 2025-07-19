// asset/JS/Covoiturage.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('trajetForm');
  const searchForm = document.getElementById('searchForm');
  const listeTrajets = document.getElementById('liste-trajets');
  let tousLesTrajets = [];

  // 1) Gestion du formulaire d'ajout
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const depart = document.getElementById('depart').value.trim();
      const arrivee = document.getElementById('arrivee').value.trim();
      const date = document.getElementById('date').value;
      const heure = document.getElementById('heure').value;
      const places = parseInt(document.getElementById('places').value, 10);
      const prix = parseFloat(document.getElementById('prix').value);

      if (!depart || !arrivee || !date || !heure || isNaN(places) || places <= 0 || isNaN(prix) || prix < 0) {
        alert('Veuillez remplir tous les champs correctement.');
        return;
      }

      fetch('asset/PHP/trajets.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depart, arrivee, date, heure, places, prix })
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

  // 2) Chargement et affichage des trajets
  function afficherTrajets(data) {
    listeTrajets.innerHTML = '';
    data.forEach(trajet => {
      const placesRestantes = trajet.places - trajet.total_reservations;
      const card = document.createElement('div');
      card.className = 'col-md-4 mb-4';
      card.innerHTML = `
        <div class="card shadow-sm h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${trajet.depart} → ${trajet.arrivee}</h5>
            <p class="card-text flex-grow-1">
              <strong>Date :</strong> ${trajet.date}<br>
              <strong>Heure :</strong> ${trajet.heure}<br>
              <strong>Places :</strong> ${placesRestantes}<br>
              <strong>Prix :</strong> €${trajet.prix.toFixed(2)}
            </p>
            <button class="btn btn-success mt-auto btn-reserver"
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
      listeTrajets.appendChild(card);
    });

    // Boutons réserver
    document.querySelectorAll('.btn-reserver').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const depart = btn.dataset.depart;
        const arrivee = btn.dataset.arrivee;
        const date = btn.dataset.date;
        const heure = btn.dataset.heure;
        const restantes = btn.dataset.restantes;
        confirmerReservation(id, depart, arrivee, date, heure, restantes);
      });
    });
  }

  // 3) Récupérer tous
  fetch('asset/PHP/trajets.php?all=1')
    .then(res => res.json())
    .then(data => {
      tousLesTrajets = data.all_trajets || [];
      afficherTrajets(tousLesTrajets);
    })
    .catch(err => console.error('Erreur chargement trajets:', err));

});

// 4) Gestion du modal de réservation
function confirmerReservation(id, depart, arrivee, date, heure, restantes) {
  const btnConf = document.getElementById('btnConfirmerReservation');
  btnConf.dataset.trajetId = id;
  document.getElementById('modalBody').innerHTML = `
    <p><strong>Départ :</strong> ${depart}</p>
    <p><strong>Arrivée :</strong> ${arrivee}</p>
    <p><strong>Date :</strong> ${date}</p>
    <p><strong>Heure :</strong> ${heure}</p>
    <p><strong>Places restantes :</strong> ${restantes}</p>
  `;
  new bootstrap.Modal(document.getElementById('reservationModal')).show();
}

// 5) Envoi réservation
const btnConfirmer = document.getElementById('btnConfirmerReservation');
if (btnConfirmer) {
  btnConfirmer.addEventListener('click', () => {
    const id = btnConfirmer.dataset.trajetId;
    const places = parseInt(document.getElementById('nbPlaces').value, 10);
    if (!id || isNaN(places) || places <= 0) {
      alert('Entrée invalide');
      return;
    }
    fetch('asset/PHP/reserver.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trajet_id: id, places })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(data.message || 'Réservation effectuée');
        location.reload();
      } else {
        alert(data.error || 'Erreur réservation');
      }
    })
    .catch(err => console.error('Erreur réservation:', err));
  });
}
