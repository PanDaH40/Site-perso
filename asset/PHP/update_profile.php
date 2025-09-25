<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user']['id'])) { echo json_encode(['error'=>'Non connecté']); exit; }
$userId = (int)$_SESSION['user']['id'];

$in = json_decode(file_get_contents('php://input'), true) ?: $_POST;

$fields = [
  'prenom' => isset($in['prenom']) ? trim((string)$in['prenom']) : null,
  'nom'    => isset($in['nom'])    ? trim((string)$in['nom'])    : null,
  'bio'    => isset($in['bio'])    ? trim((string)$in['bio'])    : null,
  'avatar' => isset($in['avatar']) ? trim((string)$in['avatar']) : null,
  'telephone' => isset($in['telephone']) ? trim((string)$in['telephone']) : null,
];

try {
  require_once __DIR__ . '/db_conn.php';

  $sets=[]; $params=[];
  foreach ($fields as $col=>$val) {
    if ($val !== null) { $sets[]="$col=?"; $params[]=$val; }
  }
  if ($sets) {
    $params[]=$userId;
    $pdo->prepare("UPDATE inscrits SET ".implode(',', $sets)." WHERE id=?")->execute($params);

    // rafraîchir session (basique)
    foreach ($fields as $k=>$v) { if ($v!==null) $_SESSION['user'][$k] = $v; }
  }

  echo json_encode(['success'=>true]);
} catch (Throwable $e) {
  error_log('update_profile: '.$e->getMessage());
  echo json_encode(['error'=>'Erreur serveur']);
}


// session_start();
// header('Content-Type: application/json');

// // Paramètres base de données
// $host = 'sql309.infinityfree.com';
// $dbname = 'if0_39505571_db_projet';
// $username = 'if0_39505571';
// $password = 'qBOSjJTyyq5Trff';

// if (!isset($_SESSION['user']['id'])) {
//     http_response_code(401);
//     echo json_encode(['error' => 'Utilisateur non connecté']);
//     exit;
// }

// $userId = (int) $_SESSION['user']['id'];

// try {
//     // Connexion PDO
//     $pdo = new PDO(
//         "mysql:host=$host;dbname=$dbname;charset=utf8",
//         $username,
//         $password,
//         [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
//     );

//     // Validation minimale des champs
//     foreach (['prenom','nom','email'] as $field) {
//         if (isset($_POST[$field]) && trim($_POST[$field]) === '') {
//             echo json_encode(['error' => "Le champ $field est obligatoire."]);
//             exit;
//         }
//     }

//     // Changement de mot de passe (si demandé)
//     if (!empty($_POST['newPassword']) || !empty($_POST['newPasswordConfirm'])) {
//         if (empty($_POST['passwordConfirm'])) {
//             echo json_encode(['error'=>'Le mot de passe actuel est requis.']);
//             exit;
//         }
//         $stmt = $pdo->prepare("SELECT mot_de_passe FROM inscrits WHERE id = ?");
//         $stmt->execute([$userId]);
//         $currentHash = $stmt->fetchColumn();
//         if (!$currentHash || !password_verify($_POST['passwordConfirm'], $currentHash)) {
//             echo json_encode(['error'=>'Mot de passe actuel incorrect.']);
//             exit;
//         }
//         if ($_POST['newPassword'] !== $_POST['newPasswordConfirm']) {
//             echo json_encode(['error'=>'La confirmation du nouveau mot de passe ne correspond pas.']);
//             exit;
//         }
//     }

//     // Mise à jour infos de base
//     if (isset($_POST['prenom'], $_POST['nom'], $_POST['email'])) {
//         $bio = trim($_POST['bio'] ?? '');
//         $stmt = $pdo->prepare("
//             UPDATE inscrits
//             SET prenom = :prenom,
//                 nom    = :nom,
//                 email  = :email,
//                 bio    = :bio
//             WHERE id = :id
//         ");
//         $stmt->execute([
//             ':prenom' => trim($_POST['prenom']),
//             ':nom'    => trim($_POST['nom']),
//             ':email'  => trim($_POST['email']),
//             ':bio'    => $bio,
//             ':id'     => $userId
//         ]);
//         // Mettre à jour la session
//         $_SESSION['user']['prenom'] = trim($_POST['prenom']);
//         $_SESSION['user']['nom']    = trim($_POST['nom']);
//         $_SESSION['user']['email']  = trim($_POST['email']);
//     }

//     // Gestion rôle Conducteur
//     if (!empty($_POST['roleConducteur'])) {
//         $stmt = $pdo->prepare("
//             INSERT INTO conducteurs (
//               inscrit_id, prenom, nom,
//               marque_vehicule, modele_vehicule, carburant,
//               animaux, fumeurs, plaque, couleur, date_premiere_immatriculation
//             )
//             VALUES (
//               :id, :prenom, :nom,
//               :marque, :modele, :carburant,
//               :animaux, :fumeurs, :plaque, :couleur, :dateimmat
//             )
//             ON DUPLICATE KEY UPDATE
//               marque_vehicule   = VALUES(marque_vehicule),
//               modele_vehicule   = VALUES(modele_vehicule),
//               carburant         = VALUES(carburant),
//               animaux           = VALUES(animaux),
//               fumeurs           = VALUES(fumeurs),
//               plaque            = VALUES(plaque),
//               couleur           = VALUES(couleur),
//               date_premiere_immatriculation = VALUES(date_premiere_immatriculation)
//         ");
//         $stmt->execute([
//             ':id'        => $userId,
//             ':prenom'    => $_SESSION['user']['prenom'],
//             ':nom'       => $_SESSION['user']['nom'],
//             ':marque'    => $_POST['profileMarqueVehicule'] ?? '',
//             ':modele'    => $_POST['profileModeleVehicule'] ?? '',
//             ':carburant' => $_POST['carburant'] ?? 'essence',
//             ':animaux'   => !empty($_POST['animaux']) ? 1 : 0,
//             ':fumeurs'   => !empty($_POST['fumeurs']) ? 1 : 0,
//             ':plaque'    => $_POST['plaque'] ?? '',
//             ':couleur'   => $_POST['couleur'] ?? '',
//             ':dateimmat' => $_POST['date_premiere_immatriculation'] ?: null
//         ]);
//     } else {
//         $pdo->prepare("DELETE FROM conducteurs WHERE inscrit_id = ?")->execute([$userId]);
//     }

//     // Gestion rôle Passager
//     if (!empty($_POST['rolePassager'])) {
//         $prefs = trim($_POST['preferences'] ?? '');
//         $stmt = $pdo->prepare("
//             INSERT INTO passagers (inscrit_id, prenom, nom, preferences)
//             VALUES (:id, :prenom, :nom, :prefs)
//             ON DUPLICATE KEY UPDATE preferences = VALUES(preferences)
//         ");
//         $stmt->execute([
//             ':id'     => $userId,
//             ':prenom' => $_SESSION['user']['prenom'],
//             ':nom'    => $_SESSION['user']['nom'],
//             ':prefs'  => $prefs
//         ]);
//     } else {
//         $pdo->prepare("DELETE FROM passagers WHERE inscrit_id = ?")->execute([$userId]);
//     }

//     // Mise à jour mot de passe si demandé
//     if (!empty($_POST['newPassword'])) {
//         $newHash = password_hash($_POST['newPassword'], PASSWORD_DEFAULT);
//         $pdo->prepare("UPDATE inscrits SET mot_de_passe = ? WHERE id = ?")
//             ->execute([$newHash, $userId]);
//     }

//     // Upload avatar
//     if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
//         $uploadDir = __DIR__.'/../asset/uploads/avatars/';
//         if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

//         $finfo = new finfo(FILEINFO_MIME_TYPE);
//         $mime  = $finfo->file($_FILES['avatar']['tmp_name']);
//         $allowed = ['image/jpeg','image/png','image/gif','image/webp'];
//         if (!in_array($mime, $allowed)) {
//             echo json_encode(['error'=>'Format d’image non autorisé']);
//             exit;
//         }
//         $ext = pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION);
//         $filename = "avatar_{$userId}_".time().".{$ext}";
//         $dest = $uploadDir.$filename;
//         if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $dest)) {
//             echo json_encode(['error'=>'Échec de l’upload de l’avatar']);
//             exit;
//         }
//         $avatarUrl = "asset/uploads/avatars/$filename";
//         $pdo->prepare("UPDATE inscrits SET avatar = ? WHERE id = ?")
//             ->execute([$avatarUrl, $userId]);
//     } else {
//         $avatarUrl = $pdo->query("SELECT avatar FROM inscrits WHERE id = $userId")->fetchColumn();
//     }

//     // Réponse OK
//     echo json_encode([
//         'success'   => true,
//         'avatarUrl' => $avatarUrl ?? null,
//         'message'   => 'Profil mis à jour avec succès'
//     ]);

// } catch (Exception $e) {
//     http_response_code(500);
//     echo json_encode([
//         'error' => 'Erreur serveur',
//         'debug' => $e->getMessage()
//     ]);
// }
