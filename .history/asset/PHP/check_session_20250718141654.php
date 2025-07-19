<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user']['id'])) {
    echo json_encode([
        'connected' => true,
        'user' => [
            'id' => $_SESSION['user']['id'],
            'prenom' => $_SESSION['user']['prenom'] ?? '',
            'email' => $_SESSION['user']['email'] ?? ''
            admin' => $_SESSION['user']['admin'] ?? 0
        ]
    ]);
} else {
    echo json_encode(['connected' => false]);
}

