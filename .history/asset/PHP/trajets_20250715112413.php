<?php
// trajets.php
// Gère l'ajout, l'affichage public et le dashboard des trajets, avec champ prix

session_start();
header('Content-Type: application/json');

// Connexion base de données
$host     = 'localhost';
$dbname   = 'covoiturage_db';
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

// Récupération ID utilisateur (si connecté)
$userId = $_SESSION['user']['id'] ?? null;

// 1) Création de trajet (conducteur)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$userId) {
        echo json_encode(['error' => 'Utilisateur non connecté']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $date    = $input['date']    ?? null;
    $heure   = $input['heure']   ?? null;
    $depart  = trim($input['depart']  ?? '');
    $arrivee = trim($input['arrivee'] ?? '');
    $places  = intval($input['places'] ?? 0);
    $prix    = floatval($input['prix'] ?? -1);

    if (!$date || !$heure || !$depart || !$arrivee || $places <= 0 || $prix < 0) {
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO trajets (conducteur_id,date,heure,depart,arrivee,places,prix,statut) VALUES (?,?,?,?,?,?,?,'disponible')");
        $stmt->execute([$userId, $date, $heure, $depart, $arrivee, $places, $prix]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        error_log('Erreur SQL INSERT trajets: '.$e->getMessage());
        echo json_encode(['error'=>'Erreur serveur']);
    }
    exit;
}

// 2) Liste publique de tous les trajets disponibles
if (isset($_GET['all']) && $_GET['all']==='1') {
    try {
        $sql = "SELECT t.id,t.date,t.heure,t.depart,t.arrivee,t.places,t.prix,u.prenom AS conducteur_prenom,u.nom AS conducteur_nom,"
             . "(SELECT COUNT(*) FROM reservations r WHERE r.trajet_id=t.id) AS total_reservations"
             . " FROM trajets t JOIN inscrits u ON u.id=t.conducteur_id WHERE t.statut='disponible'"
             . " ORDER BY t.date DESC,t.heure DESC";
        $all = $pdo->query($sql)->fetchAll();
        echo json_encode(['all_trajets'=>$all]);
    } catch (PDOException $e) {
        error_log('Erreur SQL GET all trajets: '.$e->getMessage());
        echo json_encode(['error'=>'Erreur serveur']);
    }
    exit;
}

// 3) Dashboard (trajets proposés et réservés) - authentification requise
if (!$userId) {
    echo json_encode(['error'=>'Utilisateur non connecté']);
    exit;
}

try {
    // a) Trajets proposés
    $stmt1 = $pdo->prepare("SELECT t.id,t.date,t.heure,t.depart,t.arrivee,t.places,t.prix,(SELECT COUNT(*) FROM reservations r WHERE r.trajet_id=t.id) AS total_reservations FROM trajets t WHERE t.conducteur_id=? AND t.statut='disponible' ORDER BY t.date DESC,t.heure DESC");
    $stmt1->execute([$userId]);
    $proposes = $stmt1->fetchAll();
    foreach ($proposes as &$tr) {
        $qr = $pdo->prepare("SELECT i.prenom,i.nom,r.places_reservees FROM reservations r JOIN inscrits i ON i.id=r.passager_id WHERE r.trajet_id=?");
        $qr->execute([$tr['id']]);
        $res = $qr->fetchAll();
        $tr['reservataires']=$res;
        $tr['statut_conducteur'] = count($res)?(count($res).' réservations'): 'Aucune réservation';
    }
    // b) Trajets réservés
    $stmt2 = $pdo->prepare("SELECT t.id,t.date,t.heure,t.depart,t.arrivee,t.places,t.prix,u.prenom AS conducteur_prenom,u.nom AS conducteur_nom,r.places_reservees FROM reservations r JOIN trajets t ON t.id=r.trajet_id JOIN inscrits u ON u.id=t.conducteur_id WHERE r.passager_id=? ORDER BY t.date DESC,t.heure DESC");
    $stmt2->execute([$userId]);
    $reserves = $stmt2->fetchAll();
    foreach($reserves as &$t){$t['statut_passager']='Réservé '.$t['places_reservees'].' places';}

    echo json_encode(['trajets_proposes'=>$proposes,'trajets_reserves'=>$reserves]);
} catch (PDOException $e) {
    error_log('Erreur SQL dashboard trajets: '.$e->getMessage());
    echo json_encode(['error'=>'Erreur serveur']);
}
