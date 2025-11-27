document.addEventListener("DOMContentLoaded", function () {
  // Récupère le formulaire d'inscription
  const form = document.getElementById("inscriptionForm");

  // Ajoute un écouteur d'événement sur la soumission du formulaire
  form.addEventListener("submit", function (e) {
    e.preventDefault(); // Empêche le rechargement de la page

    // Récupère et nettoie les valeurs des champs du formulaire
    const nom = document.getElementById("nom").value.trim();
    const prenom = document.getElementById("prenom").value.trim();
    const age = document.getElementById("age").value.trim();
    const telephone = document.getElementById("telephone").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const accepted = document.getElementById("acceptTerms").checked;

    // Vérifie que tous les champs sont remplis et que les termes sont acceptés
    if (!accepted || !nom || !prenom || !age || !telephone || !email || !password) {
      alert("Veuillez remplir tous les champs et accepter les termes.");
      return; // Arrête la soumission si validation échoue
    }

    // Prépare les données à envoyer via FormData (pour POST multipart/form-data)
    const formData = new FormData();
    formData.append("nom", nom);
    formData.append("prenom", prenom);
    formData.append("age", age);
    formData.append("telephone", telephone);
    formData.append("email", email);
    formData.append("password", password);

    // Envoi des données au serveur via fetch
    fetch("/PHP/inscription.php", {
      method: "POST",
      body: formData,
    })
      .then(res => res.json()) // Parse la réponse JSON
      .then(data => {
        alert(data.message); // Affiche le message retourné par le serveur
        if (data.success) {
          // En cas de succès, redirige vers la page de connexion
          window.location.href = "PageConnection.html";
        }
      })
      .catch(err => {
        // En cas d'erreur réseau ou autre, affiche un message d'erreur
        console.error("Erreur d'inscription :", err);
        alert("Une erreur est survenue.");
      });
  });
});




// document.addEventListener("DOMContentLoaded", function () {
//   const form = document.getElementById("inscriptionForm");

//   form.addEventListener("submit", function (e) {
//     e.preventDefault();

//     const nom = document.getElementById("nom").value.trim();
//     const prenom = document.getElementById("prenom").value.trim();
//     const age = document.getElementById("age").value.trim();
//     const telephone = document.getElementById("telephone").value.trim();
//     const email = document.getElementById("email").value.trim();
//     const password = document.getElementById("password").value.trim();
//     const accepted = document.getElementById("acceptTerms").checked;

//     if (!accepted || !nom || !prenom || !age || !telephone || !email || !password) {
//       alert("Veuillez remplir tous les champs et accepter les termes.");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("nom", nom);
//     formData.append("prenom", prenom);
//     formData.append("age", age);
//     formData.append("telephone", telephone);
//     formData.append("email", email);
//     formData.append("password", password);

//     fetch("asset/PHP/inscription.php", {
//       method: "POST",
//       body: formData,
//     })
//       .then(res => res.json())
//       .then(data => {
//         alert(data.message);
//         if (data.success) {
//           window.location.href = "PageConnection.html";
//         }
//       })
//       .catch(err => {
//         console.error("Erreur d'inscription :", err);
//         alert("Une erreur est survenue.");
//       });
//   });
// });
