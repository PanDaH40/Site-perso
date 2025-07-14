<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user'])) { echo json_encode(['error'=>'Non connecté']); exit; }
$data     = json_decode(file_get_contents('php://input'), true);
$sender   = $_SESSION['user']['id'];
$receiver = intval($data['receiver_id'] ?? 0);
$content  = trim($data['content'] ?? '');

if ($receiver<=0 || $content==='') {
  echo json_encode(['error'=>'Données invalides']); exit;
}

$pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $pdo->prepare(
  "INSERT INTO messages (sender_id, receiver_id, content)
   VALUES (?, ?, ?)"
);
$stmt->execute([$sender, $receiver, $content]);
echo json_encode(['success'=>true]);
