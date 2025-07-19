<?php

require __DIR__ . '/TPCovoiturage/asset/PHP/config.php';

// contrôle d’accès
if (($_GET['key'] ?? '') !== SITE_ACCESS_KEY) {
  header('HTTP/1.1 403 Forbidden');
  exit('Accès restreint.');
}

session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user']['id'])) {
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
    echo json_encode(['connected' => false]);
}

