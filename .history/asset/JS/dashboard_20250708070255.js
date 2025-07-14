document.addEventListener("DOMContentLoaded", () => {
  const proposesBody = document.querySelector("#trajets-proposes tbody");
  const reservesBody = document.querySelector("#trajets-reserves tbody");

  if (proposesBody) proposesBody.innerHTML = "";
  if (reservesBody) reservesBody.innerHTML = "";

  fetch('./asset/PHP/trajets.php', { credentials: 'same-origin' })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("Erreur : " + data.error);
        return;
      }

      if (proposesBody) {
        if (data.trajets_proposes.length === 0) {
          proposesBody.innerHTML = `<tr><td colspan="5">Aucun trajet proposé.</td></tr>`;
        } else {
          data.trajets_proposes.forEach(t => {
            proposesBody.innerHTML += `
              <tr>
                <td>${t.date} ${t.heure}</td>
                <td>${t.depart}</td>
                <td>${t.arrivee}</td>
                <td>${t.places}</td>
                <td>${t.statut}</td>
              </tr>
            `;
          });
        }
      }

      if (reservesBody) {
        if (data.trajets_reserves.length === 0) {
          reservesBody.innerHTML = `<tr><td colspan="5">Aucun trajet réservé.</td></tr>`;
        } else {
          data.trajets_reserves.forEach(t => {
            reservesBody.innerHTML += `
              <tr>
                <td>${t.date} ${t.heure}</td>
                <td>${t.depart}</td>
                <td>${t.arrivee}</td>
                <td>${t.conducteur_prenom} ${t.conducteur_nom}</td>
                <td>${t.statut}</td>
              </tr>
            `;
          });
        }
      }
    })
    .catch(err => {
      console.error("Erreur fetch trajets:", err);
      alert("Erreur lors du chargement des trajets.");
    });
});
