<?php
session_start();
session_destroy();
header('Location: PageConnection.html'); // Redirection vers la page de connexion
exit;

