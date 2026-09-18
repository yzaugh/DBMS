<?php
// This will automatically create a local database file named 'carepulse.db' in your folder
$dbFile = __DIR__ . '/carepulse.db';

try {
    $pdo = new PDO("sqlite:" . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create the users table
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT,
        email TEXT UNIQUE,
        password_hash TEXT,
        role TEXT,
        is_active INTEGER DEFAULT 1
    )");

    // Insert a default Admin account (Email: admin@carepulse.com, Password: password)
    $email = 'admin@carepulse.com';
    $passwordHash = password_hash('password', PASSWORD_DEFAULT);
    $role = 'Admin';
    $firstName = 'System';

    $stmt = $pdo->prepare("INSERT OR IGNORE INTO users (first_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)");
    $stmt->execute([$firstName, $email, $passwordHash, $role]);

    echo "✅ SQLite database ('carepulse.db') and Admin user created successfully!<br><br>";
    echo "You can now go to your <a href='login.html'>Login Page</a> and log in using:<br>";
    echo "<strong>Email:</strong> admin@carepulse.com<br>";
    echo "<strong>Password:</strong> password";

} catch (PDOException $e) {
    echo "❌ Error setting up SQLite: " . $e->getMessage();
}
?>