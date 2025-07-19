<?php
// update_profile.php

session_start();
header('Content-Type: application/json');

// 1. utilisateur non connecté ?
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}
$userId = (int) $_SESSION['user']['id'];

try {
    // 2. connexion PDO
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root','',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // 3. Validation minimale (si champs présents, ils ne doivent pas être vides)
    foreach (['prenom','nom','email'] as $field) {
        if (isset($_POST[$field]) && trim($_POST[$field])==='') {
            echo json_encode(['error'=>"Le champ $field est obligatoire."]);
            exit;
        }
    }

    // 4. Si le mot de passe est modifié, vérifier l’actuel
    if (!empty($_POST['newPassword']) || !empty($_POST['newPasswordConfirm'])) {
        if (empty($_POST['passwordConfirm'])) {
            echo json_encode(['error'=>'Le mot de passe actuel est requis.']);
            exit;
        }
        // récupérer le hash actuel
        $stmt = $pdo->prepare("SELECT mot_de_passe FROM inscrits WHERE id=?");
        $stmt->execute([$userId]);
        $currentHash = $stmt->fetchColumn();
        if (!$currentHash || !password_verify($_POST['passwordConfirm'], $currentHash)) {
            echo json_encode(['error'=>'Mot de passe actuel incorrect.']);
            exit;
        }
        // valider la confirmation du nouveau
        if ($_POST['newPassword'] !== $_POST['newPasswordConfirm']) {
            echo json_encode(['error'=>'La confirmation du nouveau mot de passe ne correspond pas.']);
            exit;
        }
    }

    // 5. Mise à jour des infos de base
    if (isset($_POST['prenom'], $_POST['nom'], $_POST['email'])) {
        $bio = trim($_POST['bio'] ?? '');
        $stmt = $pdo->prepare("
            UPDATE inscrits
            SET prenom = :prenom, nom = :nom, email = :email, bio = :bio
            WHERE id = :id
        ");
        $stmt->execute([
            ':prenom'=>trim($_POST['prenom']),
            ':nom'   =>trim($_POST['nom']),
            ':email' =>trim($_POST['email']),
            ':bio'   =>$bio,
            ':id'    =>$userId
        ]);
        // mettre à jour la session
        $_SESSION['user']['prenom'] = trim($_POST['prenom']);
        $_SESSION['user']['nom']    = trim($_POST['nom']);
        $_SESSION['user']['email']  = trim($_POST['email']);
    }

    // 6. Gestion conducteur
    if (!empty($_POST['roleConducteur'])) {
        $stmt = $pdo->prepare("
            INSERT INTO conducteurs (
              inscrit_id, prenom, nom,
              marque_vehicule, modele_vehicule, carburant,
              animaux, fumeurs, plaque, couleur, date_premiere_immatriculation
            )
            VALUES (
              :id, :prenom, :nom,
              :marque, :modele, :carburant,
              :animaux, :fumeurs, :plaque, :couleur, :dateimmat
            )
            ON DUPLICATE KEY UPDATE
              marque_vehicule = VALUES(marque_vehicule),
              modele_vehicule = VALUES(modele_vehicule),
              carburant       = VALUES(carburant),
              animaux         = VALUES(animaux),
              fumeurs         = VALUES(fumeurs),
              plaque          = VALUES(plaque),
              couleur         = VALUES(couleur),
              date_premiere_immatriculation = VALUES(date_premiere_immatriculation)
        ");
        $stmt->execute([
            ':id'        =>$userId,
            ':prenom'    =>$_SESSION['user']['prenom'],
            ':nom'       =>$_SESSION['user']['nom'],
            ':marque'    =>$_POST['profileMarqueVehicule'] ?? '',
            ':modele'    =>$_POST['profileModeleVehicule'] ?? '',
            ':carburant' =>$_POST['carburant'] ?? 'essence',
            ':animaux'   =>isset($_POST['animaux'])?(int)$_POST['animaux']:0,
            ':fumeurs'   =>isset($_POST['fumeurs'])?(int)$_POST['fumeurs']:0,
            ':plaque'    =>$_POST['plaque'] ?? '',
            ':couleur'   =>$_POST['couleur'] ?? '',
            ':dateimmat' =>$_POST['date_premiere_immatriculation'] ?? null
        ]);
    } else {
        // suppression du rôle conducteur
        $pdo->prepare("DELETE FROM conducteurs WHERE inscrit_id=?")
            ->execute([$userId]);
    }

    // 7. Gestion passager
    if (!empty($_POST['rolePassager'])) {
        $prefs = trim($_POST['preferences'] ?? '');
        $stmt = $pdo->prepare("
            INSERT INTO passagers (inscrit_id, prenom, nom, preferences)
            VALUES (:id, :prenom, :nom, :prefs)
            ON DUPLICATE KEY UPDATE preferences = VALUES(preferences)
        ");
        $stmt->execute([
            ':id'      =>$userId,
            ':prenom'  =>$_SESSION['user']['prenom'],
            ':nom'     =>$_SESSION['user']['nom'],
            ':prefs'   =>$prefs
        ]);
    } else {
        $pdo->prepare("DELETE FROM passagers WHERE inscrit_id=?")
            ->execute([$userId]);
    }

    // 8. Mise à jour du mot de passe
    if (!empty($_POST['newPassword'])) {
        $newHash = password_hash($_POST['newPassword'], PASSWORD_DEFAULT);
        $pdo->prepare("UPDATE inscrits SET mot_de_passe = ? WHERE id = ?")
            ->execute([$newHash, $userId]);
    }

    // 9. Upload avatar
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error']===UPLOAD_ERR_OK) {
        $uploadDir = __DIR__.'/../asset/uploads/avatars/';
        if (!is_dir($uploadDir)) mkdir($uploadDir,0777,true);

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime  = $finfo->file($_FILES['avatar']['tmp_name']);
        $allowed = ['image/jpeg','image/png','image/gif','image/webp'];
        if (!in_array($mime, $allowed)) {
            echo json_encode(['error'=>'Format d’image non autorisé']);
            exit;
        }
        $ext = pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION);
        $filename = "avatar_{$userId}_".time().".{$ext}";
        $dest = $uploadDir.$filename;
        if (!move_uploaded_file($_FILES['avatar']['tmp_name'],$dest)) {
            echo json_encode(['error'=>'Échec de l’upload de l’avatar']);
            exit;
        }
        $avatarUrl = "asset/uploads/avatars/$filename";
        // maj dans la base
        $pdo->prepare("UPDATE inscrits SET avatar=? WHERE id=?")
            ->execute([$avatarUrl,$userId]);
    } else {
        // charger l’url existant
        $avatarUrl = $pdo
            ->query("SELECT avatar FROM inscrits WHERE id=$userId")
            ->fetchColumn();
    }

    // 10. Tout est OK
    echo json_encode([
        'success'   => true,
        'avatarUrl' => $avatarUrl ?? null,
        'message'   => 'Profil mis à jour avec succès'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error'=>'Erreur serveur',
        'debug'=>$e->getMessage()
    ]);
}
