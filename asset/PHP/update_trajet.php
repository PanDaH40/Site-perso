<?php
// Met à jour un trajet existant via JSON, y compris le champ jetons

session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user']['id'])) { echo json_encode(['error'=>'Non connecté']); exit; }
$userId = (int)$_SESSION['user']['id'];

$in = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$trajetId = (int)($in['id'] ?? 0);
$depart   = isset($in['depart'])  ? trim((string)$in['depart'])  : null;
$arrivee  = isset($in['arrivee']) ? trim((string)$in['arrivee']) : null;
$date     = isset($in['date'])    ? trim((string)$in['date'])    : null;   // YYYY-MM-DD
$heure    = isset($in['heure'])   ? trim((string)$in['heure'])   : null;   // HH:MM
$places   = isset($in['places'])  ? (int)$in['places']           : null;
$jetons   = isset($in['jetons'])  ? (float)$in['jetons']         : null;

if ($trajetId <= 0) { echo json_encode(['error'=>'ID invalide']); exit; }

try {
  require_once __DIR__ . '/db_conn.php';

  // Vérifier propriétaire
  $stmt = $pdo->prepare("SELECT conducteur_id FROM trajets WHERE id=?");
  $stmt->execute([$trajetId]);
  $cid = (int)$stmt->fetchColumn();
  if ($cid !== $userId && (int)($_SESSION['user']['admin'] ?? 0) !== 1) {
    echo json_encode(['error'=>'Accès refusé']); exit;
  }

  // Build dynamique
  $sets = []; $params = [];
  if ($depart  !== null) { $sets[]='depart=?';  $params[]=$depart; }
  if ($arrivee !== null) { $sets[]='arrivee=?'; $params[]=$arrivee; }
  if ($date    !== null) { $sets[]='date=?';    $params[]=$date; }
  if ($heure   !== null) { $sets[]='heure=?';   $params[]=$heure; }
  if ($places  !== null) { $sets[]='places=?';  $params[]=$places; }
  if ($jetons  !== null) { $sets[]='jetons=?';  $params[]=$jetons; }

  if (!$sets) { echo json_encode(['error'=>'Aucune donnée à mettre à jour']); exit; }

  $params[] = $trajetId;
  $sql = "UPDATE trajets SET ".implode(',', $sets)." WHERE id=?";
  $pdo->prepare($sql)->execute($params);

  echo json_encode(['success'=>true]);
} catch (Throwable $e) {
  error_log('update_trajet: '.$e->getMessage());
  echo json_encode(['error'=>'Erreur serveur']);
}



// session_start();
// header('Content-Type: application/json');

// // Vérification de l'authentification
// if (!isset($_SESSION['user']['id'])) {
//     echo json_encode(['error' => 'Utilisateur non connecté']);
//     exit;
// }
// $userId = $_SESSION['user']['id'];

// // Configuration base de données
// $host = "sql309.infinityfree.com";
// $dbname = "if0_39505571_db_projet";
// $username = "if0_39505571";
// $password = "qBOSjJTyyq5Trff";
// try {
//     $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password, [
//     PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
//     PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
// ]);

// } catch (PDOException $e) {
//     error_log('Erreur connexion BD: ' . $e->getMessage());
//     echo json_encode(['error' => 'Erreur connexion base de données']);
//     exit;
// }

// // Récupération des données envoyées en JSON
// $input = json_decode(file_get_contents('php://input'), true);
// $id       = isset($input['id'])       ? intval($input['id'])       : 0;
// $date     = $input['date']    ?? null;
// $heure    = $input['heure']   ?? null;
// $depart   = isset($input['depart'])   ? trim($input['depart'])   : '';
// $arrivee  = isset($input['arrivee'])  ? trim($input['arrivee'])  : '';
// $places   = isset($input['places'])   ? intval($input['places']) : 0;
// $jetons   = isset($input['jetons'])   ? floatval($input['jetons']) : -1;

// // Validation des données
// if ($id <= 0 || !$date || !$heure || $depart === '' || $arrivee === '' || $places <= 0 || $jetons < 0) {
//     echo json_encode(['error' => 'Données incomplètes ou invalides']);
//     exit;
// }

// // Vérification de l'auteur du trajet
// $check = $pdo->prepare("SELECT id FROM trajets WHERE id = ? AND conducteur_id = ?");
// $check->execute([$id, $userId]);
// if (!$check->fetch()) {
//     echo json_encode(['error' => 'Accès refusé ou trajet introuvable']);
//     exit;
// }

// // Mise à jour du trajet
// try {
//     $stmt = $pdo->prepare(
//         "UPDATE trajets
//          SET date = ?, heure = ?, depart = ?, arrivee = ?, places = ?, jetons = ?
//          WHERE id = ?"
//     );
//     $stmt->execute([$date, $heure, $depart, $arrivee, $places, $jetons, $id]);
//     echo json_encode(['success' => true]);
// } catch (PDOException $e) {
//     error_log('Erreur SQL UPDATE trajets: ' . $e->getMessage());
//     echo json_encode(['error' => 'Erreur DB : ' . $e->getMessage()]);
// }
