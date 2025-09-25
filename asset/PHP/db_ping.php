<?php
require __DIR__ . '/db_conn.php';
echo "OK DB, trajets = " . (int)$pdo->query("SELECT COUNT(*) FROM trajets")->fetchColumn();
