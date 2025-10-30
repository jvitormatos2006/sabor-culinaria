<?php
require_once __DIR__ . '/../db.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['success' => false, 'message' => 'Method not allowed'], 405);
}

$pdo = get_db();
// Consulta publicações e agrega contagens da tabela `avaliacao`
// Envolve em try/catch para retornar erros em JSON e facilitar a depuração
try {
    $sql = "SELECT p.id_publicacao, p.titulo_prato, p.local, p.cidade, p.foto,
               COALESCE(SUM(CASE WHEN a.nota >= 1 THEN 1 ELSE 0 END),0) AS total_avaliacoes,
               COALESCE(SUM(CASE WHEN a.nota >= 4 THEN 1 ELSE 0 END),0) AS likes,
               COALESCE(SUM(CASE WHEN a.nota <= 2 THEN 1 ELSE 0 END),0) AS dislikes,
               COALESCE(COUNT(a.id_avaliacao),0) AS comentarios
        FROM publicacao p
        LEFT JOIN avaliacao a ON a.id_publicacao = p.id_publicacao
        GROUP BY p.id_publicacao
        ORDER BY p.id_publicacao";

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll();

    // Se o usuário estiver logado, busca a avaliação dele por publicação
    $userEval = [];
    if (!empty($_SESSION['user_id'])) {
        $uStmt = $pdo->prepare('SELECT id_publicacao, nota FROM avaliacao WHERE id_usuario = ?');
        $uStmt->execute([$_SESSION['user_id']]);
        $uRows = $uStmt->fetchAll();
        foreach ($uRows as $ur) {
            $userEval[(int)$ur['id_publicacao']] = (int)$ur['nota'];
        }
    }

    $mapped = array_map(function($r) use ($userEval) {
        $id = (int)$r['id_publicacao'];
        return [
            'id' => $id,
            'titulo' => $r['titulo_prato'],
            'local' => $r['local'],
            'cidade' => $r['cidade'],
            'likes' => (int)$r['likes'],
            'dislikes' => (int)$r['dislikes'],
            'comentarios' => (int)$r['comentarios'],
            'img' => $r['foto'],
            // user_nota é null ou a nota inteira que o usuário atual deu
            'user_nota' => array_key_exists($id, $userEval) ? $userEval[$id] : null
        ];
    }, $rows);

    json_response(['success' => true, 'publications' => $mapped]);
} catch (Exception $e) {
    // Retorna erro em JSON para que o frontend possa exibir diagnóstico
    json_response(['success' => false, 'error' => 'DB query failed', 'message' => $e->getMessage()], 500);
}
