<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = (int)$_SESSION['user']['id'];

foreach (['prenom', 'nom', 'email'] as $champ) {
    if (empty($_POST[$champ])) {
        echo json_encode(['error' => "Le champ $champ est obligatoire."]);
        exit;
    }
}

if (!isset($_POST['passwordConfirm']) || empty($_POST['passwordConfirm'])) {
    echo json_encode(['error' => 'Le mot de passe actuel est obligatoire pour confirmer les modifications.']);
    exit;
}

$passwordConfirm = $_POST['passwordConfirm'];

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root', '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Récupérer le hash du mot de passe actuel
    $stmt = $pdo->prepare("SELECT password FROM inscrits WHERE id = ?");
    $stmt->execute([$userId]);
    $hashedPassword = $stmt->fetchColumn();

    if (!$hashedPassword || !password_verify($passwordConfirm, $hashedPassword)) {
        echo json_encode(['error' => 'Mot de passe actuel incorrect']);
        exit;
    }

    // Si utilisateur veut changer son mot de passe
    $nouveauMotDePasse = $_POST['newPassword'] ?? '';
    $confirmeMotDePasse = $_POST['newPasswordConfirm'] ?? '';

    if ($nouveauMotDePasse !== '' || $confirmeMotDePasse !== '') {
        if ($nouveauMotDePasse !== $confirmeMotDePasse) {
            echo json_encode(['error' => 'Les nouveaux mots de passe ne correspondent pas.']);
            exit;
        }
        if (strlen($nouveauMotDePasse) < 6) {
            echo json_encode(['error' => 'Le nouveau mot de passe doit contenir au moins 6 caractères.']);
            exit;
        }

        $nouveauHash = password_hash($nouveauMotDePasse, PASSWORD_DEFAULT);

        // Mettre à jour mot de passe en même temps
        $stmtUpdatePwd = $pdo->prepare("UPDATE inscrits SET password = :password WHERE id = :id");
        $stmtUpdatePwd->execute([
            ':password' => $nouveauHash,
            ':id' => $userId
        ]);
    }

    $bio = isset($_POST['bio']) ? trim($_POST['bio']) : null;

    // Mise à jour infos de base
    $stmt = $pdo->prepare("UPDATE inscrits SET prenom=:prenom, nom=:nom, email=:email, bio=:bio WHERE id=:id");
    $stmt->execute([
        ':prenom' => $_POST['prenom'],
        ':nom'    => $_POST['nom'],
        ':email'  => $_POST['email'],
        ':bio'    => $bio,
        ':id'     => $userId
    ]);

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

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
