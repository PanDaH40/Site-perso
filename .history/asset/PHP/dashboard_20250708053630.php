<?php
session_start();

if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit;
}

$userName = htmlspecialchars($_SESSION['user']['prenom'] . ' ' . $_SESSION['user']['nom']);
?>