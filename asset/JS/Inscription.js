document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("inscriptionForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const nom = document.getElementById("nom").value.trim();
    const prenom = document.getElementById("prenom").value.trim();
    const age = document.getElementById("age").value.trim();
    const telephone = document.getElementById("telephone").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const accepted = document.getElementById("acceptTerms").checked;

    if (!accepted || !nom || !prenom || !age || !telephone || !email || !password) {
      alert("Veuillez remplir tous les champs et accepter les termes.");
      return;
    }

    const formData = new FormData();
    formData.append("nom", nom);
    formData.append("prenom", prenom);
    formData.append("age", age);
    formData.append("telephone", telephone);
    formData.append("email", email);
    formData.append("password", password);

    fetch("asset/PHP/inscription.php", {
      method: "POST",
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        if (data.success) {
          window.location.href = "PageConnection.html";
        }
      })
      .catch(err => {
        console.error("Erreur d'inscription :", err);
        alert("Une erreur est survenue.");
      });
  });
});
