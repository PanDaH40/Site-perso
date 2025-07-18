<?php
if (mail('test@exemple.com', 'Test MailHog', 'Ceci est un test de mail avec MailHog !')) {
    echo "Mail envoyé avec succès !";
} else {
    echo "Erreur lors de l'envoi du mail.";
}
?>
