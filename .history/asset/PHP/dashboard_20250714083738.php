<?php
session_start();
if (!isset($_SESSION['user'])) {
    header('Location: /asset/PHP/login.phplogin.php');
    exit;
}
?>
<!-- le reste de ta page HTML ici -->
