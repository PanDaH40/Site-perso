<?php
// update_trajet.php
// Met à jour un trajet existant en base de données, y compris le nouveau champ "prix"

session_start();
header('Content-Type: application/json');

// Vérification de l'authentification
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Utilisateur non authentifié']);
    exit;
}

$userId = $_SESSION['user_id'];

// Connexion à la base de données (adapter le chemin si nécessaire)
require_once __DIR__ . '/config.php'; // Ce fichier doit instancier $pdo (PDO)

// Récupération des données JSON
$input = json_decode(file_get_contents('php://input'), true);

// Récupérer l'ID du trajet à mettre à jour
$id = isset($input['id']) ? intval($input['id']) : 0;

// Lecture des champs
$date    = $input['date']    ?? null;
$heure   = $input['heure']   ?? null;
$depart  = isset($input['depart'])  ? trim($input['depart'])  : '';
$arrivee = isset($input['arrivee']) ? trim($input['arrivee']) : '';
$places  = isset($input['places'])  ? intval($input['places'])  : 0;
$prix    = isset($input['prix'])    ? floatval($input['prix'])  : -1;

// Validation des données
if ($id <= 0
    || !$date
    || !$heure
    || $depart === ''
    || $arrivee === ''
    || $places <= 0
    || $prix < 0
) {
    echo json_encode(['error' => 'Données invalides']);
    exit;
}

try {
    // Préparation de la requête de mise à jour
    $stmt = $pdo->prepare(
        "UPDATE trajets
         SET date    = :date,
             heure   = :heure,
             depart  = :depart,
             arrivee = :arrivee,
             places  = :places,
             prix    = :prix
         WHERE id = :id
           AND conducteur_id = :conducteur_id"
    );

    // Exécution avec liaison des paramètres
    $stmt->execute([
        ':date'            => $date,
        ':heure'           => $heure,
        ':depart'          => $depart,
        ':arrivee'         => $arrivee,
        ':places'          => $places,
        ':prix'            => $prix,
        ':id'              => $id,
        ':conducteur_id'   => $userId
    ]);

    // Vérifier qu'une ligne a bien été modifiée
    if ($stmt->rowCount() === 0) {
        echo json_encode(['error' => 'Trajet introuvable ou pas autorisé']);
    } else {
        echo json_encode(['success' => true]);
    }
} catch (PDOException $e) {
    // En cas d'erreur SQL
    error_log('Erreur SQL update_trajet: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
}
