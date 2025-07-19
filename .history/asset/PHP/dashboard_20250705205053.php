<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
var_dump($_SESSION); 
if (!isset($_SESSION['user'])) {
    header('Location: dashboard.html'); // Redirige vers la page de connexion si l'utilisateur n'est pas connecté
    exit;
}

$user = $_SESSION['user'];
?>