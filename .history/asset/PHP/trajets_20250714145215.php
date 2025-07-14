<?php
session_start();
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'covoiturage_db';
$username = 'root';
$password = '';

try {
    // Connexion PDO
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ID de l'utilisateur connecté
    $userId = $_SESSION['user']['id'] ?? null;

    // 1) AJOUT D'UN TRAJET (POST JSON)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!$userId) {
            echo json_encode(['error' => 'Utilisateur non connecté']);
            exit;
        }
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $date     = $input['date']    ?? null;
        $heure    = $input['heure']   ?? null;
        $depart   = trim($input['depart']  ?? '');
        $arrivee  = trim($input['arrivee'] ?? '');
        $places   = intval($input['places'] ?? 0);

        if (!$date || !$heure || !$depart || !$arrivee || $places <= 0) {
            echo json_encode(['error' => 'Données invalides']);
            exit;
        }

        $stmt = $pdo->prepare(
            "INSERT INTO trajets (conducteur_id, date, heure, depart, arrivee, places, statut) \
             VALUES (?, ?, ?, ?, ?, ?, 'disponible')"
        );
        $stmt->execute([$userId, $date, $heure, $depart, $arrivee, $places]);

        echo json_encode(['success' => true]);
        exit;
    }

    // 2) TRAJETS PUBLICS (GET ?all=1)
    if (isset($_GET['all']) && $_GET['all'] === '1') {
        $sql = 
            "SELECT t.*, u.prenom AS conducteur_prenom, u.nom AS conducteur_nom, \
             COALESCE(SUM(r.places_reservees), 0) AS total_reservations \
             FROM trajets t \
             JOIN inscrits u ON u.id = t.conducteur_id \
             LEFT JOIN reservations r ON r.trajet_id = t.id \
             GROUP BY t.id \
             ORDER BY t.date DESC, t.heure DESC";
        $all = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['all_trajets' => $all]);
        exit;
    }

    // 3) DASHBOARD : TRAJETS PROPOSÉS & RÉSERVÉS
    if ($userId) {
        // a) Trajets proposés
        $stmt = $pdo->prepare(
            "SELECT t.id, t.date, t.heure, t.depart, t.arrivee, t.places, \
                    COALESCE(SUM(r.places_reservees),0) AS total_reservations \
             FROM trajets t \
             LEFT JOIN reservations r ON r.trajet_id = t.id \
             WHERE t.conducteur_id = ? \
             GROUP BY t.id \
             ORDER BY t.date DESC, t.heure DESC"
        );
        $stmt->execute([$userId]);
        $trajetsProposes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Ajouter les réservataires pour chaque trajet proposé
        foreach ($trajetsProposes as &$trajet) {
            $qr = $pdo->prepare(
                "SELECT i.prenom, i.nom, r.places_reservees \
                 FROM reservations r \
                 JOIN inscrits i ON i.id = r.passager_id \
                 WHERE r.trajet_id = ?"
            );
            $qr->execute([$trajet['id']]);
            $reservations = $qr->fetchAll(PDO::FETCH_ASSOC);
            $list = [];
            foreach ($reservations as $r) {
                $list[] = "{$r['prenom']} {$r['nom']} ({$r['places_reservees']})";
            }
            $trajet['statut_conducteur'] = $list
                ? implode(', ', $list)
                : 'Aucune réservation';
        }

        // b) Trajets réservés
        $stmt = $pdo->prepare(
            "SELECT t.id, t.date, t.heure, t.depart, t.arrivee, u.prenom AS conducteur_prenom, u.nom AS conducteur_nom, r.places_reservees \
             FROM reservations r \
             JOIN trajets t ON t.id = r.trajet_id \
             JOIN inscrits u ON u.id = t.conducteur_id \
             WHERE r.passager_id = ? \
             ORDER BY t.date DESC, t.heure DESC"
        );
        $stmt->execute([$userId]);
        $trajetsReserves = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($trajetsReserves as &$t) {
            $t['statut_passager'] = "Réservé {$t['places_reservees']} place(s)";
        }

        echo json_encode([
            'trajets_proposes' => $trajetsProposes,
            'trajets_reserves' => $trajetsReserves
        ]);
        exit;
    }

    // Utilisateur non connecté ou action invalide
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur DB: ' . $e->getMessage()]);
    exit;
}
?>
