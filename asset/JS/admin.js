document.addEventListener("DOMContentLoaded", () => {

  // Vérification accès admin au chargement de la page
  fetch('asset/PHP/check_admin.php', { credentials: "include" })
    .then(r => r.text())
    .then(txt => {
      if (txt.trim() === "") {
        chargerMembres();
        chargerSignalements();
        chargerStats();
        return;
      }
      let data;
      try { data = JSON.parse(txt); } catch {
        alert("Erreur technique inattendue !");
        window.location.href = "PageDaccueil.html";
        throw new Error("Accès admin refusé");
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

  // Eléments DOM
  const tbodyUsers = document.getElementById("users-tbody");
  const tbodySignalements = document.getElementById("signalements-tbody");
  const feedback = document.getElementById("admin-feedback");
  const searchInput = document.getElementById("search-user");
  const roleFilter = document.getElementById("role-filter");
  const statutFilter = document.getElementById("statut-filter");
  const totalCreditsEl = document.getElementById("totalCredits");
  const chartTrajetsCtx = document.getElementById("chartTrajets")?.getContext('2d');
  const chartCreditsCtx = document.getElementById("chartCredits")?.getContext('2d');

  let chartTrajets = null;
  let chartCredits = null;

  // Utilitaire fetch JSON avec credentials inclus
  function fetchJson(url, options = {}) {
    return fetch(url, { credentials: "include", ...options }).then(r => r.json());
  }

  // Chargement des membres avec filtres
  function chargerMembres() {
    tbodyUsers.innerHTML = "<tr><td colspan='9' class='text-center'>Chargement...</td></tr>";
    fetchJson(`asset/PHP/admin_get_users.php?search=${encodeURIComponent(searchInput.value)}&role=${roleFilter.value}&statut=${statutFilter.value}`)
      .then(data => {
        if (data.error) {
          tbodyUsers.innerHTML = `<tr><td colspan='9' class='text-danger text-center'>${data.error}</td></tr>`;
          return;
        }
        if (!Array.isArray(data.users) || data.users.length === 0) {
          tbodyUsers.innerHTML = `<tr><td colspan='9' class='text-center'>Aucun membre trouvé.</td></tr>`;
          return;
        }
        tbodyUsers.innerHTML = "";
        data.users.forEach(u => {
          const roles = `${u.roleConducteur == 1 ? '<span class="badge bg-success">Conducteur</span>' : ''}${u.rolePassager == 1 ? '<span class="badge bg-info">Passager</span>' : ''}`;
          const statutBadge = `<span class="badge ${u.statut === 'actif' ? 'bg-success' : 'bg-danger'}">${u.statut}</span>`;
          const adminBadge = u.admin == 1 ? '<span class="badge admin-badge">Admin</span>' : '';
          tbodyUsers.insertAdjacentHTML('beforeend', `
            <tr>
              <td>${u.id}</td>
              <td>${u.prenom}</td>
              <td>${u.nom}</td>
              <td>${u.email}</td>
              <td>${roles}</td>
              <td>${statutBadge}</td>
              <td>${u.jetons ?? 0}</td>
              <td>${adminBadge}</td>
              <td>
                <button class="btn btn-warning btn-sm mb-1" onclick="adminToggleStatut(${u.id},'${u.statut}')">${u.statut === 'actif' ? 'Suspendre' : 'Réactiver'}</button>
                <button class="btn btn-secondary btn-sm mb-1" onclick="adminResetPwd(${u.id})">Réinit. MDP</button>
                <button class="btn btn-dark btn-sm mb-1" onclick="adminSetPwd(${u.id})">Définir MDP</button>
                <button class="btn btn-success btn-sm mb-1" onclick="adminEditRole(${u.id})">Changer rôle</button>
                <button class="btn btn-info btn-sm mb-1" onclick="adminEditJetons(${u.id}, ${u.jetons ?? 0})">Modifier jetons</button>
              </td>
            </tr>
          `);
        });
      })
      .catch(() => {
        tbodyUsers.innerHTML = `<tr><td colspan='9' class='text-danger text-center'>Erreur de chargement des membres</td></tr>`;
      });
  }

  // Chargement des signalements
  function chargerSignalements() {
    if (!tbodySignalements) return;
    tbodySignalements.innerHTML = `<tr><td colspan='8' class='text-center'>Chargement...</td></tr>`;
    fetchJson('asset/PHP/get_signalements.php')
      .then(data => {
        if (data.error) {
          tbodySignalements.innerHTML = `<tr><td colspan='8' class='text-danger text-center'>${data.error}</td></tr>`;
          return;
        }
        if (!Array.isArray(data) || data.length === 0) {
          tbodySignalements.innerHTML = `<tr><td colspan='8' class='text-center'>Aucun signalement trouvé.</td></tr>`;
          return;
        }
        tbodySignalements.innerHTML = "";
        data.forEach(s => {
          tbodySignalements.insertAdjacentHTML('beforeend', `
            <tr>
              <td>${s.id}</td>
              <td>${s.nom_utilisateur || "Inconnu"}</td>
              <td>${s.type}</td>
              <td>${s.motif}</td>
              <td>${s.description}</td>
              <td>${new Date(s.date_signalement).toLocaleString()}</td>
              <td>${s.statut === 'en_attente' ? '<span class="badge bg-warning">En attente</span>' : '<span class="badge bg-success">Traité</span>'}</td>
              <td>
                <button class="btn btn-success btn-sm me-1" title="Marquer traité" onclick="marquerCommeTraite(${s.id})">
                  <i class="bi bi-check-lg"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteSignalement(${s.id})" title="Supprimer signalement">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `);
        });
      })
      .catch(() => {
        tbodySignalements.innerHTML = `<tr><td colspan='8' class='text-danger text-center'>Erreur de chargement des signalements</td></tr>`;
      });
  }

  // Chargement des statistiques / graphiques
  function chargerStats() {
    fetchJson('asset/PHP/stats_covoiturage.php')
      .then(data => {
        if(data.error){
          feedback.textContent = data.error;
          feedback.className = "text-danger";
          return;
        }
        const dates = data.dates || [];
        const trajetsParJour = data.trajets_par_jour || [];
        const creditsParJour = data.credits_par_jour || [];
        const totalCredits = data.total_credits || 0;

        if(totalCreditsEl) totalCreditsEl.textContent = totalCredits;

        if(chartTrajets) chartTrajets.destroy();
        if(chartCredits) chartCredits.destroy();

        if(chartTrajetsCtx) {
          chartTrajets = new Chart(chartTrajetsCtx, {
            type: 'line',
            data: {
              labels: dates,
              datasets: [{
                label: 'Nombre de covoiturages',
                data: trajetsParJour,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.3
              }]
            },
            options: {
              responsive: true,
              scales: { y: { beginAtZero: true, precision: 0 } }
            }
          });
        }

        if(chartCreditsCtx) {
          chartCredits = new Chart(chartCreditsCtx, {
            type: 'bar',
            data: {
              labels: dates,
              datasets: [{
                label: 'Crédits gagnés',
                data: creditsParJour,
                backgroundColor: 'rgba(255, 159, 64, 0.7)'
              }]
            },
            options: {
              responsive: true,
              scales: { y: { beginAtZero: true, precision: 0 } }
            }
          });
        }
      })
      .catch(() => {
        feedback.textContent = "Erreur de chargement des statistiques.";
        feedback.className = "text-danger";
      });
  }

  // Actions admin

  window.adminToggleStatut = (id, current) => {
    if (!confirm(current === "actif" ? "Suspendre cet utilisateur ?" : "Réactiver cet utilisateur ?")) return;
    fetchJson('asset/PHP/admin_toggle_statut.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id })
    })
    .then(data => {
      feedback.textContent = data.success ? "Mise à jour OK" : data.error;
      feedback.className = data.success ? "text-success" : "text-danger";
      chargerMembres();
    })
    .catch(() => {
      feedback.textContent = "Erreur lors de la modification du statut.";
      feedback.className = "text-danger";
    });
  };

  window.adminResetPwd = id => {
    if (!confirm("Réinitialiser le mot de passe de cet utilisateur ?")) return;
    fetchJson('asset/PHP/admin_reset_pwd.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id })
    })
    .then(data => {
      feedback.textContent = data.success && data.nv_mdp ? "MDP réinitialisé : " + data.nv_mdp : data.error || "Erreur lors de la réinitialisation du MDP.";
      feedback.className = data.success ? "text-success" : "text-danger";
    })
    .catch(() => {
      feedback.textContent = "Erreur lors de la réinitialisation du MDP.";
      feedback.className = "text-danger";
    });
  };

  window.adminSetPwd = id => {
    const nvMdp = prompt("Entrer le nouveau mot de passe (min 6 caractères) :");
    if (!nvMdp || nvMdp.length < 6) {
      alert("Mot de passe trop court.");
      return;
    }
    fetchJson('asset/PHP/admin_set_pwd.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id, password: nvMdp })
    })
    .then(data => {
      feedback.textContent = data.success ? "Mot de passe défini avec succès." : data.error;
      feedback.className = data.success ? "text-success" : "text-danger";
    })
    .catch(() => {
      feedback.textContent = "Erreur lors de la modification du mot de passe.";
      feedback.className = "text-danger";
    });
  };

  window.adminEditRole = id => {
    const nvRole = prompt("Entrer 'conducteur', 'passager', ou 'les deux' pour le nouveau rôle :", "");
    if (!nvRole) return;
    fetchJson('asset/PHP/admin_edit_role.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id, role: nvRole })
    })
    .then(data => {
      feedback.textContent = data.success ? "Rôle modifié" : data.error;
      feedback.className = data.success ? "text-success" : "text-danger";
      chargerMembres();
    })
    .catch(() => {
      feedback.textContent = "Erreur lors de la modification du rôle.";
      feedback.className = "text-danger";
    });
  };

  window.adminEditJetons = (id, jetonsActuels) => {
    const nv = prompt(`Nombre de jetons (actuel : ${jetonsActuels})`, jetonsActuels);
    if (nv === null) return;
    if (isNaN(nv) || nv < 0) {
      alert("Veuillez entrer un nombre positif.");
      return;
    }
    fetchJson('asset/PHP/admin_update_jetons.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id, jetons: nv })
    })
    .then(data => {
      feedback.textContent = data.success ? "Jetons modifiés" : data.error;
      feedback.className = data.success ? "text-success" : "text-danger";
      chargerMembres();
    })
    .catch(() => {
      feedback.textContent = "Erreur lors de la modification des jetons.";
      feedback.className = "text-danger";
    });
  };

  // Supprimer un signalement
  window.deleteSignalement = id => {
    if (!confirm("Supprimer ce signalement ?")) return;
    fetchJson('asset/PHP/delete_signalement.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id })
    })
    .then(data => {
      if (data.success) {
        feedback.textContent = "Signalement supprimé.";
        feedback.className = "text-success";
        chargerSignalements();
      } else {
        feedback.textContent = data.error || "Erreur lors de la suppression du signalement.";
        feedback.className = "text-danger";
      }
    })
    .catch(() => {
      feedback.textContent = "Erreur réseau lors de la suppression du signalement.";
      feedback.className = "text-danger";
    });
  };

  // Marquer un signalement comme traité
  window.marquerCommeTraite = id => {
    if (!confirm("Marquer ce signalement comme traité ?")) return;
    fetchJson('asset/PHP/traiter_signalement.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id })
    })
    .then(data => {
      if (data.success) {
        feedback.textContent = data.message;
        feedback.className = "text-success";
        chargerSignalements();
      } else {
        feedback.textContent = data.error || "Erreur lors de la mise à jour.";
        feedback.className = "text-danger";
      }
    })
    .catch(() => {
      feedback.textContent = "Erreur réseau lors de la mise à jour.";
      feedback.className = "text-danger";
    });
  };

  // Écouteurs filtres recherche membres
  [searchInput, roleFilter, statutFilter].forEach(el => {
    el.addEventListener('input', chargerMembres);
    el.addEventListener('change', chargerMembres);
  });

  // Initial load
  chargerMembres();
  chargerSignalements();
  chargerStats();

});
