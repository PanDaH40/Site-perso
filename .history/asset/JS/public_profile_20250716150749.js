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

  // Section avis reçus
  let avisSection = document.getElementById('avis-section');
  if (!avisSection) {
    avisSection = document.createElement('div');
    avisSection.id = "avis-section";
    infosPlusEl.parentNode.appendChild(avisSection);
  }

  const defaultAvatar = 'asset/Images/default_03.png';

  // Fonction affichage avatar avec fallback
  function setAvatar(imgEl, avatarPath, altTxt) {
    imgEl.src = avatarPath && avatarPath !== 'null' ? avatarPath : defaultAvatar;
    imgEl.alt = altTxt || "Avatar utilisateur";
    imgEl.onerror = () => {
      imgEl.src = defaultAvatar;
      imgEl.onerror = null;
    };
  }

  // Affichage des étoiles en lecture seule
  function renderStars(moyenne, nbAvis = 0) {
    const container = document.createElement('div');
    container.className = 'mb-2 d-flex align-items-center';
    const note = Math.round(Number(moyenne) * 2) / 2; // arrondi au 0.5 près
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

  // Formulaire d'avis interactif
  function afficherFormulaireAvis(utilisateurId, dejaNote = false, noteUtilisateur = '', commentaireUtilisateur = '') {
    let oldForm = document.getElementById('form-avis');
    if (oldForm) oldForm.remove();

    const form = document.createElement('form');
    form.id = 'form-avis';
    form.className = 'mb-3 p-3 border rounded';

    form.innerHTML = `
      <div class="mb-2 fw-bold">${dejaNote ? "Modifier votre avis" : "Laisser un avis"} :</div>
      <div class="d-flex align-items-center mb-2" id="stars-input"></div>
      <input type="hidden" id="noteInput" name="note" value="${noteUtilisateur || ''}">
      <textarea class="form-control mb-2" id="commentaireInput" name="commentaire" rows="2" maxlength="255" placeholder="Commentaire (optionnel)...">${commentaireUtilisateur || ''}</textarea>
      <button type="submit" class="btn btn-primary btn-sm">${dejaNote ? "Modifier" : "Envoyer"}</button>
      <span id="avis-message" class="ms-3 text-success small"></span>
    `;
    avisSection.prepend(form);

    const starsDiv = form.querySelector('#stars-input');
    let currentNote = noteUtilisateur || 0;

    // Création étoiles cliquables
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.style.fontSize = "1.5rem";
      star.style.cursor = "pointer";
      star.style.color = (i <= currentNote) ? "#ffc107" : "#bbb";
      star.textContent = '★';
      star.dataset.value = i;
      star.onmouseover = () => highlightStars(i);
      star.onmouseout = () => highlightStars(currentNote);
      star.onclick = () => {
        currentNote = i;
        form.note.value = i;
        highlightStars(i);
      };
      starsDiv.appendChild(star);
    }

    function highlightStars(val) {
      starsDiv.childNodes.forEach((star, idx) => {
        star.style.color = (idx < val) ? "#ffc107" : "#bbb";
      });
    }
    highlightStars(currentNote);

    // Gestion soumission formulaire
    form.onsubmit = e => {
      e.preventDefault();
      const note = parseInt(form.note.value);
      const commentaire = form.commentaire.value.trim();
      const msg = form.querySelector('#avis-message');
      msg.textContent = '';

      if (!note || note < 1 || note > 5) {
        msg.textContent = "Merci de donner une note !";
        msg.className = "ms-3 text-danger small";
        return;
      }
      fetch('asset/PHP/ajouter_avis.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ utilisateur_id: utilisateurId, note, commentaire })
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          msg.textContent = "Merci pour votre avis !";
          msg.className = "ms-3 text-success small";
          setTimeout(() => location.reload(), 1000);
        } else {
          msg.textContent = result.error || "Erreur lors de l'envoi.";
          msg.className = "ms-3 text-danger small";
        }
      })
      .catch(() => {
        msg.textContent = "Erreur réseau.";
        msg.className = "ms-3 text-danger small";
      });
    };
  }

  // Chargement des données du profil public
  fetch(`asset/PHP/get_public_profile.php?id=${encodeURIComponent(userId)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      // Avatar
      setAvatar(avatarEl, data.avatar, `Avatar de ${data.prenom || ''} ${data.nom || ''}`);

      // Infos basiques
      pseudoEl.textContent = data.prenom || 'Utilisateur';
      prenomEl.textContent = data.prenom || '';
      bioEl.textContent = data.bio || "Cet utilisateur n'a pas encore ajouté de présentation.";

      // Moyenne étoiles avant rôle
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

      // Ancienneté & nb trajets
      ancienneteEl.textContent = data.anciennete || 'Membre depuis une date inconnue';
      nbTrajetsEl.textContent = `${data.nbTrajets || 0} trajets publiés et complétés`;

      // Préférences diverses
      infosPlusEl.innerHTML = '';
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

      // Liste des avis reçus
      avisSection.innerHTML = '';
      if (data.avis && Array.isArray(data.avis) && data.avis.length > 0) {
        const titre = document.createElement('h6');
        titre.textContent = "Derniers avis reçus :";
        titre.className = "mt-4 mb-2";
        avisSection.appendChild(titre);

        data.avis.forEach(av => {
          const div = document.createElement('div');
          div.className = "mb-3 p-2 border rounded";
          div.appendChild(renderStars(av.note));
          if (av.commentaire) {
            const commentaire = document.createElement('div');
            commentaire.textContent = `"${av.commentaire}"`;
            commentaire.className = "fst-italic small";
            div.appendChild(commentaire);
          }
          const info = document.createElement('div');
          info.className = "text-muted small mt-1";
          info.textContent = `par ${av.auteur_prenom} • ${new Date(av.date).toLocaleDateString('fr-FR')}`;
          div.appendChild(info);

          avisSection.appendChild(div);
        });
      }

      // Afficher formulaire d'avis si connecté et pas son propre profil
      if (data.isLoggedIn && String(data.currentUserId) !== String(userId)) {
        afficherFormulaireAvis(userId, data.deja_note, data.note_utilisateur, data.commentaire_utilisateur);
      }
    })
    .catch(err => {
      console.error(err);
      alert("Erreur lors du chargement du profil.");
    });
});
