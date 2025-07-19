document.addEventListener('DOMContentLoaded', () => {
  // Récupérer l'id utilisateur depuis l'URL
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');

  if (!userId) {
    alert("Profil introuvable : identifiant manquant.");
    return;
  }

  // Sélecteurs DOM
  const avatarEl      = document.getElementById('avatar');
  const pseudoEl      = document.getElementById('pseudo');
  const prenomEl      = document.getElementById('prenom');
  const bioEl         = document.getElementById('bio');
  const roleEl        = document.getElementById('role');
  const ancienneteEl  = document.getElementById('anciennete');
  const nbTrajetsEl   = document.getElementById('nbTrajets');
  const infosPlusEl   = document.getElementById('infos-plus');

  const defaultAvatar = 'asset/Images/default_03.png';

  // Fonction d'affichage sécurisée pour l'avatar (fallback en cas d'erreur)
  function setAvatar(imgEl, avatarPath, altTxt) {
    imgEl.src = avatarPath && avatarPath !== 'null'
      ? avatarPath
      : defaultAvatar;
    imgEl.alt = altTxt;
    imgEl.onerror = function() {
      this.src = defaultAvatar;
      this.onerror = null; // Pour éviter une boucle infinie
    };
  }

  // Affichage étoiles moyenne (lecture seule)
  function renderStars(moyenne, nbAvis = 0) {
    const container = document.createElement('div');
    container.className = 'mb-1';
    const note = Math.round(Number(moyenne) * 2) / 2; // arrondi 0.5 près
    for (let i = 1; i <= 5; i++) {
      if (note >= i) {
        container.innerHTML += '<span style="color:#ffc107;font-size:1.4rem;">★</span>';
      } else if (note >= i - 0.5) {
        container.innerHTML += '<span style="color:#ffc107;font-size:1.4rem;">☆</span>';
      } else {
        container.innerHTML += '<span style="color:#bbb;font-size:1.4rem;">☆</span>';
      }
    }
    if (nbAvis > 0) {
      container.innerHTML += `<small class="ms-2 text-muted">(${nbAvis} avis)</small>`;
    }
    return container;
  }

  // Chargement des données utilisateur via API PHP
  fetch(`asset/PHP/get_public_profile.php?id=${encodeURIComponent(userId)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      // Avatar
      setAvatar(avatarEl, data.avatar, `Avatar de ${data.prenom || ''} ${data.nom || ''}`);

      // Pseudo, prénom, présentation
      pseudoEl.textContent = data.prenom || 'Utilisateur';
      prenomEl.textContent = data.prenom || '';
      bioEl.textContent = data.bio || "Cet utilisateur n'a pas encore ajouté de présentation.";

      // Ajout des étoiles (moyenne) juste avant le rôle
      if (data.moyenne_note) {
        const stars = renderStars(data.moyenne_note, data.nb_avis);
        roleEl.parentNode.insertBefore(stars, roleEl);
      }

      // Rôles
      if (data.roleConducteur && data.rolePassager) {
        roleEl.textContent = 'Conducteur & Passager';
      } else if (data.roleConducteur) {
        roleEl.textContent = 'Conducteur';
      } else if (data.rolePassager) {
        roleEl.textContent = 'Passager';
      } else {
        roleEl.textContent = 'Membre';
      }

      // Ancienneté & trajets
      ancienneteEl.textContent = data.anciennete || 'Membre depuis une date inconnue';
      nbTrajetsEl.textContent = `${data.nbTrajets || 0} trajets publiés et complétés`;

      // Préférences et autres infos
      infosPlusEl.innerHTML = '';
      // Préférences texte
      if (data.preferences) {
        const li = document.createElement('li');
        li.textContent = `Préférences : ${data.preferences}`;
        infosPlusEl.appendChild(li);
      }
      // Animaux
      if ('animaux' in data) {
        const li = document.createElement('li');
        li.textContent = (data.animaux === 1)
          ? "Animaux acceptés 🐾"
          : "Animaux refusés 🐾";
        infosPlusEl.appendChild(li);
      }
      // Fumeur
      if ('fumeurs' in data) {
        const li = document.createElement('li');
        li.textContent = (data.fumeurs === 1)
          ? "Fumeurs acceptés 🚬"
          : "Pas de cigarette, svp 🚭";
        infosPlusEl.appendChild(li);
      }
      // Tu peux ajouter d'autres préférences ici

    })
    .catch(err => {
      console.error(err);
      alert("Erreur lors du chargement du profil.");
    });
});
