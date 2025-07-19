<?php
session_start();

if (!isset($_SESSION['user']) || !isset($_SESSION['user']['admin']) || $_SESSION['user']['admin'] != 1) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Accès interdit (admin seulement)']);
    exit;
}

// Si tout va bien, ne rien afficher ici.
?>
