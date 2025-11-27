<?php
require_once 'check_admin.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

$id = intval($data['id'] ?? 0);
$role = strtolower(trim($data['role'] ?? ''));

if (!$id || !in_array($role, ['conducteur', 'passager', 'les deux'])) {
    echo json_encode(['error' => "Paramètres invalides"]);
    exit;
}

try {
    require __DIR__ . '/db_conn.php';
    $pdo->beginTransaction();

    // On récupère d’abord les infos de base de l’utilisateur
    $stmt = $pdo->prepare("SELECT prenom, nom FROM inscrits WHERE id = ?");
    $stmt->execute([$id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['error' => "Utilisateur introuvable"]);
        exit;
    }

    $prenom = $user['prenom'];
    $nom = $user['nom'];

    // Suppression pour éviter les doublons
    $pdo->prepare("DELETE FROM conducteurs WHERE inscrit_id=?")->execute([$id]);
    $pdo->prepare("DELETE FROM passagers WHERE inscrit_id=?")->execute([$id]);

    // Réinsertion selon le rôle choisi (avec PRÉNOM + NOM)
    if ($role === 'conducteur' || $role === 'les deux') {
        $pdo->prepare("
            INSERT INTO conducteurs (inscrit_id, prenom, nom)
            VALUES (?, ?, ?)
        ")->execute([$id, $prenom, $nom]);
    }

    if ($role === 'passager' || $role === 'les deux') {
        $pdo->prepare("
            INSERT INTO passagers (inscrit_id, prenom, nom)
            VALUES (?, ?, ?)
        ")->execute([$id, $prenom, $nom]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Rôle mis à jour avec succès'
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
