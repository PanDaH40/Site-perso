document.addEventListener('DOMContentLoaded', () => {
  const conversationsList = document.getElementById('conversationsList');
  const messageThread = document.getElementById('messageThread');
  const messageTexte = document.getElementById('messageTexte');
  const sendBtn = document.getElementById('sendMessageBtn');
  const refreshBtn = document.getElementById('refreshConversations');
  const notifBadge = document.getElementById('badge-msg');

  let currentConversationId = null;

  // Charger la liste des conversations (personnes qui ont envoyé un message)
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

          li.dataset.userid = conv.user_id || conv.id || 0;
          li.onclick = () => {
            if (currentConversationId === li.dataset.userid) return;
            currentConversationId = li.dataset.userid;
            chargerConversation(currentConversationId);
            Array.from(conversationsList.children).forEach(item => {
              item.classList.toggle('active', item === li);
            });
          };

          conversationsList.appendChild(li);
        });

        // Mettre à jour badge global
        if (notifBadge) {
          notifBadge.textContent = totalNonLus;
          notifBadge.style.display = totalNonLus > 0 ? '' : 'none';
        }

        // Sélectionner la première conversation si aucune sélection
        if (!currentConversationId && data.conversations.length > 0) {
          currentConversationId = data.conversations[0].user_id || data.conversations[0].id;
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

  // Charger messages d’une conversation
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
        messageThread.innerHTML = '<p class="text-danger">Erreur lors du
