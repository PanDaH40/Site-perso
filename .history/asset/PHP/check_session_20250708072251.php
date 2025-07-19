<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user']['id'])) {
    // Renvoie quelques infos utiles (tu peux adapter)
    echo json_encode([
        'connected' => true,
        'user' => [
            'id' => $_SESSION['user']['id'],
            'prenom' => $_SESSION['user']['prenom'] ?? '',
            'email' => $_SESSION['user']['email'] ?? ''
        ]
    ]);
} else {
    echo json_encode(['connected' => false]);
}

