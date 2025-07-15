<?php
// asset/PHP/update_profile.php
session_start();
header('Content-Type: application/json');

// 1) Vérifier la session
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}
$userId = (int)$_SESSION['user']['id'];

// 2) Lecture du JSON d’entrée
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Payload JSON invalide']);
    exit;
}

// 3) Champs de base
$prenom  = trim($input['prenom']  ?? '');
$nom     = trim($input['nom']     ?? '');
$email   = trim($input['email']   ?? '');

// 4) Rôles
$roleCond   = !empty($input['roleConducteur']);
$rolePass   = !empty($input['rolePassager']);

// 5) Validation des champs de base
if (!$prenom || !$nom || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Prénom, nom ou email manquant ou invalide']);
    exit;
}

// 6) Si conducteur, récupérer et valider ses champs
if ($roleCond) {
    $voiture   = trim($input['voiture']   ?? '');
    $carburant = $input['carburant']      ?? '';
    $animaux   = !empty($input['animaux']) ? 1 : 0;
    $fumeurs   = !empty($input['fumeurs']) ? 1 : 0;

    if (!$voiture || !in_array($carburant, ['electric','essence','gazole'], true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Données conducteur manquantes ou invalides']);
        exit;
    }
}

// 7) Si passager, récupérer ses préférences (optionnel)
$preferences = trim($input['preferences'] ?? '');

// 8) Connexion PDO
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    error_log('DB connexion failed in update_profile.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion à la base']);
    exit;
}

try {
    // Transaction pour cohérence
    $pdo->beginTransaction();

    // 9) Mettre à jour la table inscrits
    $stmt = $pdo->prepare("
        UPDATE inscrits
           SET prenom = :prenom,
               nom    = :nom,
               email  = :email
         WHERE id = :id
    ");
    $stmt->execute([
        ':prenom' => $prenom,
        ':nom'    => $nom,
        ':email'  => $email,
        ':id'     => $userId
    ]);

    // 10) Gestion de la table conducteurs
   if ($roleCond) {
    $stmt = $pdo->prepare("
        INSERT INTO conducteurs
            (inscrit_id, prenom, nom, voiture, carburant, animaux, fumeurs)
        VALUES
            (:id, :prenom, :nom, :voiture, :carburant, :animaux, :fumeurs)
        ON DUPLICATE KEY UPDATE
            prenom    = :prenom,
            nom       = :nom,
            voiture   = :voiture,
            carburant = :carburant,
            animaux   = :animaux,
            fumeurs   = :fumeurs
    ");
    $stmt->execute([
        ':id'        => $userId,
        ':prenom'    => $prenom,
        ':nom'       => $nom,
        ':voiture'   => $voiture,
        ':carburant' => $carburant,
        ':animaux'   => $animaux,
        ':fumeurs'   => $fumeurs
    ]);
} else {
    $pdo->prepare("DELETE FROM conducteurs WHERE inscrit_id = ?")
        ->execute([$userId]);
}

    // 11) Gestion de la table passagers
    if ($rolePass) {
        // Même si preferences est vide, on souhaite garder la ligne
        $stmt = $pdo->prepare("
            INSERT INTO passagers
                (inscrit_id, preferences)
            VALUES
                (:id, :prefs)
            ON DUPLICATE KEY UPDATE
                preferences = :prefs
        ");
        $stmt->execute([
            ':id'   => $userId,
            ':prefs'=> $preferences
        ]);
    } else {
        // Supprimer éventuel record passager
        $pdo->prepare("DELETE FROM passagers WHERE inscrit_id = ?")
            ->execute([$userId]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Profil mis à jour avec succès']);
} catch (PDOException $e) {
    $pdo->rollBack();
    error_log('Erreur SQL update_profile: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur interne']);
}
