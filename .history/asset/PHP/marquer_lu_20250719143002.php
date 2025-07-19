<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error'=>'Non connecté']);
    exit;
}
$me = (int)$_SESSION['user']['id'];
$with = intval($_POST['with'] ?? 0);
if ($with <= 0) {
    echo json_encode(['error'=>'Paramètre manquant']);
    exit;
}

$pdo = new PDO('mysql:host=sql309.infinityfree.com;dbname=if0_39505571_db_projet;charset=utf8','if0_39505571_XXX','qBOSjJTyyq5Trff');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Marquer les messages reçus comme lus
$stmt = $pdo->prepare("UPDATE messages SET lu = 1 WHERE sender_id = ? AND receiver_id = ? AND lu = 0");
$stmt->execute([$with, $me]);
echo json_encode(['success'=>true]);
