document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const accepted = document.getElementById("acceptTerms").checked;

    if (!accepted) {
      alert("Vous devez accepter les termes.");
      return;
    }

    if (!email || !password) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    fetch("asset/PHP/connection.php", {
      method: "POST",
      body: formData,
      credentials: "same-origin"
    })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        if (data.success) {

          window.location.href = "asset/PHP/dashboard.php";
        }
      })
      .catch(error => {
        console.error("Erreur lors de la connexion :", error);
        alert("Une erreur est survenue.");
      });
  });
});
