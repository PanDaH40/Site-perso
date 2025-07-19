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
