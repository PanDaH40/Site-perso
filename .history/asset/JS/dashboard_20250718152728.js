let trajetsProposesMemo = [];

document.addEventListener('DOMContentLoaded', () => {
  chargerDashboard();
  mettreAJourNotificationMessages();
  chargerTrajetsAValider();

  // Déconnexion
  document.querySelectorAll('#logoutBtn').forEach(btn =>
    btn.addEventListener('click', () => {
      fetch('asset/PHP/logout.php', { method: 'POST', credentials: 'include' })
        .then(() => window.location.href = 'PageDaccueil.html')
        .catch(() => alert('Erreur lors de la déconnexion'));
    })
  );

  // Modal validation / signalement
  const validationModal = document.getElementById('validationFormModal');
  let modalInstance = null;
  let isSignalement = false;

  if (validationModal) {
    modalInstance = new bootstrap.Modal(validationModal);

    // Switch validation / signalement
    document.getElementById('switchSignalement').onclick = function(e) {
      e.preventDefault();
      isSignalement = !isSignalement;
      document.getElementById('bloc-valider-trajet').style.display = isSignalement ? "none" : "";
      document.getElementById('bloc-signalement').style.display = isSignalement ? "" : "none";
      document.getElementById('switchSignalement').textContent = isSignalement
        ? "Retour à la validation" : "Signaler un problème";
      document.getElementById('validation-feedback').textContent = "";
    };

    // Formulaire de validation / signalement
    document.getElementById('formValidationTrajet').onsubmit = async function(e) {
      e.preventDefault();
      document.getElementById('validation-feedback').textContent = "";
      const reservation_id = document.getElementById('reservationIdValider').value;
      if (!reservation_id) return;

      if (isSignalement) {
        const commentaire = document.getElementById('commentaire-probleme').value.trim();
        if (commentaire.length < 10) {
          document.getElementById('validation-feedback').textContent =
            "Merci d'expliquer le problème (au moins 10 caractères)";
          return;
        }
        try {
          const res = await fetch('asset/PHP/valider_trajet_passager.php', {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ reservation_id, action: 'probleme', commentaire })
          });
          const data = await res.json();
          if (data.success) {
            document.getElementById('validation-feedback').textContent = "Votre signalement a bien été transmis à l'équipe.";
            setTimeout(() => {
              modalInstance.hide();
              chargerTrajetsAValider();
            }, 1500);
          } else {
            document.getElementById('validation-feedback').textContent = data.error || "Erreur lors de l'envoi.";
          }
        } catch {
          document.getElementById('validation-feedback').textContent = "Erreur technique lors de l'envoi.";
        }
        return;
      }

      // Validation normale avec note et avis
      const note = document.getElementById('note').value;
      if (!note) {
        document.getElementById('validation-feedback').textContent = "Merci de donner une note.";
        return;
      }
      const avis = document.getElementById('avis').value.trim();

      try {
        const res = await fetch('asset/PHP/valider_trajet_passager.php', {
          method: 'POST',
          credentials: 'include',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ reservation_id, action: 'valider', note, avis })
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById('validation-feedback').textContent = "Merci pour votre retour ! Le trajet est validé.";
          setTimeout(() => {
            modalInstance.hide();
            chargerTrajetsAValider();
            chargerDashboard();
          }, 1500);
        } else {
          document.getElementById('validation-feedback').textContent = data.error || "Erreur lors de la validation.";
        }
      } catch {
        document.getElementById('validation-feedback').textContent = "Erreur technique lors de la validation.";
      }
    };
  }

  setInterval(mettreAJourNotificationMessages, 30000);
});

// Notification messages non lus
function mettreAJourNotificationMessages() {
  const notifBadge = document.getElementById('notif-badge');
  if (!notifBadge) return;

  fetch('asset/PHP/get_messages_recus.php', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      const totalNonLus = data.totalNonLus || 0;
      notifBadge.textContent = totalNonLus;
      notifBadge.style.display = totalNonLus > 0 ? 'inline-block' : 'none';
    })
    .catch(() => { notifBadge.style.display = 'none'; });
}

function chargerDashboard() {
  fetch('asset/PHP/trajets.php?dashboard=1', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      afficherStats(data);
      afficherTrajetsProposes(data.trajets_proposes || []);
      afficherTrajetsReserves(data.trajets_reserves || []);
      afficherDemandesReservations(data.demandes_en_attente || []);

      trajetsProposesMemo = data.trajets_proposes || [];
      if (data.user_prenom && document.getElementById('userFirstName'))
        document.getElementById('userFirstName').textContent = data.user_prenom;
    })
    .catch(() => alert("Erreur lors du chargement du dashboard"));
}

// ... (les autres fonctions que tu as déjà)

async function chargerTrajetsAValider() {
  try {
    const res = await fetch('asset/PHP/get_trajets_a_valider.php', { credentials: 'include' });
    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return;
    }
    const container = document.getElementById('trajets-a-valider');
    if (!container) return;
    container.innerHTML = '';
    if (!data.trajets_a_valider || data.trajets_a_valider.length === 0) {
      container.textContent = 'Aucun trajet à valider pour l’instant.';
      return;
    }
    data.trajets_a_valider.forEach(trajet => {
      const div = document.createElement('div');
      div.className = 'trajet-validation mb-3 p-3 border rounded';
      div.innerHTML = `
        <p><strong>Date:</strong> ${trajet.date} ${trajet.heure}<br>
        <strong>De:</strong> ${trajet.depart} <strong>À:</strong> ${trajet.arrivee}</p>
        <button class="btn btn-success btn-valider" data-reservation-id="${trajet.reservation_id}">Valider ou Signaler</button>
      `;
      container.appendChild(div);
    });
    container.querySelectorAll('.btn-valider').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const reservationId = btn.getAttribute('data-reservation-id');
        ouvrirModalValidation(reservationId);
      });
    });
  } catch (e) {
    alert('Erreur lors du chargement des trajets à valider.');
    console.error(e);
  }
}

function ouvrirModalValidation(reservation_id) {
  document.getElementById('reservationIdValider').value = reservation_id;
  document.getElementById('bloc-valider-trajet').style.display = "";
  document.getElementById('bloc-signalement').style.display = "none";
  document.getElementById('switchSignalement').textContent = "Signaler un problème";
  document.getElementById('note').value = "";
  document.getElementById('avis').value = "";
  document.getElementById('commentaire-probleme').value = "";
  document.getElementById('validation-feedback').textContent = "";
  if (window.bootstrap) {
    const modal = new bootstrap.Modal(document.getElementById('validationFormModal'));
    modal.show();
  }
}
