document.addEventListener('DOMContentLoaded', () => {
  // Sélecteurs DOM des éléments principaux
  const conversationsList = document.getElementById('conversationsList');
  const messageThread = document.getElementById('messageThread');
  const messageTexte = document.getElementById('messageTexte');
  const sendBtn = document.getElementById('sendMessageBtn');
  const refreshBtn = document.getElementById('refreshConversations');
  const notifBadge = document.getElementById('badge-msg');

  // ID de la conversation actuellement sélectionnée
  let currentConversationId = null;

  // Désactive l'envoi de message tant qu'aucune conversation n'est sélectionnée
  if (messageTexte && sendBtn) {
    messageTexte.disabled = true;
    sendBtn.disabled = true;
  }

  /**
   * Charge et affiche la liste des conversations avec badges de messages non lus
   */
  function chargerConversations() {
    fetch('asset/PHP/get_messages_recus.php')
      .then(res => {
        if (!res.ok) throw new Error('Erreur réseau');
        return res.json();
      })
      .then(data => {
        conversationsList.innerHTML = '';

        // Cas où il n'y a aucune conversation
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

        // Nombre total de messages non lus (pour badge global)
        const totalNonLus = data.totalNonLus || 0;

        // Création des éléments de la liste des conversations
        data.conversations.forEach(conv => {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          li.style.cursor = 'pointer';
          li.textContent = `${conv.prenom} ${conv.nom}`;

          // Badge de messages non lus par conversation
          if (conv.badge && conv.badge > 0) {
            const badge = document.createElement('span');
            badge.className = 'badge bg-danger rounded-pill';
            badge.textContent = conv.badge;
            li.appendChild(badge);
          }

          li.dataset.userid = conv.user_id;

          // Gestion du clic sur une conversation
          li.onclick = () => {
            if (currentConversationId === conv.user_id) return; // Pas de rechargement si déjà sélectionné
            currentConversationId = conv.user_id;
            chargerConversation(conv.user_id);

            // Mise à jour visuelle de la sélection
            Array.from(conversationsList.children).forEach(item => {
              item.classList.toggle('active', item === li);
            });

            // Activation du champ message et bouton d'envoi
            if (messageTexte && sendBtn) {
              messageTexte.disabled = false;
              sendBtn.disabled = false;
              messageTexte.focus();
            }
          };

          conversationsList.appendChild(li);
        });

        // Mise à jour du badge global (cloche)
        if (notifBadge) {
          notifBadge.textContent = totalNonLus;
          notifBadge.style.display = totalNonLus > 0 ? '' : 'none';
        }

        // Sélection automatique de la première conversation si aucune sélection
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
        // Gestion des erreurs réseau ou serveur
        conversationsList.innerHTML = '<li class="list-group-item text-danger">Erreur de chargement</li>';
        if (messageThread) messageThread.innerHTML = '<p class="text-muted">Impossible de charger les conversations.</p>';
        if (notifBadge) notifBadge.style.display = 'none';
        if (messageTexte && sendBtn) {
          messageTexte.disabled = true;
          sendBtn.disabled = true;
        }
      });
  }

  /**
   * Charge et affiche les messages d'une conversation donnée
   * @param {string} userId - ID de l'utilisateur avec qui la conversation est ouverte
   */
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

        // Affiche chaque message avec style selon l'expéditeur
        data.messages.forEach(m => {
          const div = document.createElement('div');
          div.className = 'mb-2 ' + (m.from_me ? 'text-end' : 'text-start');
          div.innerHTML = `
            <span class="badge ${m.from_me ? 'bg-success' : 'bg-secondary'}">${m.texte}</span><br>
            <small class="text-muted">${m.date}</small>`;
          messageThread.appendChild(div);
        });

        // Scroll automatique vers le bas pour voir les derniers messages
        messageThread.scrollTop = messageThread.scrollHeight;
      })
      .catch(() => {
        if (messageThread) messageThread.innerHTML = '<p class="text-danger">Erreur lors du chargement des messages.</p>';
      });
  }

  // Gestion de l'envoi de message
  if (sendBtn) {
    sendBtn.onclick = () => {
      const destinataire = currentConversationId;
      const message = messageTexte.value.trim();

      // Validation simple avant envoi
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
            // Réinitialise le champ message et recharge la conversation + liste
            messageTexte.value = '';
            chargerConversation(destinataire);
            chargerConversations();
          } else {
            alert(data.error || 'Erreur lors de l\'envoi');
          }
        })
        .catch(() => alert('Erreur réseau'));
    };
  }

  // Bouton de rafraîchissement manuel des messages
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      if (currentConversationId) chargerConversation(currentConversationId);
    };
  }

  // Rafraîchissement automatique toutes les 30 secondes
  setInterval(() => {
    chargerConversations();
    if (currentConversationId) chargerConversation(currentConversationId);
  }, 30000);

  // Chargement initial des conversations
  chargerConversations();
});




// document.addEventListener('DOMContentLoaded', () => {
//   const conversationsList = document.getElementById('conversationsList');
//   const messageThread = document.getElementById('messageThread');
//   const messageTexte = document.getElementById('messageTexte');
//   const sendBtn = document.getElementById('sendMessageBtn');
//   const refreshBtn = document.getElementById('refreshConversations');
//   const notifBadge = document.getElementById('badge-msg');

//   let currentConversationId = null;

//   // Désactiver envoi tant qu’aucune conversation n’est sélectionnée
//   if (messageTexte && sendBtn) {
//     messageTexte.disabled = true;
//     sendBtn.disabled = true;
//   }

//   // Charger et afficher la liste des conversations (avec badge)
//   function chargerConversations() {
//     fetch('asset/PHP/get_messages_recus.php')
//       .then(res => {
//         if (!res.ok) throw new Error('Erreur réseau');
//         return res.json();
//       })
//       .then(data => {
//         conversationsList.innerHTML = '';
//         if (!data.conversations || data.conversations.length === 0) {
//           conversationsList.innerHTML = '<li class="list-group-item">Aucune conversation</li>';
//           currentConversationId = null;
//           if (messageThread) messageThread.innerHTML = '<p class="text-muted">Sélectionnez une conversation.</p>';
//           if (notifBadge) notifBadge.style.display = 'none';
//           if (messageTexte && sendBtn) {
//             messageTexte.disabled = true;
//             sendBtn.disabled = true;
//           }
//           return;
//         }

//         const totalNonLus = data.totalNonLus || 0;

//         data.conversations.forEach(conv => {
//           const li = document.createElement('li');
//           li.className = 'list-group-item d-flex justify-content-between align-items-center';
//           li.style.cursor = 'pointer';
//           li.textContent = `${conv.prenom} ${conv.nom}`;

//           if (conv.badge && conv.badge > 0) {
//             const badge = document.createElement('span');
//             badge.className = 'badge bg-danger rounded-pill';
//             badge.textContent = conv.badge;
//             li.appendChild(badge);
//           }

//           li.dataset.userid = conv.user_id;
//           li.onclick = () => {
//             if (currentConversationId === conv.user_id) return;
//             currentConversationId = conv.user_id;
//             chargerConversation(conv.user_id);
//             Array.from(conversationsList.children).forEach(item => {
//               item.classList.toggle('active', item === li);
//             });
//             if (messageTexte && sendBtn) {
//               messageTexte.disabled = false;
//               sendBtn.disabled = false;
//               messageTexte.focus();
//             }
//           };

//           conversationsList.appendChild(li);
//         });

//         // Mise à jour badge global (cloche)
//         if (notifBadge) {
//           notifBadge.textContent = totalNonLus;
//           notifBadge.style.display = totalNonLus > 0 ? '' : 'none';
//         }

//         // Sélection automatique première conversation si aucune sélection
//         if (!currentConversationId && data.conversations.length > 0) {
//           currentConversationId = data.conversations[0].user_id;
//           if (conversationsList.children[0]) {
//             conversationsList.children[0].classList.add('active');
//           }
//           chargerConversation(currentConversationId);
//           if (messageTexte && sendBtn) {
//             messageTexte.disabled = false;
//             sendBtn.disabled = false;
//           }
//         }
//       })
//       .catch(() => {
//         conversationsList.innerHTML = '<li class="list-group-item text-danger">Erreur de chargement</li>';
//         if (messageThread) messageThread.innerHTML = '<p class="text-muted">Impossible de charger les conversations.</p>';
//         if (notifBadge) notifBadge.style.display = 'none';
//         if (messageTexte && sendBtn) {
//           messageTexte.disabled = true;
//           sendBtn.disabled = true;
//         }
//       });
//   }

//   // Charger messages d'une conversation
//   function chargerConversation(userId) {
//     if (!userId) {
//       if (messageThread) messageThread.innerHTML = '<p class="text-muted">Sélectionnez une conversation.</p>';
//       if (messageTexte && sendBtn) {
//         messageTexte.disabled = true;
//         sendBtn.disabled = true;
//       }
//       return;
//     }
//     fetch('asset/PHP/get_messages.php?with=' + encodeURIComponent(userId))
//       .then(res => {
//         if (!res.ok) throw new Error('Erreur réseau');
//         return res.json();
//       })
//       .then(data => {
//         if (!messageThread) return;
//         messageThread.innerHTML = '';
//         if (!data.messages || data.messages.length === 0) {
//           messageThread.innerHTML = '<p class="text-muted">Aucun message dans cette conversation.</p>';
//           return;
//         }
//         data.messages.forEach(m => {
//           const div = document.createElement('div');
//           div.className = 'mb-2 ' + (m.from_me ? 'text-end' : 'text-start');
//           div.innerHTML = `
//             <span class="badge ${m.from_me ? 'bg-success' : 'bg-secondary'}">${m.texte}</span><br>
//             <small class="text-muted">${m.date}</small>`;
//           messageThread.appendChild(div);
//         });
//         messageThread.scrollTop = messageThread.scrollHeight;
//       })
//       .catch(() => {
//         if (messageThread) messageThread.innerHTML = '<p class="text-danger">Erreur lors du chargement des messages.</p>';
//       });
//   }

//   // Envoyer un message
//   if (sendBtn) {
//     sendBtn.onclick = () => {
//       const destinataire = currentConversationId;
//       const message = messageTexte.value.trim();
//       if (!message || !destinataire) {
//         alert('Veuillez sélectionner une conversation et écrire un message.');
//         return;
//       }

//       fetch('asset/PHP/envoyer_message.php', {
//         method: 'POST',
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ destinataire_id: destinataire, message })
//       })
//         .then(res => {
//           if (!res.ok) throw new Error('Erreur réseau');
//           return res.json();
//         })
//         .then(data => {
//           if (data.success) {
//             messageTexte.value = '';
//             chargerConversation(destinataire);
//             chargerConversations(); // rafraîchir la liste et badge
//           } else {
//             alert(data.error || 'Erreur lors de l\'envoi');
//           }
//         })
//         .catch(() => alert('Erreur réseau'));
//     };
//   }

//   if (refreshBtn) {
//     refreshBtn.onclick = () => {
//       if (currentConversationId) chargerConversation(currentConversationId);
//     };
//   }

//   // Auto-refresh toutes les 30 secondes
//   setInterval(() => {
//     chargerConversations();
//     if (currentConversationId) chargerConversation(currentConversationId);
//   }, 30000);

//   // Premier chargement
//   chargerConversations();
// });
