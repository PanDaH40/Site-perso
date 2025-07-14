<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user']['id'])) {
    echo json_encode(['connected' => true, 'user' => $_SESSION['user']]);
} else {
    echo json_encode(['connected' => false]);
}
