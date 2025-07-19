// asset/JS/profile.js
// Gestion du chargement et de la mise à jour du profil utilisateur

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profileForm');
  const prenomInput = document.getElementById('profilePrenom');
  const nomInput = document.getElementById('profileNom');
  const emailInput = document.getElementById('profileEmail');
  const voitureInput = document.getElementById('profileVoiture');
  const carburantSelect = document.getElementById('profileCarburant');
  const animauxCheckbox = document.getElementById('acceptAnimaux');
  const fumeurCheckbox = document.getElementById('acceptFumeur');

  // Charger les données de profil
  async function loadProfile() {
    try {
      const res = await fetch('./asset/PHP/get_profile.php', { credentials: 'include' });
      const data = await res.json();
      if (data.error) return alert('Erreur chargement profil: ' + data.error);
      // Remplir le formulaire
      prenomInput.value = data.prenom || '';
      nomInput.value = data.nom || '';
      emailInput.value = data.email || '';
      voitureInput.value = data.voiture || '';
      carburantSelect.value = data.carburant || 'essence';
      animauxCheckbox.checked = Boolean(data.animaux);
      fumeurCheckbox.checked = Boolean(data.fumeurs);
    } catch (err) {
      console.error('Erreur fetch profil:', err);
      alert('Impossible de charger le profil.');
    }
  }

  // Soumettre les modifications
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      prenom: prenomInput.value.trim(),
      nom: nomInput.value.trim(),
      email: emailInput.value.trim(),
      voiture: voitureInput.value.trim(),
      carburant: carburantSelect.value,
      animaux: animauxCheckbox.checked ? 1 : 0,
      fumeurs: fumeurCheckbox.checked ? 1 : 0
    };
    // Validation simple
    if (!payload.prenom || !payload.nom || !payload.email) {
      return alert('Veuillez remplir prénom, nom et email.');
    }
    try {
      const res = await fetch('./asset/PHP/update_profile.php', {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.error) alert('Erreur enregistrement: ' + result.error);
      else alert('Profil mis à jour avec succès.');
    } catch (err) {
      console.error('Erreur update profil:', err);
      alert('Erreur réseau, impossible de mettre à jour.');
    }
  });

  // Initialisation
  loadProfile();
});
