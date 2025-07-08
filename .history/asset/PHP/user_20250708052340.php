<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user'])) {
    echo json_encode([
        'id' => $_SESSION['user']['id'],
        'nom' => $_SESSION['user']['nom'],  // ou 'nom_complet' si tu veux prénom + nom
        "prenom" => $user['prenom'],
    ]);
} else {
    echo json_encode(['error' => 'Non connecté']);
}
?>

