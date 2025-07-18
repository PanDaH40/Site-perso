// asset/JS/profile.js

document.addEventListener('DOMContentLoaded', () => {
  // Sélecteurs DOM sécurisés
  const $ = id => document.getElementById(id);

  const form             = $('profileForm');
  const prenomInput      = $('profilePrenom');
  const nomInput         = $('profileNom');
  const emailInput       = $('profileEmail');
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
  if (roleCondCheckbox)   roleCondCheckbox.addEventListener('change', toggleRoleSections);
  if (rolePassCheckbox)   rolePassCheckbox.addEventListener('change', toggleRoleSections);

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
        // Preview immédiat (base64, avant upload)
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
    };
  }

  // Charger et pré-remplir le profil utilisateur
  async function loadProfile() {
    try {
      const res = await fetch('asset/PHP/get_profile.php', { credentials: 'include' });
      const data = await res.json();
      if (data.error) return alert('Erreur chargement profil : ' + data.error);

      // Champs selon structure BDD/SQL
      if (roleCondCheckbox)   roleCondCheckbox.checked   = !!data.cond_prenom;
      if (rolePassCheckbox)   rolePassCheckbox.checked   = !!data.pass_prenom;
      toggleRoleSections();

      if (prenomInput)        prenomInput.value          = data.user_prenom || data.prenom || '';
      if (nomInput)           nomInput.value             = data.user_nom    || data.nom    || '';
      if (emailInput)         emailInput.value           = data.email       || '';

      if (voitureInput)       voitureInput.value         = data.voiture     || '';
      if (carburantSelect)    carburantSelect.value      = data.carburant   || 'essence';
      if (animauxCheckbox)    animauxCheckbox.checked    = !!data.animaux;
      if (fumeurCheckbox)     fumeurCheckbox.checked     = !!data.fumeurs;

      if (preferencesInput)   preferencesInput.value     = data.preferences || '';

      // Avatar utilisateur
      if (avatarPreview) {
        setAvatar(avatarPreview, data.avatar);
        avatarPreview.style.display = '';
      }
    } catch (err) {
      alert('Impossible de charger le profil.');
      console.error('Erreur fetch profil:', err);
    }
  }

  // Soumettre le formulaire (profil + avatar)
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    // Validation minimale
    if (!prenomInput.value.trim() || !nomInput.value.trim() || !emailInput.value.trim()) {
      alert('Veuillez remplir prénom, nom et email.');
      return;
    }

    const fd = new FormData();
    fd.append('prenom', prenomInput.value.trim());
    fd.append('nom', nomInput.value.trim());
    fd.append('email', emailInput.value.trim());
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
        // Mise à jour immédiate de l'avatar affiché
        if (result.avatarUrl && avatarPreview) {
          setAvatar(avatarPreview, result.avatarUrl);
        }
        // Recharge le profil pour tout rafraîchir si besoin
        // await loadProfile();
      }
    } catch (err) {
      alert('Erreur réseau, impossible de mettre à jour.');
      console.error('Erreur update profil:', err);
    }
  });

  // Init : charge les infos du profil dès l'ouverture
  loadProfile();
});
