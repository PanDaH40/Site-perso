/************************************************************
 *                     PROFILE MANAGER (OBJET)
 ************************************************************/
const ProfileManager = {
  // Raccourci
  $: id => document.getElementById(id),

  /************************************************************
   *                      OBJET UI
   ************************************************************/
  ui: {
    init() {
      this.form = ProfileManager.$("profileForm");
      this.prenom = ProfileManager.$("profilePrenom");
      this.nom = ProfileManager.$("profileNom");
      this.email = ProfileManager.$("profileEmail");
      this.bio = ProfileManager.$("profileBio");

      this.roleCond = ProfileManager.$("roleConducteur");
      this.rolePass = ProfileManager.$("rolePassager");

      this.conducteurFields = ProfileManager.$("conducteurFields");
      this.passagerFields = ProfileManager.$("passagerFields");

      this.carburant = ProfileManager.$("profileCarburant");
      this.animaux = ProfileManager.$("acceptAnimaux");
      this.fumeurs = ProfileManager.$("acceptFumeur");
      this.preferences = ProfileManager.$("profilePreferences");

      this.marque = ProfileManager.$("profileMarqueVehicule");
      this.modele = ProfileManager.$("profileModeleVehicule");
      this.plaque = ProfileManager.$("profilePlaque");
      this.couleur = ProfileManager.$("profileCouleur");
      this.dateImmat = ProfileManager.$("profileDateImmat");

      this.avatarInput = ProfileManager.$("profileAvatar");
      this.avatarPreview = ProfileManager.$("avatarPreview");
    },

    toggleRoleSections() {
      // Conducteur
      const showCond = this.roleCond.checked;
      this.conducteurFields.style.display = showCond ? "" : "none";

      const condReq = ["marque", "modele", "plaque", "couleur", "dateImmat"];
      condReq.forEach(id => {
        if (this[id]) {
          this[id].closest(".mb-3").style.display = showCond ? "" : "none";
          this[id].required = showCond;
        }
      });

      // Passager
      this.passagerFields.style.display = this.rolePass.checked ? "" : "none";
    }
  },

  /************************************************************
   *                      OBJET AVATAR
   ************************************************************/
  avatar: {
    defaultAvatar: "asset/Images/default_03.png",

    init() {
      const input = ProfileManager.ui.avatarInput;
      const preview = ProfileManager.ui.avatarPreview;

      if (!input || !preview) return;

      preview.addEventListener("click", () => input.click());

      input.addEventListener("change", () => {
        const file = input.files[0];
        if (!file || !file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = e => (preview.src = e.target.result);
        reader.readAsDataURL(file);
      });
    },

    set(avatarUrl) {
      const preview = ProfileManager.ui.avatarPreview;
      if (!preview) return;

      preview.src = avatarUrl ? avatarUrl : this.defaultAvatar;
      preview.onerror = () => (preview.src = this.defaultAvatar);
    }
  },

  /************************************************************
   *                      OBJET ROLES
   ************************************************************/
  roles: {
    applyFromApi(data) {
      ProfileManager.ui.roleCond.checked = data.roleConducteur == 1;
      ProfileManager.ui.rolePass.checked = data.rolePassager == 0 ? false : true;
      ProfileManager.ui.toggleRoleSections();
    }
  },

  /************************************************************
   *                      OBJET API
   ************************************************************/
  api: {
    async loadProfile() {
      const res = await fetch("/PHP/get_profile.php", { credentials: "include" });
      const data = await res.json();

      if (data.error) return alert("Erreur profil : " + data.error);

      // Apply roles
      ProfileManager.roles.applyFromApi(data);

      // Infos user
      ProfileManager.ui.prenom.value = data.prenom || "";
      ProfileManager.ui.nom.value = data.nom || "";
      ProfileManager.ui.email.value = data.email || "";
      ProfileManager.ui.bio.value = data.bio || "";

      const creditsEl = document.getElementById("profileCredits");
      if (creditsEl) creditsEl.textContent = data.credits ?? 0;

      // Conducteur
      ProfileManager.ui.marque.value = data.marque_vehicule || "";
      ProfileManager.ui.modele.value = data.modele_vehicule || "";
      ProfileManager.ui.plaque.value = data.plaque || "";
      ProfileManager.ui.couleur.value = data.couleur || "";
      ProfileManager.ui.dateImmat.value = data.date_premiere_immatriculation || "";
      ProfileManager.ui.carburant.value = data.carburant || "essence";
      ProfileManager.ui.animaux.checked = data.animaux == 1;
      ProfileManager.ui.fumeurs.checked = data.fumeurs == 1;

      // Passager
      ProfileManager.ui.preferences.value = data.preferences || "";

      // Avatar
      ProfileManager.avatar.set(data.avatar);

      // Notifications
      ProfileManager.notifications.update();
    },

    async saveProfile(formData) {
      const res = await fetch("/PHP/update_profile.php", {
        method: "POST",
        credentials: "include",
        body: formData
      });
      return await res.json();
    }
  },

  /************************************************************
   *                  OBJET MOT DE PASSE
   ************************************************************/
  password: {
    modal: null,

    init() {
      const modalEl = ProfileManager.$("changePasswordModal");
      if (modalEl) this.modal = new bootstrap.Modal(modalEl);
    }
  },

  /************************************************************
   *                      OBJET NOTIFICATIONS
   ************************************************************/
  notifications: {
    badge: null,

    init() {
      this.badge = ProfileManager.$("notif-badge");
    },

    async update() {
      if (!this.badge) return;

      const res = await fetch("/PHP/get_messages_recus.php", { credentials: "include" });
      const data = await res.json();

      const n = data.totalNonLus || 0;
      this.badge.textContent = n;
      this.badge.style.display = n > 0 ? "inline-block" : "none";
    }
  },

  /************************************************************
   *                  INITIALISATION GENERALE
   ************************************************************/
  init() {
    this.ui.init();
    this.avatar.init();
    this.password.init();
    this.notifications.init();

    // Events
    this.ui.roleCond.addEventListener("change", () => this.ui.toggleRoleSections());
    this.ui.rolePass.addEventListener("change", () => this.ui.toggleRoleSections());

    // Submit
    this.ui.form.addEventListener("submit", e => this.onSubmit(e));

    // Load data
    this.api.loadProfile();

    setInterval(() => this.notifications.update(), 30000);
  },

  /************************************************************
   *                HANDLE SUBMISSION
   ************************************************************/
  async onSubmit(e) {
    e.preventDefault();

    const fd = new FormData();
    fd.append("prenom", this.ui.prenom.value);
    fd.append("nom", this.ui.nom.value);
    fd.append("email", this.ui.email.value);
    fd.append("bio", this.ui.bio.value);
    fd.append("roleConducteur", this.ui.roleCond.checked ? 1 : 0);
    fd.append("rolePassager", this.ui.rolePass.checked ? 1 : 0);

    if (this.ui.roleCond.checked) {
      fd.append("profileMarqueVehicule", this.ui.marque.value);
      fd.append("profileModeleVehicule", this.ui.modele.value);
      fd.append("carburant", this.ui.carburant.value);
      fd.append("animaux", this.ui.animaux.checked ? 1 : 0);
      fd.append("fumeurs", this.ui.fumeurs.checked ? 1 : 0);
      fd.append("plaque", this.ui.plaque.value);
      fd.append("couleur", this.ui.couleur.value);
      fd.append("date_premiere_immatriculation", this.ui.dateImmat.value);
    }

    if (this.ui.rolePass.checked) {
      fd.append("preferences", this.ui.preferences.value);
    }

    if (this.ui.avatarInput.files[0]) {
      fd.append("avatar", this.ui.avatarInput.files[0]);
    }

    const result = await this.api.saveProfile(fd);

    if (result.error) return alert("Erreur : " + result.error);

    alert("Profil mis à jour !");
  }
};

/************************************************************
 *                       LANCEMENT
 ************************************************************/
document.addEventListener("DOMContentLoaded", () => ProfileManager.init());
