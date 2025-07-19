<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = (int)$_SESSION['user']['id'];
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['reservation_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de réservation manquant']);
    exit;
}

$reservationId = (int)$input['reservation_id'];

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','',[
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Vérifier que la réservation appartient bien à l'utilisateur
    $stmtCheck = $pdo->prepare("SELECT statut, trajet_id FROM reservations WHERE id = ? AND passager_id = ?");
    $stmtCheck->execute([$reservationId, $userId]);
    $res = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$res) {
        http_response_code(404);
        echo json_encode(['error' => 'Réservation introuvable']);
        exit;
    }
    if ($res['statut'] !== 'valide') {
        http_response_code(400);
        echo json_encode(['error' => 'Réservation non valide']);
        exit;
    }

    // Mettre à jour la validation passager
    $stmtUpdate = $pdo->prepare("UPDATE reservations SET validation_passager = 1 WHERE id = ?");
    $stmtUpdate->execute([$reservationId]);

    // Vérifier si tous les passagers ont validé ce trajet
    $stmtAllValid = $pdo->prepare("
        SELECT COUNT(*) FROM reservations
        WHERE trajet_id = ? AND statut = 'valide' AND (validation_passager IS NULL OR validation_passager = 0)
    ");
    $stmtAllValid->execute([$res['trajet_id']]);
    $nbRestants = (int)$stmtAllValid->fetchColumn();

    if ($nbRestants === 0) {
        // Tous ont validé -> créditer le conducteur
        $pdo->beginTransaction();

        // Récupérer le nombre total de jetons pour ce trajet
        $stmtJetons = $pdo->prepare("SELECT jetons, conducteur_id FROM trajets WHERE id = ?");
        $stmtJetons->execute([$res['trajet_id']]);
        $trajet = $stmtJetons->fetch(PDO::FETCH_ASSOC);

        if ($trajet) {
            // Créditer le conducteur
            $stmtCredit = $pdo->prepare("UPDATE inscrits SET credits = credits + ? WHERE id = ?");
            $stmtCredit->execute([$trajet['jetons'], $trajet['conducteur_id']]);
        }

        $pdo->commit();
    }

    echo json_encode(['success' => true, 'message' => 'Validation enregistrée.']);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
