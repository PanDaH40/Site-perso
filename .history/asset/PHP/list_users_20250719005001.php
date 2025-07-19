<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error'=>'Non connecté']);
    exit;
}
$me = (int)$_SESSION['user']['id'];
$pdo = new PDO('mysql:host=sql309.infinityfree.com;dbname=if0_39505571_db_projet;charset=utf8','if0_39505571_XXX','qBOSjJTyyq5Trff');
$stmt = $pdo->prepare("SELECT id, prenom, nom FROM inscrits WHERE id != ? ORDER BY prenom ASC, nom ASC");
$stmt->execute([$me]);
echo json_encode(['users'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
