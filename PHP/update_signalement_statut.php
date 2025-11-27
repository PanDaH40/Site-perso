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
$statut = trim((string)($in['statut'] ?? '')); // 'nouveau','en_cours','clos'...
if ($id<=0 || $statut==='') { echo json_encode(['error'=>'Paramètres invalides']); exit; }

try {
  require_once __DIR__ . '/db_conn.php';
  $pdo->prepare("UPDATE signalements SET statut=? WHERE id=?")->execute([$statut, $id]);
  echo json_encode(['success'=>true, 'statut'=>$statut]);
} catch (Throwable $e) {
  error_log('update_signalement_statut: '.$e->getMessage());
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
// $statut = isset($input['statut']) ? (int)$input['statut'] : null;

// if ($id < 1 || !in_array($statut, [0, 1], true)) {
//     http_response_code(400);
//     echo json_encode(['error' => 'Paramètres invalides']);
//     exit;
// }

// try {
//     $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password), [
//         PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
//     ]);

//     $stmt = $pdo->prepare("UPDATE signalements SET statut = ? WHERE id = ?");
//     $stmt->execute([$statut, $id]);

//     echo json_encode(['success' => true]);
// } catch (Exception $e) {
//     http_response_code(500);
//     echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
// }
