function checkNewMessages() {
  const accessKey = sessionStorage.getItem('accessKey');
  if (!accessKey) {
    // Pas de clé, on masque le badge si présent
    const badge = document.getElementById('badge-msg');
    if (badge) {
      badge.textContent = '';
      badge.style.display = 'none';
    }
    return;
  }

  fetch(`/PHP/get_messages_recus.php?key=${encodeURIComponent(accessKey)}`)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP error ${r.status}`);
      return r.json();
    })
    .then(data => {
      const totalNonLus = Array.isArray(data.conversations)
        ? data.conversations.reduce((sum, conv) => sum + (conv.badge || 0), 0)
        : 0;
      const badge = document.getElementById('badge-msg');
      if (badge) {
        badge.textContent = totalNonLus > 0 ? totalNonLus : '';
        badge.style.display = totalNonLus > 0 ? '' : 'none';
      }
    })
    .catch(err => {
      console.error('Erreur lors de la récupération des messages :', err);
      // Optionnel : masquer le badge en cas d’erreur
      const badge = document.getElementById('badge-msg');
      if (badge) {
        badge.textContent = '';
        badge.style.display = 'none';
      }
    });
}

setInterval(checkNewMessages, 30000);
document.addEventListener('DOMContentLoaded', checkNewMessages);


// function checkNewMessages() {
//   const accessKey = sessionStorage.getItem('accessKey');
//   fetch(`asset/PHP/get_messages_recus.php?key=${encodeURIComponent(accessKey)}`)
//     .then(r => r.json())
//     .then(data => {
//       const totalNonLus = data.conversations
//         ? data.conversations.reduce((sum, conv) => sum + (conv.badge || 0), 0)
//         : 0;
//       const badge = document.getElementById('badge-msg');
//       if (badge) {
//         badge.textContent = totalNonLus;
//         badge.style.display = totalNonLus > 0 ? '' : 'none';
//       }
//     });
// }

// setInterval(checkNewMessages, 30000);
// document.addEventListener('DOMContentLoaded', checkNewMessages);
