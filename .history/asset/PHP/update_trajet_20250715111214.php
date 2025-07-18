<?php
// update_trajet.php
// Met à jour un trajet existant, y compris le champ prix

session_start();
header('Content-Type: application/json');

// Vérification de l'authentification
if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}
$userId = $_SESSION['user']['id'];

// Configuration base de données
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

// Récupération des données POST
$id       = isset($_POST['id'])       ? intval($_POST['id'])       : 0;
$date     = $_POST['date']    ?? null;
$heure    = $_POST['heure']   ?? null;
$depart   = isset($_POST['depart'])   ? trim($_POST['depart'])   : '';
$arrivee  = isset($_POST['arrivee'])  ? trim($_POST['arrivee'])  : '';
$places   = isset($_POST['places'])   ? intval($_POST['places']) : 0;
$prix     = isset($_POST['prix'])     ? floatval($_POST['prix']) : -1;

// Validation des données
if ($id <= 0 || !$date || !$heure || $depart === '' || $arrivee === '' || $places <= 0 || $prix < 0) {
    echo json_encode(['error' => 'Données incomplètes ou invalides']);
    exit;
}

// Vérification de l'auteur du trajet
$check = $pdo->prepare("SELECT id FROM trajets WHERE id = ? AND conducteur_id = ?");
$check->execute([$id, $userId]);
if (!$check->fetch()) {
    echo json_encode(['error' => 'Accès refusé ou trajet introuvable']);
    exit;
}

// Mise à jour du trajet
try {
    $stmt = $pdo->prepare(
        "UPDATE trajets
         SET date = ?, heure = ?, depart = ?, arrivee = ?, places = ?, prix = ?
         WHERE id = ?"
    );
    $stmt->execute([$date, $heure, $depart, $arrivee, $places, $prix, $id]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    error_log('Erreur SQL UPDATE trajets: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur DB : ' . $e->getMessage()]);
}
