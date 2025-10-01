class ProfileManager {
  constructor() {
    // Sélecteurs raccourcis
    this.$ = id => document.getElementById(id);

    // Elements du DOM
    this.form = this.$('profileForm');
    this.prenomInput = this.$('profilePrenom');
    this.nomInput = this.$('profileNom');
    this.emailInput = this.$('profileEmail');
    this.bioInput = this.$('profileBio');
    this.roleCondCheckbox = this.$('roleConducteur');
    this.rolePassCheckbox = this.$('rolePassager');
    this.conducteurFields = this.$('conducteurFields');
    this.passagerFields = this.$('passagerFields');
    this.carburantSelect = this.$('profileCarburant');
    this.animauxCheckbox = this.$('acceptAnimaux');
    this.fumeurCheckbox = this.$('acceptFumeur');
    this.preferencesInput = this.$('profilePreferences');
    this.avatarInput = this.$('profileAvatar');
    this.avatarPreview = this.$('avatarPreview');
    this.defaultAvatar = 'asset/Images/default_03.png';
    this.notifBadge = this.$('badge-msg') || this.$('notif-badge');

    // Véhicule fields
    this.marqueVehiculeInput = this.$('profileMarqueVehicule');
    this.modeleVehiculeInput = this.$('profileModeleVehicule');
    this.plaqueInput = this.$('profilePlaque');
    this.couleurInput = this.$('profileCouleur');
    this.dateImmatInput = this.$('profileDateImmat');

    // Modal changement mot de passe
    this.btnOpenChangePwdModal = this.$('btnOpenChangePwdModal');
    this.changePasswordModalEl = this.$('changePasswordModal');
    this.changePasswordModal = this.changePasswordModalEl ? new bootstrap.Modal(this.changePasswordModalEl) : null;
    this.changePasswordForm = this.$('changePasswordForm');
    this.currentPasswordInput = this.$('currentPassword');
    this.newPasswordModalInput = this.$('newPasswordModal');
    this.confirmNewPasswordModalInput = this.$('confirmNewPasswordModal');
    this.modalErrorMsg = this.$('modalErrorMsg');

    // Initialisation
    document.addEventListener('DOMContentLoaded', () => {
      this.init();
    });
  }

  init() {
    this.toggleRoleSections();
    this.attachEventListeners();
    this.loadProfile();
    this.startNotificationInterval();
  }

  // Affiche ou cache les sections conducteur/passager selon les rôles cochés
  toggleRoleSections() {
    if (this.roleCondCheckbox && this.conducteurFields) {
      const showCond = this.roleCondCheckbox.checked;
      this.conducteurFields.style.display = showCond ? '' : 'none';

      if (this.marqueVehiculeInput) {
        this.marqueVehiculeInput.required = showCond;
        this.marqueVehiculeInput.closest('.mb-3').style.display = showCond ? '' : 'none';
      }
      if (this.modeleVehiculeInput) {
        this.modeleVehiculeInput.required = showCond;
        this.modeleVehiculeInput.closest('.mb-3').style.display = showCond ? '' : 'none';
      }
      if (this.carburantSelect) this.carburantSelect.required = showCond;
      if (this.plaqueInput) this.plaqueInput.required = showCond;
      if (this.couleurInput) this.couleurInput.required = showCond;
      if (this.dateImmatInput) this.dateImmatInput.required = showCond;
    }
    if (this.rolePassCheckbox && this.passagerFields) {
      this.passagerFields.style.display = this.rolePassCheckbox.checked ? '' : 'none';
    }
    if (this.preferencesInput) this.preferencesInput.required = false;
  }

  // Attache tous les écouteurs d'événements
  attachEventListeners() {
    if (this.roleCondCheckbox) {
      this.roleCondCheckbox.addEventListener('change', () => this.toggleRoleSections());
    }
    if (this.rolePassCheckbox) {
      this.rolePassCheckbox.addEventListener('change', () => this.toggleRoleSections());
    }

    if (this.avatarPreview && this.avatarInput) {
      this.avatarPreview.style.cursor = 'pointer';
      this.avatarPreview.addEventListener('click', () => this.avatarInput.click());
      this.avatarInput.addEventListener('change', () => this.handleAvatarChange());
    }

    if (this.form) {
      this.form.addEventListener('submit', e => this.handleProfileSubmit(e));
    }

    if (this.btnOpenChangePwdModal && this.changePasswordModal) {
      this.btnOpenChangePwdModal.addEventListener('click', () => this.openChangePasswordModal());
    }

    if (this.changePasswordForm) {
      this.changePasswordForm.addEventListener('submit', e => this.handleChangePasswordSubmit(e));
    }
  }

  // Gestion du changement d'avatar avec preview
  handleAvatarChange() {
    const file = this.avatarInput.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Format d'image non valide");
      this.avatarInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      if (this.avatarPreview) this.avatarPreview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Définit l'avatar avec gestion du fallback
  setAvatar(imgEl, avatarPath) {
    if (!imgEl) return;
    imgEl.src = avatarPath && avatarPath !== 'null' ? avatarPath : this.defaultAvatar;
    imgEl.onerror = function() {
      this.src = this.defaultAvatar;
      this.onerror = null;
    }.bind(this);
  }

  // Met à jour l'affichage des crédits et affiche une notification temporaire
  majCreditsUI(nouveauxCredits) {
    const creditsSpan = this.$('profileCredits');
    if (!creditsSpan) return;
    creditsSpan.textContent = nouveauxCredits;

    const notif = document.createElement('div');
    notif.className = 'alert alert-success position-fixed top-0 end-0 m-3 shadow-sm';
    notif.style.zIndex = 1050;
    notif.textContent = `Vos crédits ont été mis à jour : ${nouveauxCredits} jetons disponibles.`;
    document.body.appendChild(notif);

    setTimeout(() => notif.remove(), 4000);
  }

  // Charge le profil utilisateur depuis le serveur et remplit le formulaire
  async loadProfile() {
    try {
      const res = await fetch('asset/PHP/get_profile.php', { credentials: 'include' });
      if (!res.ok) throw new Error('Erreur réseau');
      const data = await res.json();
      if (data.error) return alert('Erreur chargement profil : ' + data.error);

      if (this.roleCondCheckbox) this.roleCondCheckbox.checked = !!data.roleConducteur;
      if (this.rolePassCheckbox) this.rolePassCheckbox.checked = !!data.rolePassager;

      this.toggleRoleSections();

      if (this.prenomInput) this.prenomInput.value = data.prenom || data.user_prenom || '';
      if (this.nomInput) this.nomInput.value = data.nom || data.user_nom || '';
      if (this.emailInput) this.emailInput.value = data.email || '';
      if (this.bioInput) this.bioInput.value = data.bio || '';

      if (this.carburantSelect) this.carburantSelect.value = data.carburant || 'essence';
      if (this.animauxCheckbox) this.animauxCheckbox.checked = !!data.animaux;
      if (this.fumeurCheckbox) this.fumeurCheckbox.checked = !!data.fumeurs;
      if (this.preferencesInput) this.preferencesInput.value = data.preferences || '';

      if (this.marqueVehiculeInput) this.marqueVehiculeInput.value = data.marque_vehicule || '';
      if (this.modeleVehiculeInput) this.modeleVehiculeInput.value = data.modele_vehicule || '';
      if (this.plaqueInput) this.plaqueInput.value = data.plaque || '';
      if (this.couleurInput) this.couleurInput.value = data.couleur || '';
      if (this.dateImmatInput) this.dateImmatInput.value = data.date_premiere_immatriculation || '';

      if (this.avatarPreview) {
        const urlAvecCacheBuster = data.avatar + '?t=' + new Date().getTime();
        this.setAvatar(this.avatarPreview, urlAvecCacheBuster);
        this.avatarPreview.style.display = '';
      }

      if (data.credits !== undefined) {
        this.majCreditsUI(data.credits);
      }

      this.mettreAJourNotificationMessages();
    } catch (err) {
      alert('Impossible de charger le profil.');
      console.error('Erreur fetch profil:', err);
      if (this.notifBadge) this.notifBadge.style.display = 'none';
    }
  }

  // Met à jour le badge de notifications messages
  mettreAJourNotificationMessages() {
    if (!this.notifBadge) return;
    fetch('asset/PHP/get_messages_recus.php', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Erreur réseau');
        return res.json();
      })
      .then(data => {
        const totalNonLus = data.totalNonLus || 0;
        if (totalNonLus > 0) {
          this.notifBadge.textContent = totalNonLus;
          this.notifBadge.style.display = 'inline-block';
        } else {
          this.notifBadge.style.display = 'none';
        }
      })
      .catch(() => {
        this.notifBadge.style.display = 'none';
      });
  }

  // Actualise les crédits (externe)
  async actualiserCredits() {
    try {
      const res = await fetch('asset/PHP/get_profile.php', { credentials: 'include' });
      if (!res.ok) throw new Error('Erreur réseau');
      const data = await res.json();
      if (data.credits !== undefined) {
        this.majCreditsUI(data.credits);
      }
    } catch (e) {
      console.error('Erreur lors de l’actualisation des crédits', e);
    }
  }

  // Gestion de la soumission du formulaire profil
  async handleProfileSubmit(event) {
    event.preventDefault();

    if (!this.prenomInput?.value.trim() || !this.nomInput?.value.trim() || !this.emailInput?.value.trim()) {
      alert('Veuillez remplir prénom, nom et email.');
      return;
    }

    const fd = new FormData();
    fd.append('prenom', this.prenomInput.value.trim());
    fd.append('nom', this.nomInput.value.trim());
    fd.append('email', this.emailInput.value.trim());
    fd.append('bio', this.bioInput ? this.bioInput.value.trim() : '');
    fd.append('roleConducteur', this.roleCondCheckbox && this.roleCondCheckbox.checked ? 1 : 0);
    fd.append('rolePassager', this.rolePassCheckbox && this.rolePassCheckbox.checked ? 1 : 0);

    if (this.roleCondCheckbox && this.roleCondCheckbox.checked) {
      fd.append('profileMarqueVehicule', this.marqueVehiculeInput ? this.marqueVehiculeInput.value.trim() : '');
      fd.append('profileModeleVehicule', this.modeleVehiculeInput ? this.modeleVehiculeInput.value.trim() : '');
      fd.append('carburant', this.carburantSelect ? this.carburantSelect.value : 'essence');
      fd.append('animaux', this.animauxCheckbox && this.animauxCheckbox.checked ? 1 : 0);
      fd.append('fumeurs', this.fumeurCheckbox && this.fumeurCheckbox.checked ? 1 : 0);
      fd.append('plaque', this.plaqueInput ? this.plaqueInput.value.trim() : '');
      fd.append('couleur', this.couleurInput ? this.couleurInput.value.trim() : '');
      fd.append('date_premiere_immatriculation', this.dateImmatInput ? this.dateImmatInput.value : '');
    }
    if (this.rolePassCheckbox && this.rolePassCheckbox.checked && this.preferencesInput && this.preferencesInput.value.trim()) {
      fd.append('preferences', this.preferencesInput.value.trim());
    }
    if (this.avatarInput && this.avatarInput.files[0]) {
      fd.append('avatar', this.avatarInput.files[0]);
    }

    try {
      const res = await fetch('asset/PHP/update_profile.php', {
        method: 'POST',
        credentials: 'include',
        body: fd
      });
      if (!res.ok) throw new Error('Erreur réseau');
      const result = await res.json();
      if (result.error) {
        alert('Erreur enregistrement : ' + result.error);
      } else {
        alert('Profil mis à jour avec succès.');
        if (result.avatarUrl && this.avatarPreview) {
          this.setAvatar(this.avatarPreview, result.avatarUrl);
        }
        if (result.credits !== undefined) {
          this.majCreditsUI(result.credits);
        }
      }
    } catch (err) {
      alert('Erreur réseau, impossible de mettre à jour.');
      console.error('Erreur update profil:', err);
    }
  }

  // Ouvre la modal changement mot de passe et réinitialise les champs
  openChangePasswordModal() {
    if (this.currentPasswordInput) this.currentPasswordInput.value = '';
    if (this.newPasswordModalInput) this.newPasswordModalInput.value = '';
    if (this.confirmNewPasswordModalInput) this.confirmNewPasswordModalInput.value = '';
    if (this.modalErrorMsg) {
      this.modalErrorMsg.textContent = '';
      this.modalErrorMsg.style.display = 'none';
    }
    this.changePasswordModal.show();
  }

  // Gestion de la soumission du formulaire changement mot de passe
  async handleChangePasswordSubmit(event) {
    event.preventDefault();

    const currentPwd = this.currentPasswordInput?.value.trim();
    const newPwd = this.newPasswordModalInput?.value.trim();
    const confirmNewPwd = this.confirmNewPasswordModalInput?.value.trim();

    if (!currentPwd || !newPwd || !confirmNewPwd) {
      this.showModalError('Veuillez remplir tous les champs.');
      return;
    }
    if (newPwd !== confirmNewPwd) {
      this.showModalError('Le nouveau mot de passe et sa confirmation ne correspondent pas.');
      return;
    }

    const fd = new FormData();
    fd.append('passwordConfirm', currentPwd);
    fd.append('newPassword', newPwd);
    fd.append('newPasswordConfirm', confirmNewPwd);

    try {
      const res = await fetch('asset/PHP/update_profile.php', {
        method: 'POST',
        credentials: 'include',
        body: fd
      });

      if (!res.ok) throw new Error('Erreur réseau');
      const result = await res.json();

      if (result.error) {
        this.showModalError(result.error);
      } else {
        alert('Mot de passe changé avec succès.');
        this.changePasswordModal.hide();
        this.changePasswordForm.reset();
      }
    } catch (err) {
      this.showModalError('Erreur réseau, veuillez réessayer.');
      console.error('Erreur changement mot de passe:', err);
    }
  }

  // Affiche un message d'erreur dans la modal changement mot de passe
  showModalError(message) {
    if (!this.modalErrorMsg) return;
    this.modalErrorMsg.textContent = message;
    this.modalErrorMsg.style.display = 'block';
  }

  // Lance la mise à jour périodique des notifications messages
  startNotificationInterval() {
    this.mettreAJourNotificationMessages();
    setInterval(() => this.mettreAJourNotificationMessages(), 30000);
  }
}

// Instanciation et lancement
const profileManager = new ProfileManager();

// Suppression de compte RGPD (hors classe, car bouton hors scope DOMContentLoaded)
const btnDeleteAccount = document.getElementById('btnDeleteAccount');
if (btnDeleteAccount) {
  btnDeleteAccount.addEventListener('click', function () {
    if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.")) return;
    fetch('asset/PHP/delete_account.php', {
      method: 'POST',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Votre compte a bien été supprimé. Au revoir !");
          window.location.href = "PageDaccueil.html";
        } else {
          alert(data.error || "Erreur lors de la suppression du compte.");
        }
      })
      .catch(() => alert("Erreur technique lors de la suppression du compte."));
  });
}
