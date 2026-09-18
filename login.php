<?php
session_start();
$dbFile = __DIR__ . '/carepulse.db';

try {
    $pdo = new PDO("sqlite:" . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database Connection Failed: " . $e->getMessage());
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (empty($email) || empty($password)) {
        echo "<script>alert('All fields are required.'); window.location.href='login.html';</script>";
        exit();
    }

    $stmt = $pdo->prepare("SELECT user_id, password_hash, role, first_name FROM users WHERE email = ? AND is_active = 1");
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row && password_verify($password, $row['password_hash'])) {
        $_SESSION['user_id'] = $row['user_id'];
        $_SESSION['role'] = $row['role'];
        $_SESSION['name'] = $row['first_name'];

        if ($row['role'] === 'Admin') {
            header("Location: index.html");
        } else {
            header("Location: dashboard.html");
        }
        exit();
    } else {
        echo "<script>alert('Invalid email or password.'); window.location.href='login.html';</script>";
        exit();
    }
}
?>