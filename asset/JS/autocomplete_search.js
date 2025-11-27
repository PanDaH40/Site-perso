// Autocomplétion d'adresses API https://api-adresse.data.gouv.fr/

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

    // Ne lancer une recherche qu'à partir de 3 caractères
    if (q.length < 3) {
      suggBox.innerHTML = '';
      return;
    }

    fetch('https://api-adresse.data.gouv.fr/search/?q=' + encodeURIComponent(q) + '&limit=7')
      .then(res => {
        if (!res.ok) throw new Error("API Adresse: " + res.status);
        return res.json();
      })
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
      })
      .catch(() => {
        // L’API renvoie 400 → on ne casse rien
        // On efface seulement les suggestions
        suggBox.innerHTML = '';
      });
  });

  // Fermer la liste si clic ailleurs
  document.addEventListener('click', function(e) {
    if (!input.contains(e.target) && !suggBox.contains(e.target)) {
      suggBox.innerHTML = '';
    }
  });

  // Fermer après perte de focus
  input.addEventListener('blur', function() {
    setTimeout(() => { suggBox.innerHTML = ''; }, 150);
  });
}
