function checkNewMessages() {
  const accessKey = sessionStorage.getItem('accessKey');
  fetch(`asset/PHP/get_messages_recus.php?key=${encodeURIComponent(accessKey)}`)
    .then(r => r.json())
    .then(data => {
      const totalNonLus = data.conversations
        ? data.conversations.reduce((sum, conv) => sum + (conv.badge || 0), 0)
        : 0;
      const badge = document.getElementById('badge-msg');
      if (badge) {
        badge.textContent = totalNonLus;
        badge.style.display = totalNonLus > 0 ? '' : 'none';
      }
    });
}

setInterval(checkNewMessages, 30000);
document.addEventListener('DOMContentLoaded', checkNewMessages);
