document.addEventListener('DOMContentLoaded', () => {
  const userList   = document.getElementById('userList');
  const chatWindow = document.getElementById('chatWindow');
  const msgInput   = document.getElementById('messageInput');
  const sendBtn    = document.getElementById('sendBtn');
  let currentWith  = null;

  // 1) Charger tous les utilisateurs
  fetch('./asset/PHP/list_users.php', { credentials:'same-origin' })
    .then(r => r.json())
    .then(data => {
      data.users.forEach(u => {
        const li = document.createElement('li');
        li.className = 'list-group-item list-group-item-action';
        li.textContent = `${u.prenom} ${u.nom}`;
        li.dataset.id = u.id;
        li.addEventListener('click', () => selectUser(li));
        userList.append(li);
      });
    });

  function selectUser(li) {
    userList.querySelectorAll('li').forEach(x => x.classList.remove('active'));
    li.classList.add('active');
    currentWith = li.dataset.id;
    loadChat(currentWith);
  }

  // 2) Charger ou créer la conversation
  function loadChat(withId) {
    fetch(`./asset/PHP/get_messages.php?with=${withId}`, { credentials:'same-origin' })
      .then(r => r.json())
      .then(data => {
        chatWindow.innerHTML = '';
        (data.messages || []).forEach(m => {
          const div = document.createElement('div');
          div.className = m.sender_id == withId ? 'text-start mb-2' : 'text-end mb-2';
          div.innerHTML = `<small>${m.sender_prenom} :</small> ${m.content}`;
          chatWindow.append(div);
        });
        chatWindow.scrollTop = chatWindow.scrollHeight;
      });
  }

  // 3) Envoi d’un message
  sendBtn.addEventListener('click', () => {
    if (!currentWith) {
      return alert('Sélectionnez d’abord un destinataire.');
    }
    const content = msgInput.value.trim();
    if (!content) return;
    fetch('./asset/PHP/send_message.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: currentWith, content })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        msgInput.value = '';
        loadChat(currentWith);
      } else {
        alert(res.error);
      }
    });
  });
});
