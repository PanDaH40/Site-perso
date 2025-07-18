<?php
session_start();
if (empty($_SESSION['user']) || empty($_SESSION['user']['admin']) || $_SESSION['user']['admin'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé (admin requis)']);
    exit;
}
