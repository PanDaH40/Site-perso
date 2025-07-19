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

// 2) Lecture du FormData (POST + FILES)
$prenom  = trim($_POST['prenom']  ?? '');
$nom     = trim($_POST['nom']     ?? '');
$email   = trim($_POST['email']   ?? '');
$roleCond= !empty($_POST['roleConducteur']);
$rolePass= !empty($_POST['rolePassager']);

// 3) Validation de base
if (!$prenom || !$nom || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Prénom, nom ou email manquant ou invalide']);
    exit;
}

// 4) Si avatar uploadé
$avatarUrl = null;
if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
    $ext = pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION);
    $allowed = ['jpg','jpeg','png','gif'];
    if (!in_array(strtolower($ext), $allowed, true)) {
        echo json_encode(['error'=>'Format d\'image non supporté']);
        exit;
    }
    $dir = __DIR__ . '/../../uploads/avatars/';
    if (!is_dir($dir)) mkdir($dir,0755,true);
    $filename = "avatar_{$userId}_" . time() . ".{$ext}";
    if (!move_uploaded_file($_FILES['avatar']['tmp_name'], "$dir$filename")) {
        echo json_encode(['error'=>'Échec upload image']);
        exit;
    }
    $avatarUrl = "/uploads/avatars/$filename";
}

// 5) Connexion PDO
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    error_log("DB connexion failed in update_profile.php: {$e->getMessage()}");
    http_response_code(500);
    echo json_encode(['error'=>'Erreur de connexion DB']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 6) Update inscrits
    $sql = 'UPDATE inscrits SET prenom=:prenom, nom=:nom, email=:email'
         . ($avatarUrl ? ', avatar=:avatar' : '')
         . ' WHERE id=:id';
    $stmt = $pdo->prepare($sql);
    $params = [':prenom'=>$prenom,':nom'=>$nom,':email'=>$email,':id'=>$userId];
    if ($avatarUrl) $params[':avatar'] = $avatarUrl;
    $stmt->execute($params);

    // 7) Conducteur upsert ou delete
    if ($roleCond) {
        $voiture   = trim($_POST['voiture']   ?? '');
        $carburant = $_POST['carburant']       ?? '';
        $animaux   = !empty($_POST['animaux']) ? 1 : 0;
        $fumeurs   = !empty($_POST['fumeurs']) ? 1 : 0;
        if (!$voiture || !in_array($carburant,['electric','essence','gazole'],true)) {
            http_response_code(400);
            echo json_encode(['error'=>'Données conducteur invalides']);
            exit;
        }
        $stmt = $pdo->prepare("
            INSERT INTO conducteurs
              (inscrit_id, prenom, nom, voiture, carburant, animaux, fumeurs)
            VALUES
              (:id, :prenom, :nom, :voiture, :carburant, :animaux, :fumeurs)
            ON DUPLICATE KEY UPDATE
              prenom=:prenom, nom=:nom, voiture=:voiture,
              carburant=:carburant, animaux=:animaux, fumeurs=:fumeurs
        ");
        $stmt->execute([
            ':id'=>$userId,':prenom'=>$prenom,':nom'=>$nom,
            ':voiture'=>$voiture,':carburant'=>$carburant,
            ':animaux'=>$animaux,':fumeurs'=>$fumeurs
        ]);
    } else {
        $pdo->prepare("DELETE FROM conducteurs WHERE inscrit_id=?")
            ->execute([$userId]);
    }

    // 8) Passager upsert ou delete
    if ($rolePass) {
        $prefs = trim($_POST['preferences'] ?? '');
        $stmt = $pdo->prepare("
            INSERT INTO passagers (inscrit_id, prenom, nom, preferences)
            VALUES (:id, :prenom, :nom, :prefs)
            ON DUPLICATE KEY UPDATE preferences=:prefs
        ");
        $stmt->execute([
            ':id'=>$userId,':prenom'=>$prenom,':nom'=>$nom,
            ':prefs'=>$prefs
        ]);
    } else {
        $pdo->prepare("DELETE FROM passagers WHERE inscrit_id=?")
            ->execute([$userId]);
    }

    $pdo->commit();
    echo json_encode(['success'=>true,'avatarUrl'=>$avatarUrl]);
} catch (PDOException $e) {
    $pdo->rollBack();
    error_log("Erreur SQL update_profile: {$e->getMessage()}");
    http_response_code(500);
    echo json_encode(['error'=>'Erreur serveur interne']);
}
