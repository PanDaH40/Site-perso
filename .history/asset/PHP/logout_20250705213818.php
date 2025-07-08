<?php
session_start();
session_unset();
session_destroy();
header('Location: /asset/PHP/login.php'); // Ajuste le chemin en fonction de ta structure
exit;
?>


