<?php
session_start();
header('Content-Type: application/json');

// Connexion BD
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root',
        '',
        [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error'=>'Erreur connexion base']);
    exit;
}

// ID utilisateur (si connecté)
$userId = $_SESSION['user']['id'] ?? null;

// POST → ajout de trajet
if ($_SERVER['REQUEST_METHOD']==='POST' && empty($_GET)) {
    if (!$userId) { http_response_code(401); echo json_encode(['error'=>'Non connecté']); exit; }
    $in = json_decode(file_get_contents('php://input'), true);
    $date = trim($in['date'] ?? '');
    $heure= trim($in['heure'] ?? '');
    $dep  = trim($in['depart'] ?? '');
    $arr  = trim($in['arrivee'] ?? '');
    $pl   = intval($in['places'] ?? 0);
    $pr   = floatval($in['prix'] ?? -1);
    if (!$date||!$heure||!$dep||!$arr||$pl<=0||$pr<0) {
        http_response_code(400);
        echo json_encode(['error'=>'Données invalides']);
        exit;
    }
    $stmt = $pdo->prepare(
      "INSERT INTO trajets (conducteur_id,date,heure,depart,arrivee,places,prix,statut)
       VALUES (?,?,?,?,?,?,?, 'disponible')"
    );
    $stmt->execute([$userId,$date,$heure,$dep,$arr,$pl,$pr]);
    echo json_encode(['success'=>true]);
    exit;
}

// GET ?all=1 → liste publique
if (isset($_GET['all']) && $_GET['all']==='1') {
    $sql = "
      SELECT
        t.id,
        t.date,
        t.heure,
        t.depart,
        t.arrivee,
        t.places,
        t.prix,
        u.prenom   AS conducteur_prenom,
        u.nom      AS conducteur_nom,
        u.avatar   AS conducteur_avatar,
        COALESCE(SUM(r.places_reservees),0) AS total_reservations
      FROM trajets t
      JOIN inscrits u
        ON u.id = t.conducteur_id
      LEFT JOIN reservations r
        ON r.trajet_id = t.id
      WHERE t.statut = 'disponible'
      GROUP BY
        t.id, t.date, t.heure, t.depart, t.arrivee, t.places, t.prix,
        u.prenom, u.nom, u.avatar
      ORDER BY t.date DESC, t.heure DESC
    ";
    $all = $pdo->query($sql)->fetchAll();
    echo json_encode(['all_trajets'=>$all]);
    exit;
}

// ... dashboard (inchangé) ...


// 3) Dashboard (trajets proposés et réservés) - authentification requise
if (!$userId) {
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

try {
    // a) Trajets proposés par le conducteur
    $stmt1 = $pdo->prepare(
        "SELECT t.id, t.date, t.heure, t.depart, t.arrivee, t.places, t.prix,"
      . " (SELECT COUNT(*) FROM reservations r WHERE r.trajet_id = t.id) AS total_reservations"
      . " FROM trajets t"
      . " WHERE t.conducteur_id = ?"
      . " ORDER BY t.date DESC, t.heure DESC"
    );
    $stmt1->execute([$userId]);
    $proposes = $stmt1->fetchAll();

    foreach ($proposes as &$tr) {
        $qr = $pdo->prepare(
            "SELECT i.prenom, i.nom, r.places_reservees"
          . " FROM reservations r"
          . " JOIN inscrits i ON i.id = r.passager_id"
          . " WHERE r.trajet_id = ?"
        );
        $qr->execute([$tr['id']]);
        $reservations = $qr->fetchAll();
        $tr['reservataires'] = $reservations;
        $tr['statut_conducteur'] = count($reservations) . ' réservation(s)';
    }

    // b) Trajets réservés par le passager
    $stmt2 = $pdo->prepare(
        "SELECT t.id, t.date, t.heure, t.depart, t.arrivee, t.places, t.prix,"
      . " r.places_reservees"
      . " FROM reservations r"
      . " JOIN trajets t ON t.id = r.trajet_id"
      . " WHERE r.passager_id = ?"
      . " ORDER BY t.date DESC, t.heure DESC"
    );
    $stmt2->execute([$userId]);
    $reserves = $stmt2->fetchAll();

    foreach ($reserves as &$t) {
        $t['statut_passager'] = 'Réservé ' . $t['places_reservees'] . ' place(s)';
    }

    echo json_encode([
        'trajets_proposes' => $proposes,
        'trajets_reserves' => $reserves
    ]);
} catch (PDOException $e) {
    error_log('Erreur SQL dashboard trajets: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
}
