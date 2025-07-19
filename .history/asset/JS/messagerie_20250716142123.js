document.addEventListener('DOMContentLoaded', () => {
  // Charger la liste des utilisateurs (destinataires)
  fetch('asset/PHP/get_users.php')
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('messageDestinataire');
      select.innerHTML = '';
      data.users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.prenom} ${u.nom}`;
        select.appendChild(opt);
      });
    });

  // Gestion de l'envoi
  document.getElementById('sendMessageBtn').onclick = function() {
    const destinataire = document.getElementById('messageDestinataire').value;
    const message = document.getElementById('messageTexte').value.trim();
    if (!message || !destinataire) return;
    fetch('asset/PHP/envoyer_message.php', {
      method: 'POST',
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ destinataire_id: destinataire, message })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        document.getElementById('messageTexte').value = '';
        chargerConversation(destinataire);
      } else {
        alert(data.error || "Erreur lors de l'envoi");
      }
    });
  };

  // Afficher une conversation
  document.getElementById('messageDestinataire').addEventListener('change', function() {
    chargerConversation(this.value);
  });

  function chargerConversation(destinataireId) {
    fetch('asset/PHP/get_conversation.php?with=' + destinataireId)
      .then(res => res.json())
      .then(data => {
        const thread = document.getElementById('messageThread');
        thread.innerHTML = '';
        (data.messages || []).forEach(m => {
          const div = document.createElement('div');
          div.className = 'mb-2 ' + (m.from_me ? 'text-end' : 'text-start');
          div.innerHTML = `<span class="badge ${m.from_me ? 'bg-success' : 'bg-secondary'}">${m.texte}</span><br>
            <small class="text-muted">${m.date}</small>`;
          thread.appendChild(div);
        });
        thread.scrollTop = thread.scrollHeight;
      });
  }

  // Rafraîchissement manuel (ou auto)
  document.getElementById('refreshConversations').onclick = function() {
    const destinataire = document.getElementById('messageDestinataire').value;
    if (destinataire) chargerConversation(destinataire);
  };

  // Initial load
  setTimeout(() => {
    const first = document.getElementById('messageDestinataire').value;
    if (first) chargerConversation(first);
  }, 500);
});
