<?php
session_start();
if (!isset($_SESSION['user'])) {
    header('Location: /asset/PHP/login.php');
    exit;
}
?>
<!-- le reste de ta page HTML ici -->
