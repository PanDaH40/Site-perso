document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('messageDestinataire');
  const ulConvs = document.getElementById('conversationsList');

  // Charger uniquement les conversations existantes
  fetch('asset/PHP/get_conversations.php')
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      select.innerHTML = '';
      ulConvs.innerHTML = '';

      data.conversations.forEach(u => {
        // Option dans select
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.prenom} ${u.nom}`;
        select.appendChild(opt);

        // Liste des conversations à gauche
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `<a href="?with=${u.id}">${u.prenom} ${u.nom}</a>`;
        ulConvs.appendChild(li);
      });

      // Charger la conversation du premier interlocuteur si existant
      if (data.conversations.length > 0) {
        chargerConversation(data.conversations[0].id);
      }
    });

  // Envoi, chargement conversation, etc. (le reste de ton messagerie.js)
  // ...
});
