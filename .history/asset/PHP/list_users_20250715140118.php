<!-- <?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user'])) {
  echo json_encode(['error'=>'Non connecté']); exit;
}
$me = $_SESSION['user']['id'];

$pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Récupère tous les autres inscrits
$stmt = $pdo->prepare("SELECT id, prenom, nom FROM inscrits WHERE id <> ? ORDER BY prenom, nom");
$stmt->execute([$me]);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['users' => $users]); -->
