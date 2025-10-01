<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');

class PublicProfile {
    private PDO $pdo;
    private int $userId;
    private ?int $currentUserId;
    private bool $isLoggedIn;

    public function __construct(PDO $pdo, int $userId, ?int $currentUserId) {
        $this->pdo = $pdo;
        $this->userId = $userId;
        $this->currentUserId = $currentUserId;
        $this->isLoggedIn = !empty($currentUserId);
    }

    // Récupère les données principales du profil
    public function getProfileData(): ?array {
        $stmt = $this->pdo->prepare("
            SELECT 
                i.prenom, i.nom, i.avatar, i.bio,
                c.marque_vehicule, c.modele_vehicule, c.carburant, c.plaque, c.couleur, c.date_premiere_immatriculation,
                c.animaux, c.fumeurs,
                (SELECT COUNT(*) FROM trajets WHERE conducteur_id = i.id AND etat_trajet = 'termine') AS nbTrajetsTermines,
                (SELECT COUNT(*) FROM trajets WHERE conducteur_id = i.id) AS nbTrajetsTotal,
                DATE_FORMAT(i.date_inscription, '%M %Y') AS anciennete,
                (SELECT ROUND(AVG(a.note),1) FROM avis a WHERE a.utilisateur_id = i.id) AS moyenne_note,
                (SELECT COUNT(*) FROM avis a WHERE a.utilisateur_id = i.id) AS nb_avis
            FROM inscrits i
            LEFT JOIN conducteurs c ON c.inscrit_id = i.id
            WHERE i.id = ?
            LIMIT 1
        ");
        $stmt->execute([$this->userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    // Détermine les rôles utilisateur
    private function determineRoles(array &$profileData): void {
        $profileData['roleConducteur'] = !empty($profileData['marque_vehicule']) 
            || !empty($profileData['modele_vehicule']) 
            || !empty($profileData['carburant']);
        // Adapter selon votre logique métier
        $profileData['rolePassager'] = false;
    }

    // Récupère les derniers avis reçus
    private function getLastReviews(): array {
        $reqAvis = $this->pdo->prepare("
            SELECT a.note, a.commentaire, a.date, au.prenom AS auteur_prenom
            FROM avis a
            JOIN inscrits au ON au.id = a.auteur_id
            WHERE a.utilisateur_id = ?
            ORDER BY a.date DESC
            LIMIT 5
        ");
        $reqAvis->execute([$this->userId]);
        return $reqAvis->fetchAll(PDO::FETCH_ASSOC);
    }

    // Récupère l'avis personnel de l'utilisateur connecté sur ce profil (s'il existe)
    private function getPersonalReview(): array {
        if (!$this->isLoggedIn || $this->currentUserId === $this->userId) {
            return [];
        }
        $stmt = $this->pdo->prepare("
            SELECT note, commentaire 
            FROM avis 
            WHERE utilisateur_id = ? AND auteur_id = ?
            LIMIT 1
        ");
        $stmt->execute([$this->userId, $this->currentUserId]);
        $avisPerso = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($avisPerso) {
            return [
                'deja_note' => true,
                'note_utilisateur' => (int)$avisPerso['note'],
                'commentaire_utilisateur' => $avisPerso['commentaire']
            ];
        }
        return ['deja_note' => false];
    }

    // Construit la réponse complète
    public function getFullProfile(): array {
        $profileData = $this->getProfileData();
        if (!$profileData) {
            http_response_code(404);
            return ['error' => 'Profil introuvable'];
        }

        $this->determineRoles($profileData);

        $profileData['avis'] = $this->getLastReviews();
        $profileData['isLoggedIn'] = $this->isLoggedIn;
        $profileData['currentUser Id'] = $this->currentUserId;

        $profileData += $this->getPersonalReview();

        return $profileData;
    }
}

// Validation et exécution
try {
    if (!isset($_GET['id']) || !ctype_digit($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID utilisateur invalide']);
        exit;
    }
    $userId = (int)$_GET['id'];
    $currentUserId = isset($_SESSION['user']['id']) ? (int)$_SESSION['user']['id'] : null;

    require_once __DIR__ . '/db_conn.php';

    $profile = new PublicProfile($pdo, $userId, $currentUserId);
    $result = $profile->getFullProfile();

    echo json_encode($result);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
