<?php
$to = 'test@exemple.com';
$subject = 'Test MailHog';
$message = 'Ceci est un test MailHog.';
$headers = "From: noreply@localhost\r\n";
if(mail($to, $subject, $message, $headers)){
    echo "Mail envoyé";
} else {
    echo "Échec de l'envoi";
}
?>
