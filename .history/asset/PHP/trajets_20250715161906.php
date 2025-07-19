<?php
// asset/PHP/trajets.php
// Gère :
//   • POST JSON pour création de trajet (conducteur connecté)
//   • GET ?all=1 pour liste publique des trajets disponibles (avec profil conducteur)
//   • GET sans paramètre pour dashboard (trajets proposés & réservés)

session_start();
header('Content-Type: application/json');

// 1) Connexion à la base de données
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
    error_log('DB connexion failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur connexion base de données']);
    exit;
}

// 2) Récupérer l'ID utilisateur (si connecté)
$userId = $_SESSION['user']['id'] ?? null;

// ----------------------------------------------------------------
// A) POST JSON : création d'un nouveau trajet
if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($_GET)) {
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Utilisateur non connecté']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $date     = trim($input['date']    ?? '');
    $heure    = trim($input['heure']   ?? '');
    $depart   = trim($input['depart']  ?? '');
    $arrivee  = trim($input['arrivee'] ?? '');
    $places   = intval($input['places'] ?? 0);
    $prix     = floatval($input['prix'] ?? -1);

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

// ----------------------------------------------------------------
// B) GET publique ?all=1 : tous les trajets disponibles
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
          FROM trajets AS t
          INNER JOIN inscrits AS u
            ON u.id = t.conducteur_id
          LEFT JOIN reservations AS r
            ON r.trajet_id = t.id
          WHERE COALESCE(t.statut,'disponible') = 'disponible'
          GROUP BY
            t.id, t.date, t.heure, t.depart, t.arrivee, t.places, t.prix,
            u.prenom, u.nom, u.avatar
          ORDER BY t.da
::contentReference[oaicite:0]{index=0}
