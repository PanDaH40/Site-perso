// Attendre que le DOM soit prêt
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-trajet');

  // Soumission du formulaire pour ajouter un trajet
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const destination = document.getElementById('destination').value.trim();
      const heure = document.getElementById('heure').value;
      const places = parseInt(document.getElementById('places').value, 10);

      if (!destination || !heure || isNaN(places) || places <= 0) {
        alert('Veuillez remplir tous les champs correctement.');
        return;
      }

      fetch('asset/PHP/trajets.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ destination, heure, places })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert('Trajet ajouté avec succès');
            window.location.reload();
          } else {
            alert(data.error || 'Erreur lors de l\'ajout du trajet');
          }
        })
        .catch(error => {
          console.error('Erreur lors de l\'ajout :', error);
        });
    });
  }

  // Chargement des trajets existants
  fetch('asset/PHP/trajets.php')
    .then(response => response.json())
    .then(data => {
      const tableau = document.getElementById('liste-trajets');
      if (!tableau) return;

      tableau.innerHTML = '';

      data.trajets.forEach(trajet => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${trajet.destination}</td>
          <td>${trajet.heure}</td>
          <td>${trajet.places}</td>
          <td>
            <button onclick="confirmerReservation(${trajet.id})">Réserver</button>
          </td>
        `;
        tableau.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Erreur lors du chargement des trajets :', error);
    });
});

// Fonction appelée quand l'utilisateur clique sur "Réserver"
function confirmerReservation(trajetId) {
  if (!confirm('Confirmer la réservation ?')) return;

  fetch('asset/PHP/reserver.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ trajet_id: trajetId, places: 1 }) // ← adapter si choix du nombre de places
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(data.message || 'Réservation confirmée');
        location.reload();
      } else {
        alert(data.error || 'Erreur lors de la réservation');
      }
    })
    .catch(error => {
      console.error('Erreur lors de la réservation :', error);
    });
}
