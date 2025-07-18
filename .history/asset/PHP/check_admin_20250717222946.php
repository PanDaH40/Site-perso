session_start();
// Importe ta logique de connexion/session ici si besoin

if (empty($_SESSION['user']) || empty($_SESSION['user']['admin']) || $_SESSION['user']['admin'] != 1) {
    http_response_code(403); // Refuse l'accès
    echo json_encode(['error'=>'Accès interdit (admin seulement)']);
    exit;
}
