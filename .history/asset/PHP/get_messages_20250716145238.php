<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user']['id'])) { 
    echo json_encode(['error'=>'Non connecté']); 
    exit; 
}
$me = (int)$_SESSION['user']['id'];

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Récupère les interlocuteurs distincts dans les messages
    $stmt = $pdo->prepare(
      "SELECT DISTINCT
         CASE WHEN sender_id = :me THEN receiver_id ELSE sender_id END AS user_id
       FROM messages
       WHERE sender_id = :me OR receiver_id = :me
       ORDER BY (SELECT MAX(created_at) FROM messages m2 WHERE 
                  (m2.sender_id = user_id AND m2.receiver_id = :me) OR 
                  (m2.sender_id = :me AND m2.receiver_id = user_id)) DESC"
    );
    $stmt->execute(['me' => $me]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $ids = array_column($rows,'user_id');
    $convs = [];

    if (count($ids)) {
      $in  = implode(',', array_map('intval',$ids));
      $users = $pdo->query("SELECT id, prenom, nom FROM inscrits WHERE id IN ($in)")
                   ->fetchAll(PDO::FETCH_ASSOC);
      $map = []; foreach($users as $u) $map[$u['id']]=$u;
      $convs = array_map(fn($r)=>[
        'id'=>$r['user_id'],
        'prenom'=>$map[$r['user_id']]['prenom'],
        'nom'=>$map[$r['user_id']]['nom']
      ], $rows);
    }

    echo json_encode(['conversations'=>$convs]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error'=>'Erreur serveur', 'debug'=>$e->getMessage()]);
}
