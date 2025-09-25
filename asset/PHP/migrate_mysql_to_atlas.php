<?php
declare(strict_types=1);
ini_set('display_errors','1'); error_reporting(E_ALL);
require __DIR__.'/../../vendor/autoload.php';

use MongoDB\Client as MongoClient;
use MongoDB\BSON\UTCDateTime;

function pdo(): PDO {
  $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
    getenv('DB_HOST') ?: 'db',
    getenv('DB_PORT') ?: '3306',
    getenv('DB_DATABASE') ?: 'covoit'
  );
  return new PDO($dsn, getenv('DB_USERNAME') ?: 'root', getenv('DB_PASSWORD') ?: '',
    [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
}

function toUtc(?string $dt): ?UTCDateTime {
  if (!$dt) return null;
  $ts = strtotime($dt);
  if ($ts === false) return null;
  return new UTCDateTime($ts*1000);
}

$pdo = pdo();
$mongo = new MongoClient(getenv('MONGODB_URI'));
$db    = $mongo->selectDatabase(getenv('MONGODB_DB') ?: 'covoit');

$colUsers = $db->inscrits;
$colDrivers = $db->conducteurs;
$colTrajets = $db->trajets;
$colRes = $db->reservations;
$colAvis = $db->avis;

// Index idempotents
$colUsers->createIndex(['id'=>1], ['unique'=>true]);
$colDrivers->createIndex(['inscrit_id'=>1], ['unique'=>true]);
$colTrajets->createIndex(['legacyId'=>1], ['unique'=>true]);
$colTrajets->createIndex(['dt'=>1]);
$colTrajets->createIndex(['depart'=>1, 'arrivee'=>1]);
$colRes->createIndex(['trajet_legacy_id'=>1, 'statut'=>1]);
$colAvis->createIndex(['utilisateur_id'=>1]);

// 1) inscrits
$rows = $pdo->query("SELECT id, prenom, nom, avatar FROM inscrits")->fetchAll();
if ($rows) {
  $bulk = [];
  foreach ($rows as $r) {
    $bulk[] = ['updateOne' => [
      ['id'=>(int)$r['id']],
      ['$set'=>[
        'id'=>(int)$r['id'],
        'prenom'=>$r['prenom'], 'nom'=>$r['nom'], 'avatar'=>$r['avatar'] ?? null
      ]],
      ['upsert'=>true]
    ]];
  }
  if ($bulk) $colUsers->bulkWrite($bulk);
}

// 2) conducteurs
$rows = $pdo->query("SELECT inscrit_id, prenom, nom, marque_vehicule, modele_vehicule, carburant, animaux, fumeurs FROM conducteurs")->fetchAll();
if ($rows) {
  $bulk = [];
  foreach ($rows as $r) {
    $bulk[] = ['updateOne' => [
      ['inscrit_id'=>(int)$r['inscrit_id']],
      ['$set'=>[
        'inscrit_id'=>(int)$r['inscrit_id'],
        'prenom'=>$r['prenom'], 'nom'=>$r['nom'],
        'marque_vehicule'=>$r['marque_vehicule'] ?? null,
        'modele_vehicule'=>$r['modele_vehicule'] ?? null,
        'carburant'=>$r['carburant'] ?? null,
        'animaux'=> (int)($r['animaux'] ?? 0),
        'fumeurs'=> (int)($r['fumeurs'] ?? 0),
      ]],
      ['upsert'=>true]
    ]];
  }
  if ($bulk) $colDrivers->bulkWrite($bulk);
}

// 3) trajets
$rows = $pdo->query("SELECT id, conducteur_id, date, heure, depart, arrivee, places, jetons, statut, etat_trajet, created_at FROM trajets")->fetchAll();
if ($rows) {
  $bulk = [];
  foreach ($rows as $r) {
    // Champ datetime ISO unique (dt) = date + heure (Europe/Paris -> UTC)
    $dtLocal = trim(($r['date'] ?? '').' '.($r['heure'] ?? '00:00:00'));
    $dt = toUtc($dtLocal);
    $bulk[] = ['updateOne' => [
      ['legacyId'=>(int)$r['id']],
      ['$set'=>[
        'legacyId'=>(int)$r['id'],
        'conducteur_id'=>(int)$r['conducteur_id'],
        'depart'=>$r['depart'],
        'arrivee'=>$r['arrivee'],
        'date'=>$r['date'],
        'heure'=>$r['heure'],
        'dt'=>$dt,
        'places'=>(int)$r['places'],
        'jetons'=>(int)$r['jetons'],
        'statut'=>$r['statut'] ?? 'en_attente',
        'etat_trajet'=>$r['etat_trajet'] ?? 'planifie',
        'created_at'=>toUtc($r['created_at'])
      ]],
      ['upsert'=>true]
    ]];
  }
  if ($bulk) $colTrajets->bulkWrite($bulk);
}

// 4) reservations
$rows = $pdo->query("SELECT id, trajet_id, passager_id, places_reservees, statut, created_at, note, avis, avis_valide, date_validation FROM reservations")->fetchAll();
if ($rows) {
  $bulk = [];
  foreach ($rows as $r) {
    $bulk[] = ['updateOne' => [
      ['legacyId'=>(int)$r['id']],
      ['$set'=>[
        'legacyId'=>(int)$r['id'],
        'trajet_legacy_id'=>(int)$r['trajet_id'],
        'passager_id'=>(int)$r['passager_id'],
        'places_reservees'=>(int)($r['places_reservees'] ?? 1),
        'statut'=>$r['statut'],
        'created_at'=>toUtc($r['created_at']),
        'note'=> isset($r['note']) ? (int)$r['note'] : null,
        'avis'=> $r['avis'] ?? null,
        'avis_valide'=> isset($r['avis_valide']) ? (int)$r['avis_valide'] : null,
        'date_validation'=> toUtc($r['date_valida_]()_
