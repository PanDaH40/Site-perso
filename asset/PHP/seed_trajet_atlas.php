<?php
declare(strict_types=1);
ini_set('display_errors','1'); error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/../../vendor/autoload.php';

try {
  $uri = getenv('MONGODB_URI');
  $dbn = getenv('MONGODB_DB') ?: 'covoit';
  if (!$uri) throw new RuntimeException('MONGODB_URI manquant');

  $client = new MongoDB\Client($uri);
  $db     = $client->selectDatabase($dbn);
  $col    = $db->selectCollection('trajets');

  $date = '2025-10-01';
  $heure= '08:15';
  $dt   = new DateTime("$date $heure", new DateTimeZone('Europe/Paris'));
  $utc  = new MongoDB\BSON\UTCDateTime($dt->getTimestamp()*1000);

  $doc = [
    'legacyId' => 0, // si tu migreras depuis MySQL tu mettras l’id MySQL ici
    'conducteur_id' => 1,
    'date' => $date,
    'heure'=> $heure,
    'depart'=>'Paris',
    'arrivee'=>'Lyon',
    'places'=>3,
    'jetons'=>25,
    'dt' => $utc,
    'created_at' => new MongoDB\BSON\UTCDateTime(),
  ];

  $res = $col->insertOne($doc);
  echo json_encode(['ok'=>true,'id'=>(string)$res->getInsertedId()]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);
}
