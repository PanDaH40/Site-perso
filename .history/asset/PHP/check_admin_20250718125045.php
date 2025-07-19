<?php
session_start();

if (!isset($_SESSION['user']) || !isset($_SESSION['user']['admin']) || $_SESSION['user']['admin'] != 1) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Accès interdit (admin seulement)']);
    exit;
}

// Ne rien afficher ici si accès OK.
?>
