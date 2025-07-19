// asset/JS/public_profile.js

// Récupère l'id du membre depuis l'URL (ex: ProfilPublic.html?id=12)
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

document.addEventListener('DOMContentLoaded', () => {
  const id = getQueryParam('id');
  if (!id) {
    document.body.innerHTML = '<div class="container py-5"><div class="alert alert-danger">Aucun membre spécifié.</div></div>';
    return;
  }
  fetch('./asset/PHP/get_public_profile.php?id=' + encodeURIComponent(id))
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        document.body.innerHTML = '<div class="container py-5"><div class="alert alert-danger">'+data.error+'</div></div>';
        return;
      }
      document.getElementById('avatar').src = data.avatar || 'asset/Images/default_03.png';
      document.getElementById('pseudo').textContent = data.prenom + (data.nom ? ' ' + data.nom : '');
      document.getElementById('prenom').textContent = data.prenom;
      document.getElementById('role').textContent = data.role ? (data.role === 'conducteur' ? "Conducteur" : "Passager") : '';
      document.getElementById('bio').textContent = data.bio || "Ce membre n'a pas encore renseigné de présentation.";

      // Infos "plus" : préférences, animaux, musique...
      let infos = [];
      if (data.musique)  infos.push(`<li><i class="bi bi-music-note"></i> Musique&nbsp;: ${data.musique}</li>`);
      if (data.fumeur !== undefined) infos.push(`<li><i class="bi bi-ban"></i> ${data.fumeur ? 'Fumeur' : 'Non fumeur'}</li>`);
      if (data.animaux !== undefined) infos.push(`<li><i class="bi bi-paw"></i> ${data.animaux ? "J'adore les animaux" : "Pas d'animaux"}</li>`);
      if (data.preferences) infos.push(`<li><i class="bi bi-chat-dots"></i> ${data.preferences}</li>`);
      document.getElementById('infos-plus').innerHTML = infos.join('');

      document.getElementById('anciennete').textContent =
        "Membre depuis " + (data.date_inscription ? new Date(data.date_inscription).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }) : "longtemps");

      document.getElementById('nbTrajets').textContent =
        (data.nb_trajets || 0) + " trajets publiés et complétés";

      document.getElementById('typeCompte').textContent =
        data.pro ? "Compte professionnel" : "Membre non-professionnel";
    })
    .catch(() => {
      document.body.innerHTML = '<div class="container py-5"><div class="alert alert-danger">Erreur lors du chargement du profil.</div></div>';
    });
});
