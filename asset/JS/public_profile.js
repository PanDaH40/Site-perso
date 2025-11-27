class PublicProfileManager {
  constructor() {
    this.defaultAvatar = 'asset/Images/default_03.png';

    // Récupérer l'id utilisateur depuis l'URL
    const params = new URLSearchParams(window.location.search);
    this.userId = params.get('id');

    if (!this.userId) {
      alert("Profil introuvable : identifiant manquant.");
      return;
    }

    // Sélecteurs DOM
    this.btnEnvoyerMessage = document.getElementById('openSendMessageModalBtn');
    const modalEl = document.getElementById('sendMessageModal');
    this.sendMessageModal = modalEl ? new bootstrap.Modal(modalEl) : null;
    this.sendMessageForm = document.getElementById('sendMessageForm');
    this.modalMessageText = document.getElementById('modalMessageText');
    this.modalMessageFeedback = document.getElementById('modalMessageFeedback');
    this.avatarEl = document.getElementById('avatar');
    this.pseudoEl = document.getElementById('pseudo');
    this.prenomEl = document.getElementById('prenom');
    this.bioEl = document.getElementById('bio');
    this.roleEl = document.getElementById('role');
    this.ancienneteEl = document.getElementById('anciennete');
    this.nbTrajetsEl = document.getElementById('nbTrajets');
    this.infosPlusEl = document.getElementById('infos-plus');
    this.avisSection = document.getElementById('avis-section');
    this.btnHistorique = document.getElementById('btn-historique-trajets');

    // Création dynamique des éléments pour avis
    this.btnDonnerAvis = document.createElement('button');
    this.btnDonnerAvis.id = 'btnDonnerAvis';
    this.btnDonnerAvis.className = 'btn btn-outline-primary mb-3';
    this.btnDonnerAvis.textContent = 'Donner un avis';
    this.btnDonnerAvis.style.display = 'none';

    this.formulaireAvisContainer = document.createElement('div');
    this.formulaireAvisContainer.id = 'formulaire-avis-container';

    if (this.avisSection) {
      this.avisSection.appendChild(this.btnDonnerAvis);
      this.avisSection.appendChild(this.formulaireAvisContainer);
    }

    // Initialisation au chargement DOM
    document.addEventListener('DOMContentLoaded', () => {
      this.init();
    });
  }

  init() {
    this.setupHistoriqueLien();
    this.loadProfileData();
    this.setupSendMessageModal();
  }

  // Met à jour le lien du bouton historique
  setupHistoriqueLien() {
    if (this.btnHistorique && this.userId) {
      this.btnHistorique.href = `HistoriqueConducteur.html?id=${this.userId}`;
    }
  }

  // Définit l'avatar avec fallback
  setAvatar(imgEl, avatarPath, altTxt) {
    if (!imgEl) return;
    imgEl.src = avatarPath && avatarPath !== 'null' ? avatarPath : this.defaultAvatar;
    imgEl.alt = altTxt || "Avatar utilisateur";
    imgEl.onerror = () => {
      imgEl.src = this.defaultAvatar;
      imgEl.onerror = null;
    };
  }

  // Génère un conteneur d'étoiles pour la note moyenne
  renderStars(moyenne, nbAvis = 0) {
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

  // Crée et affiche le formulaire d'avis
  creerFormulaireAvis(utilisateurId, dejaNote = false, noteUtilisateur = '', commentaireUtilisateur = '') {
    this.formulaireAvisContainer.innerHTML = '';

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

    this.formulaireAvisContainer.appendChild(form);

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

      fetch('/PHP/ajouter_avis.php', {
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

  // Charge les données du profil utilisateur et met à jour l'interface
  loadProfileData() {
    fetch(`/PHP/get_public_profile.php?id=${encodeURIComponent(this.userId)}`, {
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      // Mise à jour des éléments du profil
      this.setAvatar(this.avatarEl, data.avatar, `Avatar de ${data.prenom || ''} ${data.nom || ''}`);
      if (this.pseudoEl) this.pseudoEl.textContent = data.prenom || 'Utilisateur';
      if (this.prenomEl) this.prenomEl.textContent = data.prenom || '';
      if (this.bioEl) this.bioEl.textContent = data.bio || "Cet utilisateur n'a pas encore ajouté de présentation.";

      // Affichage note moyenne avec étoiles
      if (data.moyenne_note && data.nb_avis > 0 && this.roleEl && this.roleEl.parentNode) {
        const stars = this.renderStars(data.moyenne_note, data.nb_avis);
        this.roleEl.parentNode.insertBefore(stars, this.roleEl);
      }

      // Affichage du rôle
      if (this.roleEl) {
        if (data.roleConducteur && data.rolePassager) {
          this.roleEl.textContent = 'Conducteur & Passager';
        } else if (data.roleConducteur) {
          this.roleEl.textContent = 'Conducteur';
        } else if (data.rolePassager) {
          this.roleEl.textContent = 'Passager';
        } else {
          this.roleEl.textContent = 'Membre';
        }
      }

      if (this.ancienneteEl) this.ancienneteEl.textContent = data.anciennete || 'Membre depuis une date inconnue';

      // Infos supplémentaires
      if (this.infosPlusEl) {
        this.infosPlusEl.innerHTML = ''; // reset

        if (data.nbTrajetsTermines !== undefined) {
          const liTermines = document.createElement('li');
          liTermines.textContent = `Trajets terminés : ${data.nbTrajetsTermines}`;
          this.infosPlusEl.appendChild(liTermines);
        }
        if (data.nbTrajetsTotal !== undefined) {
          const liTotal = document.createElement('li');
          liTotal.textContent = `Total trajets proposés : ${data.nbTrajetsTotal}`;
          this.infosPlusEl.appendChild(liTotal);
        }

        if (data.roleConducteur) {
          if (data.marque_vehicule || data.modele_vehicule) {
            const li = document.createElement('li');
            let ligne = "";
            if (data.marque_vehicule) ligne += "Marque : " + data.marque_vehicule;
            if (data.modele_vehicule) ligne += (ligne ? ", " : "") + "Modèle : " + data.modele_vehicule;
            li.textContent = ligne;
            this.infosPlusEl.appendChild(li);
          }
          if (data.carburant) {
            const li = document.createElement('li');
            li.textContent = "Carburant : " + (data.carburant.charAt(0).toUpperCase() + data.carburant.slice(1));
            this.infosPlusEl.appendChild(li);
          }
          if (data.couleur) {
            const li = document.createElement('li');
            li.textContent = "Couleur : " + data.couleur;
            this.infosPlusEl.appendChild(li);
          }
          if (data.plaque) {
            const li = document.createElement('li');
            li.textContent = "Plaque d’immatriculation : " + data.plaque;
            this.infosPlusEl.appendChild(li);
          }
          if (data.date_premiere_immatriculation) {
            const li = document.createElement('li');
            const d = new Date(data.date_premiere_immatriculation);
            li.textContent = "Date 1re immatriculation : " +
              (!isNaN(d) ? d.toLocaleDateString('fr-FR') : data.date_premiere_immatriculation);
            this.infosPlusEl.appendChild(li);
          }
        }

        if (data.preferences) {
          const li = document.createElement('li');
          li.textContent = `Préférences : ${data.preferences}`;
          this.infosPlusEl.appendChild(li);
        }
        if ('animaux' in data) {
          const li = document.createElement('li');
          li.textContent = (data.animaux === 1) ? "Animaux acceptés 🐾" : "Animaux refusés 🐾";
          this.infosPlusEl.appendChild(li);
        }
        if ('fumeurs' in data) {
          const li = document.createElement('li');
          li.textContent = (data.fumeurs === 1) ? "Fumeurs acceptés 🚬" : "Pas de cigarette, svp 🚭";
          this.infosPlusEl.appendChild(li);
        }
      }

      // Réinitialisation avis section + ajout bouton + formulaire
      if (this.avisSection) {
        this.avisSection.innerHTML = '';
        this.avisSection.appendChild(this.btnDonnerAvis);
        this.avisSection.appendChild(this.formulaireAvisContainer);
      }

      // Affichage des derniers avis reçus
      if (data.avis && Array.isArray(data.avis) && data.avis.length > 0 && this.avisSection) {
        const titre = document.createElement('h6');
        titre.textContent = "Derniers avis reçus:";
        titre.className = "mt-4 mb-2";
        this.avisSection.appendChild(titre);

        data.avis.forEach(av => {
          const div = document.createElement('div');
          div.className = "mb-3 p-2 border rounded";
          div.appendChild(this.renderStars(av.note));
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

          this.avisSection.appendChild(div);
        });
      }

      // Afficher bouton "Donner un avis" si connecté et profil différent
      if (data.isLoggedIn && String(data.currentUserId) !== String(this.userId)) {
        this.btnDonnerAvis.style.display = 'inline-block';
        this.btnDonnerAvis.onclick = () => {
          this.btnDonnerAvis.style.display = 'none';
          this.creerFormulaireAvis(this.userId, data.deja_note, data.note_utilisateur, data.commentaire_utilisateur);
        };
      }
    })
    .catch(err => {
      console.error(err);
      alert("Erreur lors du chargement du profil.");
    });
  }

  // Configure la modal d'envoi de message
  setupSendMessageModal() {
    if (this.btnEnvoyerMessage && this.sendMessageModal) {
      this.btnEnvoyerMessage.onclick = () => {
        if (this.modalMessageText) this.modalMessageText.value = '';
        if (this.modalMessageFeedback) {
          this.modalMessageFeedback.textContent = '';
          this.modalMessageFeedback.className = '';
        }
        this.sendMessageModal.show();
      };
    }

    if (this.sendMessageForm) {
      this.sendMessageForm.addEventListener('submit', e => {
        e.preventDefault();
        this.handleSendMessageSubmit();
      });
    }
  }

  // Gestion de l'envoi du message via modal
  handleSendMessageSubmit() {
    if (!this.modalMessageText || !this.modalMessageFeedback) return;

    const message = this.modalMessageText.value.trim();
    this.modalMessageFeedback.textContent = '';
    this.modalMessageFeedback.className = '';

    if (!message) {
      this.modalMessageFeedback.textContent = "Veuillez écrire un message.";
      this.modalMessageFeedback.className = "text-danger";
      return;
    }

    fetch('/PHP/envoyer_message.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ destinataire_id: this.userId, message })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        this.modalMessageFeedback.textContent = "Message envoyé !";
        this.modalMessageFeedback.className = "text-success";
        if (this.modalMessageText) this.modalMessageText.value = '';
        setTimeout(() => this.sendMessageModal.hide(), 1500);
      } else {
        this.modalMessageFeedback.textContent = data.error || "Erreur lors de l'envoi.";
        this.modalMessageFeedback.className = "text-danger";
      }
    })
    .catch(() => {
      this.modalMessageFeedback.textContent = "Erreur réseau.";
      this.modalMessageFeedback.className = "text-danger";
    });
  }
}

// Instanciation et lancement
const publicProfileManager = new PublicProfileManager();
