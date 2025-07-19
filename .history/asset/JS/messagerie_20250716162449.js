document.addEventListener('DOMContentLoaded', () => {
  const conversationsList = document.getElementById('conversationsList');
  const messageThread = document.getElementById('messageThread');
  const messageTexte = document.getElementById('messageTexte');
  const sendBtn = document.getElementById('sendMessageBtn');
  const refreshBtn = document.getElementById('refreshConversations');
  const notifBadge = document.getElementById('notif-badge');  // badge sur la cloche

  if (!conversationsList) {
    console.error("Élément #conversationsList introuvable, arrêt du script.");
    return; // essentiel car sans liste, le chat ne fonctionne pas
  }

  let currentConversationId = null;

  // Désactiver l’envoi tant qu’aucune conversation n’est sélectionnée
  if (messageTexte && sendBtn) {
    messageTexte.disabled = true;
    sendBtn.disabled = true;
  }

  // Charger et afficher la liste des conversations (avec badge)
  function chargerConversations() {
    fetch('asset/PHP/get_messages_recus.php')
      .then(res => {
        if (!res.ok) throw new Error('Erreur réseau');
        return res.json();
      })
      .then(data => {
        conversationsList.innerHTML = '';

        if (!data.conversations || data.conversations.length === 0) {
          conversationsList.innerHTML = '<li class="list-group-item">Aucune conversation</li>';
          currentConversationId = null;
          if (messageThread) messageThread.innerHTML = '<p class="text-muted">Sélectionnez une conversation.</p>';
          if (notifBadge) notifBadge.style.display = 'none';
          if (messageTexte && sendBtn) {
            messageTexte.disabled = true;
            sendBtn.disabled = true;
          }
          return;
        }

        const totalNonLus = data.totalNonLus || 0;

        data.conversations.forEach(conv => {
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

          li.dataset.userid = conv.user_id;
          li.onclick = () => {
            if (currentConversationId === conv.user_id) return;
            currentConversationId = conv.user_id;
            chargerConversation(conv.user_id);
            Array.from(conversationsList.children).forEach(item => {
              item.classList.toggle('active', item === li);
            });
            if (messageTexte && sendBtn) {
              messageTexte.disabled = false;
              sendBtn.disabled = false;
              messageTexte.focus();
            }
          };

          conversationsList.appendChild(li);
        });

        if (notifBadge) {
          notifBadge.textContent = totalNonLus;
          notifBadge.style.display = totalNonLus > 0 ? '' : 'none';
        }

        if (!currentConversationId && data.conversations.length > 0) {
          currentConversationId = data.conversations[0].user_id;
          if (conversationsList.children[0]) {
            conversationsList.children[0].classList.add('active');
          }
          chargerConversation(currentConversationId);
          if (messageTexte && sendBtn) {
            messageTexte.disabled = false;
            sendBtn.disabled = false;
          }
        }
      })
      .catch(() => {
        conversationsList.innerHTML = '<li class="list-group-item text-danger">Erreur de chargement</li>';
        if (messageThread) messageThread.innerHTML = '<p class="text-muted">Impossible de charger les conversations.</p>';
        if (notifBadge) notifBadge.style.display = 'none';
        if (messageTexte && sendBtn) {
          messageTexte.disabled = true;
          sendBtn.disabled = true;
        }
      });
  }

  // Charger messages d'une conversation
  function chargerConversation(userId) {
    if (!userId) {
      if (messageThread) messageThread.innerHTML = '<p class="text-muted">Sélectionnez une conversation.</p>';
      if (messageTexte && sendBtn) {
        messageTexte.disabled = true;
        sendBtn.disabled = true;
      }
      return;
    }
    fetch('asset/PHP/get_messages.php?with=' + encodeURIComponent(userId))
      .then(res => {
        if (!res.ok) throw new Error('Erreur réseau');
        return res.json();
      })
      .then(data => {
        if (!messageThread) return;
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
        if (messageThread) messageThread.innerHTML = '<p class="text-danger">Erreur lors du chargement des messages.</p>';
      });
  }

  // Envoyer un message
  if (sendBtn) {
    sendBtn.onclick = () => {
      const destinataire = currentConversationId;
      const message = messageTexte.value.trim();
      if (!message || !destinataire) {
        alert('Veuillez sélectionner une conversation et écrire un message.');
        return;
      }

      fetch('asset/PHP/envoyer_message.php', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinataire_id: destinataire, message })
      })
        .then(res => {
          if (!res.ok) throw new Error('Erreur réseau');
          return res.json();
        })
        .then(data => {
          if (data.success) {
            messageTexte.value = '';
            chargerConversation(destinataire);
            chargerConversations(); // rafraîchir la liste et le badge
          } else {
            alert(data.error || 'Erreur lors de l\'envoi');
          }
        })
        .catch(() => alert('Erreur réseau'));
    };
  }

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

  // Premier chargement
  chargerConversations();
});
