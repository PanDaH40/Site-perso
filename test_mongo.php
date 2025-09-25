<?php
require __DIR__ . '/vendor/autoload.php';

$client = new MongoDB\Client(getenv('MONGODB_URI'));
$db = $client->selectDatabase(getenv('MONGODB_DB'));

echo "Connexion OK à Atlas, bases disponibles :\n";
foreach ($client->listDatabases() as $database) {
    echo "- " . $database->getName() . "\n";
}
