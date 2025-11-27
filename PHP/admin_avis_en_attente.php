<?php
session_start();
require_once __DIR__ . '/check_admin.php';
require_once __DIR__ . '/db_conn.php'; // $pdo dispo   

// Génération d'un token CSRF simple
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(16));
}

// Traitement du POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['csrf_token']) && $_POST['csrf_token'] === $_SESSION['csrf_token']) {
    $id       = intval($_POST['id']);
    $action   = $_POST['action'];  // 'valider' ou 'refuser'
    if ($action === 'valider') {
        $stmt = $pdo->prepare("UPDATE reservations SET avis_valide = 1 WHERE id = ?");
    } else {
        // Marque comme refusé (-1) ou supprime selon vos besoins
        $stmt = $pdo->prepare("UPDATE reservations SET avis_valide = -1 WHERE id = ?");
    }
    $stmt->execute([$id]);
    header("Location: admin_avis_en_attente.php");
    exit;
}

// Récupération des avis non encore validés (avis_valide = 0)
$stmt = $pdo->query("
    SELECT r.id, r.avis, r.note, i.prenom, i.nom, t.date
      FROM reservations r
      JOIN inscrits i ON r.passager_id = i.id
      JOIN trajets t   ON r.trajet_id   = t.id
     WHERE r.avis IS NOT NULL
       AND r.avis_valide = 0
    ORDER BY t.date DESC
");
$avis = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>