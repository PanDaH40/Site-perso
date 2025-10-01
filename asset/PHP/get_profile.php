<?php
session_start();
header('Content-Type: application/json');

class UserProfile {
    private PDO $pdo;
    private int $requestedUserId;
    private int $currentUserId;

    public function __construct(PDO $pdo, int $requestedUserId, int $currentUserId) {
        $this->pdo = $pdo;
        $this->requestedUserId = $requestedUserId;
        $this->currentUserId = $currentUserId;
    }

    /**
     * Récupère les informations du profil utilisateur demandé
     * @return array|null Tableau associatif des données ou null si non trouvé
     */
    public function getProfile(): ?array {
        $sql = "
            SELECT 
                i.id,
                i.prenom,
                i.nom,
                i.email,
                i.avatar,
                i.bio,
                i.credits,
                c.marque_vehicule,
                c.modele_vehicule,
                c.carburant,
                c.animaux,
                c.fumeurs,
                p.preferences,
                -- Flags explicites :
                CASE WHEN c.inscrit_id IS NOT NULL THEN 1 ELSE 0 END AS roleConducteur,
                CASE WHEN p.inscrit_id IS NOT NULL THEN 1 ELSE 0 END AS rolePassager
            FROM inscrits i
            LEFT JOIN conducteurs c ON c.inscrit_id = i.id
            LEFT JOIN passagers  p ON p.inscrit_id   = i.id
            WHERE i.id = :id
            LIMIT 1
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':id' => $this->requestedUserId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        // Ajout d'un flag indiquant si c'est le profil de l'utilisateur connecté
        $row['is_current_user'] = ($this->requestedUserId === $this->currentUserId);

        return $row;
    }
}

// Vérification connexion utilisateur
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

try {
    require_once __DIR__ . '/db_conn.php';

    $currentUserId = (int)$_SESSION['user']['id'];
    $requestedUserId = isset($_GET['id']) && ctype_digit($_GET['id']) ? (int)$_GET['id'] : $currentUserId;

    $profile = new UserProfile($pdo, $requestedUserId, $currentUserId);
    $result = $profile->getProfile();

    if ($result === null) {
        http_response_code(404);
        echo json_encode(['error' => 'Profil introuvable']);
        exit;
    }

    echo json_encode($result);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur serveur interne',
        'debug' => $e->getMessage()
    ]);
}
