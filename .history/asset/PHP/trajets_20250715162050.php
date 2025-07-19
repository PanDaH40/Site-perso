<?php
// trajets.php
// Gère l'ajout, l'affichage public (avec profil conducteur) et le dashboard

session_start();
header('Content-Type: application/json');

// Connexion à la base de données
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root',
        '',
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    error_log('Erreur connexion BD: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur connexion base de données']);
    exit;
}

// Récupération de l'ID utilisateur si connecté
$userId = $_SESSION['user']['id'] ?? null;

// 1) Création d'un trajet (POST JSON)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($_GET)) {
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Utilisateur non connecté']);
        exit;
    }
    $input   = json_decode(file_get_contents('php://input'), true) ?: [];
    $date    = trim($input['date']    ?? '');
    $heure   = trim($input['heure']   ?? '');
    $depart  = trim($input['depart']  ?? '');
    $arrivee = trim($input['arrivee'] ?? '');
    $places  = intval($input['places'] ?? 0);
    $prix    = floatval($input['prix'] ?? -1);
    if (!$date || !$heure || !$depart || !$arrivee || $places <= 0 || $prix < 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }
    try {
        $stmt = $pdo->prepare("
            INSERT INTO trajets
              (conducteur_id, date, heure, depart, arrivee, places, prix, statut)
            VALUES
              (:uid, :date, :heure, :depart, :arrivee, :places, :prix, 'disponible')
        ");
        $stmt->execute([
            ':uid'     => $userId,
            ':date'    => $date,
            ':heure'   => $heure,
            ':depart'  => $depart,
            ':arrivee' => $arrivee,
            ':places'  => $places,
            ':prix'    => $prix,
        ]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        error_log('Erreur SQL INSERT trajets: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// 2) Liste publique de tous les trajets disponibles (?all=1)
if (isset($_GET['all']) && $_GET['all'] === '1') {
    try {
        $sql = "
          SELECT
            t.id,
            t.date,
            t.heure,
            t.depart,
            t.arrivee,
            t.places,
            t.prix,
            u.prenom AS conducteur_prenom,
            u.nom    AS conducteur_nom,
            u.avatar AS conducteur_avatar,
            COALESCE(SUM(r.places_reservees),0) AS total_reservations
          FROM trajets AS t
          JOIN inscrits AS u
            ON u.id = t.conducteur_id
          LEFT JOIN reservations AS r
            ON r.trajet_id = t.id
          WHERE COALESCE(t.statut,'disponible') = 'disponible'
          GROUP BY
            t.id, t.date, t.heure, t.depart, t.arrivee, t.places, t.prix,
            u.prenom, u.nom, u.avatar
          ORDER BY t.date DESC, t.heure DESC
        ";
        $stmt = $pdo->query($sql);
        $all   = $stmt->fetchAll();
        echo json_encode(['all_trajets' => $all]);
    } catch (PDOException $e) {
        error_log('Erreur SQL GET all trajets: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// 3) Dashboard (trajets proposés & réservés) – authentification requise
if (!$userId) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

try {
    // a) Trajets proposés
    $stmt1 = $pdo->prepare("
        SELECT
          t.id,
          t.date,
          t.heure,
          t.depart,
          t.arrivee,
          t.places,
          t.prix,
          COALESCE(SUM(r.places_reservees),0) AS total_reservations
        FROM trajets AS t
        LEFT JOIN reservations AS r
          ON r.trajet_id = t.id
        WHERE t.conducteur_id = :uid
        GROUP BY t.id
        ORDER BY t.date DESC, t.heure DESC
    ");
    $stmt1->execute([':uid' => $userId]);
    $proposes = $stmt1->fetchAll();
    foreach ($proposes as &$tr) {
        $qr = $pdo->prepare("
            SELECT i.prenom, i.nom, r.places_reservees
            FROM reservations AS r
            JOIN inscrits AS i
              ON i.id = r.passager_id
            WHERE r.trajet_id = :tid
        ");
        $qr->execute([':tid' => $tr['id']]);
        $resList = $qr->fetchAll();
        $tr['reservataires']     = $resList;
        $tr['statut_conducteur'] = count($resList) . ' réservation(s)';
    }
    unset($tr);

    // b) Trajets réservés
    $stmt2 = $pdo->prepare("
        SELECT
          t.id,
          t.date,
          t.heure,
          t.depart,
          t.arrivee,
          t.places,
          t.prix,
          r.places_reservees
        FROM reservations AS r
        JOIN trajets AS t
          ON t.id = r.trajet_id
        WHERE r.passager_id = :uid
        ORDER BY t.date DESC, t.heure DESC
    ");
    $stmt2->execute([':uid' => $userId]);
    $reserves = $stmt2->fetchAll();
    foreach ($reserves as &$r) {
        $r['statut_passager'] = 'Réservé ' . $r['places_reservees'] . ' place(s)';
    }
    unset($r);

    echo json_encode([
        'trajets_proposes' => $proposes,
        'trajets_reserves' => $reserves
    ]);
} catch (PDOException $e) {
    error_log('Erreur SQL dashboard trajets: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
