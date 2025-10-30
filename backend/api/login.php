<?php
require_once __DIR__ . '/../db.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if ($username === '' || $password === '') {
    json_response(['success' => false, 'message' => 'Usuário e senha são obrigatórios'], 400);
}

$pdo = get_db();
$stmt = $pdo->prepare('SELECT id_usuario, nome, email, nickname, senha, foto FROM usuario WHERE nickname = ? OR email = ? LIMIT 1');
$stmt->execute([$username, $username]);
$user = $stmt->fetch();

if (!$user) {
    json_response(['success' => false, 'message' => 'Usuário ou senha incorreto'], 401);
}

$stored = $user['senha'];
$ok = false;
// Se o valor armazenado parece ser um hash (ex.: começa com $2y$, $2a$ ou $argon),
// verifique com password_verify. Caso contrário, permita comparação em texto plano (legado).
if (strpos($stored, '$2y$') === 0 || strpos($stored, '$2a$') === 0 || strpos($stored, '$argon') === 0) {
    $ok = password_verify($password, $stored);
} else {
    // fallback: comparação em texto plano (compatibilidade legada)
    $ok = ($password === $stored);
}

if (!$ok) {
    json_response(['success' => false, 'message' => 'Usuário ou senha incorreto'], 401);
}

// sucesso no login
$_SESSION['user_id'] = (int)$user['id_usuario'];
$_SESSION['user_name'] = $user['nome'] ?? $user['nickname'];

// Inclui o campo 'foto' (pode ser nome de arquivo ou URL). O frontend decide como normalizar o path.
json_response(['success' => true, 'user' => [
    'id' => (int)$user['id_usuario'],
    'nome' => $user['nome'] ?? $user['nickname'],
    'foto' => isset($user['foto']) ? $user['foto'] : null
]]);
