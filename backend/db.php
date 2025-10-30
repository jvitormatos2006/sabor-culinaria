<?php
define('DB_DSN', 'mysql:host=127.0.0.1;dbname=sabor_culinaria;charset=utf8mb4');
define('DB_USER', 'root');
define('DB_PASS', '');

function get_db() {
    static $pdo = null;
    if ($pdo) return $pdo;
    try {
        $pdo = new PDO(DB_DSN, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'DB connection failed', 'message' => $e->getMessage()]);
        exit;
    }
    return $pdo;
}

function json_response($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}
