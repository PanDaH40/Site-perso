document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    alert("Veuillez remplir tous les champs.");
    return;
  }

  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);

  fetch('./asset/PHP/connection.php', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    if (data.success) {
      window.location.href = './asset/PHP/dashboard.php';
    }
  })
  .catch(err => {
    console.error('Erreur fetch:', err);
    alert("Erreur lors de la connexion.");
  });
});
