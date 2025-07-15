<?php
session_start();
if (!isset($_SESSION['user'])) {
    header('Location: /asset/PHP/login.php');
    exit;
}
$user = $_SESSION['user'];
?>
<!-- le reste de ta page HTML ici -->
