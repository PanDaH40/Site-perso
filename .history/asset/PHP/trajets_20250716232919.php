<?php
// trajets.php (version avec filtres prix_max, note_min, places_min)
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');

// Connexion BD
$host = 'localhost';
$dbname = 'covoiturage_db';
$username = 'root';
$password = '';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    error_log('Erreur connexion BD: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur connexion base de données']);
    exit;
}

$userId = $_SESSION['user']['id'] ?? null;

// -------- 1. Création de trajet --------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$userId) {
        echo json_encode(['error' => 'Utilisateur non connecté']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $date    = $input['date']    ?? null;
    $heure   = $input['heure']   ?? null;
    $depart  = trim($input['depart'] ?? '');
    $arrivee = trim($input['arrivee'] ?? '');
    $places  = intval($input['places'] ?? 0);
    $jetons  = floatval($input['jetons'] ?? -1);

    if (!$date || !$heure || !$depart || !$arrivee || $places <= 0 || $jetons < 0) {
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO trajets (conducteur_id, date, heure, depart, arrivee, places, jetons)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([$userId, $date, $heure, $depart, $arrivee, $places, $jetons]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        error_log('Erreur SQL INSERT trajets: ' . $e->getMessage());
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// -------- 2. Liste publique (filtrée) --------
if (isset($_GET['all']) && $_GET['all'] === '1') {
    try {
        $where = [];
        $params = [];

        // Filtrer trajets avec places dispo (réservations validées)
        $where[] = "(t.places - (SELECT COALESCE(SUM(r.places_reservees),0) FROM reservations r WHERE r.trajet_id = t.id AND r.statut = 'valide')) > 0";
        $where[] = "CONCAT(t.date, ' ', t.heure) > NOW()";

        if (!empty($_GET['depart'])) {
            $where[] = "t.depart LIKE ?";
            $params[] = '%' . $_GET['depart'] . '%';
        }
        if (!empty($_GET['arrivee'])) {
            $where[] = "t.arrivee LIKE ?";
            $params[] = '%' . $_GET['arrivee'] . '%';
        }
        if (!empty($_GET['date'])) {
            $where[] = "t.date = ?";
            $params[] = $_GET['date'];
        }
        if (!empty($_GET['places_min'])) {
            $where[] = "(t.places - (SELECT COALESCE(SUM(r.places_reservees),0) FROM reservations r WHERE r.trajet_id = t.id AND r.statut = 'valide')) >= ?";
            $params[] = intval($_GET['places_min']);
        }
        if (!empty($_GET['prix_max'])) {
            $where[] = "t.prix <= ?";
            $params[] = floatval($_GET['prix_max']);
        }
        if (!empty($_GET['note_min'])) {
            // Filtrer par moyenne note conducteur
            $where[] = "(
                SELECT AVG(n.note) FROM notes n WHERE n.conducteur_id = t.conducteur_id
            ) >= ?";
            $params[] = floatval($_GET['note_min']);
        }

        $sql = "
SELECT 
    t.id, t.date, t.heure, t.depart, t.arrivee, t.places, t.prix,
    (SELECT COALESCE(SUM(r.places_reservees),0) FROM reservations r WHERE r.trajet_id = t.id AND r.statut = 'valide') AS total_reservations,
    t.conducteur_id,
    c.voiture, c.carburant, c.animaux, c.fumeurs,
    i.prenom AS conducteur_prenom, i.nom AS conducteur_nom, i.avatar AS conducteur_avatar
FROM trajets t
JOIN conducteurs c ON t.conducteur_id = c.inscrit_id
JOIN inscrits i ON c.inscrit_id = i.id
" . (count($where) ? "WHERE " . implode(" AND ", $where) : "") . "
ORDER BY t.date ASC, t.heure ASC
";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $all = $stmt->fetchAll();

        // Si aucun trajet trouvé à la date demandée, proposer la date alternative
        if (empty($all) && !empty($_GET['date'])) {
            $stmtAlt = $pdo->prepare("
                SELECT t.date FROM trajets t
                WHERE CONCAT(t.date, ' ', t.heure) > NOW()
                ORDER BY t.date ASC
                LIMIT 1
            ");
            $stmtAlt->execute();
            $altDate = $stmtAlt->fetchColumn();
            echo json_encode([
                'all_trajets' => [],
                'date_alternative' => $altDate ? date('d/m/Y', strtotime($altDate)) : null
            ]);
            exit;
        }

        echo json_encode(['all_trajets' => $all]);
    } catch (PDOException $e) {
        error_log('Erreur SQL GET all trajets: ' . $e->getMessage());
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// -------- 3. Dashboard utilisateur --------
if (!$userId) {
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

try {
    // a) Trajets proposés par l’utilisateur
    $stmt1 = $pdo->prepare(
        "SELECT t.id, t.date, t.heure, t.depart, t.arrivee, t.places, t.prix,
        (SELECT COALESCE(SUM(r.places_reservees),0) FROM reservations r WHERE r.trajet_id = t.id AND r.statut = 'valide') AS total_reservations
        FROM trajets t
        WHERE t.conducteur_id = ?
        AND CONCAT(t.date, ' ', t.heure) > NOW()
        ORDER BY t.date ASC, t.heure ASC"
    );
    $stmt1->execute([$userId]);
    $proposes = $stmt1->fetchAll();

    foreach ($proposes as &$tr) {
        $qr = $pdo->prepare(
            "SELECT i.prenom, i.nom, r.places_reservees
             FROM reservations r
             JOIN inscrits i ON i.id = r.passager_id
             WHERE r.trajet_id = ? AND r.statut = 'valide'"
        );
        $qr->execute([$tr['id']]);
        $reservations = $qr->fetchAll();
        $tr['reservataires'] = $reservations;
        $tr['statut_conducteur'] = count($reservations) . ' réservation(s)';
    }

    // b) Trajets réservés par l’utilisateur (filtre statut 'valide')
    $stmt2 = $pdo->prepare(
        "SELECT 
            r.id AS reservation_id,
            t.id, t.date, t.heure, t.depart, t.arrivee, t.places, t.prix,
            r.places_reservees,
            t.conducteur_id,
            c.prenom AS conducteur_prenom, c.nom AS conducteur_nom, i.avatar AS conducteur_avatar
         FROM reservations r
         JOIN trajets t ON t.id = r.trajet_id
         JOIN conducteurs c ON t.conducteur_id = c.inscrit_id
         JOIN inscrits i ON c.inscrit_id = i.id
         WHERE r.passager_id = ?
         AND r.statut = 'valide'
         AND CONCAT(t.date, ' ', t.heure) > NOW()
         ORDER BY t.date ASC, t.heure ASC"
    );
    $stmt2->execute([$userId]);
    $reserves = $stmt2->fetchAll();

    foreach ($reserves as &$t) {
        $t['statut_passager'] = 'Réservé ' . $t['places_reservees'] . ' place(s)';
    }

    // c) Demandes de réservations en attente pour les trajets du conducteur
    $stmt3 = $pdo->prepare(
        "SELECT r.id AS reservation_id, r.places_reservees, r.statut, r.trajet_id,
                t.date, t.heure, t.depart, t.arrivee,
                i.prenom AS passager_prenom, i.nom AS passager_nom
         FROM reservations r
         JOIN trajets t ON t.id = r.trajet_id
         JOIN inscrits i ON i.id = r.passager_id
         WHERE t.conducteur_id = ? AND r.statut = 'en_attente'
         ORDER BY t.date ASC, t.heure ASC"
    );
    $stmt3->execute([$userId]);
    $demandesReservations = $stmt3->fetchAll();

    // Récupérer prénom et nom utilisateur connecté
    $stmtUser = $pdo->prepare("SELECT prenom, nom FROM inscrits WHERE id = ?");
    $stmtUser->execute([$userId]);
    $userInfo = $stmtUser->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'trajets_proposes'    => $proposes,
        'trajets_reserves'    => $reserves,
        'demandes_en_attente' => $demandesReservations,
        'user_prenom'         => $userInfo['prenom'] ?? '',
        'user_nom'            => $userInfo['nom'] ?? ''
    ]);
} catch (PDOException $e) {
    error_log('Erreur SQL dashboard trajets: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
}
