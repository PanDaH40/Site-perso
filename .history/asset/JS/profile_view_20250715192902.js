document.addEventListener("DOMContentLoaded", () => {
  const userId = getUserIdFromUrl();
  if (!userId) {
    alert("ID utilisateur manquant dans l'URL");
    return;
  }
  chargerProfilUtilisateur(userId);

  const editForm = document.getElementById('editProfileForm');
  if (editForm) {
    editForm.addEventListener('submit', async e => {
      e.preventDefault();
      await sauverProfil(userId);
    });
  }
});

function getUserIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function chargerProfilUtilisateur(userId) {
  try {
    const res = await fetch(`asset/PHP/get_profile.php?id=${encodeURIComponent(userId)}`, { credentials: 'include' });
    const data = await res.json();

    if (data.error) {
      alert("Erreur chargement profil : " + data.error);
      return;
    }

    afficherProfil(data);
  } catch (e) {
    alert("Erreur réseau, impossible de charger le profil.");
  }
}

function afficherProfil(data) {
  document.getElementById('profilNom').textContent = `${data.prenom || ''} ${data.nom || ''}`;
  document.getElementById('profilBio').textContent = data.bio || '';
  document.getElementById('profilDescription').textContent = data.description || 'Pas de description disponible.';
  document.getElementById('membreDepuis').textContent = data.date_inscription || '';
  document.getElementById('trajetsPublies').textContent = data.trajets_publies || 0;
  document.getElementById('profilAvatar').src = data.avatar || '/path/to/default-avatar.png';

  // Remplir formulaire si c'est le profil connecté
  if (data.is_current_user) {
    document.getElementById('editPrenom').value = data.prenom || '';
    document.getElementById('editNom').value = data.nom || '';
    document.getElementById('editBio').value = data.bio || '';
  } else {
    // Cacher onglet modifier si pas ton profil
    const modTab = document.querySelector('#modifier-tab');
    const modContent = document.querySelector('#modifier');
    if (modTab && modContent) {
      modTab.style.display = 'none';
      modContent.style.display = 'none';
    }
  }
}

async function sauverProfil(userId) {
  const prenom = document.getElementById('editPrenom').value.trim();
  const nom = document.getElementById('editNom').value.trim();
  const bio = document.getElementById('editBio').value.trim();

  if (!prenom || !nom) {
    alert('Prénom et nom sont obligatoires');
    return;
  }

  try {
    const res = await fetch('asset/PHP/update_profile.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prenom, nom, bio })
    });
    const data = await res.json();
    if (data.success) {
      alert('Profil mis à jour');
      chargerProfilUtilisateur(userId); // recharger avec les nouvelles infos
    } else {
      alert('Erreur lors de la mise à jour : ' + (data.error || 'Erreur inconnue'));
    }
  } catch (e) {
    alert('Erreur réseau, impossible de sauvegarder');
  }
}
