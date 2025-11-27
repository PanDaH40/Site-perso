document.addEventListener("DOMContentLoaded", () => {
  fetch("/PHP/stats_covoiturage.php", { credentials: "include" })
    .then((res) => res.json())
    .then((data) => {
      if (!data || typeof data !== "object")
        throw new Error("Données invalides");
      if (
        !Array.isArray(data.trajets_par_jour) ||
        !Array.isArray(data.credits_par_jour)
      ) {
        throw new Error("Format des données incorrect");
      }
      if (typeof data.total_credits !== "number") {
        throw new Error("Total crédits invalide");
      }

      // Préparer labels (dates) sur 30 derniers jours
      const labels = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        labels.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
      }

      // Fonction pour créer un mapping date => valeur (pour aligner toutes les dates)
      function mapData(arr, key) {
        const map = {};
        arr.forEach((item) => {
          map[item.jour] = item[key];
        });
        return labels.map((date) => map[date] ?? 0);
      }

      // Données
      const trajetsData = mapData(data.trajets_par_jour, "nb_trajets");
      const creditsData = mapData(data.credits_par_jour, "credits_gagnes");

      // Affichage total crédits
      document.getElementById("totalCredits").textContent =
        data.total_credits.toFixed(2);

      // Graphique trajets
      new Chart(document.getElementById("chartTrajets").getContext("2d"), {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Nombre de covoiturages par jour",
              data: trajetsData,
              borderColor: "blue",
              backgroundColor: "rgba(0,0,255,0.1)",
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: {
          scales: { y: { beginAtZero: true, precision: 0 } },
          responsive: true,
          plugins: { legend: { display: true } },
        },
      });

      // Graphique crédits
      new Chart(document.getElementById("chartCredits").getContext("2d"), {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Crédits gagnés par jour",
              data: creditsData,
              backgroundColor: "green",
            },
          ],
        },
        options: {
          scales: { y: { beginAtZero: true } },
          responsive: true,
          plugins: { legend: { display: true } },
        },
      });
    })
    .catch((e) => {
      console.error("Erreur chargement stats:", e);
    });
});
