<?php

session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db_conn.php';

$userId = (int)($_SESSION['user']['id'] ?? 0);
if ($userId <= 0) { echo json_encode(['error'=>'Non connecté']); exit; }

try {
  // soft delete (statut = 'supprime'). Si tu veux un hard delete, remplace par DELETE.
  $stmt = $pdo->prepare("UPDATE inscrits SET statut='supprime' WHERE id=?");
  $stmt->execute([$userId]);

  // détruit la session
  $_SESSION = [];
  if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time()-42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
  }
  session_destroy();

  echo json_encode(['success'=>true]);
} catch (Throwable $e) {
  error_log('delete_account: '.$e->getMessage());
  echo json_encode(['error'=>'Erreur serveur']);
}



// session_start();
// header('Content-Type: application/json');

// if (!isset($_SESSION['user']['id'])) {
//     echo json_encode(['error' => 'Utilisateur non connecté']);
//     exit;
// }

// $userId = intval($_SESSION['user']['id']);

// try {
//     $pdo = new PDO('mysql:host=sql309.infinityfree.com;dbname=if0_39505571_db_projet;charset=utf8', 'if0_39505571', 'qBOSjJTyyq5Trff', [
//         PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
//     ]);
//     $pdo->beginTransaction();

//     // Suppression des réservations du passager
//     $pdo->prepare("DELETE FROM reservations WHERE passager_id = ?")->execute([$userId]);
//     // Suppression des trajets créés par l'utilisateur
//     $pdo->prepare("DELETE FROM trajets WHERE conducteur_id = ?")->execute([$userId]);
//     // Suppression des signalements
//     $pdo->prepare("DELETE FROM signalements WHERE signale_par = ?")->execute([$userId]);
//     // Suppression de l'utilisateur
//     $pdo->prepare("DELETE FROM inscrits WHERE id = ?")->execute([$userId]);

//     $pdo->commit();

//     session_destroy();
//     echo json_encode(['success' => true]);
// } catch (Exception $e) {
//     $pdo->rollBack();
//     echo json_encode(['error' => "Erreur lors de la suppression", 'debug' => $e->getMessage()]);
// }
