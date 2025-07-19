<?php
session_start();
session_destroy();
header('Location: connection.php'); // Redirige vers la page de connexion connection.php
exit;
?>
