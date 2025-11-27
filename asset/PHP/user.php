<?php
session_start();

header('Content-Type: application/json');

if (isset($_SESSION['user_'])) {
    $prenom = $_SESSION['user']['prenom'] ?? '';
    $nom = $_SESSION['user']['nom'] ?? '';

    echo json_encode([
        'id' => $_SESSION['user']['id'] ?? null,
        'prenom' => $prenom,
        'nom' => $nom
    ]);
} else {
    echo json_encode(['error' => 'Non connecté']);
}

