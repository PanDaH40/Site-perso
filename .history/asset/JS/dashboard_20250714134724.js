// dashboard.js - Corrigé pour afficher erreurs détaillées

document.addEventListener('DOMContentLoaded', () => {
  const tableau = document.getElementById('liste-trajets-dashboard');

  function chargerTrajets() {
    fetch('asset/PHP/trajets.php?dashboard=1')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Suppose que data.trajets_proposes est un tableau
        tableau.innerHTML = '';
        data.trajets_proposes.forEach(trajet => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${trajet.depart}</td>
            <td>${trajet.arrivee}</td>
            <td>${trajet.date}</td>
            <td>${trajet.heure}</td>
            <td>${trajet.places}</td>
          `;
          tableau.appendChild(row);
        });
      })
      .catch(error => {
        console.error('Erreur fetch trajets:', error);
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
          errorDiv.textContent = `Erreur lors du chargement des trajets: ${error}`;
          errorDiv.style.display = 'block';
        }
      });
  }

  chargerTrajets();
});
