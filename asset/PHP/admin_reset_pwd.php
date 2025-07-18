<?php
require_once 'check_admin.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$id = intval($data['id'] ?? 0);
if (!$id) { echo json_encode(['error' => "ID invalide"]); exit; }

function genererPwd($len = 10) {
    return substr(str_shuffle("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"),0,$len);
}

$nouveau = genererPwd();
$nouveau_hash = password_hash($nouveau, PASSWORD_DEFAULT);

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');
    $stmt = $pdo->prepare("UPDATE inscrits SET mot_de_passe=? WHERE id=?");
    $stmt->execute([$nouveau_hash, $id]);
    // En prod, il faut envoyer le mot de passe par email !
    echo json_encode(['success' => true, 'nv_mdp' => $nouveau]);
} catch (Exception $e) {
    echo json_encode(['error' => "Erreur serveur"]);

    // ... vérif admin ...
$userId = $input['id'];
// 1. Génère un token sécurisé
$token = bin2hex(random_bytes(32));
// 2. Enregistre dans la table inscrits (champ reset_token, reset_token_expire)
$stmt = $pdo->prepare("UPDATE inscrits SET reset_token=?, reset_token_expire=DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id=?");
$stmt->execute([$token, $userId]);
// 3. Envoie un mail (remplace "user@email.com" par le vrai mail récupéré)
$link = "https://tonsite.com/reset_mdp.php?token=$token";
mail($userEmail, "Réinitialisation mot de passe", "Cliquez sur ce lien : $link");
echo json_encode(['success'=>true]);

}
