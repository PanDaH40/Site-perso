const messagesDiv = document.getElementById("messages");
if (messagesDiv) {
  messagesDiv.innerHTML = ""; // reset
  data.messages.forEach(msg => {
    const msgDiv = document.createElement("div");
    msgDiv.setAttribute("role", "listitem");
    msgDiv.innerHTML = `<strong>${msg.auteur} :</strong> ${msg.contenu}`;
    messagesDiv.appendChild(msgDiv);
  });
}
