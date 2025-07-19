function rechercherTrajets() {
  const depart = document.getElementById("searchDepart")?.value.trim() || "";
  const arrivee = document.getElementById("searchArrivee")?.value.trim() || "";
  const date = document.getElementById("searchDate")?.value.trim() || "";
  const places = document.getElementById("searchPlaces")?.value.trim() || "";
  const jetonsMax = document.getElementById("searchJetonsMax")?.value.trim() || "";
  const noteMin = document.getElementById("searchNoteMin")?.value.trim() || "";

  const dateAltMsg = document.getElementById("dateAlternativeMsg");
  dateAltMsg.style.display = "none";
  dateAltMsg.textContent = "";

  if (!depart || !arrivee || !date) {
    alert("Veuillez renseigner le départ, l’arrivée et la date pour la recherche.");
    return;
  }

  let url = basePath + 'trajets.php?all=1';
  url += '&depart=' + encodeURIComponent(depart);
  url += '&arrivee=' + encodeURIComponent(arrivee);
  url += '&date=' + encodeURIComponent(date);
  if (places) url += '&places_min=' + encodeURIComponent(places);
  if (jetonsMax) url += '&jetons_max=' + encodeURIComponent(jetonsMax);
  if (noteMin) url += '&note_min=' + encodeURIComponent(noteMin);

  fetch(url, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data.all_trajets) && data.all_trajets.length > 0) {
        afficherTrajets(data.all_trajets);
      } else if (data.date_alternative) {
        afficherAucunTrajet();
        dateAltMsg.style.display = "block";
        dateAltMsg.innerHTML = `
          Aucun trajet disponible à cette date.<br>
          Essayez plutôt le <a href="#" id="changerDateAlternative">${data.date_alternative}</a>.
        `;

        // Ajout d'un clic pour modifier la date de recherche automatiquement
        const lienDateAlt = document.getElementById("changerDateAlternative");
        if (lienDateAlt) {
          lienDateAlt.addEventListener("click", (e) => {
            e.preventDefault();
            // Format attendu yyyy-mm-dd pour input date
            const parts = data.date_alternative.split('/');
            if(parts.length === 3) {
              const dateFormatee = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
              document.getElementById("searchDate").value = dateFormatee;
              rechercherTrajets();
            }
          });
        }
      } else {
        afficherAucunTrajet();
      }
    })
    .catch(() => {
      afficherAucunTrajet();
    });
}
