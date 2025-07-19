// asset/JS/Covoiturage.js
// Gestion de l'affichage public et de la réservation des trajets

document.addEventListener('DOMContentLoaded', () => {
  const listeTrajets = document.getElementById('liste-trajets');
  const btnConfirmer  = document.getElementById('btnConfirmerReservation');
  let selectedTrajetId = null;

  // Charger et afficher les trajets publics
  async function loadTrajets() {
    listeTrajets.innerHTML = '';  // Reset
    try {
      // Attention au chemin selon l'emplacement de votre HTML
      const res = await fetch('./asset/PHP/trajets.php?all=1', {
        credentials: 'include',
        cache: 'no-store'
      });
      console.log('fetch trajets status:', res.status);
      const data = await res.json();
      console.log('fetch trajets payload:', data);

      if (data.error) {
        listeTrajets.innerHTML = `<p class="text-danger">Erreur : ${data.error}</p>`;
        return;
      }
      const trajets = data.all_trajets || [];
      if (trajets.length === 0) {
        listeTrajets.innerHTML = '<p>Aucun trajet disponible pour l’instant.</p>';
        return;
      }

      trajets.forEach(t => {
        const placesRestantes = t.places - t.total_reservations;
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
          <div class="card h-100">
            <div class="card-header d-flex align-items-center">
              <img src="${t.conducteur_avatar || '/default-avatar.png'}"
                   alt="Avatar"
                   class="rounded-circle me-2"
                   style="width:40px;height:40px;object-fit:cover;">
              <strong>${t.conducteur_prenom} ${t.conducteur_nom}</strong>
            </div>
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${t.depart} → ${t.arrivee}</h5>
              <p class="card-text mb-1">
                📅 ${t.date} &nbsp; 🕒 ${t.heure}<br>
                🚗 Places dispo : ${placesRestantes}<br>
                💶 Prix : ${parseFloat(t.prix).toFixed(2)} €
              </p>
              <button class="btn btn-success mt-auto btn-reserver"
                      data-id="${t.id}"
                      data-restantes="${placesRestantes}">
                Réserver
              </button>
            </div>
          </div>`;
        listeTrajets.appendChild(card);
      });

      // Lier les clics “Réserver”
      document.querySelectorAll('.btn-reserver').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedTrajetId = btn.dataset.id;
          const rest = btn.dataset.restantes;
          document.getElementById('modalBody').innerHTML = `
            <p>Places disponibles : ${rest}</p>
            <div class="mb-3">
              <label for="nbPlaces" class="form-label">
                Nombre de places à réserver:
              </label>
              <input type="number"
                     id="nbPlaces"
                     class="form-control"
                     min="1"
                     max="${rest}"
                     value="1">
            </div>`;
          new bootstrap.Modal(
            document.getElementById('reservationModal')
          ).show();
        });
      });

    } catch (err) {
      console.error('Erreur réseau chargement trajets:', err);
      listeTrajets.innerHTML = `<p class="text-danger">Erreur réseau, impossible de charger les trajets.</p>`;
    }
  }

  // Confirmation de réservation
  if (btnConfirmer) {
    btnConfirmer.addEventListener('click', async () => {
      const places = parseInt(document.getElementById('nbPlaces').value, 10);
      if (!selectedTrajetId || places < 1) {
        return alert('Nombre de places invalide.');
      }
      try {
        const res = await fetch('./asset/PHP/reserver.php', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trajet_id: selectedTrajetId, places })
        });
        const result = await res.json();
        if (result.error) {
          alert(result.error);
        } else {
          alert(result.message || 'Réservation confirmée !');
          loadTrajets();
        }
      } catch (err) {
        console.error('Erreur réseau réservation :', err);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  }

  // Initialisation
  loadTrajets();
});
