<?php

header('Content-Type: application/json'); // Indique que la réponse est au format JSON

session_start(); // Démarre la session pour accéder aux données utilisateur

if (isset($_SESSION['user']['id'])) {
    // Utilisateur connecté : on renvoie les infos essentielles
    echo json_encode([
        'connected' => true,
        'user' => [
            'id' => $_SESSION['user']['id'],
            'prenom' => $_SESSION['user']['prenom'] ?? '',
            'email' => $_SESSION['user']['email'] ?? '',
            'admin' => $_SESSION['user']['admin'] ?? 0
        ]
    ]);
} else {
    // Utilisateur non connecté
    echo json_encode(['connected' => false]);
}



