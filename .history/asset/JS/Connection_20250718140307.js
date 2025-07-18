document.addEventListener("DOMContentLoaded", function () {
  // --- GESTION CONNEXION ---
  const form = document.getElementById("loginForm");
  if (form) {
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

    // --- MOT DE PASSE OUBLIÉ (sur la page login) ---
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
  }

  // --- GESTION RÉINITIALISATION DU MOT DE PASSE ---
  const resetForm = document.getElementById("resetForm");
  if (resetForm) {
    // Pré-rempli le champ token depuis l'URL (pour éviter oubli !)
    document.getElementById("token").value = new URLSearchParams(window.location.search).get("token") || "";

    resetForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const token = document.getElementById("token").value;
      const password = document.getElementById("new-password").value;

      if (!password || password.length < 6) {
        document.getElementById("feedback").textContent = "Le mot de passe doit faire au moins 6 caractères.";
        return;
      }

      fetch("asset/PHP/reset_password.php", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ token, password })
      })
      .then(r => r.json())
      .then(data => {
        document.getElementById("feedback").textContent = data.success
          ? "Votre mot de passe a été réinitialisé ! Vous pouvez vous connecter."
          : (data.error || "Erreur.");
      })
      .catch(() => {
        document.getElementById("feedback").textContent = "Erreur technique.";
      });
    });
  }
});
