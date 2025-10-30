<?php
require_once __DIR__ . '/../db.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed'], 405);
}

if (empty($_SESSION['user_id'])) {
    json_response(['success' => false, 'message' => 'Requer autenticação'], 401);
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$action = $input['action'] ?? null; // ação: curtir / descurtir / comentar
$pubId = isset($input['publicationId']) ? (int)$input['publicationId'] : 0;
$comment = trim($input['comment'] ?? '');

if (!$action || !$pubId) {
    json_response(['success' => false, 'message' => 'Parâmetros inválidos'], 400);
}

$nota = null;
switch ($action) {
    case 'like': $nota = 5; break;
    case 'dislike': $nota = 1; break;
    case 'comment': $nota = 3; break;
    default:
        json_response(['success' => false, 'message' => 'Ação desconhecida'], 400);
}

$pdo = get_db();
try {
    // Prevenir múltiplas curtidas/descurtidas do mesmo usuário na mesma publicação.
    // Se já existir uma avaliação deste usuário para esta publicação, atualize-a; caso contrário, insira.
    $check = $pdo->prepare('SELECT id_avaliacao FROM avaliacao WHERE id_usuario = ? AND id_publicacao = ? LIMIT 1');
    $check->execute([$_SESSION['user_id'], $pubId]);
    $existing = $check->fetch();
    if ($existing) {
        $stmt = $pdo->prepare('UPDATE avaliacao SET nota = ?, comentario = ?, data_avaliacao = NOW() WHERE id_avaliacao = ?');
        $stmt->execute([$nota, $comment, $existing['id_avaliacao']]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO avaliacao (nota, comentario, data_avaliacao, id_usuario, id_publicacao) VALUES (?, ?, NOW(), ?, ?)');
        $stmt->execute([$nota, $comment, $_SESSION['user_id'], $pubId]);
    }

    // Retorna contagens agregadas atualizadas para a publicação
    $countStmt = $pdo->prepare('SELECT
        COALESCE(SUM(CASE WHEN nota >=4 THEN 1 ELSE 0 END),0) AS likes,
        COALESCE(SUM(CASE WHEN nota <=2 THEN 1 ELSE 0 END),0) AS dislikes,
        COALESCE(COUNT(id_avaliacao),0) AS comentarios
        FROM avaliacao WHERE id_publicacao = ?');
    $countStmt->execute([$pubId]);
    $counts = $countStmt->fetch();

    json_response(['success' => true, 'counts' => [
        'likes' => (int)$counts['likes'],
        'dislikes' => (int)$counts['dislikes'],
        'comentarios' => (int)$counts['comentarios']
    ]]);
} catch (Exception $e) {
    json_response(['success' => false, 'message' => $e->getMessage()], 500);
}
