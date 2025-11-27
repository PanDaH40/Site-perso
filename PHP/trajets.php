<?php
declare(strict_types=1);

ini_set('display_errors', '1');
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');

// ------------------------------------
// Connexion BD
// ------------------------------------
$host = 'ecoridt815.mysql.db';
$dbname = 'ecoridt815';
$username = 'ecoridt815';
$password = 'Thebigdu40';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    error_log('Erreur connexion BD: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur connexion base de données']);
    exit;
}

$userId = $_SESSION['user']['id'] ?? null;

// ------------------------------------
// 1. Création de trajet (POST)
// ------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if (!$userId) {
        echo json_encode(['error' => 'Utilisateur non connecté']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $date    = $input['date'] ?? null;
    $heure   = $input['heure'] ?? null;
    $depart  = trim($input['depart'] ?? '');
    $arrivee = trim($input['arrivee'] ?? '');
    $places  = intval($input['places'] ?? 0);
    $jetons  = floatval($input['jetons'] ?? -1);

    if (!$date || !$heure || !$depart || !$arrivee || $places <= 0 || $jetons < 0) {
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO trajets (conducteur_id, date, heure, depart, arrivee, places, jetons)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $date, $heure, $depart, $arrivee, $places, $jetons]);
        echo json_encode(['success' => true]);

    } catch (PDOException $e) {
        error_log('Erreur SQL INSERT trajets: ' . $e->getMessage());
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// ------------------------------------
// 2. Liste publique filtrée (GET all=1)
// ------------------------------------
if (isset($_GET['all']) && $_GET['all'] === '1') {
    try {
        $where = [];
        $params = [];

        $where[] = "(t.places - (SELECT COALESCE(SUM(r.places_reservees),0) 
                                FROM reservations r 
                                WHERE r.trajet_id = t.id AND r.statut = 'valide')) > 0";

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
            $where[] = "DATE(t.date) = ?";
            $params[] = $_GET['date'];
        }

        if (!empty($_GET['places_min'])) {
            $where[] = "(t.places - (SELECT COALESCE(SUM(r.places_reservees),0) 
                                     FROM reservations r 
                                     WHERE r.trajet_id = t.id AND r.statut = 'valide')) >= ?";
            $params[] = intval($_GET['places_min']);
        }

        if (!empty($_GET['jetons_max'])) {
            $where[] = "t.jetons <= ?";
            $params[] = floatval($_GET['jetons_max']);
        }

        if (!empty($_GET['note_min'])) {
            $where[] = "(SELECT AVG(a.note) FROM avis a WHERE a.utilisateur_id = t.conducteur_id) >= ?";
            $params[] = floatval($_GET['note_min']);
        }

        $sql = "
            SELECT 
                t.*,
                (SELECT COALESCE(SUM(r.places_reservees),0)
                 FROM reservations r 
                 WHERE r.trajet_id = t.id AND r.statut = 'valide') AS total_reservations,
                c.marque_vehicule, c.modele_vehicule, c.carburant, c.animaux, c.fumeurs,
                i.prenom AS conducteur_prenom, i.nom AS conducteur_nom, i.avatar AS conducteur_avatar
            FROM trajets t
            JOIN conducteurs c ON t.conducteur_id = c.inscrit_id
            JOIN inscrits i ON c.inscrit_id = i.id
            " . (count($where) ? "WHERE " . implode(" AND ", $where) : "") . "
            ORDER BY t.date ASC, t.heure ASC
        ";

        $stmt = $pdo->prepare($sql);
$stmt->execute($params);
$trajets = $stmt->fetchAll();

// 🔎 Si on a trouvé des trajets → renvoyer normal
if (!empty($trajets)) {
    echo json_encode(['all_trajets' => $trajets]);
    exit;
}

// 🔎 Sinon → rechercher la date alternative la plus proche
if (!empty($_GET['date']) && !empty($_GET['depart']) && !empty($_GET['arrivee'])) {

    $altWhere = [
        "t.depart LIKE ?",
        "t.arrivee LIKE ?",

        // 👉 On propose un trajet le même jour OU après
        "CONCAT(t.date, ' ', t.heure) >= CONCAT(?, ' 00:00:00')",

        // Toujours futur strict (sécurité)
        "CONCAT(t.date, ' ', t.heure) > NOW()",

        "(t.places - (
            SELECT COALESCE(SUM(r.places_reservees),0)
            FROM reservations r
            WHERE r.trajet_id = t.id AND r.statut = 'valide'
        )) > 0"
    ];

    $altParams = [
        '%' . $_GET['depart'] . '%',
        '%' . $_GET['arrivee'] . '%',
        $_GET['date']
    ];

    // Filtres optionnels identiques
    if (!empty($_GET['places_min'])) {
        $altWhere[] = "(t.places - (
            SELECT COALESCE(SUM(r.places_reservees),0)
            FROM reservations r
            WHERE r.trajet_id = t.id AND r.statut = 'valide'
        )) >= ?";
        $altParams[] = intval($_GET['places_min']);
    }

    if (!empty($_GET['jetons_max'])) {
        $altWhere[] = "t.jetons <= ?";
        $altParams[] = floatval($_GET['jetons_max']);
    }

    if (!empty($_GET['note_min'])) {
        $altWhere[] = "(SELECT AVG(a.note) FROM avis a WHERE a.utilisateur_id = t.conducteur_id) >= ?";
        $altParams[] = floatval($_GET['note_min']);
    }

    $sqlAlt = "
        SELECT t.date
        FROM trajets t
        WHERE " . implode(" AND ", $altWhere) . "
        ORDER BY t.date ASC, t.heure ASC
        LIMIT 1
    ";

    $stmtAlt = $pdo->prepare($sqlAlt);
    $stmtAlt->execute($altParams);
    $altDate = $stmtAlt->fetchColumn();

    echo json_encode([
        'all_trajets' => [],
        'date_alternative' => $altDate ? date('d/m/Y', strtotime($altDate)) : null,
        'message' => $altDate
            ? "Aucun trajet trouvé. Prochaine disponibilité : " . date('d/m/Y', strtotime($altDate))
            : "Aucun trajet disponible pour les critères choisis."
    ]);
    exit;
}

// Si aucun trajet mais filtre incomplet → réponse simple
echo json_encode(['all_trajets' => []]);
exit;


    } catch (PDOException $e) {
        error_log('Erreur SQL GET all trajets: ' . $e->getMessage());
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// ------------------------------------
// 3. Dashboard utilisateur
// ------------------------------------
if (!$userId) {
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

try {

    // ------------------------------------
    // a) Trajets proposés par l’utilisateur
    // ------------------------------------
    $stmt1 = $pdo->prepare("
        SELECT 
            t.id,
            t.conducteur_id,
            t.date,
            t.heure,
            t.depart,
            t.arrivee,
            t.places,
            t.jetons,
            t.etat_trajet,
            (SELECT COALESCE(SUM(r.places_reservees),0)
             FROM reservations r 
             WHERE r.trajet_id = t.id AND r.statut = 'valide') AS total_reservations
        FROM trajets t
        WHERE t.conducteur_id = ?
          AND CONCAT(t.date, ' ', t.heure) > NOW()
        ORDER BY t.date ASC, t.heure ASC
    ");

    $stmt1->execute([$userId]);
    $trajetsProposes = $stmt1->fetchAll();

    foreach ($trajetsProposes as &$t) {
        $qr = $pdo->prepare("
            SELECT i.prenom, i.nom, r.places_reservees
            FROM reservations r
            JOIN inscrits i ON i.id = r.passager_id
            WHERE r.trajet_id = ? AND r.statut = 'valide'
        ");
        $qr->execute([$t['id']]);
        $list = $qr->fetchAll();
        $t['reservataires'] = $list;
        $t['statut_conducteur'] = count($list) . " réservation(s)";
    }
    unset($t);

    // ------------------------------------
    // b) Trajets réservés par l’utilisateur
    // ------------------------------------
    $stmt2 = $pdo->prepare("
        SELECT 
            r.id AS reservation_id,
            t.*,
            r.places_reservees,
            u.prenom AS conducteur_prenom,
            u.nom AS conducteur_nom,
            u.avatar AS conducteur_avatar
        FROM reservations r
        JOIN trajets t ON t.id = r.trajet_id
        JOIN inscrits u ON t.conducteur_id = u.id
        WHERE r.passager_id = ?
          AND r.statut = 'valide'
          AND CONCAT(t.date, ' ', t.heure) > NOW()
        ORDER BY t.date ASC, t.heure ASC
    ");

    $stmt2->execute([$userId]);
    $trajetsReserves = $stmt2->fetchAll();

    foreach ($trajetsReserves as &$tr) {
        $tr['statut_passager'] = "Réservé {$tr['places_reservees']} place(s)";
    }
    unset($tr);

    // ------------------------------------
    // c) Demandes en attente
    // ------------------------------------
    $stmt3 = $pdo->prepare("
        SELECT 
            r.id AS reservation_id,
            r.places_reservees,
            r.trajet_id,
            t.date, t.heure, t.depart, t.arrivee,
            i.prenom AS passager_prenom, i.nom AS passager_nom
        FROM reservations r
        JOIN trajets t ON t.id = r.trajet_id
        JOIN inscrits i ON i.id = r.passager_id
        WHERE t.conducteur_id = ?
          AND r.statut = 'en_attente'
        ORDER BY t.date ASC, t.heure ASC
    ");

    $stmt3->execute([$userId]);
    $demandesReservations = $stmt3->fetchAll();

    // ------------------------------------
    // d) Info utilisateur
    // ------------------------------------
    $stmtUser = $pdo->prepare("SELECT prenom, nom FROM inscrits WHERE id = ?");
    $stmtUser->execute([$userId]);
    $userInfo = $stmtUser->fetch();

    echo json_encode([
        'trajets_proposes'    => $trajetsProposes,
        'trajets_reserves'    => $trajetsReserves,
        'demandes_en_attente' => $demandesReservations,
        'user_prenom'         => $userInfo['prenom'] ?? '',
        'user_nom'            => $userInfo['nom'] ?? ''
    ]);

} catch (PDOException $e) {
    error_log('Erreur SQL dashboard: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
}
