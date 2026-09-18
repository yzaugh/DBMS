<?php
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');        // ← XAMPP default
define('DB_NAME', 'carepulse_db');
define('DB_USER', 'root');
define('DB_PASS', '');            // ← XAMPP default

function db() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8";
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }
    return $pdo;
}
?>