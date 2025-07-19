<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user']['id'])) { echo json_encode(['error'=>'Non connecté']); exit; }
$me = (int)$_SESSION['user']['id'];

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Tous les interlocuteurs distincts + date du dernier message
    $stmt = $pdo->prepare("
        SELECT 
            CASE WHEN sender_id = :me THEN receiver_id ELSE sender_id END AS user_id,
            MAX(created_at) AS last_message_date
        FROM messages
        WHERE sender_id = :me OR receiver_id = :me
        GROUP BY user_id
        ORDER BY last_message_date DESC
    ");
    $stmt->execute(['me' => $me]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $ids = array_column($rows, 'user_id');
    $convs = [];

    if (count($ids)) {
        $in = implode(',', array_map('intval', $ids));
        $users = $pdo->query("SELECT id, prenom, nom FROM inscrits WHERE id IN ($in)")
                     ->fetchAll(PDO::FETCH_ASSOC);
        $map = [];
        foreach ($users as $u) $map[$u['id']] = $u;

        // On ajoute le badge non-lus à chaque conversation
        foreach ($rows as $r) {
            $userId = $r['user_id'];
            // Nombre de messages non lus reçus de cet utilisateur
            $badge = $pdo->prepare("
                SELECT COUNT(*) FROM messages
                WHERE sender_id = :user AND receiver_id = :me AND is_read = 0
            ");
            $badge->execute(['user' => $userId, 'me' => $me]);
            $nonLus = (int)$badge->fetchColumn();

            $convs[] = [
                'id'     => $userId,
                'prenom' => $map[$userId]['prenom'] ?? '',
                'nom'    => $map[$userId]['nom']    ?? '',
                'badge'  => $nonLus
            ];
        }
    }

    echo json_encode(['conversations' => $convs]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error'=>'Erreur serveur', 'debug'=>$e->getMessage()]);
}
