USE covoiturage_db;

CREATE TABLE IF NOT EXISTS inscrits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  telephone VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL
);


CREATE TABLE trajets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conducteur_id INT NOT NULL, -- FK vers utilisateurs
  date DATE NOT NULL,
  depart VARCHAR(100) NOT NULL,
  arrivee VARCHAR(100) NOT NULL,
  places INT NOT NULL,
  statut ENUM('Confirmé', 'En attente', 'Annulé') DEFAULT 'En attente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (conducteur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trajet_id INT NOT NULL,    -- FK vers trajets
  passager_id INT NOT NULL,  -- FK vers utilisateurs
  places_reservees INT DEFAULT 1,
  statut ENUM('Confirmé', 'Annulé') DEFAULT 'Confirmé',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (trajet_id) REFERENCES trajets(id) ON DELETE CASCADE,
  FOREIGN KEY (passager_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

ALTER TABLE trajets ADD COLUMN heure TIME NOT NULL DEFAULT '00:00:00';

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id   INT NOT NULL,
  receiver_id INT NOT NULL,
  content     TEXT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_read     TINYINT(1) DEFAULT 0,
  FOREIGN KEY (sender_id)   REFERENCES inscrits(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES inscrits(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8;

SHOW TABLES;
SHOW TABLES LIKE 'inscrits';
SHOW TABLE STATUS
WHERE Name = 'inscrits'\G
