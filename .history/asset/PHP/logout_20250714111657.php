<?php
session_start();
session_unset();
session_destroy();
header('Location: asset/PHP/login.php'); // Ajuste le chemin en fonction de ta structure
header('Content-Type: application/json');
echo json_encode(['success' => true]);
exit;
?>


