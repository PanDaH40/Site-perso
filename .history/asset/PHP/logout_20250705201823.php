<?php
session_start();
session_destroy();
header('Location: PageConnection.html'); // Redirige vers la page de connexion connection.php
exit;
?>
