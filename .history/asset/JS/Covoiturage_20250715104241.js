// asset/JS/Covoiturage.js
// Gestion de l'ajout, de l'affichage des trajets et de la réservation, avec intégration du champ prix
// Ajout de credentials, utilisation de chemins absolus et redirection si non authentifié

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('trajetForm');
  const listeTrajets = document.getElementById('liste-trajets');
  const btnConfirmer = document.getElementById('btnConfirmerReservation');
  let tousLesTrajets = [];
  const API_BASE = `${window.location.origin}/asset/PHP`;

  // Redirige vers la page de connexion si non authentifié
  function handleAuthError(error) {
    if (error === 'Utilisateur non authentifié') {
      alert('Vous devez vous connecter pour accéder à cette page.');
      window.location.href = 'login.html';
      return true;
    }
    return false;
  }

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
        const res = await fetch(`${API_BASE}/trajets.php`, {
          method: 'POST',
          credentials: 'include',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.error && handleAuthError(result.error)) return;
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
            <h5>${t.depart} → ${t.arrivee}</h5>
            <p>Date: ${t.date}<br>Heure: ${t.heure}<br>Places: ${placesRestantes}<br><strong>Prix: ${t.prix.toFixed(2)} €</strong></p>
            <button class="btn btn-success btn-reserver" data-id="${t.id}" data-restantes="${placesRestantes}">Réserver</button>
          </div>
        </div>
      `;
      listeTrajets.appendChild(col);
    });

    document.querySelectorAll('.btn-reserver').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const rest = btn.dataset.restantes;
        document.getElementById('modalBody').innerHTML = `
          <p>Places disponibles: ${rest}</p>
          <div class="mb-3">
            <label for="nbPlaces" class="form-label">Nombre de places :</label>
            <input type="number" class="form-control" id="nbPlaces" min="1" max="${rest}" value="1">
          </div>
        `;
        btnConfirmer.setAttribute('data-trajet-id', id);
        new bootstrap.Modal(document.getElementById('reservationModal')).show();
      });
    });
  }

  // Chargement initial des trajets (tous ou seulement proposés selon ?all=1)
  async function loadTrajets() {
    try {
      const params = new URLSearchParams(window.location.search);
      const url = `${API_BASE}/trajets.php${params.has('all') ? '?all=1' : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (data.error && handleAuthError(data.error)) return;

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
      const trajetId = btnConfirmer.dataset.trajetId;
      const places = parseInt(document.getElementById('nbPlaces').value, 10);
      try {
        const res = await fetch(`${API_BASE}/reserver.php`, {
          method: 'POST',
          credentials: 'include',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ trajet_id: trajetId, places })
        });
        const result = await res.json();
        if (result.error && handleAuthError(result.error)) return;
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
