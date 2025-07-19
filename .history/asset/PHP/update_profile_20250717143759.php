<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = (int)$_SESSION['user']['id'];

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root', '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Validation des champs prénom, nom, email seulement si présents dans POST
    foreach (['prenom', 'nom', 'email'] as $champ) {
        if (isset($_POST[$champ]) && trim($_POST[$champ]) === '') {
            echo json_encode(['error' => "Le champ $champ est obligatoire."]);
            exit;
        }
    }

    // Si on veut changer le mot de passe, mot de passe actuel obligatoire
    if (!empty($_POST['newPassword']) || !empty($_POST['newPasswordConfirm'])) {
        if (empty($_POST['passwordConfirm'])) {
            echo json_encode(['error' => 'Le mot de passe actuel est requis pour confirmer les modifications.']);
            exit;
        }
        $passwordConfirm = $_POST['passwordConfirm'];

        // Vérifier le mot de passe actuel
        $stmt = $pdo->prepare("SELECT password FROM inscrits WHERE id = ?");
        $stmt->execute([$userId]);
        $hashedPassword = $stmt->fetchColumn();

        if (!$hashedPassword || !password_verify($passwordConfirm, $hashedPassword)) {
            echo json_encode(['error' => 'Mot de passe actuel incorrect.']);
            exit;
        }
    } else {
        $passwordConfirm = null;
    }

    // Mise à jour du profil (si au moins prénom, nom, email envoyés)
    if (isset($_POST['prenom']) && isset($_POST['nom']) && isset($_POST['email'])) {
        $bio = isset($_POST['bio']) ? trim($_POST['bio']) : null;

        $stmt = $pdo->prepare("UPDATE inscrits SET prenom=:prenom, nom=:nom, email=:email, bio=:bio WHERE id=:id");
        $stmt->execute([
            ':prenom' => $_POST['prenom'],
            ':nom'    => $_POST['nom'],
            ':email'  => $_POST['email'],
            ':bio'    => $bio,
            ':id'     => $userId
        ]);

        // Mise à jour de la session avec les nouvelles valeurs
        $_SESSION['user']['prenom'] = $_POST['prenom'];
        $_SESSION['user']['nom'] = $_POST['nom'];
        $_SESSION['user']['email'] = $_POST['email'];
        // Si tu as d'autres infos utilisateur en session, tu peux aussi les mettre à jour ici

        // Mise à jour ou suppression des rôles
        if (!empty($_POST['roleConducteur'])) {
    $stmt = $pdo->prepare("
        INSERT INTO conducteurs (inscrit_id, marque_vehicule, modele_vehicule, carburant, animaux, fumeurs)
        VALUES (:id, :marque, :modele, :carburant, :animaux, :fumeurs)
        ON DUPLICATE KEY UPDATE marque_vehicule=:marque, modele_vehicule=:modele, carburant=:carburant, animaux=:animaux, fumeurs=:fumeurs
    ");
    $stmt->execute([
        ':id'        => $userId,
        ':marque'    => $_POST['profileMarqueVehicule'] ?? '',
        ':modele'    => $_POST['profileModeleVehicule'] ?? '',
        ':carburant' => $_POST['carburant'] ?? 'essence',
        ':animaux'   => isset($_POST['animaux']) ? (int)$_POST['animaux'] : 0,
        ':fumeurs'   => isset($_POST['fumeurs']) ? (int)$_POST['fumeurs'] : 0,
        ]);
    }
        } else {
            $pdo->prepare("DELETE FROM conducteurs WHERE inscrit_id=?")->execute([$userId]);
        }

        if (!empty($_POST['rolePassager'])) {
            $stmt = $pdo->prepare("
                INSERT INTO passagers (inscrit_id, preferences)
                VALUES (:id, :preferences)
                ON DUPLICATE KEY UPDATE preferences=:preferences
            ");
            $stmt->execute([
                ':id' => $userId,
                ':preferences' => $_POST['preferences'] ?? ''
            ]);
        } else {
            $pdo->prepare("DELETE FROM passagers WHERE inscrit_id=?")->execute([$userId]);
        }
    }

    // Changement mot de passe si demandé
    if (!empty($_POST['newPassword'])) {
        if ($_POST['newPassword'] !== ($_POST['newPasswordConfirm'] ?? '')) {
            echo json_encode(['error' => 'Le nouveau mot de passe et sa confirmation ne correspondent pas.']);
            exit;
        }
        $newHash = password_hash($_POST['newPassword'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE inscrits SET password = ? WHERE id = ?");
        $stmt->execute([$newHash, $userId]);
    }

    // Upload avatar
    $avatarUrl = null;
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/avatars/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

        $fileInfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($fileInfo, $_FILES['avatar']['tmp_name']);
        $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($mime, $allowed)) {
            echo json_encode(['error' => 'Format de fichier non autorisé']);
            exit;
        }

        $ext = pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION);
        $filename = "avatar_{$userId}_" . time() . "." . strtolower($ext);
        $dest = $uploadDir . $filename;

        if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $dest)) {
            echo json_encode(['error' => "Erreur d'upload de l'avatar"]);
            exit;
        }

        $avatarUrl = "asset/uploads/avatars/$filename";
        $stmt = $pdo->prepare("UPDATE inscrits SET avatar = ? WHERE id = ?");
        $stmt->execute([$avatarUrl, $userId]);
    } else {
        $stmt = $pdo->prepare("SELECT avatar FROM inscrits WHERE id=?");
        $stmt->execute([$userId]);
        $avatarUrl = $stmt->fetchColumn();
    }

    echo json_encode(['success' => true, 'avatarUrl' => $avatarUrl]);

 catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
?>
