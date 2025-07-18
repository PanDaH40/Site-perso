document.addEventListener('DOMContentLoaded', () => {  
  // Récupérer l'id utilisateur depuis l'URL ?id=xxx
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');

  if (!userId) {
    alert("Profil introuvable : identifiant manquant.");
    return;
  }

  // Sélecteurs des éléments DOM dans la page profil
  const btnEnvoyerMessage      = document.getElementById('openSendMessageModalBtn');
  const sendMessageModal       = new bootstrap.Modal(document.getElementById('sendMessageModal'));
  const sendMessageForm        = document.getElementById('sendMessageForm');
  const modalMessageText       = document.getElementById('modalMessageText');
  const modalMessageFeedback   = document.getElementById('modalMessageFeedback');

  const avatarEl      = document.getElementById('avatar');
  const pseudoEl      = document.getElementById('pseudo');
  const prenomEl      = document.getElementById('prenom');
  const bioEl         = document.getElementById('bio');
  const roleEl        = document.getElementById('role');
  const ancienneteEl  = document.getElementById('anciennete');
  const nbTrajetsEl   = document.getElementById('nbTrajets');
  const infosPlusEl   = document.getElementById('infos-plus');
  const avisSection   = document.getElementById('avis-section');
  const btnHistorique = document.getElementById('btn-historique-trajets');

  // Met à jour dynamiquement le lien du bouton historique selon le profil affiché
  if (btnHistorique && userId) {
    btnHistorique.href = `HistoriqueConducteur.html?id=${userId}`;
  }

  // Création du bouton "Donner un avis" + container formulaire avis (ajoutés dynamiquement)
  const btnDonnerAvis = document.createElement('button');
  btnDonnerAvis.id = 'btnDonnerAvis';
  btnDonnerAvis.className = 'btn btn-outline-primary mb-3';
  btnDonnerAvis.textContent = 'Donner un avis';
  btnDonnerAvis.style.display = 'none'; // caché par défaut

  const formulaireAvisContainer = document.createElement('div');
  formulaireAvisContainer.id = 'formulaire-avis-container';

  avisSection.appendChild(btnDonnerAvis);
  avisSection.appendChild(formulaireAvisContainer);

  const defaultAvatar = 'asset/Images/default_03.png';

  function setAvatar(imgEl, avatarPath, altTxt) {
    imgEl.src = avatarPath && avatarPath !== 'null' ? avatarPath : defaultAvatar;
    imgEl.alt = altTxt || "Avatar utilisateur";
    imgEl.onerror = () => {
      imgEl.src = defaultAvatar;
      imgEl.onerror = null;
    };
  }

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

  function creerFormulaireAvis(utilisateurId, dejaNote = false, noteUtilisateur = '', commentaireUtilisateur = '') {
    formulaireAvisContainer.innerHTML = '';

    const form = document.createElement('form');
    form.id = 'formulaire-avis';
    form.className = 'mb-4 p-3 border rounded';

    form.innerHTML = `
      <h6>Laissez un avis</h6>
      <div class="mb-3">
        <label for="note" class="form-label">Note :</label>
        <select id="note" class="form-select" required>
          <option value="">-- Choisissez une note --</option>
          <option value="1" ${noteUtilisateur == 1 ? 'selected' : ''}>1 - Très mauvais</option>
          <option value="2" ${noteUtilisateur == 2 ? 'selected' : ''}>2 - Mauvais</option>
          <option value="3" ${noteUtilisateur == 3 ? 'selected' : ''}>3 - Moyen</option>
          <option value="4" ${noteUtilisateur == 4 ? 'selected' : ''}>4 - Bon</option>
          <option value="5" ${noteUtilisateur == 5 ? 'selected' : ''}>5 - Excellent</option>
        </select>
      </div>
      <div class="mb-3">
        <label for="commentaire" class="form-label">Commentaire (facultatif) :</label>
        <textarea id="commentaire" class="form-control" rows="3">${commentaireUtilisateur}</textarea>
      </div>
      <button type="submit" class="btn btn-primary">${dejaNote ? "Modifier mon avis" : "Envoyer mon avis"}</button>
      <div id="avis-feedback" class="mt-2"></div>
    `;

    formulaireAvisContainer.appendChild(form);

    // Gestion de la soumission du formulaire avis
    form.addEventListener('submit', e => {
      e.preventDefault();
      const note = form.querySelector('#note').value;
      const commentaire = form.querySelector('#commentaire').value.trim();
      const feedback = form.querySelector('#avis-feedback');
      feedback.textContent = '';
      feedback.className = '';

      if (!note || note < 1 || note > 5) {
        feedback.textContent = 'Veuillez choisir une note valide.';
        feedback.className = 'text-danger';
        return;
      }

      fetch('asset/PHP/ajouter_avis.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ utilisateur_id: utilisateurId, note: parseInt(note), commentaire })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          feedback.textContent = 'Avis enregistré avec succès.';
          feedback.className = 'text-success';
          setTimeout(() => window.location.reload(), 1200);
        } else {
          feedback.textContent = data.error || 'Erreur lors de l\'enregistrement.';
          feedback.className = 'text-danger';
        }
      })
      .catch(() => {
        feedback.textContent = 'Erreur réseau.';
        feedback.className = 'text-danger';
      });
    });
  }

  // Chargement des données utilisateur via AJAX
  fetch(`asset/PHP/get_public_profile.php?id=${encodeURIComponent(userId)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      // Mise à jour des éléments du profil
      setAvatar(avatarEl, data.avatar, `Avatar de ${data.prenom || ''} ${data.nom || ''}`);
      pseudoEl.textContent = data.prenom || 'Utilisateur';
      prenomEl.textContent = data.prenom || '';
      bioEl.textContent = data.bio || "Cet utilisateur n'a pas encore ajouté de présentation.";

      // Affichage note moyenne avec étoiles
      if (data.moyenne_note && data.nb_avis > 0) {
        const stars = renderStars(data.moyenne_note, data.nb_avis);
        roleEl.parentNode.insertBefore(stars, roleEl);
      }

      // Affichage du rôle (conducteur/passager)
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

      // Affichage du nombre de trajets terminés et total
      if (data.nbTrajetsTermines !== undefined) {
        const liTermines = document.createElement('li');
        liTermines.textContent = `Trajets terminés : ${data.nbTrajetsTermines}`;
        infosPlusEl.appendChild(liTermines);
      }
      if (data.nbTrajetsTotal !== undefined) {
        const liTotal = document.createElement('li');
        liTotal.textContent = `Total trajets proposés : ${data.nbTrajetsTotal}`;
        infosPlusEl.appendChild(liTotal);
      }

      // Affichage des infos véhicule si conducteur
      if (data.roleConducteur) {
        if (data.marque_vehicule || data.modele_vehicule) {
          const li = document.createElement('li');
          let ligne = "";
          if (data.marque_vehicule) ligne += "Marque : " + data.marque_vehicule;
          if (data.modele_vehicule) ligne += (ligne ? ", " : "") + "Modèle : " + data.modele_vehicule;
          li.textContent = ligne;
          infosPlusEl.appendChild(li);
        }
        if (data.carburant) {
          const li = document.createElement('li');
          li.textContent = "Carburant : " + (data.carburant.charAt(0).toUpperCase() + data.carburant.slice(1));
          infosPlusEl.appendChild(li);
        }
        if (data.couleur) {
          const li = document.createElement('li');
          li.textContent = "Couleur : " + data.couleur;
          infosPlusEl.appendChild(li);
        }
        if (data.plaque) {
          const li = document.createElement('li');
          li.textContent = "Plaque d’immatriculation : " + data.plaque;
          infosPlusEl.appendChild(li);
        }
        if (data.date_premiere_immatriculation) {
          const li = document.createElement('li');
          const d = new Date(data.date_premiere_immatriculation);
          li.textContent = "Date 1re immatriculation : " +
            (!isNaN(d) ? d.toLocaleDateString('fr-FR') : data.date_premiere_immatriculation);
          infosPlusEl.appendChild(li);
        }
      }

      // Autres préférences
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

      // Réinitialisation avis section + ajout bouton + formulaire
      avisSection.innerHTML = '';
      avisSection.appendChild(btnDonnerAvis);
      avisSection.appendChild(formulaireAvisContainer);

      // Affichage des derniers avis reçus
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

      // Afficher bouton "Donner un avis" si connecté et profil différent
      if (data.isLoggedIn && String(data.currentUserId) !== String(userId)) {
        btnDonnerAvis.style.display = 'inline-block';
        btnDonnerAvis.onclick = () => {
          btnDonnerAvis.style.display = 'none';
          creerFormulaireAvis(userId, data.deja_note, data.note_utilisateur, data.commentaire_utilisateur);
        };
      }

      // Gestion modal "Envoyer un message" (si existants)
      if (btnEnvoyerMessage && sendMessageModal) {
        btnEnvoyerMessage.onclick = () => {
          modalMessageText.value = '';
          modalMessageFeedback.textContent = '';
          modalMessageFeedback.className = '';
          sendMessageModal.show();
        };
      }

      // Envoi du message via formulaire modal
      if (sendMessageForm) {
        sendMessageForm.addEventListener('submit', e => {
          e.preventDefault();
          const message = modalMessageText.value.trim();
          modalMessageFeedback.textContent = '';
          modalMessageFeedback.className = '';

          if (!message) {
            modalMessageFeedback.textContent = "Veuillez écrire un message.";
            modalMessageFeedback.className = "text-danger";
            return;
          }

          fetch('asset/PHP/envoyer_message.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ destinataire_id: userId, message })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              modalMessageFeedback.textContent = "Message envoyé !";
              modalMessageFeedback.className = "text-success";
              modalMessageText.value = '';
              setTimeout(() => sendMessageModal.hide(), 1500);
            } else {
              modalMessageFeedback.textContent = data.error || "Erreur lors de l'envoi.";
              modalMessageFeedback.className = "text-danger";
            }
          })
          .catch(() => {
            modalMessageFeedback.textContent = "Erreur réseau.";
            modalMessageFeedback.className = "text-danger";
          });
        });
      }

    })
    .catch(err => {
      console.error(err);
      alert("Erreur lors du chargement du profil.");
    });
});
