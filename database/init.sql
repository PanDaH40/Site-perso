USE covoiturage_db;

-- ============================
-- TABLE : inscrits
-- ============================
CREATE TABLE IF NOT EXISTS inscrits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prenom VARCHAR(50) NOT NULL,
  nom VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  avatar VARCHAR(255) DEFAULT NULL,
  bio TEXT NULL,
  date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
  credits INT NOT NULL DEFAULT 20,
  admin TINYINT(1) NOT NULL DEFAULT 0,
  statut ENUM('actif','suspendu') NOT NULL DEFAULT 'actif',
  reset_token VARCHAR(100) DEFAULT NULL,
  reset_token_expire DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLE : conducteurs
-- ============================
CREATE TABLE IF NOT EXISTS conducteurs (
  inscrit_id INT NOT NULL,
  prenom VARCHAR(50) NOT NULL,
  nom VARCHAR(50) NOT NULL,
  modele_vehicule VARCHAR(80) NOT NULL,
  marque_vehicule VARCHAR(50) DEFAULT NULL,
  carburant VARCHAR(50) NOT NULL DEFAULT 'essence',
  animaux TINYINT(1) DEFAULT 0,
  fumeurs TINYINT(1) DEFAULT 0,
  plaque VARCHAR(20) DEFAULT NULL,
  couleur VARCHAR(30) DEFAULT NULL,
  date_premiere_immatriculation DATE DEFAULT NULL,
  PRIMARY KEY (inscrit_id),
  FOREIGN KEY (inscrit_id) REFERENCES inscrits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLE : passagers
-- ============================
CREATE TABLE IF NOT EXISTS passagers (
  inscrit_id INT NOT NULL,
  prenom VARCHAR(50) NOT NULL,
  nom VARCHAR(50) NOT NULL,
  preferences TEXT DEFAULT NULL,
  PRIMARY KEY (inscrit_id),
  FOREIGN KEY (inscrit_id) REFERENCES inscrits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLE : trajets
-- ============================
CREATE TABLE IF NOT EXISTS trajets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conducteur_id INT NOT NULL,
  depart VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  heure TIME NOT NULL DEFAULT '00:00:00',
  places INT NOT NULL,
  jetons INT NOT NULL DEFAULT 0,
  statut ENUM('en_attente','confirmé','annulé') NOT NULL DEFAULT 'en_attente',
  etat_trajet ENUM('planifie','en_cours','termine') NOT NULL DEFAULT 'planifie',
  FOREIGN KEY (conducteur_id) REFERENCES inscrits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLE : reservations
-- ============================
CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trajet_id INT NOT NULL,
  passager_id INT NOT NULL,
  places_reservees INT DEFAULT 1,
  statut ENUM('en_attente','valide','annule') DEFAULT 'en_attente',
  validation_passager TINYINT(1) DEFAULT 0,
  note TINYINT DEFAULT NULL,
  avis TEXT DEFAULT NULL,
  avis_valide TINYINT DEFAULT 0,
  date_validation DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trajet_id) REFERENCES trajets(id) ON DELETE CASCADE,
  FOREIGN KEY (passager_id) REFERENCES inscrits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLE : messages
-- ============================
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  lu TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (sender_id) REFERENCES inscrits(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES inscrits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLE : avis
-- ============================
CREATE TABLE IF NOT EXISTS avis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  auteur_id INT NOT NULL,
  note TINYINT NOT NULL,
  commentaire TEXT,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(utilisateur_id, auteur_id),
  FOREIGN KEY (utilisateur_id) REFERENCES inscrits(id),
  FOREIGN KEY (auteur_id) REFERENCES inscrits(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLE : signalements
-- ============================
CREATE TABLE IF NOT EXISTS signalements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  signale_par INT,
  cible INT,
  type ENUM('profil','trajet','message','photo','autre') NOT NULL,
  motif VARCHAR(255) NOT NULL,
  description TEXT,
  date_signalement DATETIME DEFAULT CURRENT_TIMESTAMP,
  traite TINYINT(1) DEFAULT 0,
  traite_par INT DEFAULT NULL,
  statut ENUM('en_attente','traite') NOT NULL DEFAULT 'en_attente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLE : logs_connexions
-- ============================
CREATE TABLE IF NOT EXISTS logs_connexions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(50),
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip VARCHAR(45)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLE : transactions_jetons
-- ============================
CREATE TABLE IF NOT EXISTS transactions_jetons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  montant INT NOT NULL,
  type ENUM('credit','debit') NOT NULL,
  motif VARCHAR(255),
  date_operation DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES inscrits(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;