<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');

// Sécurité
if (!isset($_GET['id']) || !ctype_digit($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'ID utilisateur invalide']);
    exit;
}
$userId = (int)$_GET['id'];

// Connexion DB
$currentUserId = isset($_SESSION['user']['id']) ? (int)$_SESSION['user']['id'] : null;
$isLoggedIn = !empty($currentUserId);

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root', '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Requête principale profil + véhicule + trajets terminés
    $stmt = $pdo->prepare("
SELECT 
    i.prenom, i.nom, i.avatar, i.bio,
    c.marque_vehicule, c.modele_vehicule, c.carburant, c.plaque, c.couleur, c.date_premiere_immatriculation,
    c.animaux, c.fumeurs,
    (SELECT COUNT(*) FROM trajets WHERE conducteur_id = i.id AND etat_trajet = 'termine') AS nbTrajetsTermines,
    (SELECT COUNT(*) FROM trajets WHERE conducteur_id = i.id) AS nbTrajetsTotal,
    DATE_FORMAT(i.date_inscription, '%M %Y') AS anciennete,
    (SELECT ROUND(AVG(a.note),1) FROM avis a WHERE a.utilisateur_id = i.id) AS moyenne_note,
    (SELECT COUNT(*) FROM avis a WHERE a.utilisateur_id = i.id) AS nb_avis
FROM inscrits i
LEFT JOIN conducteurs c ON c.inscrit_id = i.id
WHERE i.id = ?
LIMIT 1
");
    $stmt->execute([$userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Profil introuvable']);
        exit;
    }

    // Calcul roleConducteur pour JS (presence des infos véhicule)
    $row['roleConducteur'] = !empty($row['marque_vehicule']) || !empty($row['modele_vehicule']) || !empty($row['carburant']);
    // Optionnel : rolePassager si tu veux
    $row['rolePassager'] = false;

    // 5 derniers avis reçus
    $reqAvis = $pdo->prepare("
        SELECT a.note, a.commentaire, a.date, au.prenom AS auteur_prenom
        FROM avis a
        JOIN inscrits au ON au.id = a.auteur_id
        WHERE a.utilisateur_id = ?
        ORDER BY a.date DESC
        LIMIT 5
    ");
    $reqAvis->execute([$userId]);
    $row['avis'] = $reqAvis->fetchAll(PDO::FETCH_ASSOC);

    // Infos session + avis personnels
    $row['isLoggedIn'] = $isLoggedIn;
    $row['currentUserId'] = $currentUserId;

    if ($isLoggedIn && $currentUserId !== $userId) {
        $stmtAvisPerso = $pdo->prepare("
            SELECT note, commentaire 
            FROM avis 
            WHERE utilisateur_id=? AND auteur_id=?
            LIMIT 1
        ");
        $stmtAvisPerso->execute([$userId, $currentUserId]);
        $avisPerso = $stmtAvisPerso->fetch(PDO::FETCH_ASSOC);
        if ($avisPerso) {
            $row['deja_note'] = true;
            $row['note_utilisateur'] = (int)$avisPerso['note'];
            $row['commentaire_utilisateur'] = $avisPerso['commentaire'];
        } else {
            $row['deja_note'] = false;
        }
    }

    echo json_encode($row);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
