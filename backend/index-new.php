<?php
// config/config.php пример
// $dbHost = 'localhost';
// $dbName = 'your_db_name';
// $dbUser = 'your_user';
// $dbPass = 'your_password';

require_once './config/config.php';

header("Content-Type: application/json");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка подключения к базе данных']);
    exit;
}

$inputJSON = file_get_contents('php://input');
$cmd = json_decode($inputJSON, true);

if (!$cmd || !isset($cmd['tip'])) {
    echo json_encode(['error' => 'Не указан тип запроса']);
    exit;
}

switch ($cmd['tip']) {
    case 'infoStudents':
        echo json_encode(infoStudents($pdo, $cmd['obshestvo'] ?? 'ALL'));
        break;

    case 'newDostig':
        echo json_encode(newDostig(
            $pdo,
            $cmd['name'] ?? '',
            $cmd['direction'] ?? '',
            (int)($cmd['rating_prog'] ?? 0),
            (int)($cmd['rating_est'] ?? 0),
            (int)($cmd['rating_upr'] ?? 0)
        ));
        break;

    case 'delDostig':
        echo json_encode(delDostig(
            $pdo,
            $cmd['id'] ?? 0
        ));
        break;

    case 'infoDostig':
        echo json_encode(infoDostig(
            $pdo,
            $cmd['direction'] ?? ''
        ));
        break;

    case 'newStudent':
        echo json_encode(newStudent(
            $pdo,
            $cmd['fio'] ?? '',
            $cmd['obshestvo'] ?? '',
            $cmd['group_num'] ?? '',
            $cmd['rang'] ?? ''
        ));
        break;

    // Добавляйте остальные case по вашему требованию

    default:
        echo json_encode(['error' => 'Неизвестный тип запроса']);
        break;
}

// --- Функции ---

function infoStudents(PDO $pdo, string $obshestvo): array
{
    if ($obshestvo === 'ALL') {
        $stmt = $pdo->query("SELECT * FROM student");
        return $stmt->fetchAll();
    } else {
        $stmt = $pdo->prepare("SELECT * FROM student WHERE obshestvo = :obshestvo");
        $stmt->execute(['obshestvo' => $obshestvo]);
        return $stmt->fetchAll();
    }
}

function newDostig(PDO $pdo, string $name, string $direction, int $rating_prog, int $rating_est, int $rating_upr): array
{
    if (!$name || !$direction) {
        return ['error' => 'Не указано имя или направление'];
    }

    $stmt = $pdo->prepare("SELECT id FROM meropriyatia WHERE name = :name AND direction = :direction");
    $stmt->execute(['name' => $name, 'direction' => $direction]);
    $exists = $stmt->fetch();

    if (!$exists) {
        $stmtInsert = $pdo->prepare("INSERT INTO meropriyatia (name, direction, rating_prog, rating_est, rating_upr)
            VALUES (:name, :direction, :rating_prog, :rating_est, :rating_upr)");
        $stmtInsert->execute([
            'name' => $name,
            'direction' => $direction,
            'rating_prog' => $rating_prog,
            'rating_est' => $rating_est,
            'rating_upr' => $rating_upr,
        ]);
    }

    $stmtSelect = $pdo->prepare("SELECT * FROM meropriyatia WHERE name = :name AND direction = :direction");
    $stmtSelect->execute(['name' => $name, 'direction' => $direction]);
    return $stmtSelect->fetchAll();
}

function delDostig(PDO $pdo, int $id): array
{
    if ($id <= 0) {
        return ['error' => 'Неверный ID'];
    }
    $stmt = $pdo->prepare("DELETE FROM meropriyatia WHERE id = :id");
    $stmt->execute(['id' => $id]);
    return ['success' => true];
}

function infoDostig(PDO $pdo, string $direction): array
{
    if (!$direction) {
        return ['error' => 'Не указано направление'];
    }
    $stmt = $pdo->prepare("SELECT * FROM meropriyatia WHERE direction = :direction");
    $stmt->execute(['direction' => $direction]);
    return $stmt->fetchAll();
}

function newStudent(PDO $pdo, string $fio, string $obshestvo, string $group_num, string $rang): array
{
    if (!$fio) {
        return ['error' => 'Не указано ФИО'];
    }
    $stmt = $pdo->prepare("INSERT INTO student (fio, obshestvo, group_num, rang) VALUES (:fio, :obshestvo, :group_num, :rang)");
    $stmt->execute([
        'fio' => $fio,
        'obshestvo' => $obshestvo,
        'group_num' => $group_num,
        'rang' => $rang
    ]);
    return ['success' => true, 'id' => $pdo->lastInsertId()];
}

// Здесь можно добавить остальные функции по аналогии...

?>
