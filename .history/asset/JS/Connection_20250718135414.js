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
      credentials: "include"
    })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        if (data.success) {
          window.location.href = "./PageDaccueil.html";
        }
      })
      .catch(error => {
        console.error("Erreur lors de la connexion :", error);
        alert("Une erreur est survenue.");
      });
  });

  // MOT DE PASSE OUBLIÉ
  const forgotBtn = document.getElementById("forgot-password-link");
  if (forgotBtn) {
    forgotBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const email = prompt("Entrez votre adresse email pour recevoir un lien de réinitialisation :");
      if (!email) return;

      fetch("asset/PHP/forgot_password.php", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: email.trim() })
      })
        .then(r => r.json())
        .then(data => {
          alert(data.success 
            ? "Un email de réinitialisation a été envoyé (si l'adresse existe dans la base)."
            : (data.error || "Erreur lors de la demande.")
          );
        })
        .catch(() => {
          alert("Erreur technique lors de la demande.");
        });
    });
  }
});
