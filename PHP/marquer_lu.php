<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user']['id'])) {
  echo json_encode(['error' => 'Non connecté']);
  exit;
}

$me   = (int)$_SESSION['user']['id'];
$with = isset($_POST['with']) ? (int)$_POST['with'] : 0;
if ($with <= 0) {
  echo json_encode(['error' => 'Paramètre manquant']);
  exit;
}

try {
  require_once __DIR__ . '/db_conn.php';

  // Marque les messages reçus de "with" comme lus (champ `lu` d’après ton schéma)
  $stmt = $pdo->prepare("
    UPDATE messages
       SET lu = 1
     WHERE sender_id = ? AND receiver_id = ? AND lu = 0
  ");
  $stmt->execute([$with, $me]);

  echo json_encode(['success' => true]);
} catch (Throwable $e) {
  echo json_encode(['error' => 'Erreur serveur']);
}




// session_start();
// header('Content-Type: application/json');
// if (!isset($_SESSION['user']['id'])) {
//     echo json_encode(['error'=>'Non connecté']);
//     exit;
// }
// $me = (int)$_SESSION['user']['id'];
// $with = intval($_POST['with'] ?? 0);
// if ($with <= 0) {
//     echo json_encode(['error'=>'Paramètre manquant']);
//     exit;
// }

// $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
// $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// // Marquer les messages reçus comme lus
// $stmt = $pdo->prepare("UPDATE messages SET lu = 1 WHERE sender_id = ? AND receiver_id = ? AND lu = 0");
// $stmt->execute([$with, $me]);
// echo json_encode(['success'=>true]);
