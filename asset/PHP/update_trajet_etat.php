<?php
session_start();
header('Content-Type: application/json');

// Vérification connexion utilisateur
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = (int)$_SESSION['user']['id'];
$input = json_decode(file_get_contents('php://input'), true);

// Vérification des données reçues
if (!isset($input['trajet_id'], $input['etat'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Données manquantes']);
    exit;
}

$trajetId = (int)$input['trajet_id'];
$nouvelEtat = $input['etat'];

// États valides
$etats_valides = ['planifie', 'en_cours', 'termine'];
if (!in_array($nouvelEtat, $etats_valides, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'État invalide']);
    exit;
}

try {
    $pdo = new PDO(
    "mysql:host=sql309.infinityfree.com;dbname=if0_39505571_db_projet;charset=utf8",
    "if0_39505571",
    "qBOSjJTyyq5Trff",
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);


    // Vérifier que le trajet existe et appartient au conducteur connecté, récupérer état actuel
    $stmt = $pdo->prepare('SELECT conducteur_id, etat_trajet FROM trajets WHERE id = ?');
    $stmt->execute([$trajetId]);
    $trajet = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$trajet) {
        http_response_code(404);
        echo json_encode(['error' => 'Trajet introuvable']);
        exit;
    }
    if ($trajet['conducteur_id'] != $userId) {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }

    // Vérifier transition d'état logique
    $etatActuel = $trajet['etat_trajet'];
    $transitionsValides = [
        'planifie' => ['en_cours'],
        'en_cours' => ['termine'],
        'termine'  => []
    ];
    if (!in_array($nouvelEtat, $transitionsValides[$etatActuel], true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Transition d\'état invalide']);
        exit;
    }

    // Mettre à jour l'état du trajet
    $stmt = $pdo->prepare('UPDATE trajets SET etat_trajet = ? WHERE id = ?');
    $stmt->execute([$nouvelEtat, $trajetId]);

    // Fonction d’envoi mail aux passagers
    function envoyerMailFinTrajet(array $passagers, string $trajetDesc, string $conducteurNom) {
        $sujet = "Votre trajet vient de se terminer";
        foreach ($passagers as $passager) {
            $to = $passager['email'];
            $nomPassager = $passager['prenom'];
            $message = "Bonjour $nomPassager,\n\n"
                . "Le conducteur $conducteurNom a annoncé que votre trajet ($trajetDesc) est arrivé à destination.\n"
                . "Merci de vous connecter à votre espace pour confirmer que tout s'est bien passé.\n\n"
                . "Cordialement,\nL'équipe EcoRide";

            $headers = "From: no-reply@ecoride.example.com\r\n"
                     . "Reply-To: support@ecoride.example.com\r\n"
                     . "Content-Type: text/plain; charset=UTF-8\r\n";

            mail($to, $sujet, $message, $headers);
        }
    }

    // Si le trajet est terminé, envoi des mails aux passagers
    if ($nouvelEtat === 'termine') {
        // Récupérer infos trajet + conducteur
        $stmtTrajet = $pdo->prepare("
            SELECT t.date, t.depart, t.arrivee, i.prenom, i.nom 
            FROM trajets t 
            JOIN inscrits i ON t.conducteur_id = i.id 
            WHERE t.id = ?
        ");
        $stmtTrajet->execute([$trajetId]);
        $trajetInfo = $stmtTrajet->fetch(PDO::FETCH_ASSOC);

        $trajetDesc = "trajet du " . date('d/m/Y', strtotime($trajetInfo['date'])) . " de " . $trajetInfo['depart'] . " à " . $trajetInfo['arrivee'];
        $conducteurNom = $trajetInfo['prenom'] . ' ' . $trajetInfo['nom'];

        // Récupérer passagers avec réservation validée
        $stmtPassagers = $pdo->prepare("
            SELECT i.prenom, i.email 
            FROM reservations r 
            JOIN inscrits i ON r.passager_id = i.id 
            WHERE r.trajet_id = ? AND r.statut = 'valide'
        ");
        $stmtPassagers->execute([$trajetId]);
        $passagers = $stmtPassagers->fetchAll(PDO::FETCH_ASSOC);

        envoyerMailFinTrajet($passagers, $trajetDesc, $conducteurNom);
    }

    echo json_encode(['success' => true, 'etat' => $nouvelEtat]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
