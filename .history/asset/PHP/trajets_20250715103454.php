<?php
// trajets.php
// Gère l'affichage et la création de trajets, y compris le nouveau champ "prix"

session_start();
header('Content-Type: application/json');

// Vérification de l'authentification
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Utilisateur non authentifié']);
    exit;
}

$userId = $_SESSION['user_id'];

// Connexion à la base de données
require_once __DIR__ . '/config.php'; // instancie $pdo (PDO)

// POST : création d'un nouveau trajet
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Lecture des champs
    $date    = $input['date']    ?? null;
    $heure   = $input['heure']   ?? null;
    $depart  = isset($input['depart'])  ? trim($input['depart'])  : '';
    $arrivee = isset($input['arrivee']) ? trim($input['arrivee']) : '';
    $places  = isset($input['places'])  ? intval($input['places'])  : 0;
    $prix    = isset($input['prix'])    ? floatval($input['prix'])  : -1;

    // Validation des données
    if (!$date || !$heure || $depart === '' || $arrivee === '' || $places <= 0 || $prix < 0) {
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO trajets
             (conducteur_id, date, heure, depart, arrivee, places, prix, statut)
             VALUES (:conducteur, :date, :heure, :depart, :arrivee, :places, :prix, 'disponible')"
        );
        $stmt->execute([
            ':conducteur' => $userId,
            ':date'       => $date,
            ':heure'      => $heure,
            ':depart'     => $depart,
            ':arrivee'    => $arrivee,
            ':places'     => $places,
            ':prix'       => $prix
        ]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        error_log('Erreur SQL trajets POST: ' . $e->getMessage());
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// GET : récupération des trajets proposés et réservés
try {
    // Trajets proposés par le conducteur
    $stmt1 = $pdo->prepare(
        "SELECT id, date, heure, depart, arrivee, places, prix
         FROM trajets
         WHERE conducteur_id = :uid
           AND statut = 'disponible'
         ORDER BY date, heure"
    );
    $stmt1->execute([':uid' => $userId]);
    $trajetsProposes = [];
    while ($row = $stmt1->fetch(PDO::FETCH_ASSOC)) {
        $trajetsProposes[] = [
            'id'      => intval($row['id']),
            'date'    => $row['date'],
            'heure'   => $row['heure'],
            'depart'  => $row['depart'],
            'arrivee' => $row['arrivee'],
            'places'  => intval($row['places']),
            'prix'    => floatval($row['prix'])
        ];
    }

    // Trajets réservés par l'utilisateur
    $stmt2 = $pdo->prepare(
        "SELECT t.id, t.date, t.heure, t.depart, t.arrivee, t.places, t.prix
         FROM trajets t
         JOIN reservations r ON t.id = r.trajet_id
         WHERE r.passager_id = :uid
         ORDER BY t.date, t.heure"
    );
    $stmt2->execute([':uid' => $userId]);
    $trajetsReserves = [];
    while ($row = $stmt2->fetch(PDO::FETCH_ASSOC)) {
        $trajetsReserves[] = [
            'id'      => intval($row['id']),
            'date'    => $row['date'],
            'heure'   => $row['heure'],
            'depart'  => $row['depart'],
            'arrivee' => $row['arrivee'],
            'places'  => intval($row['places']),
            'prix'    => floatval($row['prix'])
        ];
    }

    // Réponse JSON
    echo json_encode([
        'trajetsProposes' => $trajetsProposes,
        'trajetsReserves' => $trajetsReserves
    ]);
} catch (PDOException $e) {
    error_log('Erreur SQL trajets GET: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
}
