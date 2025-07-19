document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const conducteurId = params.get('id');
  const titreEl = document.getElementById("titre-historique");
  const infoConducteurEl = document.getElementById("info-conducteur");
  const listeEl = document.getElementById("liste-historique");
  const aucunEl = document.getElementById("aucun-trajet");

  if (!titreEl || !infoConducteurEl || !listeEl || !aucunEl) {
    alert("Erreur dans la structure HTML de la page !");
    return;
  }
  if (!conducteurId) {
    titreEl.textContent = "Conducteur inconnu";
    aucunEl.textContent = "Identifiant du conducteur manquant.";
    aucunEl.classList.remove('d-none');
    return;
  }

  // Infos conducteur
  fetch(`asset/PHP/get_public_profile.php?id=${encodeURIComponent(conducteurId)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        infoConducteurEl.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
        return;
      }
      infoConducteurEl.innerHTML = `
        <div class="d-flex align-items-center mb-2">
          <img src="${data.avatar && data.avatar !== 'null' ? data.avatar : 'asset/Images/default_03.png'}" alt="Photo" class="rounded-circle me-3" style="width:56px;height:56px;object-fit:cover;">
          <div>
            <div class="fw-bold">${data.prenom || ''} ${data.nom || ''}</div>
            <div class="text-muted small">Conducteur</div>
          </div>
        </div>
      `;
      if (data.prenom || data.nom)
        titreEl.textContent = `Historique de ${data.prenom || ''} ${data.nom || ''}`;
    })
    .catch(() => {
      infoConducteurEl.innerHTML = `<div class="alert alert-danger">Erreur lors du chargement du profil conducteur.</div>`;
    });

  // Historique trajets
  fetch(`asset/PHP/historique_conducteur.php?id=${encodeURIComponent(conducteurId)}`)
    .then(res => res.json())
    .then(data => {
      listeEl.innerHTML = "";
      aucunEl.classList.add('d-none');
      if (data.error) {
        aucunEl.textContent = data.error;
        aucunEl.classList.remove('d-none');
        return;
      }
      if (!data.trajets || !Array.isArray(data.trajets) || data.trajets.length === 0) {
        aucunEl.textContent = "Aucun trajet terminé trouvé pour ce conducteur.";
        aucunEl.classList.remove('d-none');
        return;
      }
      // Optionnel : titre avec nombre
      titreEl.textContent += ` (${data.trajets.length})`;
      data.trajets.forEach(trajet => {
        const card = document.createElement('div');
        card.className = 'card trajet-card mb-3';
        card.innerHTML = `
          <div class="card-body">
            <div class="row">
              <div class="col-12 col-md-8">
                <div><strong>Départ :</strong> ${trajet.depart}</div>
                <div><strong>Arrivée :</strong> ${trajet.arrivee}</div>
                <div><strong>Date :</strong> ${new Date(trajet.date).toLocaleDateString('fr-FR')} à ${trajet.heure}</div>
              </div>
              <div class="col-12 col-md-4">
                <div><strong>Places :</strong> ${trajet.places}</div>
                <div><strong>Jetons :</strong> ${trajet.jetons}</div>
                ${trajet.nb_passagers ? `<div><strong>Passagers :</strong> ${trajet.nb_passagers}</div>` : ""}
              </div>
            </div>
          </div>
        `;
        listeEl.appendChild(card);
      });
    })
    .catch(() => {
      listeEl.innerHTML = "";
      aucunEl.textContent = "Erreur lors du chargement de l'historique.";
      aucunEl.classList.remove('d-none');
    });
});
