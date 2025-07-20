<?php 
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($email && $password) {
        $stmt = $pdo->prepare("SELECT * FROM inscrits WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['mot_de_passe'])) {
            $_SESSION['user'] = [
                'id' => $user['id'],
                'nom' => $user['nom'],
                'prenom' => $user['prenom'],
                'email' => $user['email']
            ];
            header('Location: ./dashboard.html');
            exit;
        } else {
            header('Location: login.php?erreur=1');
            exit;
        }
    } else {
        header('Location: login.php?erreur=2');
        exit;
    }
} else {
    header('Location: login.php');
    exit;
}
?>
