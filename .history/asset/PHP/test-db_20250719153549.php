<?php
// tout en tête de fichier
ini_set('display_errors', 1);
error_reporting(E_ALL);

require 'config.php';

$stmt = $pdo->query("SELECT COUNT(*) AS total FROM trajets");
$row   = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Il y a {$row['total']} trajets dans la table.";

