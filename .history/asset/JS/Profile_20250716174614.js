document.addEventListener('DOMContentLoaded', () => {
  // Sélecteurs DOM sécurisés
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
  const voitureInput     = $('profileVoiture');
  const carburantSelect  = $('profileCarburant');
  const animauxCheckbox  = $('acceptAnimaux');
  const fumeurCheckbox   = $('acceptFumeur');
  const preferencesInput = $('profilePreferences');
  const avatarInput      = $('profileAvatar');
  const avatarPreview    = $('avatarPreview');
  const defaultAvatar    = 'asset/Images/default_03.png';
  const notifBadge       = $('notif-badge');  // badge notification

  // Nouveau : création du champ mot de passe confirmation (caché au départ)
  let passwordContainer = document.createElement('div');
  passwordContainer.className = 'mb-3';
  passwordContainer.style.display = 'none';
  passwordContainer.innerHTML = `
    <label for="passwordConfirm" class="form-label">Confirmez avec votre mot de passe</label>
    <input type="password" id="passwordConfirm" name="passwordConfirm" class="form-control" autocomplete="current-password" />
  `;
  form.insertBefore(passwordContainer, form.querySelector('button[type="submit"]'));

  const passwordInput = $('passwordConfirm');

  // Gestion des sections conducteur/passager
  function toggleRoleSections() {
    if (roleCondCheckbox && conducteurFields) {
      conducteurFields.style.display = roleCondCheckbox.checked ? '' : 'none';
      voitureInput.required = carburantSelect.required = !!roleCondCheckbox.checked;
    }
    if (rolePassCheckbox && passagerFields) {
      passagerFields.style.display = rolePassCheckbox.checked ? '' : 'none';
    }
    if (preferencesInput) preferencesInput.required = false;
  }
  if (roleCondCheckbox) roleCondCheckbox.addEventListener('change', toggleRoleSections);
  if (rolePassCheckbox) rolePassCheckbox.addEventListener('change', toggleRoleSections);

  // Clic sur avatar = choisir un fichier
  if (avatarPreview && avatarInput) {
    avatarPreview.style.cursor = 'pointer';
    avatarPreview.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', () => {
      const file = avatarInput.files[0];
      if (file) {
        if (!file.type.match(/^image\//)) {
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

  // Gestion du fallback si l'image est manquante
  function setAvatar(imgEl, avatarPath) {
    imgEl.src = avatarPath && avatarPath !== 'null'
      ? avatarPath
      : defaultAvatar;
    imgEl.onerror = function() {
      this.src = defaultAvatar;
      this.onerror = null;
    };
  }

  // Afficher le champ mot de passe si l'utilisateur modifie nom, prénom ou email
  let isSensitiveModified = false;
  [prenomInput, nomInput, emailInput].forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        if (!isSensitiveModified) {
          passwordContainer.style.display = 'block';
          isSensitiveModified = true;
        }
      });
    }
  });

  // Charger et pré-remplir le profil utilisateur
  async function loadProfile() {
    try {
      const res = await fetch('asset/PHP/get_profile.php', { credentials: 'include' });
      const data = await res.json();
      if (data.error) return alert('Erreur chargement profil : ' + data.error);

      if (roleCondCheckbox)   roleCondCheckbox.checked   = !!data.cond_prenom;
      if (rolePassCheckbox)   rolePassCheckbox.checked   = !!data.pass_prenom;
      toggleRoleSections();

      if (prenomInput)        prenomInput.value          = data.user_prenom || data.prenom || '';
      if (nomInput)           nomInput.value             = data.user_nom    || data.nom    || '';
      if (emailInput)         emailInput.value           = data.email       || '';
      if (bioInput)           bioInput.value             = data.bio         || '';

      if (voitureInput)       voitureInput.value         = data.voiture     || '';
      if (carburantSelect)    carburantSelect.value      = data.carburant   || 'essence';
      if (animauxCheckbox)    animauxCheckbox.checked    = !!data.animaux;
      if (fumeurCheckbox)     fumeurCheckbox.checked     = !!data.fumeurs;

      if (preferencesInput)   preferencesInput.value     = data.preferences || '';

      if (avatarPreview) {
        setAvatar(avatarPreview, data.avatar);
        avatarPreview.style.display = '';
      }

      mettreAJourNotificationMessages();

    } catch (err) {
      alert('Impossible de charger le profil.');
      console.error('Erreur fetch profil:', err);
      if (notifBadge) notifBadge.style.display = 'none';
    }
  }

  // Soumettre le formulaire (profil + avatar + bio)
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();

    if (!prenomInput.value.trim() || !nomInput.value.trim() || !emailInput.value.trim()) {
      alert('Veuillez remplir prénom, nom et email.');
      return;
    }

    // Si champ mot de passe visible, il faut qu’il soit rempli
    if (passwordContainer.style.display === 'block' && passwordInput.value.trim() === '') {
      alert('Veuillez saisir votre mot de passe pour confirmer les modifications.');
      passwordInput.focus();
      return;
    }

    const fd = new FormData();
    fd.append('prenom', prenomInput.value.trim());
    fd.append('nom', nomInput.value.trim());
    fd.append('email', emailInput.value.trim());
    fd.append('bio', bioInput ? bioInput.value.trim() : '');
    fd.append('roleConducteur', roleCondCheckbox.checked ? 1 : 0);
    fd.append('rolePassager',   rolePassCheckbox.checked ? 1 : 0);

    if (roleCondCheckbox.checked) {
      fd.append('voiture', voitureInput.value.trim());
      fd.append('carburant', carburantSelect.value);
      fd.append('animaux',   animauxCheckbox.checked ? 1 : 0);
      fd.append('fumeurs',   fumeurCheckbox.checked ? 1 : 0);
    }
    if (rolePassCheckbox.checked && preferencesInput.value.trim()) {
      fd.append('preferences', preferencesInput.value.trim());
    }
    if (avatarInput && avatarInput.files[0]) {
      fd.append('avatar', avatarInput.files[0]);
    }

    // Ajout du mot de passe de confirmation si visible
    if (passwordContainer.style.display === 'block') {
      fd.append('passwordConfirm', passwordInput.value);
    }

    try {
      const res = await fetch('asset/PHP/update_profile.php', {
        method: 'POST',
        credentials: 'include',
        body: fd
      });
      const result = await res.json();
      if (result.error) {
        alert('Erreur enregistrement : ' + result.error);
      } else {
        alert('Profil mis à jour avec succès.');
        if (result.avatarUrl && avatarPreview) {
          setAvatar(avatarPreview, result.avatarUrl);
        }
        // Reset champ mot de passe confirmation
        passwordInput.value = '';
        passwordContainer.style.display = 'none';
        isSensitiveModified = false;
        // Optionnel : recharger le profil
        // await loadProfile();
      }
    } catch (err) {
      alert('Erreur réseau, impossible de mettre à jour.');
      console.error('Erreur update profil:', err);
    }
  });

  // Mise à jour périodique badge notification messages toutes les 30 secondes
  setInterval(mettreAJourNotificationMessages, 30000);

  // Fonction pour mettre à jour le badge notification messages
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
