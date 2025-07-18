// === autocomplete.js ===
// Gère l'autocomplétion des adresses avec l'API https://api-adresse.data.gouv.fr/
// Fonctionne pour : #departure, #arrival, #depart, #arrivee

document.addEventListener('DOMContentLoaded', function() {
  setupAutocomplete('departure', 'departure-suggestions');
  setupAutocomplete('arrival', 'arrival-suggestions');
  setupAutocomplete('depart', 'depart-suggestions');
  setupAutocomplete('arrivee', 'arrivee-suggestions');
});

function setupAutocomplete(inputId, suggId) {
  const input = document.getElementById(inputId);
  const suggBox = document.getElementById(suggId);
  if (!input || !suggBox) return;

  input.addEventListener('input', function() {
    const q = input.value.trim();
    if (q.length < 2) {
      suggBox.innerHTML = '';
      return;
    }
    fetch('https://api-adresse.data.gouv.fr/search/?q=' + encodeURIComponent(q) + '&limit=7')
      .then(res => res.json())
      .then(data => {
        suggBox.innerHTML = '';
        if (!data.features) return;
        data.features.forEach(f => {
          const div = document.createElement('div');
          div.textContent = f.properties.label;
          div.tabIndex = 0;
          div.addEventListener('mousedown', function(e) {
            e.preventDefault();
            input.value = f.properties.label;
            suggBox.innerHTML = '';
          });
          suggBox.appendChild(div);
        });
      });
  });

  // Ferme la liste au clic ailleurs
  document.addEventListener('click', function(e) {
    if (!input.contains(e.target) && !suggBox.contains(e.target)) {
      suggBox.innerHTML = '';
    }
  });

  // Ferme la suggestion au blur (optionnel)
  input.addEventListener('blur', function() {
    setTimeout(() => { suggBox.innerHTML = ''; }, 150);
  });
}
