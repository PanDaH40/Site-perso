// asset/JS/Covoiturage.js
// Gestion de l'ajout, de l'affichage des trajets et des réservations

window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('trajetForm');
  const listeTrajets = document.getElementById('liste-trajets');
  const btnConfirmer = document.getElementById('btnConfirmerReservation');
  let selectedTrajetId = null;

  /**
   * 1) Ajout d'un trajet par le conducteur
   */
  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();

      const data = {
        depart: document.getElementById('depart').value.trim(),
        arrivee: document.getElementById('arrivee').value.trim(),
        date: document.getElementById('date').value,
        heure: document.getElementById('heure').value,
        places: parseInt(document.getElementById('places').value, 10),
        prix: parseFloat(document.getElementById('prix').value)
      };

      // Validation des champs
      if (!data.depart || !data.arrivee || !data.date || !data.heure ||
          data.places <= 0 || isNaN(data.prix) || data.prix < 0) {
        alert('Veuillez remplir tous les champs correctement.');
        return;
      }

      try {
        const response = await fetch('asset/PHP/trajets.php', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.error) {
          alert(result.error);
        } else {
          alert('Trajet ajouté avec succès!');
          form.reset();
          loadTrajets();
        }
      } catch (err) {
        console.error('Erreur ajout trajet:', err);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  }

  /**
   * 2) Chargement et affichage des trajets publics
   */
  async function loadTrajets() {
    try {
      const response = await fetch('asset/PHP/trajets.php?all=1', {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      if (data.error) {
        console.error('Erreur chargement trajets :', data.error);
        return;
      }
      afficherTrajets(data.all_trajets);
    } catch (err) {
      console.error('Erreur chargement trajets :', err);
    }
  }

  /**
   * 3) Construction de la grille de trajets
   * @param {Array} trajets
   */
  function afficherTrajets(trajets) {
    const liste = document.getElementById("liste-trajets");
    liste.innerHTML = ""; // reset la liste

    trajets.forEach(trajet => {
        // Chemin de la photo (fallback si pas de photo)
        const imgSrc = trajet.conducteur_avatar
            ? "asset/Images/" + trajet.conducteur_avatar
            : "asset/Images/default_03.png";

        // Card HTML
        const card = document.createElement("div");
        card.className = "trajet-card"; // Ajoute ici ta classe CSS

        card.innerHTML = `
            <div class="trajet-header" style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <img src="${imgSrc}" alt="Conducteur" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid #a9d18e;">
                <span style="font-weight:bold;font-size:1.05em;">${trajet.conducteur_prenom} ${trajet.conducteur_nom}</span>
            </div>
            <div class="trajet-infos">
                <div><strong>Date :</strong> ${trajet.date} à ${trajet.heure}</div>
                <div><strong>Départ :</strong> ${trajet.depart}</div>
                <div><strong>Arrivée :</strong> ${trajet.arrivee}</div>
                <div><strong>Prix :</strong> ${trajet.prix} €</div>
                <div><strong>Places dispos :</strong> ${trajet.places - (trajet.total_reservations || 0)}</div>
            </div>
        `;

        // Ajoute la card à la liste
        liste.appendChild(card);
    });
}


    // Liaison des boutons Réserver
    document.querySelectorAll('.btn-reserver').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedTrajetId = btn.dataset.id;
        const rest = btn.dataset.restantes;
        document.getElementById('modalBody').innerHTML = `
          <p>Places disponibles : ${rest}</p>
          <div class="mb-3">
            <label for="nbPlaces" class="form-label">Nombre de places :</label>
            <input type="number"
                   id="nbPlaces"
                   class="form-control"
                   min="1"
                   max="${rest}"
                   value="1">
          </div>
        `;
        new bootstrap.Modal(document.getElementById('reservationModal')).show();
      });
    });
  }

  /**
   * 4) Envoi de la réservation au serveur
   */
  if (btnConfirmer) {
    btnConfirmer.addEventListener('click', async () => {
      const places = parseInt(document.getElementById('nbPlaces').value, 10);
      if (!selectedTrajetId || places <= 0) {
        alert('Nombre de places invalide.');
        return;
      }
      try {
        const response = await fetch('asset/PHP/reserver.php', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trajet_id: selectedTrajetId, places })
        });
        const result = await response.json();
        if (result.error) {
          alert(result.error);
        } else {
          alert(result.message);
          loadTrajets();
        }
      } catch (err) {
        console.error('Erreur réservation :', err);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  }

  // Lancement initial
  loadTrajets();
});
