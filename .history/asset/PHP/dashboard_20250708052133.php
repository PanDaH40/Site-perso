<?php
session_start();

if (!isset($_SESSION['user'])) {
    // Redirection vers la page de connexion
    header("Location: login.php");
    exit;
}

$userName = htmlspecialchars($_SESSION['user']['nom']);
<h1 id="welcomeMsg">Bienvenue, <?php echo $userName; ?> !</h1>

?>