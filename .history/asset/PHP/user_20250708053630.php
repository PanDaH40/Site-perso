<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user'])) {
    echo json_encode([
        'id' => $_SESSION['user']['id'],
        'nom_complet' => $_SESSION['user']['prenom'] . ' ' . $_SESSION['user']['nom']
    ]);
} else {
    echo json_encode(['error' => 'Non connecté']);
}
