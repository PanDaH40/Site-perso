<?php
// asset/PHP/admin_get_users.php
require_once 'check_admin.php';
header('Content-Type: application/json');

try {
    $pdo = new PDO('mysql:host=sql309.infinityfree.com;dbname=if0_39505571_db_projet;charset=utf8','if0_39505571','qBOSjJTyyq5Trff');
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur connexion BD']);
    exit;
}

// Construction du WHERE dynamique
$where = [];
$params = [];

if (!empty($_GET['search'])) {
    $where[] = "(inscrits.prenom LIKE ? OR inscrits.nom LIKE ? OR inscrits.email LIKE ?)";
    for ($i = 0; $i < 3; $i++) $params[] = "%" . $_GET['search'] . "%";
}
if (!empty($_GET['role'])) {
    if ($_GET['role'] === 'conducteur') $where[] = "c.inscrit_id IS NOT NULL";
    if ($_GET['role'] === 'passager')   $where[] = "p.inscrit_id IS NOT NULL";
}
if (!empty($_GET['statut'])) {
    $where[] = "inscrits.statut = ?";
    $params[] = $_GET['statut'];
}

// Requête avec LEFT JOIN pour conducteurs et passagers
$sql = "SELECT 
            inscrits.id, 
            inscrits.prenom, 
            inscrits.nom, 
            inscrits.email, 
            inscrits.admin, 
            inscrits.statut, 
            inscrits.credits AS jetons,        -- c'est la colonne credits dans la table !
            CASE WHEN c.inscrit_id IS NOT NULL THEN 1 ELSE 0 END AS roleConducteur,
            CASE WHEN p.inscrit_id IS NOT NULL THEN 1 ELSE 0 END AS rolePassager
        FROM inscrits
        LEFT JOIN conducteurs c ON c.inscrit_id = inscrits.id
        LEFT JOIN passagers p ON p.inscrit_id = inscrits.id
        " . (count($where) ? "WHERE " . implode(" AND ", $where) : "");

// Préparation & exécution
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['users' => $users]);
