<?php
// asset/PHP/admin_get_users.php
require 'check_admin.php'; // Sécurise : vérifie si l'utilisateur est admin
header('Content-Type: application/json');

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur connexion BD']);
    exit;
}

$where = [];
$params = [];
if (!empty($_GET['search'])) {
    $where[] = "(prenom LIKE ? OR nom LIKE ? OR email LIKE ?)";
    for ($i=0;$i<3;$i++) $params[] = "%".$_GET['search']."%";
}
if (!empty($_GET['role'])) {
    if ($_GET['role'] === 'conducteur')    $where[] = "roleConducteur = 1";
    if ($_GET['role'] === 'passager')      $where[] = "rolePassager = 1";
}
if (!empty($_GET['statut'])) {
    $where[] = "statut = ?";
    $params[] = $_GET['statut'];
}
$sql = "SELECT id, prenom, nom, email, admin, statut, roleConducteur, rolePassager, jetons
        FROM inscrits
        ".(count($where) ? "WHERE ".implode(" AND ", $where) : "");
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['users' => $users]);
