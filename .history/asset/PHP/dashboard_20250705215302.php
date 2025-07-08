<?php
session_start();

if (!isset($_SESSION['user'])) {
    // Redirection vers la page de connexion
    header("Location: login.php");
    exit;
}
// Inclure le fichier de connexion à la base de données
require_once 'db.php';
// Récupérer les informations de l'utilisateur connecté
$userName = htmlspecialchars($_SESSION['user']['nom']);
?>