<?php
require 'config.php';

$stmt = $pdo->query("SELECT COUNT(*) AS total FROM trajets");
$row   = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Il y a {$row['total']} trajets dans la table.";
