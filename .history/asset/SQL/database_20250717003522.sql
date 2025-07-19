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

ALTER TABLE inscrits ENGINE=InnoDB;

ALTER TABLE trajets ADD COLUMN prix DECIMAL(6,2) NOT NULL DEFAULT 0.00;

SELECT COUNT(*) AS nb_disponibles
  FROM trajets
 WHERE statut = 'disponible';

-- Passe toutes les lignes dont le statut est NULL ou vide à 'disponible'
UPDATE trajets
  SET statut = 'disponible'
WHERE statut IS NULL
   OR statut = '';

SELECT id, statut
  FROM trajets
 LIMIT 10;

UPDATE trajets
  SET statut = 'disponible';

UPDATE trajets
   SET statut = NULL
 WHERE statut = 'disponible';

 CREATE TABLE `conducteurs` (
  `inscrit_id`    INT                  NOT NULL,
  `voiture`       VARCHAR(100)         NOT NULL,
  `carburant`     ENUM('electric','essence','gazole') NOT NULL,
  `animaux`       TINYINT(1) DEFAULT 0, 
  `fumeurs`       TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`inscrit_id`),
  CONSTRAINT `fk_cond_inscrit`
    FOREIGN KEY (`inscrit_id`) REFERENCES `inscrits`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `passagers` (
  `inscrit_id`    INT        NOT NULL,
  `preferences`   TEXT       NULL,  -- ex : « non fumeur, animaux…, etc. »
  PRIMARY KEY (`inscrit_id`),
  CONSTRAINT `fk_pass_inscrit`
    FOREIGN KEY (`inscrit_id`) REFERENCES `inscrits`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


ALTER TABLE `conducteurs`
  ADD COLUMN `prenom` VARCHAR(50) NOT NULL AFTER `inscrit_id`,
  ADD COLUMN `nom`    VARCHAR(50) NOT NULL AFTER `prenom`;

  ALTER TABLE `passagers`
  ADD COLUMN `prenom` VARCHAR(50) NOT NULL AFTER `inscrit_id`,
  ADD COLUMN `nom`    VARCHAR(50) NOT NULL AFTER `prenom`;

  CREATE TRIGGER trg_conducteurs_ins BEFORE INSERT ON conducteurs
FOR EACH ROW
BEGIN
  DECLARE p VARCHAR(50);
  DECLARE n VARCHAR(50);
  SELECT prenom, nom INTO p, n FROM inscrits WHERE id = NEW.inscrit_id;
  SET NEW.prenom = p;
  SET NEW.nom    = n;
END;


CREATE TRIGGER trg_passagers_ins BEFORE INSERT ON passagers
FOR EACH ROW
BEGIN
  DECLARE p2 VARCHAR(50);
  DECLARE n2 VARCHAR(50);
  SELECT prenom, nom INTO p2, n2 FROM inscrits WHERE id = NEW.inscrit_id;
  SET NEW.prenom = p2;
  SET NEW.nom    = n2;
END;
//
DELIMITER ;

UPDATE conducteurs c
JOIN inscrits i ON i.id = c.inscrit_id
SET c.prenom = i.prenom, c.nom = i.nom;

UPDATE passagers p
JOIN inscrits i ON i.id = p.inscrit_id
SET p.prenom = i.prenom, p.nom = i.nom;

ALTER TABLE `inscrits`
  ADD COLUMN `avatar` VARCHAR(255) NULL AFTER `email`;

ALTER TABLE inscrits ADD bio TEXT NULL;

ALTER TABLE inscrits ADD date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP;

UPDATE inscrits SET avatar = REPLACE(avatar, 'uploads/avatars/', 'asset/uploads/avatars/') WHERE avatar LIKE 'uploads/avatars/%';


CREATE TABLE IF NOT EXISTS avis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,        -- Le membre qui reçoit la note
    auteur_id INT NOT NULL,             -- Celui qui note
    note TINYINT NOT NULL,              -- Note (1 à 5)
    commentaire TEXT,                   -- Optionnel
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(utilisateur_id, auteur_id),  -- 1 note par pair
    FOREIGN KEY (utilisateur_id) REFERENCES inscrits(id),
    FOREIGN KEY (auteur_id) REFERENCES inscrits(id)
);

ALTER TABLE messages ADD COLUMN lu TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE reservations ADD COLUMN statut ENUM('en_attente','confirmee','annulee') NOT NULL DEFAULT 'en_attente';
ALTER TABLE reservations 
ADD COLUMN statut ENUM('en_attente', 'confirmee', 'annulee') NOT NULL DEFAULT 'en_attente';

SHOW CREATE TABLE reservations

ALTER TABLE reservations ENGINE=InnoDB;

ALTER TABLE reservations 
MODIFY statut ENUM('en_attente', 'Confirmé', 'Annulé') 
COLLATE utf8mb4_general_ci DEFAULT 'en_attente';


SHOW CREATE TABLE trajets;
SHOW CREATE TABLE reservations;
SHOW CREATE TABLE inscrits;
SHOW CREATE TABLE conducteurs;

SHOW CREATE TABLE reservations;


ALTER TABLE reservations 
MODIFY COLUMN statut ENUM('en_attente', 'valide', 'annule') 
CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci 
DEFAULT 'en_attente';

UPDATE reservations SET statut = 'valide' WHERE statut = 'Confirmé';
UPDATE reservations SET statut = 'annule' WHERE statut = 'Annulé';

SELECT DISTINCT carburant FROM conducteurs;

ALTER TABLE conducteurs 
MODIFY carburant ENUM('electric', 'essence', 'gazole', 'hybride') NOT NULL DEFAULT 'essence';

ALTER TABLE conducteurs 
MODIFY carburant VARCHAR(50) NOT NULL DEFAULT 'essence';


ALTER TABLE inscrits
ADD COLUMN credits INT NOT NULL DEFAULT 20;

ALTER TABLE trajets CHANGE COLUMN prix jetons INT NOT NULL DEFAULT 0;

UPDATE reservations
SET statut = LOWER(statut);

UPDATE reservations
SET statut = REPLACE(LOWER(statut), ' ', '_');

UPDATE trajets
SET statut = 'en_attente'
WHERE statut = 'En attente';

UPDATE trajets SET statut = 'confirmé' WHERE statut = 'Confirmé';
UPDATE trajets SET statut = 'annulé' WHERE statut = 'Annulé';

SELECT * FROM reservations WHERE passager_id = 2 AND statut = 'confirmé';