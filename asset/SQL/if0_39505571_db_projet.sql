-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Hôte : sql309.byetcluster.com
-- Généré le :  mar. 23 sep. 2025 à 13:49
-- Version du serveur :  11.4.7-MariaDB
-- Version de PHP :  7.2.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données :  `if0_39505571_db_projet`
--

-- --------------------------------------------------------

--
-- Structure de la table `avis`
--

DROP TABLE IF EXISTS `avis`;
CREATE TABLE `avis` (
  `id` int(11) NOT NULL,
  `utilisateur_id` int(11) NOT NULL,
  `auteur_id` int(11) NOT NULL,
  `note` tinyint(4) NOT NULL,
  `commentaire` text DEFAULT NULL,
  `date` datetime DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `conducteurs`
--

DROP TABLE IF EXISTS `conducteurs`;
CREATE TABLE `conducteurs` (
  `inscrit_id` int(11) NOT NULL,
  `prenom` varchar(50) NOT NULL,
  `nom` varchar(50) NOT NULL,
  `modele_vehicule` varchar(80) DEFAULT NULL,
  `carburant` varchar(50) NOT NULL DEFAULT 'essence',
  `animaux` tinyint(1) DEFAULT 0,
  `fumeurs` tinyint(1) DEFAULT 0,
  `marque_vehicule` varchar(50) DEFAULT NULL,
  `plaque` varchar(20) DEFAULT NULL,
  `couleur` varchar(30) DEFAULT NULL,
  `date_premiere_immatriculation` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `inscrits`
--

DROP TABLE IF EXISTS `inscrits`;
CREATE TABLE `inscrits` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `prenom` varchar(100) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `mot_de_passe` text DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `date_inscription` datetime DEFAULT current_timestamp(),
  `credits` int(11) NOT NULL DEFAULT 20,
  `admin` tinyint(1) NOT NULL DEFAULT 0,
  `statut` enum('actif','suspendu') NOT NULL DEFAULT 'actif',
  `reset_token` varchar(100) DEFAULT NULL,
  `reset_token_expire` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `inscrits`
--

INSERT INTO `inscrits` (`id`, `nom`, `prenom`, `age`, `telephone`, `email`, `avatar`, `mot_de_passe`, `bio`, `date_inscription`, `credits`, `admin`, `statut`, `reset_token`, `reset_token_expire`) VALUES
(16, 'Admin', 'Test', 30, '2222222222', 'admin_test@mail.com', NULL, '$2y$10$1P9SletxLVKXk9Ly4BBBu.S.C/pjSqE4twsBHQdzeHIoKWHz/wVQ2', '', '2025-07-20 07:26:44', 20, 1, 'actif', NULL, NULL),
(17, 'User', 'Test', 30, '1111111111', 'User_Test@mail.com', NULL, '$2y$10$4GZvryA/fHYaBvX9PwkHOuc1UYOiQnj40HNPL3UuRYWHn3txdy/VG', NULL, '2025-07-20 07:27:48', 20, 0, 'actif', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `logs_connexions`
--

DROP TABLE IF EXISTS `logs_connexions`;
CREATE TABLE `logs_connexions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `date` datetime DEFAULT current_timestamp(),
  `ip` varchar(45) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `is_read` tinyint(1) DEFAULT 0,
  `lu` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `passagers`
--

DROP TABLE IF EXISTS `passagers`;
CREATE TABLE `passagers` (
  `inscrit_id` int(11) NOT NULL,
  `prenom` varchar(50) NOT NULL,
  `nom` varchar(50) NOT NULL,
  `preferences` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
CREATE TABLE `reservations` (
  `id` int(11) NOT NULL,
  `trajet_id` int(11) NOT NULL,
  `passager_id` int(11) NOT NULL,
  `places_reservees` int(11) DEFAULT 1,
  `statut` enum('en_attente','valide','annule') NOT NULL DEFAULT 'en_attente',
  `validation_passager` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `note` tinyint(4) DEFAULT NULL,
  `avis` text DEFAULT NULL,
  `avis_valide` tinyint(4) DEFAULT 0,
  `date_validation` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `signalements`
--

DROP TABLE IF EXISTS `signalements`;
CREATE TABLE `signalements` (
  `id` int(11) NOT NULL,
  `signale_par` int(11) DEFAULT NULL,
  `cible` int(11) DEFAULT NULL,
  `type` enum('profil','trajet','message','photo','autre') NOT NULL,
  `motif` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `date_signalement` datetime DEFAULT current_timestamp(),
  `traite` tinyint(1) DEFAULT 0,
  `traite_par` int(11) DEFAULT NULL,
  `statut` enum('en_attente','traite') NOT NULL DEFAULT 'en_attente'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `trajets`
--

DROP TABLE IF EXISTS `trajets`;
CREATE TABLE `trajets` (
  `id` int(11) NOT NULL,
  `conducteur_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `depart` varchar(100) NOT NULL,
  `arrivee` varchar(100) NOT NULL,
  `places` int(11) NOT NULL,
  `statut` enum('valide','en_attente','annule') NOT NULL DEFAULT 'en_attente',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `heure` time NOT NULL DEFAULT '00:00:00',
  `jetons` int(11) NOT NULL DEFAULT 0,
  `etat_trajet` enum('planifie','en_cours','termine') NOT NULL DEFAULT 'planifie'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `transactions_jetons`
--

DROP TABLE IF EXISTS `transactions_jetons`;
CREATE TABLE `transactions_jetons` (
  `id` int(11) NOT NULL,
  `utilisateur_id` int(11) NOT NULL,
  `montant` int(11) NOT NULL,
  `type` enum('credit','debit') NOT NULL,
  `motif` varchar(255) DEFAULT NULL,
  `date_operation` datetime DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `inscrits`
--
ALTER TABLE `inscrits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Index pour la table `logs_connexions`
--
ALTER TABLE `logs_connexions`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Index pour la table `passagers`
--
ALTER TABLE `passagers`
  ADD PRIMARY KEY (`inscrit_id`);

--
-- Index pour la table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `trajet_id` (`trajet_id`),
  ADD KEY `passager_id` (`passager_id`);

--
-- Index pour la table `signalements`
--
ALTER TABLE `signalements`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `trajets`
--
ALTER TABLE `trajets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conducteur_id` (`conducteur_id`);

--
-- Index pour la table `transactions_jetons`
--
ALTER TABLE `transactions_jetons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `utilisateur_id` (`utilisateur_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `inscrits`
--
ALTER TABLE `inscrits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT pour la table `logs_connexions`
--
ALTER TABLE `logs_connexions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

--
-- AUTO_INCREMENT pour la table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=300;

--
-- AUTO_INCREMENT pour la table `signalements`
--
ALTER TABLE `signalements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `trajets`
--
ALTER TABLE `trajets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- AUTO_INCREMENT pour la table `transactions_jetons`
--
ALTER TABLE `transactions_jetons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `inscrits` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `inscrits` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `passagers`
--
ALTER TABLE `passagers`
  ADD CONSTRAINT `fk_pass_inscrit` FOREIGN KEY (`inscrit_id`) REFERENCES `inscrits` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
