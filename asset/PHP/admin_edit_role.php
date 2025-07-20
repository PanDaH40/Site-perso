<?php
require_once 'check_admin.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$id = intval($data['id'] ?? 0);
$role = strtolower(trim($data['role'] ?? ''));
if (!$id || !in_array($role, ['conducteur', 'passager', 'les deux'])) {
    echo json_encode(['error' => "Paramètres invalides"]); exit;
}

try {
    $pdo = new PDO(
    'mysql:host=sql309.infinityfree.com;dbname=if0_39505571_db_projet;charset=utf8',
    'if0_39505571',
    'qBOSjJTyyq5Trff',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$pdo->beginTransaction();
    // On commence par tout supprimer (pour éviter les doublons)
        $pdo->prepare("DELETE FROM conducteurs WHERE inscrit_id=?")->execute([$id]);
        $pdo->prepare("DELETE FROM passagers WHERE inscrit_id=?")->execute([$id]);


// Réinsertion selon le rôle choisi
if ($role === 'conducteur' || $role === 'les deux') {
        $pdo->prepare("INSERT INTO conducteurs (inscrit_id) VALUES (?)")->execute([$id]);
    }
    if ($role === 'passager' || $role === 'les deux') {
        $pdo->prepare("INSERT INTO passagers (inscrit_id) VALUES (?)")->execute([$id]);
    }

     $pdo->commit();

     
    echo json_encode(['success' => true, 'message' => 'Rôle mis à jour']);

  } catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
