<?php
session_start();
var_dump($_SESSION); 
if (!isset($_SESSION['user'])) {
    header('Location: connection.php');
    exit;
}

$user = $_SESSION['user'];
?>