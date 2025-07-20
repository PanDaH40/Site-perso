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
  const carburantSelect  = $('profileCarburant');
  const animauxCheckbox  = $('acceptAnimaux');
  const fumeurCheckbox   = $('acceptFumeur');
  const preferencesInput = $('profilePreferences');
  const avatarInput      = $('profileAvatar');
  const avatarPreview    = $('avatarPreview');
  const defaultAvatar    = 'asset/Images/default_03.png';
  const notifBadge       = $('badge-msg') || $('notif-badge');

  // Véhicule fields
  const marqueVehiculeInput = $('profileMarqueVehicule');
  const modeleVehiculeInput = $('profileModeleVehicule');
  const plaqueInput         = $('profilePlaque');
  const couleurInput        = $('profileCouleur');
  const dateImmatInput      = $('profileDateImmat');

  // Modal changement mot de passe
  const btnOpenChangePwdModal = $('btnOpenChangePwdModal');
  const changePasswordModalEl = $('changePasswordModal');
  const changePasswordModal = changePasswordModalEl ? new bootstrap.Modal(changePasswordModalEl) : null;
  const changePasswordForm = $('changePasswordForm');
  const currentPasswordInput = $('currentPassword');
  const newPasswordModalInput = $('newPasswordModal');
  const confirmNewPasswordModalInput = $('confirmNewPasswordModal');
  const modalErrorMsg = $('modalErrorMsg');

  // Affiche ou cache sections conducteur/passager
  function toggleRoleSections() {
    if (roleCondCheckbox && conducteurFields) {
      conducteurFields.style.display = roleCondCheckbox.checked ? '' : 'none';
      if (marqueVehiculeInput) {
        marqueVehiculeInput.required = !!roleCondCheckbox.checked;
        marqueVehiculeInput.closest('.mb-3').style.display = roleCondCheckbox.checked ? '' : 'none';
      }
      if (modeleVehiculeInput) {
        modeleVehiculeInput.required = !!roleCondCheckbox.checked;
        modeleVehiculeInput.closest('.mb-3').style.display = roleCondCheckbox.checked ? '' : 'none';
      }
      if (carburantSelect) carburantSelect.required = !!roleCondCheckbox.checked;
      if (plaqueInput) plaqueInput.required = !!roleCondCheckbox.checked;
      if (couleurInput) couleurInput.required = !!roleCondCheckbox.checked;
      if (dateImmatInput) dateImmatInput.required = !!roleCondCheckbox.checked;
    }
    if (rolePassCheckbox && passagerFields) {
      passagerFields.style.display = rolePassCheckbox.checked ? '' : 'none';
    }
    if (preferencesInput) preferencesInput.required = false;
  }
  if (roleCondCheckbox) roleCondCheckbox.addEventListener('change', toggleRoleSections);
  if (rolePassCheckbox) rolePassCheckbox.addEventListener('change', toggleRoleSections);

  // Preview avatar
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

  function majCreditsUI(nouveauxCredits) {
    const creditsSpan = $('profileCredits');
    if (!creditsSpan) return;
    creditsSpan.textContent = nouveauxCredits;

    const notif = document.createElement('div');
    notif.className = 'alert alert-success position-fixed top-0 end-0 m-3 shadow-sm';
    notif.style.zIndex = 1050;
    notif.textContent = `Vos crédits ont été mis à jour : ${nouveauxCredits} jetons disponibles.`;
    document.body.appendChild(notif);

    setTimeout(() => notif.remove(), 4000);
  }

  // Charge le profil utilisateur depuis serveur
  async function loadProfile() {
    try {
      const res = await fetch('asset/PHP/get_profile.php', { credentials: 'include' });
      if (!res.ok) throw new Error('Erreur réseau');
      const data = await res.json();
      if (data.error) return alert('Erreur chargement profil : ' + data.error);

      if (roleCondCheckbox)   roleCondCheckbox.checked   = !!data.roleConducteur;
      if (rolePassCheckbox)   rolePassCheckbox.checked   = !!data.rolePassager;

      toggleRoleSections();

      if (prenomInput)        prenomInput.value          = data.prenom || data.user_prenom || '';
      if (nomInput)           nomInput.value             = data.nom    || data.user_nom    || '';
      if (emailInput)         emailInput.value           = data.email       || '';
      if (bioInput)           bioInput.value             = data.bio         || '';

      if (carburantSelect)    carburantSelect.value      = data.carburant   || 'essence';
      if (animauxCheckbox)    animauxCheckbox.checked    = !!data.animaux;
      if (fumeurCheckbox)     fumeurCheckbox.checked     = !!data.fumeurs;
      if (preferencesInput)   preferencesInput.value     = data.preferences || '';

      if (marqueVehiculeInput) marqueVehiculeInput.value = data.marque_vehicule || '';
      if (modeleVehiculeInput) modeleVehiculeInput.value = data.modele_vehicule || '';
      if (plaqueInput)      plaqueInput.value      = data.plaque || '';
      if (couleurInput)     couleurInput.value     = data.couleur || '';
      if (dateImmatInput)   dateImmatInput.value  = data.date_premiere_immatriculation || '';

      if (avatarPreview) {
  const urlAvecCacheBuster = data.avatar + '?t=' + new Date().getTime();
  setAvatar(avatarPreview, urlAvecCacheBuster);
  avatarPreview.style.display = '';
}
      if (data.credits !== undefined) {
        majCreditsUI(data.credits);
      }

      mettreAJourNotificationMessages();
    } catch (err) {
      alert('Impossible de charger le profil.');
      console.error('Erreur fetch profil:', err);
      if (notifBadge) notifBadge.style.display = 'none';
    }
  }

  // Rafraîchir crédits (externe)
  async function actualiserCredits() {
    try {
      const res = await fetch('asset/PHP/get_profile.php', { credentials: 'include' });
      if (!res.ok) throw new Error('Erreur réseau');
      const data = await res.json();
      if (data.credits !== undefined) {
        majCreditsUI(data.credits);
      }
    } catch (e) {
      console.error('Erreur lors de l’actualisation des crédits', e);
    }
  }

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
        fd.append('profileMarqueVehicule', marqueVehiculeInput ? marqueVehiculeInput.value.trim() : '');
        fd.append('profileModeleVehicule', modeleVehiculeInput ? modeleVehiculeInput.value.trim() : '');
        fd.append('carburant', carburantSelect ? carburantSelect.value : 'essence');
        fd.append('animaux', animauxCheckbox && animauxCheckbox.checked ? 1 : 0);
        fd.append('fumeurs', fumeurCheckbox && fumeurCheckbox.checked ? 1 : 0);
        fd.append('plaque', plaqueInput ? plaqueInput.value.trim() : '');
        fd.append('couleur', couleurInput ? couleurInput.value.trim() : '');
        fd.append('date_premiere_immatriculation', dateImmatInput ? dateImmatInput.value : '');
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
          if (result.credits !== undefined) {
            majCreditsUI(result.credits);
          }
        }
      } catch (err) {
        alert('Erreur réseau, impossible de mettre à jour.');
        console.error('Erreur update profil:', err);
      }
    });
  }

  if (btnOpenChangePwdModal && changePasswordModal) {
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

  // Notification messages toutes les 30 secondes
  setInterval(mettreAJourNotificationMessages, 30000);

  // Badge notification messages
  function mettreAJourNotificationMessages() {
    if (!notifBadge) return;
    fetch('asset/PHP/get_messages_recus.php', { credentials: 'include' })
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

  window.actualiserCredits = actualiserCredits;
});

// Suppression de compte RGPD
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
