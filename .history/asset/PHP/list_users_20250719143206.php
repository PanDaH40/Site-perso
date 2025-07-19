<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error'=>'Non connecté']);
    exit;
}
$me = (int)$_SESSION['user']['id'];
$pdo = new PDO("mysql:host=sql309.infinityfree.com;dbname=$dbname;charset=utf8", $username, $password);
$stmt = $pdo->prepare("SELECT id, prenom, nom FROM inscrits WHERE id != ? ORDER BY prenom ASC, nom ASC");
$stmt->execute([$me]);
echo json_encode(['users'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
