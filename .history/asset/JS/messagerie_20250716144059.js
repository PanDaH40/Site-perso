document.addEventListener('DOMContentLoaded', () => {

  const select = document.getElementById('messageDestinataire');
  const messageThread = document.getElementById('messageThread');
  const refreshBtn = document.getElementById('refreshConversations');

  // Charger la liste des conversations (interlocuteurs avec badge de non lus)
  function chargerConversations() {
    fetch('asset/PHP/get_messages_recus.php')
      .then(res => res.json())
      .then(data => {
        if (!select) return;
        select.innerHTML = '';
        (data.conversations || []).forEach(conv => {
          const opt = document.createElement('option');
          opt.value = conv.id;
          opt.textContent = `${conv.prenom} ${conv.nom}`;
          if (conv.badge && conv.badge > 0) {
            opt.textContent += ` (${conv.badge})`;
            opt.style.fontWeight = 'bold';
          }
          select.appendChild(opt);
        });
        // Si aucune conversation sélectionnée, sélectionne la première
        if (!select.value && select.options.length > 0) {
          select.value = select.options[0].value;
        }
        // Charge la conversation active
        if (select.value) chargerConversation(select.value);
      });
  }

  // Charger une conversation précise
  function chargerConversation(destinataireId) {
    if (!messageThread) return;
    fetch('asset/PHP/get_conversation.php?with=' + destinataireId)
      .then(res => res.json())
      .then(data => {
        messageThread.innerHTML = '';
        (data.messages || []).forEach(m => {
          const div = document.createElement('div');
          div.className = 'mb-2 ' + (m.from_me ? 'text-end' : 'text-start');
          div.innerHTML = `<span class="badge ${m.from_me ? 'bg-success' : 'bg-secondary'}">${m.texte}</span><br>
            <small class="text-muted">${m.date}</small>`;
          messageThread.appendChild(div);
        });
        messageThread.scrollTop = messageThread.scrollHeight;
      });
  }

  // Envoi de message
  document.getElementById('sendMessageBtn').onclick = function() {
    const destinataire = select.value;
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
        chargerConversations(); // Met à jour badges après envoi
      } else {
        alert(data.error || "Erreur lors de l'envoi");
      }
    });
  };

  // Changement de destinataire : charger la conversation
  if (select) {
    select.addEventListener('change', function() {
      chargerConversation(this.value);
    });
  }

  // Bouton rafraîchir conversation
  if (refreshBtn) {
    refreshBtn.onclick = function() {
      const destinataire = select.value;
      if (destinataire) chargerConversation(destinataire);
    };
  }

  // Initialisation
  chargerConversations();

  // Optionnel : auto rafraîchir toutes les 30s (messages, conversations)
  setInterval(() => {
    chargerConversations();
    if (select && select.value) chargerConversation(select.value);
  }, 30000);

});
