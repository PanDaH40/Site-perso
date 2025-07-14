window.addEventListener('DOMContentLoaded', () => {
  const userStatus = document.getElementById('userStatus');
  const proposesBody = document.querySelector('#trajets-proposes tbody');
  const reservesBody = document.querySelector('#trajets-reserves tbody');
  const editModal = new bootstrap.Modal(document.getElementById('editTrajetModal'));
  const editForm = document.getElementById('editTrajetForm');

  fetch('./asset/PHP/check_session.php', { credentials: 'same-origin' })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(text => {
      if (!text) throw new Error('Vide');
      return JSON.parse(text);
    })
    .then(data => {
      if (data.connected) {
        if (userStatus) userStatus.textContent = `Connecté en tant que ${data.user.prenom}`;
        chargerTrajets();
      } else if (userStatus) {
        userStatus.textContent = 'Non connecté';
      }
    })
    .catch(err => {
      console.error('Erreur session:', err);
      if (userStatus) userStatus.textContent = 'Erreur session';
    });

  function chargerTrajets() {
    if (proposesBody) proposesBody.innerHTML = '';
    if (reservesBody) reservesBody.innerHTML = '';

    fetch('./asset/PHP/trajets.php', { credentials: 'same-origin' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(text => {
        if (!text) throw new Error('Vide');
        return JSON.parse(text);
      })
      .then(data => {
        if (data.error) { alert('Erreur: '+data.error); return; }
        (data.trajets_proposes || []).forEach(t => {
          const row = document.createElement('tr');
          const statut = t.total_reservations>0
            ? `${t.total_reservations} réservées<br>${t.reservataires}`
            : 'Aucune';
          row.innerHTML = `
            <td>${t.date} ${t.heure}</td>
            <td>${t.depart}</td>
            <td>${t.arrivee}</td>
            <td>${t.places}</td>
            <td>${statut}</td>
            <td><button class="btn btn-sm btn-outline-primary" data-id="${t.id}" data-action="edit">✏️</button>
                <button class="btn btn-sm btn-outline-danger" data-id="${t.id}" data-action="delete">🗑️</button></td>
          `;
          proposesBody.appendChild(row);
        });
        (data.trajets_reserves||[]).forEach(t=>{
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${t.date} ${t.heure}</td>
            <td>${t.depart}</td>
            <td>${t.arrivee}</td>
            <td>${t.conducteur_prenom} ${t.conducteur_nom}</td>
            <td>${t.statut}</td>
            <td><button class="btn btn-sm btn-outline-warning" data-id="${t.id}" data-action="cancel">❌</button></td>
          `;
          reservesBody.appendChild(row);
        });
      })
      .catch(err=>{ console.error('Erreur fetch:',err); alert('Erreur chargement: '+err.message); });
  }

  document.body.addEventListener('click', e=>{
    const btn = e.target.closest('button[data-action]'); if(!btn) return;
    const action=btn.dataset.action, id=btn.dataset.id, row=btn.closest('tr');
    if(action==='edit'){const cells=row.querySelectorAll('td'); editForm.trajetId.value=id; editForm.editDate.value=cells[0].textContent.split(' ')[0]; editForm.editHeure.value=cells[0].textContent.split(' ')[1]; editForm.editDepart.value=cells[1].textContent; editForm.editArrivee.value=cells[2].textContent; editForm.editPlaces.value=cells[3].textContent; editModal.show();}
    if(action==='delete'&&confirm('Supprimer?')) fetch('./asset/PHP/delete_trajet.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}).then(r=>r.json()).then(d=>d.success?chargerTrajets():alert('Err:'+d.error));
    if(action==='cancel'&&confirm('Annuler?')) fetch('./asset/PHP/annuler_reservation.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}).then(r=>r.json()).then(d=>d.success?chargerTrajets():alert('Err:'+d.error));
  });

  if(editForm) editForm.addEventListener('submit',e=>{e.preventDefault();fetch('./asset/PHP/update_trajet.php',{method:'POST',body:new FormData(editForm)}).then(r=>r.json()).then(d=>d.success?(editModal.hide(),chargerTrajets()):alert('Err:'+d.error)).catch(err=>alert('Err serv'));});
});
