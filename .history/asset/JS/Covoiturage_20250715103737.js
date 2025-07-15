// asset/JS/Covoiturage.js
// Gestion de la création et de l'affichage des trajets (avec intégration du champ prix)

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('trajetForm');
  const listeProposes = document.getElementById('trajetsProposes');
  const listeReserves = document.getElementById('trajetsReserves');

  // Soumission du formulaire de création de trajet
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      depart:   document.getElementById('depart').value.trim(),
      arrivee:  document.getElementById('arrivee').value.trim(),
      date:     document.getElementById('date').value,
      heure:    document.getElementById('heure').value,
      places:   parseInt(document.getElementById('places').value, 10),
      prix:     parseFloat(document.getElementById('prix').value)
    };

    // Validation basique
    if (data.places <= 0 || data.prix < 0) {
      return alert('Veuillez saisir un nombre de places et un prix valides.');
    }

    try {
      const response = await fetch('asset/PHP/trajets.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();

      if (result.success) {
        alert('Trajet ajouté avec succès !');
        form.reset();
        loadTrajets();
      } else {
        alert(result.error || 'Erreur lors de l\'ajout du trajet.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau, veuillez réessayer.');
    }
  });

  // Chargement initial des trajets
  loadTrajets();

  async function loadTrajets() {
    try {
      const response = await fetch('asset/PHP/trajets.php');
      const data = await response.json();

      if (data.error) {
        return console.error(data.error);
      }

      afficherTrajets(data.trajetsProposes, listeProposes, 'Proposés');
      afficherTrajets(data.trajetsReserves, listeReserves, 'Réservés');
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Affiche une liste de trajets dans un container donné
   * @param {Array} trajets Tableau d'objets trajet
   * @param {HTMLElement} container Élément DOM où insérer les cartes
   * @param {string} titreLibellé Libellé à afficher si la liste est vide
   */
  function afficherTrajets(trajets, container, titreLibellé) {
    container.innerHTML = '';

    if (!trajets || trajets.length === 0) {
      container.innerHTML = `<p>Aucun trajet ${titreLibellé.toLowerCase()}.</p>`;
      return;
    }

    trajets.forEach(t => {
      const card = document.createElement('div');
      card.className = 'card mb-3';
      card.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${t.depart} → ${t.arrivee}</h5>
          <p class="card-text">Date : ${t.date} à ${t.heure}</p>
          <p class="card-text">Places disponibles : ${t.places}</p>
          <p class="card-text"><strong>Prix : ${t.prix.toFixed(2)} €</strong></p>
        </div>
      `;
      container.appendChild(card);
    });
  }
});
