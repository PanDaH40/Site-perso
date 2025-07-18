document.addEventListener("DOMContentLoaded", () => {

// Vérification accès admin au chargement de la page
  fetch('asset/PHP/check_admin.php')
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        alert(data.error); // Ou remplace par une modal/belle alerte si tu veux
        window.location.href = 'connexion.html'; // Ou autre page publique
        throw new Error("Accès admin refusé : " + data.error);
      }
    })
    .catch(e => {
      // Si le serveur renvoie du HTML au lieu de JSON, ou erreur réseau/session
      alert("Erreur technique ou accès refusé. Merci de vous reconnecter.");
      window.location.href = 'connexion.html';
      throw e;
    });

const tbody = document.getElementById("users-tbody");
  const feedback = document.getElementById("admin-feedback");
  const searchInput = document.getElementById("search-user");
  const roleFilter = document.getElementById("role-filter");
  const statutFilter = document.getElementById("statut-filter");

  function chargerMembres() {
    tbody.innerHTML = "<tr><td colspan='9' class='text-center'>Chargement...</td></tr>";
    fetch(`asset/PHP/admin_get_users.php?search=${encodeURIComponent(searchInput.value)}&role=${roleFilter.value}&statut=${statutFilter.value}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          tbody.innerHTML = `<tr><td colspan='9' class='text-danger text-center'>${data.error}</td></tr>`;
          return;
        }
        if (!Array.isArray(data.users) || data.users.length === 0) {
          tbody.innerHTML = `<tr><td colspan='9' class='text-center'>Aucun membre trouvé.</td></tr>`;
          return;
        }
        tbody.innerHTML = "";
        data.users.forEach(u => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${u.id}</td>
            <td>${u.prenom}</td>
            <td>${u.nom}</td>
            <td>${u.email}</td>
            <td>
              ${(u.roleConducteur ? '<span class="badge bg-success">Conducteur</span>' : '')}
              ${(u.rolePassager ? '<span class="badge bg-info">Passager</span>' : '')}
            </td>
            <td>
              <span class="badge ${u.statut === 'actif' ? 'bg-success' : 'bg-danger'}">${u.statut}</span>
            </td>
            <td>
              ${u.admin == 1 ? '<span class="badge admin-badge">Admin</span>' : ''}
            </td>
            <td>${u.jetons ?? 0}</td>
            <td>
              <button class="btn btn-warning btn-sm mb-1" onclick="adminToggleStatut(${u.id},'${u.statut}')">${u.statut === 'actif' ? 'Suspendre' : 'Réactiver'}</button>
              <button class="btn btn-secondary btn-sm mb-1" onclick="adminResetPwd(${u.id})">Réinit. MDP</button>
              <button class="btn btn-success btn-sm mb-1" onclick="adminEditRole(${u.id})">Changer rôle</button>
              <button class="btn btn-info btn-sm mb-1" onclick="adminEditJetons(${u.id}, ${u.jetons ?? 0})">Modifier jetons</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      });
  }

  // Recherche/filtrage
  [searchInput, roleFilter, statutFilter].forEach(el => {
    el.addEventListener('input', chargerMembres);
    el.addEventListener('change', chargerMembres);
  });

  // Fonctions d'action
  window.adminToggleStatut = function(id, current) {
    if (!confirm(current === "actif" ? "Suspendre cet utilisateur ?" : "Réactiver cet utilisateur ?")) return;
    fetch('asset/PHP/admin_toggle_statut.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id })
    })
    .then(res => res.json())
    .then(data => {
      feedback.textContent = data.success ? "Mise à jour OK" : data.error;
      feedback.className = data.success ? "text-success" : "text-danger";
      chargerMembres();
    });
  };

  window.adminResetPwd = function(id) {
    if (!confirm("Réinitialiser le mot de passe de cet utilisateur ?")) return;
    fetch('asset/PHP/admin_reset_pwd.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id })
    })
    .then(res => res.json())
    .then(data => {
      feedback.textContent = data.success ? "MDP réinitialisé (un email a été envoyé)" : data.error;
      feedback.className = data.success ? "text-success" : "text-danger";
    });
  };

  window.adminEditRole = function(id) {
    const nvRole = prompt("Entrer 'conducteur', 'passager', ou 'les deux' pour le nouveau rôle :", "");
    if (!nvRole) return;
    fetch('asset/PHP/admin_edit_role.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id, role: nvRole })
    })
    .then(res => res.json())
    .then(data => {
      feedback.textContent = data.success ? "Rôle modifié" : data.error;
      feedback.className = data.success ? "text-success" : "text-danger";
      chargerMembres();
    });
  };

  window.adminEditJetons = function(id, jetonsActuels) {
    const nv = prompt(`Nombre de jetons (actuel : ${jetonsActuels})`, jetonsActuels);
    if (nv === null) return;
    if (isNaN(nv) || nv < 0) {
      alert("Veuillez entrer un nombre positif.");
      return;
    }
    fetch('asset/PHP/admin_edit_jetons.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id, jetons: nv })
    })
    .then(res => res.json())
    .then(data => {
      feedback.textContent = data.success ? "Jetons modifiés" : data.error;
      feedback.className = data.success ? "text-success" : "text-danger";
      chargerMembres();
    });
  };

  chargerMembres();
});
