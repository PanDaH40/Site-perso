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
  
  // (optionnel) Section avis en bas du profil
  let avisSection = document.getElementById('avis-section');
  if (!avisSection) {
    avisSection = document.createElement('div');
    avisSection.id = "avis-section";
    infosPlusEl.parentNode.appendChild(avisSection);
  }

  const defaultAvatar = 'asset/Images/default_03.png';

  // Fonction d'affichage sécurisée pour l'avatar (fallback en cas d'erreur)
  function setAvatar(imgEl, avatarPath, altTxt) {
    imgEl.src = avatarPath && avatarPath !== 'null'
      ? avatarPath
      : defaultAvatar;
    imgEl.alt = altTxt;
    imgEl.onerror = function() {
      this.src = defaultAvatar;
      this.onerror = null;
    };
  }

  // Affichage étoiles moyenne (lecture seule)
  function renderStars(moyenne, nbAvis = 0) {
    const container = document.createElement('div');
    container.className = 'mb-2 d-flex align-items-center';
    const note = Math.round(Number(moyenne) * 2) / 2;
    for (let i = 1; i <= 5; i++) {
      if (note >= i) {
        container.innerHTML += '<span style="color:#ffc107;font-size:1.3rem;">★</span>';
      } else if (note >= i - 0.5) {
        container.innerHTML += '<span style="color:#ffc107;font-size:1.3rem;">☆</span>';
      } else {
        container.innerHTML += '<span style="color:#bbb;font-size:1.3rem;">☆</span>';
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
      if (data.moyenne_note && data.nb_avis > 0) {
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

      // -----------------------------
      // Section avis (optionnelle)
      // -----------------------------
      avisSection.innerHTML = '';
      if (data.avis && Array.isArray(data.avis) && data.avis.length > 0) {
        const titre = document.createElement('h6');
        titre.textContent = "Derniers avis reçus :";
        titre.className = "mt-4 mb-2";
        avisSection.appendChild(titre);

        data.avis.forEach(av => {
          const div = document.createElement('div');
          div.className = "mb-3 p-2 border rounded";
          // Note sous forme d'étoiles
          div.appendChild(renderStars(av.note));
          // Commentaire
          if (av.commentaire) {
            const commentaire = document.createElement('div');
            commentaire.textContent = `"${av.commentaire}"`;
            commentaire.className = "fst-italic small";
            div.appendChild(commentaire);
          }
          // Auteur & date
          const info = document.createElement('div');
          info.className = "text-muted small mt-1";
          const date = new Date(av.date).toLocaleDateString('fr-FR');
          info.textContent = `par ${av.auteur_prenom} • ${date}`;
          div.appendChild(info);

          avisSection.appendChild(div);
        });
      }

    })
    .catch(err => {
      console.error(err);
      alert("Erreur lors du chargement du profil.");
    });
});
