// asset/JS/profile.js
// Gestion du chargement et de la mise à jour du profil utilisateur avec sélection de rôle

document.addEventListener('DOMContentLoaded', () => {
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

  // Afficher/masquer les blocs selon le rôle
  function toggleRoleSections() {
    conducteurFields.style.display = roleCondCheckbox.checked ? '' : 'none';
    // rendre requis uniquement si visible
    voitureInput.required    = roleCondCheckbox.checked;
    carburantSelect.required = roleCondCheckbox.checked;

    passagerFields.style.display = rolePassCheckbox.checked ? '' : 'none';
    preferencesInput.required    = rolePassCheckbox.checked;
  }

  roleCondCheckbox.addEventListener('change', toggleRoleSections);
  rolePassCheckbox.addEventListener('change', toggleRoleSections);

  // Charger les données de profil
  async function loadProfile() {
    try {
      const res = await fetch('./asset/PHP/get_profile.php', { credentials: 'include' });
      const data = await res.json();
      if (data.error) {
        return alert('Erreur chargement profil: ' + data.error);
      }
      // Rôles
      roleCondCheckbox.checked = Boolean(data.voiture);
      rolePassCheckbox.checked = Boolean(data.preferences && data.preferences.trim());
      toggleRoleSections();

      // Infos de base
      prenomInput.value = data.prenom || '';
      nomInput.value    = data.nom    || '';
      emailInput.value  = data.email  || '';

      // Conducteur
      voitureInput.value     = data.voiture   || '';
      carburantSelect.value  = data.carburant || 'essence';
      animauxCheckbox.checked= Boolean(data.animaux);
      fumeurCheckbox.checked = Boolean(data.fumeurs);

      // Passager
      preferencesInput.value = data.preferences || '';
    } catch (err) {
      console.error('Erreur fetch profil:', err);
      alert('Impossible de charger le profil.');
    }
  }

  // Soumettre les modifications
  form.addEventListener('submit', async e => {
    e.preventDefault();
    // Validation minimale
    if (!prenomInput.value.trim() || !nomInput.value.trim() || !emailInput.value.trim()) {
      return alert('Veuillez remplir prénom, nom et email.');
    }
    // Construire le payload
    const payload = {
      prenom:         prenomInput.value.trim(),
      nom:            nomInput.value.trim(),
      email:          emailInput.value.trim(),
      roleConducteur: roleCondCheckbox.checked ? 1 : 0,
      rolePassager:   rolePassCheckbox.checked ? 1 : 0
    };
    if (roleCondCheckbox.checked) {
      payload.voiture   = voitureInput.value.trim();
      payload.carburant = carburantSelect.value;
      payload.animaux   = animauxCheckbox.checked   ? 1 : 0;
      payload.fumeurs   = fumeurCheckbox.checked    ? 1 : 0;
    }
    if (rolePassCheckbox.checked) {
      payload.preferences = preferencesInput.value.trim();
    }

    try {
      const res = await fetch('./asset/PHP/update_profile.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.error) {
        alert('Erreur enregistrement: ' + result.error);
      } else {
        alert('Profil mis à jour avec succès.');
      }
    } catch (err) {
      console.error('Erreur update profil:', err);
      alert('Erreur réseau, impossible de mettre à jour.');
    }
  });

  // Initialisation
  loadProfile();
});
