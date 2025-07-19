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
