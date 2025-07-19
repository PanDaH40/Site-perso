<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: connexion.php");
    exit;
}

require_once 'config.php'; // Connexion à la BDD

$id = $_SESSION['user_id'];
$sql = "SELECT * FROM inscrits WHERE id = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute([$id]);
$user = $stmt->fetch();

if (!$user || $user['admin'] != 1) {
    echo "Accès interdit (admin seulement)";
    exit;
}
?>
<!-- Reste de ta page admin ici -->
