<?php
$host = '';
$user = 'test-db';
$password = '';
$dbname = 'test-db';

$xls_file = '1.xlsx';

$err_msql='';

$mysqli = new mysqli($host, $user, $password, $dbname);
//if($mysqli) {echo("Ok");}
if ($mysqli->connect_errno) 
{

    $err_msql.= "Проблема с бд.\n";
    $err_msql.= "Ошибка: Не удалось создать соединение с базой MySQL и вот почему: \n";
    $err_msql .= "Номер_ошибки: " . $mysqli->connect_errno . "\n";
    $err_msql .= "Ошибка: " . $mysqli->connect_error . "\n";

er_bd($err_msql); // В файл скидываем ошибки
}

if (!$mysqli->query("SET NAMES 'utf8'")) 
{
    $a=''; 
    $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
    $a.= "Запрос: " . $query . "\n";
    $a.='Errorcode: '.$mysqli->errno."\n";
    er_bd($a);
}

if (!$mysqli->query("SET CHARACTER SET 'utf8'")) 
{
    $a=''; 
    $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
    $a.= "Запрос: " . $query . "\n";
    $a.='Errorcode: '.$mysqli->errno."\n";
    er_bd($a);
} 
$mysqli->query("SET SESSION collation_connection = 'utf8_general_ci'");

function er_bd($a) 
{
    $dateTime = date('Y-m-d_H-i-s');
    $resultFilename = dirname(__FILE__) . "/log/error_bd{$dateTime}.txt";
    file_put_contents($resultFilename, $a);
    echo $a;
    die;
}

?>
