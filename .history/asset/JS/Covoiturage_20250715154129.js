// asset/JS/Covoiturage.js
// Gestion de l'ajout, de l'affichage (profil conducteur) et des réservations

window.addEventListener('DOMContentLoaded', () => {
  // (1) Références DOM
  const form           = document.getElementById('trajetForm');
  const departInput    = document.getElementById('depart');
  const arriveeInput   = document.getElementById('arrivee');
  const dateInput      = document.getElementById('date');
  const heureInput     = document.getElementById('heure');
  const placesInput    = document.getElementById('places');
  const prixInput      = document.getElementById('prix');
  const listeTrajets   = document.getElementById('liste-trajets');
  const btnConfirmer   = document.getElementById('btnConfirmerReservation');
  let selectedTrajetId = null;

  // (2) Ajout d'un trajet
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = {
        depart:  departInput.value.trim(),
        arrivee: arriveeInput.value.trim(),
        date:    dateInput.value,
        heure:   heureInput.value,
        places:  parseInt(placesInput.value, 10),
        prix:    parseFloat(prixInput.value)
      };
      if (!data.depart || !data.arrivee || !data.date || !data.heure ||
          data.places <= 0 || isNaN(data.prix) || data.prix < 0) {
        return alert('Veuillez remplir tous les champs correctement.');
      }
      try {
        const res  = await fetch('./asset/PHP/trajets.php', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.error) alert(json.error);
        else {
          alert('Trajet ajouté !');
          form.reset();
          loadTrajets();
        }
      } catch (err) {
        console.error('Erreur ajout trajet:', err);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  }

  // (3) Chargement des trajets publics
  async function loadTrajets() {
    listeTrajets.innerHTML = '';
    try {
      const res = await fetch('./asset/PHP/trajets.php?all=1', {
        credentials: 'include',
        cache: 'no-store'
      });
      console.log('Fetch status:', res.status);
      const { all_trajets, error } = await res.json();
      console.log('Données reçues:', all_trajets, error);
      if (error) {
        listeTrajets.innerHTML = `<p class="text-danger">${error}</p>`;
      } else {
        afficherTrajets(all_trajets || []);
      }
    } catch (err) {
      console.error('Erreur chargement trajets:', err);
      listeTrajets.innerHTML = '<p class="text-danger">Impossible de charger les trajets.</p>';
    }
  }

  // (4) Affichage des cartes de trajet
  function afficherTrajets(trajets) {
    if (!trajets.length) {
      listeTrajets.innerHTML = '<p>Aucun trajet disponible.</p>';
      return;
    }
    trajets.forEach(t => {
      const rest = t.places - (t.total_reservations || 0);
      const col = document.createElement('div');
      col.className = 'col-md-4 mb-4';
      col.innerHTML = `
        <div class="card h-100">
          <div class="card-header d-flex align-items-center">
            <img src="${t.conducteur_avatar || '/default-avatar.png'}"
                 alt="Avatar ${t.conducteur_prenom}"
                 class="rounded-circle me-2"
                 style="width:40px;height:40px;object-fit:cover;cursor:pointer;"
                 data-id="${t.conducteur_id}">
            <strong>${t.conducteur_prenom} ${t.conducteur_nom}</strong>
          </div>
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${t.depart} → ${t.arrivee}</h5>
            <p class="card-text mb-3">
              📅 ${t.date} 🕒 ${t.heure}<br>
              🚗 Places dispo : ${rest}<br>
              💶 Prix : ${parseFloat(t.prix).toFixed(2)} €
            </p>
            <button class="btn btn-success mt-auto btn-reserver"
                    data-id="${t.id}"
                    data-restantes="${rest}">
              Réserver
            </button>
          </div>
        </div>`;
      listeTrajets.appendChild(col);
    });

    // Cliquer sur avatar → Profile.html?user=ID
    document.querySelectorAll('.card-header img').forEach(img => {
      img.addEventListener('click', () => {
        window.location.href = `Profile.html?user=${img.dataset.id}`;
      });
    });

    // Ouvrir modal de réservation
    document.querySelectorAll('.btn-reserver').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedTrajetId = btn.dataset.id;
        const rest = btn.dataset.restantes;
        document.getElementById('modalBody').innerHTML = `
          <p>Places disponibles : ${rest}</p>
          <div class="mb-3">
            <label for="nbPlaces" class="form-label">Nombre de places :</label>
            <input type="number" id="nbPlaces"
                   class="form-control"
                   min="1" max="${rest}" value="1">
          </div>`;
        new bootstrap.Modal(document.getElementById('reservationModal')).show();
      });
    });
  }

  // (5) Confirmation de réservation
  if (btnConfirmer) {
    btnConfirmer.addEventListener('click', async () => {
      const places = parseInt(document.getElementById('nbPlaces').value, 10);
      if (!selectedTrajetId || places < 1) {
        return alert('Nombre de places invalide.');
      }
      try {
        const res  = await fetch('./asset/PHP/reserver.php', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trajet_id: selectedTrajetId, places })
        });
        const json = await res.json();
        if (json.error) alert(json.error);
        else {
          alert(json.message || 'Réservation confirmée !');
          loadTrajets();
        }
      } catch (err) {
        console.error('Erreur réservation:', err);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  }

  // (6) Lancement initial
  loadTrajets();
});
