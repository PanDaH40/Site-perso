<?php
session_start();
header('Content-Type: application/json');

// Vérification session utilisateur
if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}

$me = (int)$_SESSION['user']['id'];
$isAdmin = isset($_SESSION['user']['admin']) && $_SESSION['user']['admin'] == 1;

$data = json_decode(file_get_contents('php://input'), true);

// Paramètres reçus
$destinataire_id = isset($data['destinataire_id']) ? (int)$data['destinataire_id'] : 0;
$message = trim($data['message'] ?? '');
$via_admin = !empty($data['via_admin']) && $isAdmin ? 1 : 0;   // 1 si admin envoie

// Vérification basique
if ($destinataire_id <= 0 || $message === '') {
    echo json_encode(['error' => 'Paramètres invalides']);
    exit;
}

try {
    require_once __DIR__ . '/db_conn.php';

    $hasViaAdminColumn = false;

    try {
        $pdo->query("SELECT via_admin FROM messages LIMIT 1");
        $hasViaAdminColumn = true;
    } catch (Exception $e) {
        $hasViaAdminColumn = false;
    }

    if ($hasViaAdminColumn) {
        $sql = "
            INSERT INTO messages (sender_id, receiver_id, content, created_at, is_read, via_admin)
            VALUES (?, ?, ?, NOW(), 0, ?)
        ";
        $params = [$me, $destinataire_id, $message, $via_admin];
    } else {
        // Version sans colonne "via_admin"
        $sql = "
            INSERT INTO messages (sender_id, receiver_id, content, created_at, is_read)
            VALUES (?, ?, ?, NOW(), 0)
        ";
        $params = [$me, $destinataire_id, $message];
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur serveur',
        'debug' => $e->getMessage()
    ]);
}
