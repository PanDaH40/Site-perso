document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const idConducteur = params.get('id');

  if (!idConducteur) {
    alert("Identifiant conducteur manquant.");
    return;
  }

  fetch(`asset/PHP/historique_conducteur.php?id=${idConducteur}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      const liste = document.getElementById('historique-trajets');
      if (!liste) return;
      liste.innerHTML = "";

      if (!data.trajets || !data.trajets.length) {
        liste.innerHTML = `<div class="alert alert-info text-center">Aucun trajet terminé trouvé pour ce conducteur.</div>`;
        return;
      }

      data.trajets.forEach(trajet => {
        const div = document.createElement('div');
        div.className = "card mb-3";
        div.innerHTML = `
          <div class="card-body">
            <div><b>Départ :</b> ${trajet.depart}</div>
            <div><b>Arrivée :</b> ${trajet.arrivee}</div>
            <div><b>Date :</b> ${trajet.date} à ${trajet.heure}</div>
            <div><b>Places :</b> ${trajet.places} | <b>Réservées :</b> ${trajet.total_reservations}</div>
            <div><b>Jetons :</b> ${trajet.jetons}</div>
          </div>
        `;
        liste.appendChild(div);
      });
    })
    .catch(err => {
      alert("Erreur lors du chargement de l'historique.");
      console.error(err);
    });
});
