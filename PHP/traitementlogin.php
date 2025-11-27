<?php 
session_start();
header('Content-Type: application/json; charset=utf-8');

$email = isset($_POST['email']) ? strtolower(trim((string)$_POST['email'])) : '';
$pwd   = (string)($_POST['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $pwd==='') {
  echo json_encode(['success'=>false,'error'=>'Identifiants invalides']); exit;
}

try {
  require_once __DIR__ . '/db_conn.php';
  $stmt = $pdo->prepare("SELECT id, prenom, nom, email, mot_de_passe, admin, statut, credits FROM inscrits WHERE email=? LIMIT 1");
  $stmt->execute([$email]);
  $u = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$u || $u['statut']==='suspendu') {
    echo json_encode(['success'=>false,'error'=>'Compte introuvable ou suspendu']); exit;
  }
  if (!password_verify($pwd, $u['mot_de_passe'])) {
    echo json_encode(['success'=>false,'error'=>'Mot de passe incorrect']); exit;
  }
  $_SESSION['user'] = [
    'id'=>(int)$u['id'],'prenom'=>$u['prenom'],'nom'=>$u['nom'],
    'email'=>$u['email'],'admin'=>(int)$u['admin'],'credits'=>(int)$u['credits']
  ];
  echo json_encode(['success'=>true]);
} catch (Throwable $e) {
  error_log('traitementlogin: '.$e->getMessage());
  echo json_encode(['success'=>false,'error'=>'Erreur serveur']);
}


// if ($_SERVER['REQUEST_METHOD'] === 'POST') {
//     $email = trim($_POST['email'] ?? '');
//     $password = $_POST['password'] ?? '';

//     if ($email && $password) {
//         $stmt = $pdo->prepare("SELECT * FROM inscrits WHERE email = ?");
//         $stmt->execute([$email]);
//         $user = $stmt->fetch(PDO::FETCH_ASSOC);

//         if ($user && password_verify($password, $user['mot_de_passe'])) {
//             $_SESSION['user'] = [
//                 'id' => $user['id'],
//                 'nom' => $user['nom'],
//                 'prenom' => $user['prenom'],
//                 'email' => $user['email']
//             ];
//             header('Location: ./dashboard.html');
//             exit;
//         } else {
//             header('Location: login.php?erreur=1');
//             exit;
//         }
//     } else {
//         header('Location: login.php?erreur=2');
//         exit;
//     }
// } else {
//     header('Location: login.php');
//     exit;
// }
// ?>
