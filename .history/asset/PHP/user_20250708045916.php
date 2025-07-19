<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'id' => $_SESSION['user_id'],
        'nom' => $_SESSION['user_nom']
    ]);
} else {
    echo json_encode(['error' => 'Non connecté']);
}
?>
