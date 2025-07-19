document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');

  if (!userId) {
    alert("Profil introuvable : identifiant manquant.");
    return;
  }

  // Sélecteurs DOM profil
  const avatarEl      = document.getElementById('avatar');
  const pseudoEl      = document.getElementById('pseudo');
  const prenomEl      = document.getElementById('prenom');
  const bioEl         = document.getElementById('bio');
  const roleEl        = document.getElementById('role');
  const ancienneteEl  = document.getElementById('anciennete');
  const nbTrajetsEl   = document.getElementById('nbTrajets');
  const infosPlusEl   = document.getElementById('infos-plus');
  const avisSection   = document.getElementById('avis-section');

  // ... (boutons, modals, fonctions stars etc) ...

  // Fonction pour afficher avatar avec fallback
  function setAvatar(imgEl, avatarPath, altTxt) {
    imgEl.src = avatarPath && avatarPath !== 'null' ? avatarPath : 'asset/Images/default_03.png';
    imgEl.alt = altTxt || "Avatar utilisateur";
    imgEl.onerror = () => {
      imgEl.src = 'asset/Images/default_03.png';
      imgEl.onerror = null;
    };
  }

  // ... (renderStars et creerFormulaireAvis inchangés) ...

  // Chargement des données du profil
  fetch(`asset/PHP/get_public_profile.php?id=${encodeURIComponent(userId)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      // Mise à jour profil
      setAvatar(avatarEl, data.avatar, `Avatar de ${data.prenom || ''} ${data.nom || ''}`);
      pseudoEl.textContent = data.prenom || 'Utilisateur';
      prenomEl.textContent = data.prenom || '';
      bioEl.textContent = data.bio || "Cet utilisateur n'a pas encore ajouté de présentation.";

      if (data.moyenne_note && data.nb_avis > 0) {
        const stars = renderStars(data.moyenne_note, data.nb_avis);
        roleEl.parentNode.insertBefore(stars, roleEl);
      }

      if (data.roleConducteur && data.rolePassager) {
        roleEl.textContent = 'Conducteur & Passager';
      } else if (data.roleConducteur) {
        roleEl.textContent = 'Conducteur';
      } else if (data.rolePassager) {
        roleEl.textContent = 'Passager';
      } else {
        roleEl.textContent = 'Membre';
      }

      ancienneteEl.textContent = data.anciennete || 'Membre depuis une date inconnue';
      nbTrajetsEl.textContent = `${data.nbTrajets || 0} trajets publiés et complétés`;

      // Affichage des infos supplémentaires
      infosPlusEl.innerHTML = '';

      // ----------- INFOS CONDUCTEUR AJOUT --------------
      if (data.marque_vehicule || data.modele_vehicule || data.carburant) {
        const vehicule = document.createElement('li');
        let ligne = '';
        if (data.marque_vehicule) ligne += `Marque : <b>${data.marque_vehicule}</b> `;
        if (data.modele_vehicule) ligne += `Modèle : <b>${data.modele_vehicule}</b> `;
        if (data.carburant)       ligne += `<span class="badge bg-light text-dark ms-2">${data.carburant.charAt(0).toUpperCase() + data.carburant.slice(1)}</span>`;
        vehicule.innerHTML = ligne.trim();
        infosPlusEl.appendChild(vehicule);
      }
      // ----------- /INFOS CONDUCTEUR AJOUT --------------

      if (data.preferences) {
        const li = document.createElement('li');
        li.textContent = `Préférences : ${data.preferences}`;
        infosPlusEl.appendChild(li);
      }
      if ('animaux' in data) {
        const li = document.createElement('li');
        li.textContent = (data.animaux === 1) ? "Animaux acceptés 🐾" : "Animaux refusés 🐾";
        infosPlusEl.appendChild(li);
      }
      if ('fumeurs' in data) {
        const li = document.createElement('li');
        li.textContent = (data.fumeurs === 1) ? "Fumeurs acceptés 🚬" : "Pas de cigarette, svp 🚭";
        infosPlusEl.appendChild(li);
      }

      // --- avis, bouton avis, modal message etc (inchangé) ---
      // ... (code suite, inchangé)
    })
    .catch(err => {
      console.error(err);
      alert("Erreur lors du chargement du profil.");
    });
});
