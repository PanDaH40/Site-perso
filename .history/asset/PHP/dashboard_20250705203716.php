<?php
session_start();
var_dump($_SESSION); 
if (!isset($_SESSION['user'])) {
    header('Location: ./asset/PHPconnection.php');
    exit;
}

$user = $_SESSION['user'];
?>