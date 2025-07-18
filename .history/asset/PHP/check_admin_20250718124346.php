<?php
// asset/PHP/check_admin.php
session_start();


if (empty($_SESSION['user']['admin']) || $_SESSION['user']['admin'] != 1) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Accès interdit (admin seulement)']);
    exit;
}
?>
