document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const conducteurId = params.get('id');
  if (!conducteurId) return;

  fetch(`/TPCovoiturage/asset/PHP/historique_conducteur.php?conducteur_id=${conducteurId}`)
    .then(res => res.json())
    .then(data => {
      const cont = document.getElementById("historique-trajets");
      if (!data.historique || !data.historique.length) {
        cont.innerHTML = "<div class='alert alert-info'>Aucun trajet trouvé.</div>";
        return;
      }
      cont.innerHTML = data.historique.map(t => `
        <div class="card my-2 p-2">
          <div><b>Date:</b> ${t.date} ${t.heure}</div>
          <div><b>Départ:</b> ${t.depart} → <b>Arrivée:</b> ${t.arrivee}</div>
          <div><b>Places:</b> ${t.places} | <b>Jetons:</b> ${t.jetons}</div>
          <div><b>Statut:</b> ${t.etat_trajet || 'inconnu'}</div>
        </div>
      `).join('');
    });
});
