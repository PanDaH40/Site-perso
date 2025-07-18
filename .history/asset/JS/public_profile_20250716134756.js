// asset/JS/public_profile.js

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
  const typeCompteEl  = document.getElementById('typeCompte');
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

  // Chargement des données utilisateur via API PHP
  fetch(`asset/PHP/get_public_profile.php?id=${encodeURIComponent(userId)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      // Avatar + fallback en cas d'image manquante
      setAvatar(avatarEl, data.avatar, `Avatar de ${data.prenom || ''} ${data.nom || ''}`);

      // Pseudo, prénom, présentation
      pseudoEl.textContent = data.prenom || 'Utilisateur';
      prenomEl.textContent = data.prenom || '';
      bioEl.textContent = data.bio || "Cet utilisateur n'a pas encore ajouté de présentation.";

      // Rôles et type de compte
      if (data.roleConducteur && data.rolePassager) {
        roleEl.textContent = 'Conducteur & Passager';
        typeCompteEl.textContent = 'Membre professionnel';
      } else if (data.roleConducteur) {
        roleEl.textContent = 'Conducteur';
        typeCompteEl.textContent = 'Membre professionnel';
      } else if (data.rolePassager) {
        roleEl.textContent = 'Passager';
        typeCompteEl.textContent = 'Membre non-professionnel';
      } else {
        roleEl.textContent = 'Membre';
        typeCompteEl.textContent = 'Membre non-professionnel';
      }

      // Ancienneté & trajets
      ancienneteEl.textContent = data.anciennete || 'Membre depuis une date inconnue';
      nbTrajetsEl.textContent = `${data.nbTrajets || 0} trajets publiés et complétés`;

      // Préférences et autres infos
      infosPlusEl.innerHTML = '';
      if (data.preferences) {
        const li = document.createElement('li');
        li.textContent = `Préférences : ${data.preferences}`;
        infosPlusEl.appendChild(li);
      }
      if (data.animaux === 1) {
        const li = document.createElement('li');
        li.textContent = `Animaux  🐾`;
        infosPlusEl.appendChild(li);
      }
      if (data.fumeurs === 0) {
        const li = document.createElement('li');
        li.textContent = `Pas de cigarette, svp 🚭`;
        infosPlusEl.appendChild(li);
      }
      if(data.fumeurs === 1){
        const li = document.createElement('li');
        li.textContent = `Fumeurs acceptés 🚬`;
        infosPlusEl.appendChild(li);
      }
      if (data.musique) {
        const li = document.createElement('li');
        li.textContent = `Musique tout le long 🎵`;
        infosPlusEl.appendChild(li);
      }
      // Tu peux ajouter d'autres préférences ici si besoin
    })
    .catch(err => {
      console.error(err);
      alert("Erreur lors du chargement du profil.");
    });
});
