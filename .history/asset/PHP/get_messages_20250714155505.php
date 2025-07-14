<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user'])) { echo json_encode(['error'=>'Non connecté']); exit; }
$me   = $_SESSION['user']['id'];
$with = intval($_GET['with'] ?? 0);
if ($with <= 0) { echo json_encode(['error'=>'Paramètre manquant']); exit; }

$pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $pdo->prepare(
  "SELECT m.*, s.prenom AS sender_prenom, s.nom AS sender_nom
   FROM messages m
   JOIN inscrits s ON s.id=m.sender_id
   WHERE (sender_id=? AND receiver_id=?)
      OR (sender_id=? AND receiver_id=?)
   ORDER BY created_at ASC"
);
$stmt->execute([$me,$with,$with,$me]);
echo json_encode(['messages'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
