<?php
session_start();
session_unset();
session_destroy();
header('Location: PageConnection.html'); // Ajuste le chemin en fonction de ta structure
exit;
?>


