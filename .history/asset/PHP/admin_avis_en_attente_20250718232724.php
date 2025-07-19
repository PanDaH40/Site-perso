<?php
require_once 'check_admin.php';
require_once 'login.php';

$stmt = $pdo->query("SELECT r.id, r.avis, r.note, i.prenom, i.nom, t.date
                     FROM reservations r
                     JOIN inscrits i ON r.passager_id = i.id
                     JOIN trajets t ON r.trajet_id = t.id
                     WHERE r.avis IS NOT NULL AND r.avis_valide=0");
$avis = $stmt->fetchAll(PDO::FETCH_ASSOC);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['valider_avis'])) {
    $id = intval($_POST['id']);
    $pdo->prepare("UPDATE reservations SET avis_valide=1 WHERE id=?")->execute([$id]);
    header("Location: admin_avis_en_attente.php");
    exit;
}
?>
<!DOCTYPE html>
<html><body>
  <h2>Avis en attente de validation</h2>
  <?php foreach ($avis as $a): ?>
    <div style="border:1px solid #ccc;margin:8px;padding:8px;">
      <b><?=htmlspecialchars($a['prenom']." ".$a['nom'])?></b>
      (<?=htmlspecialchars($a['date'])?>) <br>
      Note: <?=htmlspecialchars($a['note'])?> / 5 <br>
      Avis: <?=nl2br(htmlspecialchars($a['avis']))?><br>
      <form method="post" style="display:inline;">
        <input type="hidden" name="id" value="<?=$a['id']?>">
        <button name="valider_avis" value="1">Valider</button>
      </form>
    </div>
  <?php?>

