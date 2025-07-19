// asset/JS/profile.js
// Gestion du chargement, de l’upload d’avatar et de la mise à jour du profil utilisateur

document.addEventListener('DOMContentLoaded', () => {
  // Éléments du DOM
  const form               = document.getElementById('profileForm');
  const prenomInput        = document.getElementById('profilePrenom');
  const nomInput           = document.getElementById('profileNom');
  const emailInput         = document.getElementById('profileEmail');
  const roleCondCheckbox   = document.getElementById('roleConducteur');
  const rolePassCheckbox   = document.getElementById('rolePassager');
  const conducteurFields   = document.getElementById('conducteurFields');
  const passagerFields     = document.getElementById('passagerFields');
  const voitureInput       = document.getElementById('profileVoiture');
  const carburantSelect    = document.getElementById('profileCarburant');
  const animauxCheckbox    = document.getElementById('acceptAnimaux');
  const fumeurCheckbox     = document.getElementById('acceptFumeur');
  const preferencesInput   = document.getElementById('profilePreferences');
  const avatarInput        = document.getElementById('profileAvatar');
  const avatarPreview      = document.getElementById('avatarPreview');

  // Afficher/masquer les sections Conducteur et Passager
  function toggleRoleSections() {
    if (roleCondCheckbox.checked) {
      conducteurFields.style.display = '';
      voitureInput.required    = true;
      carburantSelect.required = true;
    } else {
      conducteurFields.style.display = 'none';
      voitureInput.required    = false;
      carburantSelect.required = false;
    }
    if (rolePassCheckbox.checked) {
      passagerFields.style.display = '';
    } else {
      passagerFields.style.display = 'none';
    }
    // Préférences passager toujours facultatives
    preferencesInput.required = false;
  }

  roleCondCheckbox.addEventListener('change', toggleRoleSections);
  rolePassCheckbox.addEventListener('change', toggleRoleSections);

  // Clic sur l'avatar ouvre le file-picker
  avatarPreview.addEventListener('click', () => {
    avatarInput.click();
  });

  // Afficher un aperçu de l'image sélectionnée
  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      avatarPreview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Charger les données de profil et préremplir le formulaire
  async function loadProfile() {
    try {
      const res = await fetch('./asset/PHP/get_profile.php', { credentials: 'include' });
      const data = await res.json();
      if (data.error) {
        return alert('Erreur chargement profil : ' + data.error);
      }

      // Rôles
      roleCondCheckbox.checked = Boolean(data.cond_prenom);
      rolePassCheckbox.checked = Boolean(data.pass_prenom);
      toggleRoleSections();

      // Infos de base
      prenomInput.value = data.prenom   || '';
      nomInput.value    = data.nom      || '';
      emailInput.value  = data.email    || '';

      // Conducteur
      voitureInput.value      = data.voiture   || '';
      carburantSelect.value   = data.carburant || 'essence';
      animauxCheckbox.checked = Boolean(data.animaux);
      fumeurCheckbox.checked  = Boolean(data.fumeurs);

      // Passager
      preferencesInput.value = data.preferences || '';

      // Avatar
      if (data.avatar) {
        avatarPreview.src = data.avatar;
      } else {
        avatarPreview.src = '/path/to/default-avatar.png';
      }
      avatarPreview.style.display = '';
    } catch (err) {
      console.error('Erreur fetch profil :', err);
      alert('Impossible de charger le profil.');
    }
  }

  // Soumettre le formulaire sous forme de FormData pour gérer l'avatar
  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Validation minimale
    if (!prenomInput.value.trim() || !nomInput.value.trim() || !emailInput.value.trim()) {
      return alert('Veuillez remplir prénom, nom et email.');
    }

    const fd = new FormData();
    fd.append('prenom', prenomInput.value.trim());
    fd.append('nom',    nomInput.value.trim());
    fd.append('email',  emailInput.value.trim());
    fd.append('roleConducteur', roleCondCheckbox.checked ? 1 : 0);
    fd.append('rolePassager',   rolePassCheckbox.checked ? 1 : 0);

    if (roleCondCheckbox.checked) {
      fd.append('voiture',   voitureInput.value.trim());
      fd.append('carburant', carburantSelect.value);
      fd.append('animaux',   animauxCheckbox.checked ? 1 : 0);
      fd.append('fumeurs',   fumeurCheckbox.checked  ? 1 : 0);
    }

    if (rolePassCheckbox.checked && preferencesInput.value.trim()) {
      fd.append('preferences', preferencesInput.value.trim());
    }

    if (avatarInput.files[0]) {
      fd.append('avatar', avatarInput.files[0]);
    }

    try {
      const res = await fetch('./asset/PHP/update_profile.php', {
        method: 'POST',
        credentials: 'include',
        body: fd
      });
      const result = await res.json();
      if (result.error) {
        alert('Erreur enregistrement : ' + result.error);
      } else {
        alert('Profil mis à jour avec succès.');
        if (result.avatarUrl) {
          avatarPreview.src = result.avatarUrl;
        }
      }
    } catch (err) {
      console.error('Erreur update profil :', err);
      alert('Erreur réseau, impossible de mettre à jour.');
    }
  });

  // Initialisation
  loadProfile();
});
