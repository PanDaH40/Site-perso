<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db_conn.php';

// Vérifier connexion
if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}

$auteurId = (int)$_SESSION['user']['id'];

// Lire JSON
$in = json_decode(file_get_contents('php://input'), true);

$utilisateurId = (int)($in['utilisateur_id'] ?? 0);
$note = (int)($in['note'] ?? 0);
$commentaire = trim((string)($in['commentaire'] ?? ''));

// Validation
if ($utilisateurId <= 0 || $note < 1 || $note > 5) {
    echo json_encode(['error' => 'Paramètres invalides']);
    exit;
}

if ($utilisateurId === $auteurId) {
    echo json_encode(['error' => "Impossible de s’auto-noter"]);
    exit;
}

try {
    // Vérifie si l'utilisateur a déjà laissé un avis
    $stmt = $pdo->prepare("
        SELECT id 
        FROM avis 
        WHERE utilisateur_id = ? AND auteur_id = ?
        LIMIT 1
    ");
    $stmt->execute([$utilisateurId, $auteurId]);
    $existing = $stmt->fetchColumn();

    if ($existing) {
        // Mise à jour
        $stmt = $pdo->prepare("
            UPDATE avis 
            SET note = ?, commentaire = ?, date = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$note, $commentaire !== '' ? $commentaire : null, $existing]);
    } else {
        // Insertion
        $stmt = $pdo->prepare("
            INSERT INTO avis (utilisateur_id, auteur_id, note, commentaire, date)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$utilisateurId, $auteurId, $note, $commentaire !== '' ? $commentaire : null]);
    }

    echo json_encode(['success' => true]);

} catch (Throwable $e) {
    error_log("Erreur ajouter_avis: " . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
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
