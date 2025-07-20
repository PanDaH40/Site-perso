<?php
header('Content-Type: application/json');
$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');

if (!$email) {
    echo json_encode(['error' => "Email manquant."]); exit;
}

try {
    $pdo = new PDO('mysql:host=sql309.infinityfree.com;dbname=if0_39505571_db_projet;charset=utf8', 'if0_39505571', 'qBOSjJTyyq5Trff');
    $stmt = $pdo->prepare("SELECT id FROM inscrits WHERE email=?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // On ne révèle pas si l'email existe ou non !
    if (!$user) {
        echo json_encode(['success' => true]); // Toujours OK, sécurité !
        exit;
    }

    $token = bin2hex(random_bytes(32));
    $pdo->prepare("UPDATE inscrits SET reset_token=?, reset_token_expire=DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id=?")
        ->execute([$token, $user['id']]);

    // Envoie email (à adapter, ici c'est un mail brut)
    $reset_link = "http://localhost/TPCovoiturage/reset_password.html?token=$token";
    mail($email, "Réinitialisation de votre mot de passe", 
        "Cliquez sur ce lien pour réinitialiser votre mot de passe : $reset_link");

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => "Erreur serveur."]);
}
