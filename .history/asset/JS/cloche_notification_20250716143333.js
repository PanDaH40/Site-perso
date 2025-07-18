function checkNewMessages() {
  fetch('asset/PHP/messages_reçus.php')
    .then(r => r.json())
    .then(data => {
      const totalNonLus = data.conversations
        ? data.conversations.reduce((sum, conv) => sum + (conv.non_lus || 0), 0)
        : 0;
      const badge = document.getElementById('badge-msg');
      if (badge) {
        badge.textContent = totalNonLus;
        badge.style.display = totalNonLus > 0 ? '' : 'none';
      }
    });
}
// À appeler au chargement, puis toutes les 30s par exemple :
setInterval(checkNewMessages, 30000);
document.addEventListener('DOMContentLoaded', checkNewMessages);
