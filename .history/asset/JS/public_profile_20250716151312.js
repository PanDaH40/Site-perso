document.addEventListener('DOMContentLoaded', () => {
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
  let avisSection     = document.getElementById('avis-section');
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

  // Affichage étoiles moyenne
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

  // Formulaire d'avis interactif (pas modifié ici)
  function afficherFormulaireAvis(utilisateurId, dejaNote = false, noteUtilisateur = '', commentaireUtilisateur = '') {
    // ... Ton code formulaire avis existant ...
  }

  // Gestion modal Bootstrap pour envoyer un message
  const sendMessageModalEl = document.getElementById('sendMessageModal');
  const sendMessageModal = sendMessageModalEl ? new bootstrap.Modal(sendMessageModalEl) : null;
  const openModalBtn = document.getElementById('openSendMessageModalBtn');
  const sendMessageForm = document.getElementById('sendMessageForm');
  const modalMessageText = document.getElementById('modalMessageText');
  const modalMessageFeedback = document.getElementById('modalMessageFeedback');

  if (openModalBtn && sendMessageModal) {
    openModalBtn.onclick = () => {
      modalMessageText.value = '';
      modalMessageFeedback.textContent = '';
      sendMessageModal.show();
    };
  }

  if (sendMessageForm) {
    sendMessageForm.onsubmit = e => {
      e.preventDefault();
      const message = modalMessageText.value.trim();
      modalMessageFeedback.textContent = '';

      if (!message) {
        modalMessageFeedback.textContent = "Veuillez écrire un message.";
        modalMessageFeedback.className = "text-danger small mt-1";
        return;
      }

      fetch('asset/PHP/envoyer_message.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinataire_id: userId, message })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          modalMessageFeedback.textContent = "Message envoyé !";
          modalMessageFeedback.className = "text-success small mt-1";
          modalMessageText.value = '';
          setTimeout(() => sendMessageModal.hide(), 1500);
        } else {
          modalMessageFeedback.textContent = data.error || "Erreur lors de l'envoi.";
          modalMessageFeedback.className = "text-danger small mt-1";
        }
      })
      .catch(() => {
        modalMessageFeedback.textContent = "Erreur réseau.";
        modalMessageFeedback.className = "text-danger small mt-1";
      });
    };
  }

  // Chargement des données du profil
  fetch(`asset/PHP/get_public_profile.php?id=${encodeURIComponent(userId)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

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

      if (data.isLoggedIn && String(data.currentUserId) !== String(userId)) {
        afficherFormulaireAvis(userId, data.deja_note, data.note_utilisateur, data.commentaire_utilisateur);
      }
    })
    .catch(err => {
      console.error(err);
      alert("Erreur lors du chargement du profil.");
    });
});
