<?php
require_once 'check_admin.php';
header('Content-Type: application/json');
$data = json_decode(file_get_contents("php://input"), true);
$id = intval($data['id'] ?? 0);
$password = $data['password'] ?? '';

if (!$id || strlen($password) < 6) {
    echo json_encode(['error' => 'Paramètres invalides ou mot de passe trop court']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE inscrits SET mot_de_passe=? WHERE id=?");
    $stmt->execute([$hash, $id]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Erreur serveur']);
}
