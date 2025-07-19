<?php
// asset/PHP/trajets.php
session_start();
header('Content-Type: application/json');

// 1) Connexion à la base
$host     = 'localhost';
$dbname   = 'covoiturage_db';
$username = 'root';
$password = '';
try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    error_log('Erreur connexion BD trajets.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion DB']);
    exit;
}

// Récupérer l'ID utilisateur (si connecté)
$userId = $_SESSION['user']['id'] ?? null;

// ------------------------------------------------------------------
// 2) Création d'un nouveau trajet (conducteur)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Utilisateur non connecté']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $date    = $input['date']    ?? '';
    $heure   = $input['heure']   ?? '';
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
            ':prix'    => $prix
        ]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        error_log('Erreur SQL INSERT trajets: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// ------------------------------------------------------------------
// 3) Liste publique de tous les trajets disponibles
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
            u.prenom   AS conducteur_prenom,
            u.nom      AS conducteur_nom,
            u.avatar   AS conducteur_avatar,
            COALESCE(SUM(r.places_reservees),0) AS total_reservations
          FROM trajets t
          JOIN conducteurs c     ON c.inscrit_id    = t.conducteur_id
          JOIN inscrits   u      ON u.id            = c.inscrit_id
          LEFT JOIN reservations r ON r.trajet_id   = t.id
          WHERE t.statut = 'disponible'
          GROUP BY t.id, u.prenom, u.nom, u.avatar
          ORDER BY t.date DESC, t.heure DESC
        ";
        $stmt = $pdo->query($sql);
        $all = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['all_trajets' => $all]);
    } catch (PDOException $e) {
        error_log('Erreur SQL GET all trajets: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// ------------------------------------------------------------------
// 4) Autres cas : Auth requis pour dashboard (non géré ici)
http_response_code(403);
echo json_encode(['error' => 'Requête non autorisée']);
