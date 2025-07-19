// asset/JS/public_profile.js

document.addEventListener('DOMContentLoaded', () => {
  // Récupérer l'id utilisateur depuis l'URL
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');

  if (!userId) {
    alert("Profil introuvable : identifiant manquant.");
    return;
  }

  // Sélecteurs DOM
  const avatarEl = document.getElementById('avatar');
  const pseudoEl = document.getElementById('pseudo');
  const prenomEl = document.getElementById('prenom');
  const bioEl = document.getElementById('bio');
  const roleEl = document.getElementById('role');
  const ancienneteEl = document.getElementById('anciennete');
  const nbTrajetsEl = document.getElementById('nbTrajets');
  const typeCompteEl = document.getElementById('typeCompte');
  const infosPlusEl = document.getElementById('infos-plus');

  // Chargement des données utilisateur via API PHP
  fetch(`asset/PHP/get_public_profile.php?id=${encodeURIComponent(userId)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      // Affichage des données
      avatarEl.src = data.avatar || 'asset/Images/default_03.png';
      avatarEl.alt = `Avatar de ${data.prenom} ${data.nom}`;
      pseudoEl.textContent = data.prenom || 'Utilisateur';
      prenomEl.textContent = data.prenom || '';
      bioEl.textContent = data.bio || "Cet utilisateur n'a pas encore ajouté de présentation.";

      // Role et type de compte
      if(data.roleConducteur && data.rolePassager){
        roleEl.textContent = 'Conducteur & Passager';
        typeCompteEl.textContent = 'Membre professionnel';
      } else if(data.roleConducteur){
        roleEl.textContent = 'Conducteur';
        typeCompteEl.textContent = 'Membre professionnel';
      } else if(data.rolePassager){
        roleEl.textContent = 'Passager';
        typeCompteEl.textContent = 'Membre non-professionnel';
      } else {
        roleEl.textContent = 'Membre';
        typeCompteEl.textContent = 'Membre non-professionnel';
      }

      // Infos supplémentaires
      ancienneteEl.textContent = data.anciennete || 'Membre depuis une date inconnue';
      nbTrajetsEl.textContent = `${data.nbTrajets || 0} trajets publiés et complétés`;

      // Préférences (exemple)
      infosPlusEl.innerHTML = '';
      if(data.preferences){
        const li = document.createElement('li');
        li.textContent = `Préférences: ${data.preferences}`;
        infosPlusEl.appendChild(li);
      }
      if(data.animaux){
        const li = document.createElement('li');
        li.textContent = `Aime les animaux 🐾`;
        infosPlusEl.appendChild(li);
      }
      if(data.fumeurs === 0){
        const li = document.createElement('li');
        li.textContent = `Pas de cigarette, svp 🚭`;
        infosPlusEl.appendChild(li);
      }
      if(data.musique){
        const li = document.createElement('li');
        li.textContent = `Musique tout le long 🎵`;
        infosPlusEl.appendChild(li);
      }
      // Ajoute ici d'autres préférences si tu veux
    })
    .catch(err => {
      console.error(err);
      alert("Erreur lors du chargement du profil.");
    });
});
