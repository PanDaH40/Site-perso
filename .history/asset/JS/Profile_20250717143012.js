document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  const form             = $('profileForm');
  const prenomInput      = $('profilePrenom');
  const nomInput         = $('profileNom');
  const emailInput       = $('profileEmail');
  const bioInput         = $('profileBio');
  const roleCondCheckbox = $('roleConducteur');
  const rolePassCheckbox = $('rolePassager');
  const conducteurFields = $('conducteurFields');
  const passagerFields   = $('passagerFields');
  // Ancien champ (supprimer ou commenter si obsolète)
  // const voitureInput     = $('profileVoiture');
  const marqueVehiculeInput = $('profileMarqueVehicule');
  const modeleVehiculeInput = $('profileModeleVehicule');
  const carburantSelect  = $('profileCarburant');
  const animauxCheckbox  = $('acceptAnimaux');
  const fumeurCheckbox   = $('acceptFumeur');
  const preferencesInput = $('profilePreferences');
  const avatarInput      = $('profileAvatar');
  const avatarPreview    = $('avatarPreview');
  const defaultAvatar    = 'asset/Images/default_03.png';
  const notifBadge       = $('notif-badge');

  // Modal elements for password change
  const btnOpenChangePwdModal = $('btnOpenChangePwdModal');
  const changePasswordModalEl = $('changePasswordModal');
  const changePasswordModal = new bootstrap.Modal(changePasswordModalEl);
  const changePasswordForm = $('changePasswordForm');
  const currentPasswordInput = $('currentPassword');
  const newPasswordModalInput = $('newPasswordModal');
  const confirmNewPasswordModalInput = $('confirmNewPasswordModal');
  const modalErrorMsg = $('modalErrorMsg');

  // Gestion affichage sections conducteur/passager
  function toggleRoleSections() {
    if (roleCondCheckbox && conducteurFields) {
      conducteurFields.style.display = roleCondCheckbox.checked ? '' : 'none';
      if (marqueVehiculeInput) marqueVehiculeInput.required = !!roleCondCheckbox.checked;
      if (modeleVehiculeInput) modeleVehiculeInput.required = !!roleCondCheckbox.checked;
      if (marqueVehiculeInput) marqueVehiculeInput.parentNode.style.display = roleCondCheckbox.checked ? '' : 'none';
      if (modeleVehiculeInput) modeleVehiculeInput.parentNode.style.display = roleCondCheckbox.checked ? '' : 'none';
      if (carburantSelect) carburantSelect.required = !!roleCondCheckbox.checked;
    }
    if (rolePassCheckbox && passagerFields) {
      passagerFields.style.display = rolePassCheckbox.checked ? '' : 'none';
    }
    if (preferencesInput) preferencesInput.required = false;
  }
  if (roleCondCheckbox) roleCondCheckbox.addEventListener('change', toggleRoleSections);
  if (rolePassCheckbox) rolePassCheckbox.addEventListener('change', toggleRoleSections);

  // Clic avatar ouvre sélection fichier + preview
  if (avatarPreview && avatarInput) {
    avatarPreview.style.cursor = 'pointer';
    avatarPreview.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', () => {
      const file = avatarInput.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          alert("Format d'image non valide");
          avatarInput.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = e => { avatarPreview.src = e.target.result; };
        reader.readAsDataURL(file);
      }
    });
  }

  function setAvatar(imgEl, avatarPath) {
    if (!imgEl) return;
    imgEl.src = avatarPath && avatarPath !== 'null' ? avatarPath : defaultAvatar;
    imgEl.onerror = function() {
      this.src = defaultAvatar;
      this.onerror = null;
    };
  }

  // Chargement profil utilisateur
  async function loadProfile() {
    try {
      const res = await fetch('asset/PHP/get_profile.php', { credentials: 'include' });
      if (!res.ok) throw new Error('Erreur réseau');
      const data = await res.json();
      if (data.error) return alert('Erreur chargement profil : ' + data.error);

      if (roleCondCheckbox)   roleCondCheckbox.checked   = !!data.cond_prenom;
      if (rolePassCheckbox)   rolePassCheckbox.checked   = !!data.pass_prenom;
      toggleRoleSections();

      if (prenomInput)        prenomInput.value          = data.user_prenom || data.prenom || '';
      if (nomInput)           nomInput.value             = data.user_nom    || data.nom    || '';
      if (emailInput)         emailInput.value           = data.email       || '';
      if (bioInput)           bioInput.value             = data.bio         || '';
      if (marqueVehiculeInput) marqueVehiculeInput.value = data.marque_vehicule || '';
      if (modeleVehiculeInput) modeleVehiculeInput.value = data.modele_vehicule || '';
      if (carburantSelect)    carburantSelect.value      = data.carburant   || 'essence';
      if (animauxCheckbox)    animauxCheckbox.checked    = !!data.animaux;
      if (fumeurCheckbox)     fumeurCheckbox.checked     = !!data.fumeurs;
      if (preferencesInput)   preferencesInput.value     = data.preferences || '';

      if (avatarPreview) {
        setAvatar(avatarPreview, data.avatar);
        avatarPreview.style.display = '';
        if (data.credits !== undefined && document.getElementById('profileCredits')) {
          document.getElementById('profileCredits').textContent = data.credits;
        }
      }

      mettreAJourNotificationMessages();

    } catch (err) {
      alert('Impossible de charger le profil.');
      console.error('Erreur fetch profil:', err);
      if (notifBadge) notifBadge.style.display = 'none';
    }
  }

  // Soumission formulaire profil (sans mot de passe)
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      if (!prenomInput?.value.trim() || !nomInput?.value.trim() || !emailInput?.value.trim()) {
        alert('Veuillez remplir prénom, nom et email.');
        return;
      }

      const fd = new FormData();
      fd.append('prenom', prenomInput.value.trim());
      fd.append('nom', nomInput.value.trim());
      fd.append('email', emailInput.value.trim());
      fd.append('bio', bioInput ? bioInput.value.trim() : '');
      fd.append('roleConducteur', roleCondCheckbox && roleCondCheckbox.checked ? 1 : 0);
      fd.append('rolePassager', rolePassCheckbox && rolePassCheckbox.checked ? 1 : 0);

      if (roleCondCheckbox && roleCondCheckbox.checked) {
        if (marqueVehiculeInput) fd.append('marque_vehicule', marqueVehiculeInput.value.trim());
        if (modeleVehiculeInput) fd.append('modele_vehicule', modeleVehiculeInput.value.trim());
        fd.append('carburant', carburantSelect ? carburantSelect.value : 'essence');
        fd.append('animaux', animauxCheckbox && animauxCheckbox.checked ? 1 : 0);
        fd.append('fumeurs', fumeurCheckbox && fumeurCheckbox.checked ? 1 : 0);
      }
      if (rolePassCheckbox && rolePassCheckbox.checked && preferencesInput && preferencesInput.value.trim()) {
        fd.append('preferences', preferencesInput.value.trim());
      }
      if (avatarInput && avatarInput.files[0]) {
        fd.append('avatar', avatarInput.files[0]);
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
          if (result.avatarUrl && avatarPreview) {
            setAvatar(avatarPreview, result.avatarUrl);
          }
        }
      } catch (err) {
        alert('Erreur réseau, impossible de mettre à jour.');
        console.error('Erreur update profil:', err);
      }
    });
  }

  // Ouvre modal changement mot de passe
  if (btnOpenChangePwdModal) {
    btnOpenChangePwdModal.addEventListener('click', () => {
      if (currentPasswordInput) currentPasswordInput.value = '';
      if (newPasswordModalInput) newPasswordModalInput.value = '';
      if (confirmNewPasswordModalInput) confirmNewPasswordModalInput.value = '';
      if (modalErrorMsg) {
        modalErrorMsg.textContent = '';
        modalErrorMsg.style.display = 'none';
      }
      changePasswordModal.show();
    });
  }

  // Soumission modal changement mot de passe
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async e => {
      e.preventDefault();

      const currentPwd = currentPasswordInput?.value.trim();
      const newPwd = newPasswordModalInput?.value.trim();
      const confirmNewPwd = confirmNewPasswordModalInput?.value.trim();

      if (!currentPwd || !newPwd || !confirmNewPwd) {
        modalErrorMsg.textContent = 'Veuillez remplir tous les champs.';
        modalErrorMsg.style.display = 'block';
        return;
      }

      if (newPwd !== confirmNewPwd) {
        modalErrorMsg.textContent = 'Le nouveau mot de passe et sa confirmation ne correspondent pas.';
        modalErrorMsg.style.display = 'block';
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
          modalErrorMsg.textContent = result.error;
          modalErrorMsg.style.display = 'block';
        } else {
          alert('Mot de passe changé avec succès.');
          changePasswordModal.hide();
          changePasswordForm.reset();
        }
      } catch (err) {
        modalErrorMsg.textContent = 'Erreur réseau, veuillez réessayer.';
        modalErrorMsg.style.display = 'block';
        console.error('Erreur changement mot de passe:', err);
      }
    });
  }

  // Mise à jour périodique badge notification messages toutes les 30 secondes
  setInterval(mettreAJourNotificationMessages, 30000);

  // Fonction badge notification messages
  function mettreAJourNotificationMessages() {
    if (!notifBadge) return;
    fetch('asset/PHP/get_messages_recus.php')
      .then(res => {
        if (!res.ok) throw new Error('Erreur réseau');
        return res.json();
      })
      .then(data => {
        const totalNonLus = data.totalNonLus || 0;
        if (totalNonLus > 0) {
          notifBadge.textContent = totalNonLus;
          notifBadge.style.display = 'inline-block';
        } else {
          notifBadge.style.display = 'none';
        }
      })
      .catch(() => {
        notifBadge.style.display = 'none';
      });
  }

  loadProfile();
});
