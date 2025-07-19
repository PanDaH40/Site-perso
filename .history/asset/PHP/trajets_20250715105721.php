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

// Connexion à la base de données sans config.php
try {
    $host     = 'localhost';       // Adresse du serveur MySQL
    $dbname   = 'TPCovoiturage';   // Nom de la base de données
    $username = 'root';            // Utilisateur MySQL
    $password = '';                // Mot de passe MySQL
    $dsn      = "mysql:host=$host;dbname=$dbname;charset=utf8";
    $pdo      = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    error_log('Erreur connexion BD: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur connexion base de données']);
    exit;
}

// POST : création d'un nouveau trajet
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $date    = $input['date']    ?? null;
    $heure   = $input['heure']   ?? null;
    $depart  = trim($input['depart']  ?? '');
    $arrivee = trim($input['arrivee'] ?? '');
    $places  = intval($input['places'] ?? 0);
    $prix    = floatval($input['prix'] ?? -1);
    // Validation
    if (!$date || !$heure || $depart === '' || $arrivee === '' || $places <= 0 || $prix < 0) {
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO trajets
             (conducteur_id, date, heure, depart, arrivee, places, prix, statut)
             VALUES (:uid, :date, :heure, :depart, :arrivee, :places, :prix, 'disponible')"
        );
        $stmt->execute([
            ':uid'      => $userId,
            ':date'     => $date,
            ':heure'    => $heure,
            ':depart'   => $depart,
            ':arrivee'  => $arrivee,
            ':places'   => $places,
            ':prix'     => $prix
        ]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        error_log('Erreur SQL POST trajets: ' . $e->getMessage());
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// GET : récupération des trajets proposés et réservés
try {
    // Trajets proposés
    $stmt1 = $pdo->prepare(
        "SELECT id, date, heure, depart, arrivee, places, prix
         FROM trajets
         WHERE conducteur_id = :uid
           AND statut = 'disponible'
         ORDER BY date, heure"
    );
    $stmt1->execute([':uid' => $userId]);
    $trajetsProposes = $stmt1->fetchAll();
    // Trajets réservés
    $stmt2 = $pdo->prepare(
        "SELECT t.id, t.date, t.heure, t.depart, t.arrivee, t.places, t.prix
         FROM trajets t
         JOIN reservations r ON t.id = r.trajet_id
         WHERE r.passager_id = :uid
         ORDER BY t.date, t.heure"
    );
    $stmt2->execute([':uid' => $userId]);
    $trajetsReserves = $stmt2->fetchAll();
    echo json_encode([
        'trajetsProposes' => array_map(function($r){
            return [
                'id'=>intval($r['id']),
                'date'=>$r['date'],
                'heure'=>$r['heure'],
                'depart'=>$r['depart'],
                'arrivee'=>$r['arrivee'],
                'places'=>intval($r['places']),
                'prix'=>floatval($r['prix'])
            ];
        }, $trajetsProposes),
        'trajetsReserves' => array_map(function($r){
            return [
                'id'=>intval($r['id']),
                'date'=>$r['date'],
                'heure'=>$r['heure'],
                'depart'=>$r['depart'],
                'arrivee'=>$r['arrivee'],
                'places'=>intval($r['places']),
                'prix'=>floatval($r['prix'])
            ];
        }, $trajetsReserves)
    ]);
} catch (PDOException $e) {
    error_log('Erreur SQL GET trajets: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
}
