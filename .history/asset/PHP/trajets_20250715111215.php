<?php
// trajets.php
// Gère l'ajout, l'affichage public et le dashboard des trajets, avec champ prix

session_start();
header('Content-Type: application/json');

// Configuration base de données
$host     = 'localhost';
$dbname   = 'covoiturage_db';
$username = 'root';
$password = '';

try {
    // Connexion PDO
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    error_log('Erreur connexion BD: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur connexion base de données']);
    exit;
}

// Récupération de l'ID utilisateur en session
$userId = $_SESSION['user']['id'] ?? null;

// 1) Création de trajet (conducteur)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$userId) {
        echo json_encode(['error' => 'Utilisateur non connecté']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $date     = $input['date']    ?? null;
    $heure    = $input['heure']   ?? null;
    $depart   = trim($input['depart']  ?? '');
    $arrivee  = trim($input['arrivee'] ?? '');
    $places   = intval($input['places'] ?? 0);
    $prix     = floatval($input['prix'] ?? -1);

    // Validation
    if (!$date || !$heure || !$depart || !$arrivee || $places <= 0 || $prix < 0) {
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO trajets
             (conducteur_id, date, heure, depart, arrivee, places, prix, statut)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'disponible')"
        );
        $stmt->execute([$userId, $date, $heure, $depart, $arrivee, $places, $prix]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        error_log('Erreur SQL POST trajets: ' . $e->getMessage());
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// 2) Liste publique de tous les trajets disponibles
if (isset($_GET['all']) && $_GET['all'] === '1') {
    try {
        $sql = "SELECT t.id, t.date, t.heure, t.depart, t.arrivee,
                       t.places, t.prix,
                       u.prenom AS conducteur_prenom, u.nom AS conducteur_nom,
                       COALESCE(SUM(r.places_reservees),0) AS total_reservations
                  FROM trajets t
                  JOIN inscrits u ON u.id = t.conducteur_id
                  LEFT JOIN reservations r ON r.trajet_id = t.id
                 WHERE t.statut = 'disponible'
              GROUP BY t.id, u.prenom, u.nom
              ORDER BY t.date DESC, t.heure DESC";
        $all = $pdo->query($sql)->fetchAll();
        echo json_encode(['all_trajets' => $all]);
    } catch (PDOException $e) {
        error_log('Erreur SQL GET all trajets: ' . $e->getMessage());
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// 3) Dashboard (proposés et réservés) - nécessite authentification
if (!$userId) {
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

try {
    // a) Trajets proposés par le conducteur
    $stmt1 = $pdo->prepare(
        "SELECT t.id, t.date, t.heure, t.depart, t.arrivee,
                t.places, t.prix,
                COALESCE(SUM(r.places_reservees),0) AS total_reservations
           FROM trajets t
           LEFT JOIN reservations r ON r.trajet_id = t.id
          WHERE t.conducteur_id = ?
            AND t.statut = 'disponible'
       GROUP BY t.id
       ORDER BY t.date DESC, t.heure DESC"
    );
    $stmt1->execute([$userId]);
    $trajetsProposes = $stmt1->fetchAll();

    // Enrichir chaque trajet proposé
    foreach ($trajetsProposes as &$trajet) {
        $qr = $pdo->prepare(
            "SELECT i.prenom, i.nom, r.places_reservees
               FROM reservations r
               JOIN inscrits i ON i.id = r.passager_id
              WHERE r.trajet_id = ?"
        );
        $qr->execute([$trajet['id']]);
        $reservations = $qr->fetchAll();
        $trajet['reservataires'] = $reservations;
        if (count($reservations) > 0) {
            $list = array_map(function($r) {
                return "{$r['prenom']} {$r['nom']} ({$r['places_reservees']})";
            }, $reservations);
            $trajet['statut_conducteur'] = "{$trajet['total_reservations']} place(s) réservée(s): " . implode(', ', $list);
        } else {
            $trajet['statut_conducteur'] = 'Aucune réservation';
        }
    }

    // b) Trajets réservés par le passager
    $stmt2 = $pdo->prepare(
        "SELECT t.id, t.date, t.heure, t.depart, t.arrivee,
                t.places, t.prix,
                u.prenom AS conducteur_prenom, u.nom AS conducteur_nom,
                r.places_reservees
           FROM reservations r
           JOIN trajets t ON t.id = r.trajet_id
           JOIN inscrits u ON u.id = t.conducteur_id
          WHERE r.passager_id = ?
          ORDER BY t.date DESC, t.heure DESC"
    );
    $stmt2->execute([$userId]);
    $trajetsReserves = $stmt2->fetchAll();
    foreach ($trajetsReserves as &$t) {
        $t['statut_passager'] = "Réservé {$t['places_reservees']} place(s)";
    }

    echo json_encode([
        'trajets_proposes' => $trajetsProposes,
        'trajets_reserves' => $trajetsReserves
    ]);
} catch (PDOException $e) {
    error_log('Erreur SQL dashboard trajets: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
}
