document.addEventListener('DOMContentLoaded', () => {
  // Récupérer l'id utilisateur depuis l'URL (ex: ?id=123)
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');

  // Si pas d'id, on arrête
  if (!userId) {
    alert("Profil introuvable : identifiant manquant.");
    return;
  }

  // Sélecteurs des éléments DOM pour affichage profil
  const avatarEl      = document.getElementById('avatar');
  const pseudoEl      = document.getElementById('pseudo');
  const prenomEl      = document.getElementById('prenom');
  const bioEl         = document.getElementById('bio');
  const roleEl        = document.getElementById('role');
  const ancienneteEl  = document.getElementById('anciennete');
  const nbTrajetsEl   = document.getElementById('nbTrajets');
  const infosPlusEl   = document.getElementById('infos-plus');
  const avisSection   = document.getElementById('avis-section');

  // Créer bouton "Donner un avis" et conteneur formulaire avis, puis les ajouter au DOM
  const btnDonnerAvis = document.createElement('button');
  btnDonnerAvis.id = 'btnDonnerAvis';
  btnDonnerAvis.className = 'btn btn-outline-primary mb-3';
  btnDonnerAvis.textContent = 'Donner un avis';
  btnDonnerAvis.style.display = 'none';  // caché au départ

  const formulaireAvisContainer = document.createElement('div');
  formulaireAvisContainer.id = 'formulaire-avis-container';

  avisSection.appendChild(btnDonnerAvis);
  avisSection.appendChild(formulaireAvisContainer);

  // Image avatar par défaut
  const defaultAvatar = 'asset/Images/default_03.png';

  // Fonction pour afficher avatar avec fallback sur défaut si erreur chargement
  function setAvatar(imgEl, avatarPath, altTxt) {
    imgEl.src = avatarPath && avatarPath !== 'null' ? avatarPath : defaultAvatar;
    imgEl.alt = altTxt || "Avatar utilisateur";
    imgEl.onerror = () => {
      imgEl.src = defaultAvatar;
      imgEl.onerror = null;
    };
  }

  // Fonction pour afficher étoiles moyenne note
  function renderStars(moyenne, nbAvis = 0) {
    const container = document.createElement('div');
    container.className = 'mb-2 d-flex align-items-center';
    const note = Math.round(Number(moyenne) * 2) / 2;  // arrondi au 0.5 proche
    for (let i = 1; i <= 5; i++) {
      if (note >= i) {
        container.innerHTML += '<span style="color:#ffc107;font-size:1.3rem;">★</span>';  // étoile pleine
      } else if (note >= i - 0.5) {
        container.innerHTML += '<span style="color:#ffc107;font-size:1.3rem;">☆</span>';  // étoile demi
      } else {
        container.innerHTML += '<span style="color:#bbb;font-size:1.3rem;">☆</span>';  // étoile vide
      }
    }
    if (nbAvis > 0) {
      container.innerHTML += `<small class="ms-2 text-muted">(${nbAvis} avis)</small>`;  // nb avis
    }
    return container;
  }

  // Fonction qui crée et affiche le formulaire d'avis, avec gestion du submit ajax
  function creerFormulaireAvis(utilisateurId, dejaNote = false, noteUtilisateur = '', commentaireUtilisateur = '') {
    formulaireAvisContainer.innerHTML = ''; // reset formulaire

    const form = document.createElement('form');
    form.id = 'formulaire-avis';
    form.className = 'mb-4 p-3 border rounded';

    // HTML du formulaire avec pré-remplissage si déjà noté
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

    // Gestion de la soumission du formulaire (ajax POST)
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
        credentials: 'include',  // envoie cookie session
        body: JSON.stringify({
          utilisateur_id: utilisateurId,
          note: parseInt(note),
          commentaire
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          feedback.textContent = 'Avis enregistré avec succès.';
          feedback.className = 'text-success';
          // Recharge la page après 1.2s pour afficher le nouvel avis
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

  // Chargement des données du profil utilisateur public via fetch
  fetch(`asset/PHP/get_public_profile.php?id=${encodeURIComponent(userId)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      // Mise à jour des champs du profil dans le DOM
      setAvatar(avatarEl, data.avatar, `Avatar de ${data.prenom || ''} ${data.nom || ''}`);
      pseudoEl.textContent = data.prenom || 'Utilisateur';
      prenomEl.textContent = data.prenom || '';
      bioEl.textContent = data.bio || "Cet utilisateur n'a pas encore ajouté de présentation.";

      // Affiche la moyenne des notes sous forme d'étoiles, avant le badge rôle
      if (data.moyenne_note && data.nb_avis > 0) {
        const stars = renderStars(data.moyenne_note, data.nb_avis);
        roleEl.parentNode.insertBefore(stars, roleEl);
      }

      // Affichage rôle(s) utilisateur
      if (data.roleConducteur && data.rolePassager) {
        roleEl.textContent = 'Conducteur & Passager';
      } else if (data.roleConducteur) {
        roleEl.textContent = 'Conducteur';
      } else if (data.rolePassager) {
        roleEl.textContent = 'Passager';
      } else {
        roleEl.textContent = 'Membre';
      }

      // Ancienneté et nombre de trajets
      ancienneteEl.textContent = data.anciennete || 'Membre depuis une date inconnue';
      nbTrajetsEl.textContent = `${data.nbTrajets || 0} trajets publiés et complétés`;

      // Préférences & autres infos
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

      // Nettoyer la section avis et y remettre bouton + formulaire (initialement caché)
      avisSection.innerHTML = '';
      avisSection.appendChild(btnDonnerAvis);
      avisSection.appendChild(formulaireAvisContainer);

      // Affiche les derniers avis reçus, s'il y en a
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

      // Affiche bouton "Donner un avis" uniquement si utilisateur connecté et profil différent
      if (data.isLoggedIn && String(data.currentUserId) !== String(userId)) {
        btnDonnerAvis.style.display = 'inline-block';
        btnDonnerAvis.onclick = () => {
          btnDonnerAvis.style.display = 'none'; // cacher bouton une fois cliqué
          creerFormulaireAvis(userId, data.deja_note, data.note_utilisateur, data.commentaire_utilisateur);
        };
      }
    })
    .catch(err => {
      console.error(err);
      alert("Erreur lors du chargement du profil.");
    });
});
