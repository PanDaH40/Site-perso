<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');

if ((int)($_SESSION['user']['admin'] ?? 0) !== 1) {
  http_response_code(403);
  echo json_encode(['error'=>'Accès refusé']); exit;
}

$in = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$id     = (int)($in['id'] ?? 0);
$statut = trim((string)($in['statut'] ?? '')); // ex: 'nouveau','en_cours','clos'
if ($id<=0 || $statut==='') { echo json_encode(['error'=>'Paramètres invalides']); exit; }

try {
  require_once __DIR__ . '/db_conn.php';
  $stmt = $pdo->prepare("UPDATE signalements SET statut=? WHERE id=?");
  $stmt->execute([$statut, $id]);
  echo json_encode(['success'=>true,'statut'=>$statut]);
} catch (Throwable $e) {
  error_log('traiter_signalement: '.$e->getMessage());
  echo json_encode(['error'=>'Erreur serveur']);
}



// session_start();
// header('Content-Type: application/json');

// if (!isset($_SESSION['user']['admin']) || $_SESSION['user']['admin'] != 1) {
//     http_response_code(403);
//     echo json_encode(['error' => 'Accès refusé']);
//     exit;
// }

// $input = json_decode(file_get_contents('php://input'), true);
// $id = isset($input['id']) ? (int)$input['id'] : 0;

// if ($id < 1) {
//     http_response_code(400);
//     echo json_encode(['error' => 'ID invalide']);
//     exit;
// }

// try {
//     $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password), [
//         PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
//     ]);

//     $stmt = $pdo->prepare("UPDATE signalements SET statut = 'traite' WHERE id = ?");
//     $stmt->execute([$id]);

//     if ($stmt->rowCount() > 0) {
//         echo json_encode(['success' => true, 'message' => 'Signalement marqué comme traité.']);
//     } else {
//         echo json_encode(['error' => 'Signalement non trouvé ou déjà traité.']);
//     }
// } catch (Exception $e) {
//     http_response_code(500);
//     echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
// }
