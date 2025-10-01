<?php

session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401); // Non autorisé
    echo json_encode(['error' => 'Non connecté']);
    exit;
}

$me = (int)$_SESSION['user']['id'];

try {
    require_once __DIR__ . '/db_conn.php';

    // Sélectionne tous les utilisateurs sauf l'utilisateur courant, triés par prénom puis nom
    $stmt = $pdo->prepare("
        SELECT id, prenom, nom
        FROM inscrits
        WHERE id != ?
        ORDER BY prenom ASC, nom ASC
    ");
    $stmt->execute([$me]);

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['users' => $users]);
} catch (Throwable $e) {
    http_response_code(500); // Erreur serveur
    echo json_encode(['error' => 'Erreur serveur']);
    exit;
}





// session_start();
// header('Content-Type: application/json; charset=utf-8');
// if (!isset($_SESSION['user']['id'])) {
//     echo json_encode(['error'=>'Non connecté']);
//     exit;
// }
// $me = (int)$_SESSION['user']['id'];
// $pdo = new PDO("mysql:host=sql309.infinityfree.com;dbname=$dbname;charset=utf8", $username, $password);
// $stmt = $pdo->prepare("SELECT id, prenom, nom FROM inscrits WHERE id != ? ORDER BY prenom ASC, nom ASC");
// $stmt->execute([$me]);
// echo json_encode(['users'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
