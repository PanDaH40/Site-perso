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