<?php
// trajets.php
// Gère la création, la mise à jour et la récupération des trajets.

session_start();
header('Content-Type: application/json');

// Connexion à la base de données
try {
    $host     = 'localhost';
    $dbname   = 'tpcovoiturage';
    $username = 'root';
    $password = '';
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

$method = $_SERVER['REQUEST_METHOD'];

// --- GET public: liste de tous les trajets disponibles (covoiturage public) ---
if ($method === 'GET' && isset($_GET['all'])) {
    try {
        $stmt = $pdo->query(
            "SELECT t.id, t.date, t.heure, t.depart, t.arrivee, t.places, t.prix,
                    (SELECT COUNT(*) FROM reservations r WHERE r.trajet_id = t.id) AS total_reservations
             FROM trajets t
             WHERE t.statut = 'disponible'
             ORDER BY t.date, t.heure"
        );
        $all = [];
        while ($row = $stmt->fetch()) {
            $all[] = [
                'id'                 => (int)$row['id'],
                'date'               => $row['date'],
                'heure'              => $row['heure'],
                'depart'             => $row['depart'],
                'arrivee'            => $row['arrivee'],
                'places'             => (int)$row['places'],
                'prix'               => (float)$row['prix'],
                'total_reservations' => (int)$row['total_reservations']
            ];
        }
        echo json_encode(['all_trajets' => $all]);
    } catch (PDOException $e) {
        error_log('Erreur SQL GET all trajets: ' . $e->getMessage());
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// Les autres routes nécessitent l'authentification
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Utilisateur non authentifié']);
    exit;
}
$userId = $_SESSION['user_id'];

// --- POST : création d'un nouveau trajet (conducteur) ---
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $date    = $input['date']    ?? null;
    $heure   = $input['heure']   ?? null;
    $depart  = trim($input['depart']  ?? '');
    $arrivee = trim($input['arrivee'] ?? '');
    $places  = intval($input['places'] ?? 0);
    $prix    = floatval($input['prix'] ?? -1);

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
            ':uid'     => $userId,
            ':date'    => $date,
            ':heure'   => $heure,
            ':depart'  => $depart,
            ':arrivee' => $arrivee,
            ':places'  => $places,
            ':prix'    => $prix
        ]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        error_log('Erreur SQL POST trajets: ' . $e->getMessage());
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// --- GET privé : tableau de bord conducteur (proposés) et passager (réservés) ---
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
    $trajetsProposes = $stmt1->fetchAll();

    // Trajets réservés par le passager
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
                'id'=> (int)$r['id'],
                'date'=> $r['date'],
                'heure'=> $r['heure'],
                'depart'=> $r['depart'],
                'arrivee'=> $r['arrivee'],
                'places'=> (int)$r['places'],
                'prix'=> (float)$r['prix']
            ];
        }, $trajetsProposes),
        'trajetsReserves' => array_map(function($r){
            return [
                'id'=> (int)$r['id'],
                'date'=> $r['date'],
                'heure'=> $r['heure'],
                'depart'=> $r['depart'],
                'arrivee'=> $r['arrivee'],
                'places'=> (int)$r['places'],
                'prix'=> (float)$r['prix']
            ];
        }, $trajetsReserves)
    ]);
} catch (PDOException $e) {
    error_log('Erreur SQL GET trajets: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
}
