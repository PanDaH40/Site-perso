<?php
// annuler_reservation.php
// Annule une réservation du passager, rembourse les jetons du trajet si la réservation était validée

session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}
$userId = (int) $_SESSION['user']['id'];

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input) || !isset($input['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de réservation manquant']);
    exit;
}
$reservationId = intval($input['id']);

if ($reservationId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de réservation invalide']);
    exit;
}

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de se connecter à la base']);
    exit;
}

try {
    $pdo->beginTransaction();

    // On récupère la réservation pour vérifier statut et à qui elle appartient
    $stmt = $pdo->prepare('SELECT statut, trajet_id, passager_id FROM reservations WHERE id = ? AND passager_id = ?');
    $stmt->execute([$reservationId, $userId]);
    $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reservation) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'Réservation introuvable']);
        exit;
    }

    // Si la réservation était "valide", il faut rembourser les jetons du trajet
    if ($reservation['statut'] === 'valide') {
        // On récupère le conducteur et le nombre de jetons du trajet
        $stmt = $pdo->prepare('SELECT conducteur_id, jetons FROM trajets WHERE id = ?');
        $stmt->execute([$reservation['trajet_id']]);
        $trajet = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($trajet) {
            // Retire les jetons du conducteur
            $stmt = $pdo->prepare('UPDATE inscrits SET credits = credits - ? WHERE id = ?');
            $stmt->execute([$trajet['jetons'], $trajet['conducteur_id']]);
            // Rend les jetons au passager
            $stmt = $pdo->prepare('UPDATE inscrits SET credits = credits + ? WHERE id = ?');
            $stmt->execute([$trajet['jetons'], $reservation['passager_id']]);
        }
        // La commission (2 jetons) N'EST PAS remboursée !
    }

    // Supprime la réservation (ou tu peux aussi faire UPDATE statut = 'annule')
    $del = $pdo->prepare('DELETE FROM reservations WHERE id = ? AND passager_id = ?');
    $del->execute([$reservationId, $userId]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Réservation annulée, jetons remboursés si réservation validée'
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
