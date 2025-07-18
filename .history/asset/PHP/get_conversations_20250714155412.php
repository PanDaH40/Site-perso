<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user'])) { echo json_encode(['error'=>'Non connecté']); exit; }
$me = $_SESSION['user']['id'];

$pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Tous les interlocuteurs distincts
$stmt = $pdo->prepare(
  "SELECT DISTINCT
     CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS user_id
   FROM messages
   WHERE sender_id = ? OR receiver_id = ?
   ORDER BY MAX(created_at) DESC"
);
$stmt->execute([$me,$me,$me]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Charger leurs noms
$ids = array_column($rows,'user_id');
if (count($ids)) {
  $in  = implode(',', array_map('intval',$ids));
  $users = $pdo->query("SELECT id, prenom, nom FROM inscrits WHERE id IN ($in)")
               ->fetchAll(PDO::FETCH_ASSOC);
  // Réindexer
  $map = []; foreach($users as $u) $map[$u['id']]=$u;
  $convs = array_map(fn($r)=>[
    'id'=>$r['user_id'],
    'prenom'=>$map[$r['user_id']]['prenom'],
    'nom'=>$map[$r['user_id']]['nom']
  ], $rows);
} else {
  $convs = [];
}

echo json_encode(['conversations'=>$convs]);
