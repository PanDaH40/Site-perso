<?php
header('Content-Type: application/json');
$data = json_decode(file_get_contents("php://input"), true);
$token = $data['token'] ?? '';
$password = $data['password'] ?? '';

if (!$token || strlen($password) < 6) {
    echo json_encode(['error' => "Paramètres invalides."]); exit;
}

try {
    require_once __DIR__ . '/db_conn.php';
    $stmt = $pdo->prepare("SELECT id, reset_token_expire FROM inscrits WHERE reset_token=?");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || strtotime($user['reset_token_expire']) < time()) {
        echo json_encode(['error' => "Lien invalide ou expiré."]); exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE inscrits SET mot_de_passe=?, reset_token=NULL, reset_token_expire=NULL WHERE id=?")
        ->execute([$hash, $user['id']]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => "Erreur serveur."]);
}
