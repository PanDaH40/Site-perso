<?php
session_start();
var_dump($_SESSION); 
if (!isset($_SESSION['user'])) {
    header('Location: <div class="">
    <asset></asset>connection.php');
    exit;
}

$user = $_SESSION['user'];
?>