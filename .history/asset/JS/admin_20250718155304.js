document.addEventListener("DOMContentLoaded", () => {

  // Vérification accès admin au chargement de la page
  fetch('asset/PHP/check_admin.php', { credentials: "include" })
    .then(r => r.text())
    .then(txt => {
      if (txt.trim() === "") {
        chargerMembres();
        chargerSignalements(); // Charge aussi les signalements au départ
        return;
      }
      let data;
      try { data = JSON.parse(txt); } catch (e) {
        alert("Erreur technique inattendue !");
        window.location.href = "PageDaccueil.html";
        throw e;
      }
      if (data.error) {
        alert(data.error);
        window.location.href = "PageDaccueil.html";
        throw new Error("Accès admin refusé : " + data.error);
      }
    })
    .catch(e => {
      alert("Erreur technique ou accès refusé. Merci de vous reconnecter.");
      window.location.href = 'PageDaccueil.html';
      throw e;
    });

  const tbody = document.getElementById("users-tbody");
  const feedback = document.getElementById("admin-feedback");
  const searchInput = document.getElementById("search-user");
  const roleFilter = document.getElementById("role-filter");
  const statutFilter = document.getElementById("statut-filter");
  const signalementsTbody = document.getElementById("signalements-tbody");

  // Fonction chargement membres
  function chargerMembres() {
    tbody.innerHTML = "<tr><td colspan='9' class='text-center'>Chargement...</td></tr>";
    fetch(`asset/PHP/admin_get_users.php?search=${encodeURIComponent(searchInput.value)}&role=${roleFilter.value}&statut=${statutFilter.value}`, {
      credentials: "include"
    })
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
              ${(u.roleConducteur == 1 ? '<span class="badge bg-success">Conducteur</span>' : '')}
              ${(u.rolePassager == 1 ? '<span class="badge bg-info">Passager</span>' : '')}
            </td>
            <td>
              <span class="badge ${u.statut === 'actif' ? 'bg-success' : 'bg-danger'}">${u.statut}</span>
            </td>
            <td>${u.jetons ?? 0}</td>
            <td>
              ${u.admin == 1 ? '<span class="badge admin-badge">Admin</span>' : ''}
            </td>
            <td>
              <button class="btn btn-warning btn-sm mb-1" onclick="adminToggleStatut(${u.id},'${u.statut}')">${u.statut === 'actif' ? 'Suspendre' : 'Réactiver'}</button>
              <button class="btn btn-secondary btn-sm mb-1" onclick="adminResetPwd(${u.id})">Réinit. MDP</button>
              <button class="btn btn-dark btn-sm mb-1" onclick="adminSetPwd(${u.id})">Définir MDP</button>
              <button class="btn btn-success btn-sm mb-1" onclick="adminEditRole(${u.id})">Changer rôle</button>
              <button class="btn btn-info btn-sm mb-1" onclick="adminEditJetons(${u.id}, ${u.jetons ?? 0})">Modifier jetons</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      })
      .catch(error => {
        tbody.innerHTML = `<tr><td colspan='9' class='text-danger text-center'>Erreur de chargement des membres</td></tr>`;
        console.error("Erreur fetch admin_get_users.php :", error);
      });
  }

  [searchInput, roleFilter, statutFilter].forEach(el => {
    el.addEventListener('input', chargerMembres);
    el.addEventListener('change', chargerMembres);
  });

  // Fonctions déjà existantes : adminToggleStatut, adminResetPwd, adminSetPwd, adminEditRole, adminEditJetons
  // (Assure-toi qu’elles sont bien dans ton code, inchangées.)

  // --- Gestion des signalements ---

  function chargerSignalements() {
    if (!signalementsTbody) return;
    signalementsTbody.innerHTML = `<tr><td colspan="8" class="text-center">Chargement...</td></tr>`;
    fetch('asset/PHP/get_signalement.php', { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          signalementsTbody.innerHTML = `<tr><td colspan="8" class="text-danger text-center">${data.error}</td></tr>`;
          return;
        }
        if (!Array.isArray(data) || data.length === 0) {
          signalementsTbody.innerHTML = `<tr><td colspan="8" class="text-center">Aucun signalement.</td></tr>`;
          return;
        }
        signalementsTbody.innerHTML = "";
        data.forEach(sig => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${sig.id}</td>
            <td>${sig.nom_utilisateur || "Inconnu"}</td>
            <td>${sig.type}</td>
            <td>${sig.motif}</td>
            <td>${sig.description}</td>
            <td>${new Date(sig.date_signalement).toLocaleString('fr-FR')}</td>
            <td>${sig.statut == 0 ? '<span class="badge bg-warning">En attente</span>' : '<span class="badge bg-success">Traitée</span>'}</td>
            <td>
              <button class="btn btn-danger btn-sm" onclick="supprimerSignalement(${sig.id})" title="Supprimer ce signalement">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          `;
          signalementsTbody.appendChild(tr);
        });
      })
      .catch(error => {
        signalementsTbody.innerHTML = `<tr><td colspan="8" class="text-danger text-center">Erreur de chargement des signalements</td></tr>`;
        console.error("Erreur fetch get_signalement.php :", error);
      });
  }

  window.supprimerSignalement = function(id) {
    if (!confirm("Supprimer ce signalement définitivement ?")) return;
    fetch('asset/PHP/delete_signalement.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id }),
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        chargerSignalements();
        feedback.textContent = "Signalement supprimé.";
        feedback.className = "text-success";
      } else {
        alert(data.error || 'Erreur lors de la suppression.');
      }
    })
    .catch(() => alert('Erreur réseau lors de la suppression.'));
  };

  // Chargement initial des données
  chargerMembres();
  chargerSignalements();

});
