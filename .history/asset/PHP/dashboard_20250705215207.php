<?php
session_start();

if (!isset($_SESSION['user'])) {
    // Redirection vers la page de connexion
    header("Location: login.php");
    exit;
}

<h1 id="welcomeMsg">Welcome <?= htmlspecialchars($user['nom']) ?></h1>

$userName = htmlspecialchars($_SESSION['user']['nom']);
?>