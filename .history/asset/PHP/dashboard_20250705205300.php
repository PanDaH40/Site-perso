<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

var_dump($_SESSION);

if (!isset($_SESSION['user'])) {
    // Rediriger vers la page contenant le formulaire de connexion, pas vers le script PHP qui traite le POST
    header('Location: Page'); // par exemple selon ton arborescence
    exit;
}

$user = $_SESSION['user'];
?>