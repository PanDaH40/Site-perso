<?php
session_start();

if (!isset($_SESSION['user'])) {
    header('Location: connection.php');
    exit;
}

$user = $_SESSION['user'];
?>