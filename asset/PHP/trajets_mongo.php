<?php
ini_set('display_errors','1'); error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/../../vendor/autoload.php';

use MongoDB\Client as Mongo;

$uri   = getenv('MONGODB_URI');
$dbn   = getenv('MONGODB_DB') ?: 'covoit';
if (!$uri) { echo json_encode(['error'=>'MONGODB_URI manquante']); exit; }

$client = new Mongo($uri);
$db     = $client->selectDatabase($dbn);
$colT   = $db->selectCollection('trajets');
$colR   = $db->selectCollection('reservations');

// Only public list (compat avec ?all=1)
if (isset($_GET['all']) && $_GET['all']==='1') {
  $filter = [];
  $and = [];

  if (!empty($_GET['depart']))  $and[] = ['depart'  => ['$regex'=>$_GET['depart'],  '$options'=>'i']];
  if (!empty($_GET['arrivee'])) $and[] = ['arrivee' => ['$regex'=>$_GET['arrivee'], '$options'=>'i']];
  if (!empty($_GET['date']))    $and[] = ['date'    => $_GET['date']];

  // dt > now (si migré avec champ dt)
  $and[] = ['dt' => ['$gt' => new MongoDB\BSON\UTCDateTime((new DateTime('now', new DateTimeZone('UTC')))->getTimestamp()*1000)]];

  if ($and) $filter['$and'] = $and;

  $cursor = $colT->find($filter, ['sort'=>['date'=>1,'heure'=>1], 'limit'=>200]);

  $res = [];
  foreach ($cursor as $t) {
    $trajetId = (int)($t['legacyId'] ?? 0);

    // calc places réservées (statut 'valide')
    $agg = $colR->aggregate([
      ['$match'=>['trajet_legacy_id'=>$trajetId, 'statut'=>'valide']],
      ['$group'=>['_id'=>null, 'sum'=>['$sum'=>'$places_reservees']]]
    ]);
    $sum = 0;
    foreach ($agg as $g) { $sum = (int)($g['sum'] ?? 0); }

    $res[] = [
      'id'                   => $trajetId,
      'date'                 => (string)($t['date'] ?? ''),
      'heure'                => (string)($t['heure'] ?? ''),
      'depart'               => (string)($t['depart'] ?? ''),
      'arrivee'              => (string)($t['arrivee'] ?? ''),
      'places'               => (int)($t['places'] ?? 0),
      'jetons'               => (float)($t['jetons'] ?? 0),
      'total_reservations'   => $sum,
      'conducteur_id'        => (int)($t['conducteur_id'] ?? 0),
      // champs facultatifs (si migrés)
      'marque_vehicule'      => $t['marque_vehicule'] ?? null,
      'modele_vehicule'      => $t['modele_vehicule'] ?? null,
      'carburant'            => $t['carburant'] ?? null,
      'animaux'              => $t['animaux'] ?? null,
      'fumeurs'              => $t['fumeurs'] ?? null,
      'conducteur_prenom'    => $t['conducteur_prenom'] ?? null,
      'conducteur_nom'       => $t['conducteur_nom'] ?? null,
      'conducteur_avatar'    => $t['conducteur_avatar'] ?? null,
    ];
  }

  // Date alternative (approx) si rien trouvé
  if (empty($res) && !empty($_GET['date']) && !empty($_GET['depart']) && !empty($_GET['arrivee'])) {
    $alt = $colT->findOne([
      'depart'  => ['$regex'=>$_GET['depart'],  '$options'=>'i'],
      'arrivee' => ['$regex'=>$_GET['arrivee'], '$options'=>'i'],
      'date'    => ['$gt' => $_GET['date']]
    ], ['sort'=>['date'=>1, 'heure'=>1], 'projection'=>['date'=>1]]);
    $altDate = $alt['date'] ?? null;
    echo json_encode([
      'all_trajets'=>[],
      'date_alternative' => $altDate ? (new DateTime((string)$altDate))->format('d/m/Y') : null,
      'message' => $altDate ? "Aucun trajet disponible à cette date. Essayez le ".(new DateTime((string)$altDate))->format('d/m/Y') : "Aucun trajet disponible."
    ]);
    exit;
  }

  echo json_encode(['all_trajets'=>$res]); exit;
}

echo json_encode(['error'=>'Opération non supportée sur trajets_mongo.php']);


// declare(strict_types=1);
// ini_set('display_errors','1'); error_reporting(E_ALL);
// header('Content-Type: application/json; charset=utf-8');

// require __DIR__ . '/../../vendor/autoload.php';
// use MongoDB\Client;
// use MongoDB\BSON\UTCDateTime;

// $client = new Client(getenv('MONGODB_URI'));
// $db = $client->selectDatabase(getenv('MONGODB_DB') ?: 'covoit');

// $trajets = $db->trajets;
// $reserv = $db->reservations;
// $drivers = $db->conducteurs;
// $users = $db->inscrits;
// $avis = $db->avis;

// // index idempotents
// $trajets->createIndex(['dt'=>1]);
// $trajets->createIndex(['depart'=>1, 'arrivee'=>1]);
// $reserv->createIndex(['trajet_legacy_id'=>1, 'statut'=>1]);
// $drivers->createIndex(['inscrit_id'=>1]);
// $users->createIndex(['id'=>1]);
// $avis->createIndex(['utilisateur_id'=>1]);

// if (isset($_GET['all']) && $_GET['all'] === '1') {
//   // Filtres front
//   $depart = $_GET['depart'] ?? null;
//   $arrivee = $_GET['arrivee'] ?? null;
//   $date = $_GET['date'] ?? null; // YYYY-MM-DD
//   $places_min = isset($_GET['places_min']) ? (int)$_GET['places_min'] : null;
//   $jetons_max = isset($_GET['jetons_max']) ? (float)$_GET['jetons_max'] : null;
//   $note_min = isset($_GET['note_min']) ? (float)$_GET['note_min'] : null;

//   $todayUtc = new DateTime('now', new DateTimeZone('UTC'));
//   $nowUtc = new UTCDateTime($todayUtc->getTimestamp()*1000);

//   $match = [
//     // trajets futurs (dt >= now)
//     'dt' => ['$gte' => $nowUtc],
//   ];
//   if ($depart)  $match['depart']  = ['$regex'=>$depart,  '$options'=>'i'];
//   if ($arrivee) $match['arrivee'] = ['$regex'=>$arrivee, '$options'=>'i'];
//   if ($date) { // si une date stricte est fournie
//     $match['date'] = $date;
//   }
//   if ($jetons_max !== null) $match['jetons'] = ['$lte'=>$jetons_max];

//   $pipeline = [
//     ['$match' => $match],
//     // total_reservations (statut = 'valide')
//     ['$lookup' => [
//       'from' => 'reservations',
//       'localField' => 'legacyId',
//       'foreignField' => 'trajet_legacy_id',
//       'as' => 'reslist'
//     ]],
//     ['$addFields' => [
//       'total_reservations' => [
//         '$sum' => [
//           '$map' => [
//             'input' => [
//               '$filter' => [
//                 'input' => '$reslist',
//                 'as' => 'r',
//                 'cond' => ['$eq' => ['$$r.statut', 'valide']]
//               ]
//             ],
//             'as' => 'v',
//             'in' => ['$ifNull' => ['$$v.places_reservees', 0]]
//           ]
//         ]
//       ]
//     ]],
//     // filtrer places restantes (et places_min)
//     ['$addFields' => [
//       'places_restantes' => ['$subtract' => ['$places', '$total_reservations']]
//     ]],
//     ['$match' => ['places_restantes' => ['$gt' => ($places_min ?? 0) - 1]]],
//     // enrichir conducteur + inscrit
//     ['$lookup' => [
//       'from' => 'conducteurs',
//       'localField' => 'conducteur_id',
//       'foreignField' => 'inscrit_id',
//       'as' => 'cond'
//     ]],
//     ['$lookup' => [
//       'from' => 'inscrits',
//       'localField' => 'conducteur_id',
//       'foreignField' => 'id',
//       'as' => 'ins'
//     ]],
//     ['$addFields' => [
//       'cond' => ['$first' => '$cond'],
//       'ins'  => ['$first' => '$ins']
//     ]],
//     // note moyenne conducteur (avis.utilisateur_id == conducteur_id)
//     ['$lookup' => [
//       'from' => 'avis',
//       'let' => ['cid' => '$conducteur_id'],
//       'pipeline' => [
//         ['$match' => ['$expr' => ['$eq' => ['$utilisateur_id', '$$cid']]]],
//         ['$group' => ['_id'=>null, 'avg'=>['$avg'=>'$note']]],
//       ],
//       'as' => 'rat'
//     ]],
//     ['$addFields' => [
//       'note_moy' => ['$ifNull' => [['$first' => '$rat.avg'], null]]
//     ]],
//   ];

//   if ($note_min !== null) {
//     $pipeline[] = ['$match' => ['note_moy' => ['$gte' => $note_min]]];
//   }

//   // projection pour matcher ton front
//   $pipeline[] = ['$project' => [
//     '_id' => 0,
//     'id' => ['$toString' => '$_id'], // identifiant Mongo (string)
//     'date' => 1,
//     'heure' => 1,
//     'depart' => 1,
//     'arrivee' => 1,
//     'places' => 1,
//     'jetons' => 1,
//     'total_reservations' => 1,
//     'conducteur_id' => 1,
//     'marque_vehicule' => ['$ifNull' => ['$cond.marque_vehicule', null]],
//     'modele_vehicule' => ['$ifNull' => ['$cond.modele_vehicule', null]],
//     'carburant'       => ['$ifNull' => ['$cond.carburant', null]],
//     'animaux'         => ['$ifNull' => ['$cond.animaux', null]],
//     'fumeurs'         => ['$ifNull' => ['$cond.fumeurs', null]],
//     'conducteur_prenom' => ['$ifNull' => ['$ins.prenom', null]],
//     'conducteur_nom'    => ['$ifNull' => ['$ins.nom', null]],
//     'conducteur_avatar' => ['$ifNull' => ['$ins.avatar', null]],
//   ]];

//   $pipeline[] = ['$sort' => ['date'=>1, 'heure'=>1]];
//   $pipeline[] = ['$limit' => 200];

//   $rows = iterator_to_array($trajets->aggregate($pipeline), false);

//   // même logique "date alternative" que ton PHP MySQL
//   if (empty($rows) && $date && $depart && $arrivee) {
//     $alt = iterator_to_array($trajets->aggregate([
//       ['$match'=>[
//         'depart'=>['$regex'=>$depart,'$options'=>'i'],
//         'arrivee'=>['$regex'=>$arrivee,'$options'=>'i'],
//         'date' => ['$gt' => $date]
//       ]],
//       ['$sort'=>['date'=>1,'heure'=>1]],
//       ['$limit'=>1],
//       ['$project'=>['_id'=>0,'date'=>1]]
//     ]), false);
//     $altDate = $alt[0]['date'] ?? null;
//     echo json_encode([
//       'all_trajets'=>[],
//       'date_alternative'=> $altDate ? date('d/m/Y', strtotime($altDate)) : null,
//       'message'=> $altDate ? "Aucun trajet disponible à cette date. Essayez le ".date('d/m/Y', strtotime($altDate)) : "Aucun trajet disponible."
//     ], JSON_UNESCAPED_UNICODE);
//     exit;
//   }

//   echo json_encode(['all_trajets'=>$rows], JSON_UNESCAPED_UNICODE);
//   exit;
// }

// echo json_encode(['error'=>'bad request']);
