<?php
header('Content-Type: application/json');
$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');

if (!$email) {
    echo json_encode(['error' => "Email manquant."]); exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8', 'root', '');
    $stmt = $pdo->prepare("SELECT id FROM inscrits WHERE email=?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => true]); // On ne révèle pas si l'email existe
        exit;
    }

    $token = bin2hex(random_bytes(32));
    $pdo->prepare("UPDATE inscrits SET reset_token=?, reset_token_expire=DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id=?")
        ->execute([$token, $user['id']]);

    $reset_link = "http://localhost/TPCovoiturage/reset_password.html?token=$token";
    // Pour dev: on écrit dans un fichier local (remplace par mail() en prod !)
    file_put_contents(__DIR__ . '/reset_mail_dev.txt', "Pour: $email\nLien: $reset_link\n\n", FILE_APPEND);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => "Erreur serveur."]);
}
