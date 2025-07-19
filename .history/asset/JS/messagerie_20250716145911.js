document.addEventListener('DOMContentLoaded', () => {
  const conversationsList = document.getElementById('conversationsList');
  const messageThread = document.getElementById('messageThread');
  const messageTexte = document.getElementById('messageTexte');
  const sendBtn = document.getElementById('sendMessageBtn');
  const refreshBtn = document.getElementById('refreshConversations');
  const notifBadge = document.getElementById('badge-msg');

  let currentConversationId = null;

  // Charger et afficher la liste des conversations (uniquement utilisateurs ayant envoyé un message)
  function chargerConversations() {
    fetch('asset/PHP/get_messages_recus.php')
      .then(res => res.json())
      .then(data => {
        conversationsList.innerHTML = '';
        if (!data.conversations || data.conversations.length === 0) {
          conversationsList.innerHTML = '<li class="list-group-item">Aucune conversation</li>';
          currentConversationId = null;
          messageThread.innerHTML = '<p class="text-muted">Sélectionnez une conversation.</p>';
          if (notifBadge) notifBadge.style.display = 'none';
          return;
        }

        let totalNonLus = 0;

        data.conversations.forEach(conv => {
          // Garde tous les interlocuteurs qui ont au moins un message
          totalNonLus += conv.badge || 0;

          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          li.style.cursor = 'pointer';
          li.textContent = `${conv.prenom} ${conv.nom}`;

          if (conv.badge && conv.badge > 0) {
            const badge = document.createElement('span');
            badge.className = 'badge bg-danger rounded-pill';
            badge.textContent = conv.badge;
            li.appendChild(badge);
          }

          li.dataset.userid = conv.id;
          li.onclick = () => {
            if (currentConversationId === conv.id) return;
            currentConversationId = conv.id;
            chargerConversation(conv.id);
            Array.from(conversationsList.children).forEach(item => {
              item.classList.toggle('active', item === li);
            });
          };

          conversationsList.appendChild(li);
        });

        // Mise à jour badge global
        if (notifBadge) {
          notifBadge.textContent = totalNonLus;
          notifBadge.style.display = totalNonLus > 0 ? '' : 'none';
        }

        // Sélection automatique de la première conversation si aucune sélection
        if (!currentConversationId && data.conversations.length > 0) {
          currentConversationId = data.conversations[0].id;
          conversationsList.children[0].classList.add('active');
          chargerConversation(currentConversationId);
        }
      })
      .catch(() => {
        conversationsList.innerHTML = '<li class="list-group-item text-danger">Erreur de chargement</li>';
        messageThread.innerHTML = '<p class="text-muted">Impossible de charger les conversations.</p>';
        if (notifBadge) notifBadge.style.display = 'none';
      });
  }

  // Charger une conversation spécifique
  function chargerConversation(userId) {
    if (!userId) {
      messageThread.innerHTML = '<p class="text-muted">Sélectionnez une conversation.</p>';
      return;
    }
    fetch('asset/PHP/get_conversation.php?with=' + encodeURIComponent(userId))
      .then(res => res.json())
      .then(data => {
        messageThread.innerHTML = '';
        if (!data.messages || data.messages.length === 0) {
          messageThread.innerHTML = '<p class="text-muted">Aucun message dans cette conversation.</p>';
          return;
        }
        data.messages.forEach(m => {
          const div = document.createElement('div');
          div.className = 'mb-2 ' + (m.from_me ? 'text-end' : 'text-start');
          div.innerHTML = `
            <span class="badge ${m.from_me ? 'bg-success' : 'bg-secondary'}">${m.texte}</span><br>
            <small class="text-muted">${m.date}</small>`;
          messageThread.appendChild(div);
        });
        messageThread.scrollTop = messageThread.scrollHeight;
      })
      .catch(() => {
        messageThread.innerHTML = '<p class="text-danger">Erreur lors du chargement des messages.</p>';
      });
  }

  // Envoi d’un message
  sendBtn.onclick = () => {
    const destinataire = currentConversationId;
    const message = messageTexte.value.trim();
    if (!message || !destinataire) return alert('Veuillez sélectionner une conversation et écrire un message.');

    fetch('asset/PHP/envoyer_message.php', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataire_id: destinataire, message })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        messageTexte.value = '';
        chargerConversation(destinataire);
        chargerConversations(); // Rafraîchir la liste et badges
      } else {
        alert(data.error || 'Erreur lors de l\'envoi');
      }
    })
    .catch(() => alert('Erreur réseau'));
  };

  // Rafraîchir conversation manuellement
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      if (currentConversationId) chargerConversation(currentConversationId);
    };
  }

  // Auto-refresh toutes les 30 secondes
  setInterval(() => {
    chargerConversations();
    if (currentConversationId) chargerConversation(currentConversationId);
  }, 30000);

  // Initialisation
  chargerConversations();
});
