<?php
require __DIR__ . '/TPCovoiturage/asset/PHP/config.php';

// contrôle d’accès
if (($_GET['key'] ?? '') !== SITE_ACCESS_KEY) {
  header('HTTP/1.1 403 Forbidden');
  exit('Accès restreint.');
}

session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user'])) {
    // S'assurer que 'prenom' et 'nom' existent bien dans la session
    $prenom = $_SESSION['user']['prenom'] '';
    $nom = $_SESSION['user']['nom'] '';

    echo json_encode([
        'id' => $_SESSION['user']['id'] null,
        'prenom' => $prenom,
        'nom' => $nom
    ]);
} else {
    echo json_encode(['error' => 'Non connecté']);
}

