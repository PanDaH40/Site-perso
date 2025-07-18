<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user']['id'])) { echo json_encode(['error'=>'Non connecté']); exit; }
$me = (int)$_SESSION['user']['id'];
$pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');
$stmt = $pdo->prepare("SELECT id, prenom, nom FROM inscrits WHERE id != ?");
$stmt->execute([$me]);
echo json_encode(['users'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);

