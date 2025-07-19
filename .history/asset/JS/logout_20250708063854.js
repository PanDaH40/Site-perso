document.getElementById('logoutBtn').addEventListener('click', function() {
  fetch('logout.php')
    .then(() => {
      // Redirection vers la page de connexion après déconnexion
      window.location.href = '/asset/PHP/login.';
    })
    .catch(() => {
      alert("Erreur lors de la déconnexion.");
    });
});
