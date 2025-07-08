<?php
session_start();
session_unset();
session_destroy();
header('window.location.href = 'asset/PHP/login.php'); // Ajuste le chemin en fonction de ta structure
exit;
?>


