<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = (int)$_SESSION['user']['id'];

// Champs obligatoires
foreach (['prenom', 'nom', 'email'] as $champ) {
    if (empty($_POST[$champ])) {
        echo json_encode(['error' => "Le champ $champ est obligatoire."]);
        exit;
    }
}

// Vérifier que le mot de passe de confirmation est envoyé
if (empty($_POST['passwordConfirm'])) {
    echo json_encode(['error' => 'Le mot de passe actuel est requis pour confirmer les modifications.']);
    exit;
}

$passwordConfirm = $_POST['passwordConfirm'];

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root', '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Récupérer le hash du mot de passe actuel en base
    $stmt = $pdo->prepare("SELECT password FROM inscrits WHERE id = ?");
    $stmt->execute([$userId]);
    $hashedPassword = $stmt->fetchColumn();

    if (!$hashedPassword || !password_verify($passwordConfirm, $hashedPassword)) {
        echo json_encode(['error' => 'Mot de passe actuel incorrect.']);
        exit;
    }

    // Champ facultatif bio
    $bio = isset($_POST['bio']) ? trim($_POST['bio']) : null;

    // 1. Mise à jour des infos de base
    $stmt = $pdo->prepare("UPDATE inscrits SET prenom=:prenom, nom=:nom, email=:email, bio=:bio WHERE id=:id");
    $stmt->execute([
        ':prenom' => $_POST['prenom'],
        ':nom'    => $_POST['nom'],
        ':email'  => $_POST['email'],
        ':bio'    => $bio,
        ':id'     => $userId
    ]);

    // 2. Changement mot de passe si demandé
    if (!empty($_POST['newPassword'])) {
        if ($_POST['newPassword'] !== ($_POST['newPasswordConfirm'] ?? '')) {
            echo json_encode(['error' => 'Le nouveau mot de passe et sa confirmation ne correspondent pas.']);
            exit;
        }
        // Hasher le nouveau mot de passe et le stocker
        $newHash = password_hash($_POST['newPassword'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE inscrits SET password = ? WHERE id = ?");
        $stmt->execute([$newHash, $userId]);
    }

    // 3. Mise à jour ou suppression des rôles
    // Conducteur
    if (!empty($_POST['roleConducteur'])) {
        $stmt = $pdo->prepare("
            INSERT INTO conducteurs (inscrit_id, voiture, carburant, animaux, fumeurs)
            VALUES (:id, :voiture, :carburant, :animaux, :fumeurs)
            ON DUPLICATE KEY UPDATE voiture=:voiture, carburant=:carburant, animaux=:animaux, fumeurs=:fumeurs
        ");
        $stmt->execute([
            ':id'        => $userId,
            ':voiture'   => $_POST['voiture'] ?? '',
            ':carburant' => $_POST['carburant'] ?? 'essence',
            ':animaux'   => isset($_POST['animaux']) ? (int)$_POST['animaux'] : 0,
            ':fumeurs'   => isset($_POST['fumeurs']) ? (int)$_POST['fumeurs'] : 0,
        ]);
    } else {
        $pdo->prepare("DELETE FROM conducteurs WHERE inscrit_id=?")->execute([$userId]);
    }

    // Passager
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

    // 4. Upload avatar
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

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
