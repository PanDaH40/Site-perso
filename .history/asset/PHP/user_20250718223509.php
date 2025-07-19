<?php
<?php
// clé secrète à garder hors Git/public
define('SITE_ACCESS_KEY', '4f3b2a1c9d8e7f6a5b4c3d2e1f0a9b8c');

// 1) On lit le paramètre "key" dans l'URL
$key = $_GET['key'] ?? '';

// 2) Si ça ne correspond pas, on renvoie un 403
if ($key !== SITE_ACCESS_KEY) {
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

