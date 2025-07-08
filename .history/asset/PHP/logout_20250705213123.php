<?php
session_start();
session_destroy();
header('Location: pageConnection.html'); // Redirection vers la page de connexion
exit;

