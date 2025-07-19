// asset/JS/messaging.js
// Gestion de la messagerie privée

document.addEventListener('DOMContentLoaded', () => {
  const userListSelect = document.getElementById('messageDestinataire');
  const messageInput   = document.getElementById('messageTexte');
  const sendBtn        = document.getElementById('sendMessageBtn');
  const messageList    = document.getElementById('messageList');

  // Charger la liste des utilisateurs pour destinataires
  async function loadUsers() {
    try {
      const res = await fetch('./asset/PHP/get_users.php', { credentials: 'include' });
      const data = await res.json();
      if (data.error) {
        console.error('Erreur chargement utilisateurs:', data.error);
        return;
      }
      userListSelect.innerHTML = '';
      data.users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.prenom} ${u.nom}`;
        userListSelect.append(opt);
      });
    } catch (err) {
      console.error('Impossible de charger les utilisateurs:', err);
    }
  }

  // Charger les messages reçus
  async function loadMessages() {
    try {
      const res = await fetch('./asset/PHP/get_messages.php', { credentials: 'include' });
      const data = await res.json();
      if (data.error) {
        console.error('Erreur chargement messages:', data.error);
        return;
      }
      messageList.innerHTML = '';
      data.messages.forEach(m => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        const date = new Date(m.date_sent).toLocaleString();
        li.innerHTML = `<strong>${m.from_prenom} ${m.from_nom}</strong> <em>${date}</em><br>${m.content}`;
        messageList.append(li);
      });
    } catch (err) {
      console.error('Impossible de charger les messages:', err);
    }
  }

  // Envoyer un message
  sendBtn.addEventListener('click', async () => {
    const recipientId = userListSelect.value;
    const content     = messageInput.value.trim();
    if (!recipientId || !content) {
      return alert('Sélectionnez un destinataire et saisissez un message.');
    }
    try {
      const res = await fetch('./asset/PHP/send_message.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_id: parseInt(recipientId,10), content })
      });
      const data = await res.json();
      if (data.error) {
        alert('Erreur envoi: ' + data.error);
      } else {
        messageInput.value = '';
        loadMessages();
      }
    } catch (err) {
      console.error('Erreur réseau envoi message:', err);
      alert('Impossible d\'envoyer le message.');
    }
  });

  // Initialisation
  loadUsers();
  loadMessages();
});
