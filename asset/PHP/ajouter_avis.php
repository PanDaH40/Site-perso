<?php

declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db_conn.php';

$userId = (int)($_SESSION['user']['id'] ?? 0);
if ($userId <= 0) { echo json_encode(['error'=>'Non connecté']); exit; }

$in = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$reservationId = (int)($in['reservation_id'] ?? 0);
$note = isset($in['note']) ? (int)$in['note'] : null;
$avis = trim((string)($in['avis'] ?? ''));

if ($reservationId <= 0 || $note === null || $note < 1 || $note > 5) {
  echo json_encode(['error'=>'Paramètres invalides']); exit;
}

try {
  // Le passager qui laisse l’avis doit être le propriétaire de la réservation
  $stmt = $pdo->prepare("SELECT passager_id FROM reservations WHERE id=? LIMIT 1");
  $stmt->execute([$reservationId]);
  $passager = (int)$stmt->fetchColumn();
  if ($passager !== $userId) { echo json_encode(['error'=>'Accès refusé']); exit; }

  $stmt = $pdo->prepare("UPDATE reservations
    SET note = ?, avis = ?, avis_valide = 0, date_validation = NULL
    WHERE id = ?");
  $stmt->execute([$note, $avis !== '' ? $avis : null, $reservationId]);

  echo json_encode(['success'=>true]);
} catch (Throwable $e) {
  error_log('ajouter_avis: '.$e->getMessage());
  echo json_encode(['error'=>'Erreur serveur']);
}



// session_start();
// header('Content-Type: application/json');
// require_once __DIR__ . '/db_conn.php';

// if (!isset($_SESSION['user']['id'])) {
//     echo json_encode(['error' => 'Non connecté']);
//     exit;
// }

// $input = json_decode(file_get_contents('php://input'), true);
// $utilisateur_id = (int)($input['utilisateur_id'] ?? 0);
// $note = (int)($input['note'] ?? 0);
// $commentaire = trim($input['commentaire'] ?? '');
// $auteur_id = (int)$_SESSION['user']['id'];

// if ($utilisateur_id < 1 || $note < 1 || $note > 5 || $utilisateur_id === $auteur_id) {
//     echo json_encode(['error' => 'Paramètres invalides']);
//     exit;
// }

// try {
//     $pdo = new PDO(
//         'mysql:host=sql309.infinityfree.com;dbname=if0_39505571_db_projet;charset=utf8',
//         'if0_39505571', 'qBOSjJTyyq5Trff',
//         [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
//     );

//     // INSERT ou UPDATE si déjà un avis existant (clé UNIQUE sur utilisateur_id + auteur_id)
//     $stmt = $pdo->prepare("
//         INSERT INTO avis (utilisateur_id, auteur_id, note, commentaire, date)
//         VALUES (?, ?, ?, ?, NOW())
//         ON DUPLICATE KEY UPDATE
//             note = VALUES(note),
//             commentaire = VALUES(commentaire),
//             date = NOW()
//     ");
//     $stmt->execute([$utilisateur_id, $auteur_id, $note, $commentaire]);

//     echo json_encode(['success' => true]);
// } catch (Exception $e) {
//     http_response_code(500);
//     echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
// } -->
