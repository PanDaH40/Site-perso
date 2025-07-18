document.addEventListener('DOMContentLoaded', () => {
  setupAutocomplete('departure');
  setupAutocomplete('arrival');
});

function setupAutocomplete(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Ajoute un conteneur suggestions après le champ
  let suggBox = document.getElementById(inputId + '-suggestions');
  if (!suggBox) {
    suggBox = document.createElement('div');
    suggBox.id = inputId + '-suggestions';
    suggBox.className = 'autocomplete-suggestions';
    input.parentNode.appendChild(suggBox);
  }

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
          div.addEventListener('mousedown', function() {
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
}
