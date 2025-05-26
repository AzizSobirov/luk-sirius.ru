<?php
require_once './config/config.php';

header("Content-type: application/json");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');
        
        if (@$_REQUEST['tip']) {
            $cmd =  $_REQUEST;
         //   print_r ($cmd);
        } 
        else 
        {
        $f = fopen('php://input', 'r'); // Открываем на чтение поток ввода
        $data = stream_get_contents($f); // Получаем содержимое потока
        $cmd=json_decode($data, true);
        
      //  print_r ($cmd);
        }

        if ($cmd) { // Код обработки
           
            switch ($cmd["tip"]) {
                case 'infoStudent':
                    $user = infoStudent($cmd["familia"],$cmd["imya"],$cmd["otchestvo"],$cmd["dateRozdenia"],$cmd["snils"], $cmd["obshestvo"], $cmd["klass"], $cmd["potok"], $cmd["telefon"]);
                    header('Content-Type: application/json');
                    print_r (json_encode($user));
                    break;
                case 'upgradeStudent':
                    $user = upgradeStudent($cmd["id_student"], $cmd["familia"],$cmd["imya"],$cmd["otchestvo"],$cmd["dateRozdenia"],$cmd["snils"], $cmd["obshestvo"], $cmd["klass"], $cmd["potok"], $cmd["telefon"]);
                    header('Content-Type: application/json');
                    print_r (json_encode($user));
                    break;    
                case 'searchStudent':
                    $user = searchStudent($cmd["snils"]);
                    header('Content-Type: application/json');
                    print_r (json_encode($user));
                    break;
            case 'nameDostig':
                    header('Content-Type: application/json');
                    $name = searchNameDostig($cmd["name"]);
                    print_r(json_encode($name));
                    break;
            case 'profilDostig':
                    header('Content-Type: application/json');
                    $name = searchProfilDostig($cmd["name"]);
                    print_r(json_encode($name));
                    break;
            case 'setDostig':
                     header('Content-Type: application/json');
                        
                    $name = setDostig($cmd["idStudent"], $cmd["idMeropriatiya"], $_FILES['picture'],$cmd["subject"], $cmd["status"], $cmd["level"],$cmd["ball"] );
                    print_r($name);
                    break;
            case 'updateDostig':
                     header('Content-Type: application/json');
                    $name = updateDostig($cmd["idStudent"], $cmd["idMeropriatiya"], $_FILES['picture'],$cmd["subject"], $cmd["status"], $cmd["level"],$cmd["ball"] );
                    print_r($name);
                    break;
            case 'delImage':
                    // header('Content-Type: application/json');
                    //$subinput = substr($result["PicturePath"], 21);
                    $filepath = dirname(__FILE__)."/img/".$cmd["PicturePath"];// $subinput;
                    print_r ($filepath);

                    if( unlink($filepath)) echo("Ok");
                    break;       
            case 'getDostig':
                    $user = getDostig($cmd["idStudent"]);
                    header('Content-Type: application/json');
                    print_r (json_encode($user));
                    break;
            case 'delDostig':
                    $name = delDostig($cmd["id_student"], $cmd["id_meropriyatiya"], $cmd["role"]);
                    // header('Content-Type: application/json');
                    print_r ($name);
                    break;
            case 'picDostig':
                    $name = picDostig($cmd["id_Student"], $cmd["id_meropriyatiya"]);
                    header('Content-Type: application/json');
                    print_r (json_encode($name));
                    break;
            case 'setNapravl':
                    $name = setNapravl($cmd["idStudent"], $cmd["napravl"], $cmd["rating"]);
                    print_r($name);
                    break;
            
            case 'newDostig':
                    $name = newDostig($cmd["name"], $cmd["direction"], $cmd["rating_prog"], $cmd["rating_est"], $cmd["rating_upr"]);
                    header('Content-Type: application/json');
                    print_r (json_encode($name));
                    break;
            
            case 'infoStudents':
                    $name = infoStudents($cmd["obshestvo"]);
                    header('Content-Type: application/json');
                    print_r (json_encode($name));
                    break;
            case 'vigruzka':
                    $user = allStudents($cmd["obshestvo"]);
                    $users = [];
                    foreach ($user as $item) {
                        $users[$item['id']] = $item;
                        $dostig = allDostig($item['id']);
                        foreach ($dostig as $item) {
                            $users[$item['id_student']]['dostig'][] = $item;
                        }
                    }

            header('Content-Type: application/json');
            echo json_encode($users);
            break;
            }
        }

function infoStudents($obshestvo){
    GLOBAL $mysqli;
    
    $query = "SELECT * FROM student WHERE obshestvo = $obshestvo";
    if($obshestvo == "ALL"){
        $query = "SELECT * FROM student WHERE 1";
    }
    $row = $mysqli->query($query);
    for ($data = []; $name_dost= mysqli_fetch_assoc($row); $data[] = $name_dost);
    
    if (!$mysqli->query($query)) 
{ // косяк однако
    $a=''; 
    $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
    $a.= "Запрос: " . $query . "\n";
    $a.='Errorcode: '.$mysqli->errno."\n";
    er_bd($a);        
}
mysqli_close($mysqli);

return $data;

}

function newDostig($name, $direction, $rating_prog, $rating_est, $rating_upr){
    GLOBAL $mysqli;

$query = "SELECT id FROM meropriyatia WHERE name = '$name' AND direction = '$direction'";
$row = $mysqli->query($query);
$result = mysqli_fetch_assoc($row);

if (!$result){
    
    $query = "INSERT INTO meropriyatia(name, direction, rating_prog, rating_est, rating_upr)
         VALUES
         ('$name','$direction', $rating_prog , $rating_est , $rating_upr )"; 
}         

if (!$mysqli->query($query)) 
{ // косяк однако
    $a=''; 
    $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
    $a.= "Запрос: " . $query . "\n";
    $a.='Errorcode: '.$mysqli->errno."\n";
    er_bd($a);        
}

 $query = "SELECT * FROM meropriyatia WHERE name ='$name' AND direction = '$direction'";
    $row = $mysqli->query($query);
    for ($data = []; $name_dost= mysqli_fetch_assoc($row); $data[] = $name_dost);
    
    if (!$mysqli->query($query)) 
{ // косяк однако
    $a=''; 
    $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
    $a.= "Запрос: " . $query . "\n";
    $a.='Errorcode: '.$mysqli->errno."\n";
    er_bd($a);        
}


mysqli_close($mysqli);

return  $data;
}

function setNapravl($idStudent, $napravl, $rating){
    GLOBAL $mysqli;
$query = "UPDATE student SET napravl='$napravl', rating='$rating' WHERE id = '$idStudent'";    

if (!$mysqli->query($query)) 
{ // косяк однако
    $a=''; 
    $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
    $a.= "Запрос: " . $query . "\n";
    $a.='Errorcode: '.$mysqli->errno."\n";
    er_bd($a);        
}
mysqli_close($mysqli);

return 'OK';

}

function picDostig($idStudent, $idMeropriatiya){
    GLOBAL $mysqli;
    
    $query = "SELECT PicturePath FROM dostigeniya WHERE id_student = $idStudent AND id_meropriyatiya = $idMeropriatiya ";
    
    $row = $mysqli->query($query);
    for ($data = []; $name_dost= mysqli_fetch_assoc($row); $data[] = $name_dost);
    
    if (!$mysqli->query($query)) 
{ // косяк однако
    $a=''; 
    $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
    $a.= "Запрос: " . $query . "\n";
    $a.='Errorcode: '.$mysqli->errno."\n";
    er_bd($a);        
}
mysqli_close($mysqli);

return $data;
}

function delDostig($idStudent, $idMeropriatiya, $role){
    GLOBAL $mysqli;

$query = "SELECT PicturePath FROM `dostigeniya` WHERE `id_student` = $idStudent AND `id_meropriyatiya` = $idMeropriatiya AND role = '$role'";
$row = $mysqli->query($query);
$result = mysqli_fetch_assoc($row);

$subinput = substr($result["PicturePath"], 21);

$filepath = dirname(__FILE__). $subinput;

unlink($filepath);

$query = "DELETE FROM `dostigeniya` WHERE `id_student` = $idStudent AND `id_meropriyatiya` = $idMeropriatiya AND role = '$role'";
    
    if (!$mysqli->query($query)) 
        { // косяк однако
            $a=''; 
            $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
            $a.= "Запрос: " . $query . "\n";
            $a.='Errorcode: '.$mysqli->errno."\n";
            er_bd($a);        
        }
           
           
            return('OK');
}

function getDostig($idStudent){
    GLOBAL $mysqli;
    
    $query = "SELECT * FROM dostigeniya WHERE id_student = '$idStudent' ";
    $row = $mysqli->query($query);
    for ($data = []; $name_dost= mysqli_fetch_assoc($row); $data[] = $name_dost);
    
    if (!$mysqli->query($query)) 
{ // косяк однако
    $a=''; 
    $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
    $a.= "Запрос: " . $query . "\n";
    $a.='Errorcode: '.$mysqli->errno."\n";
    er_bd($a);        
}
mysqli_close($mysqli);

return $data;
}


function setDostig($idStudent, $idMeropriatiya, $file, $subject, $status, $level, $ball){
        GLOBAL $mysqli;

// Загружаем картинку ------------------------------------

$uploadPath = __DIR__.'/img/';

// Массив допустимых значений типа файла
$types = array('image/gif', 'image/png', 'image/jpeg');
// Максимальный размер файла
$size = 2048000;
 
	// Проверяем тип файла
	if (!in_array($file['type'], $types))
		return($file['type']);
		
	// Проверяем размер файла
	if ($file['size'] > $size)
		return($file['size']);
 
    $tmp_name = $file['tmp_name'];
    $name = time() . '_' . basename(encodestring($file["name"]));
    $fileName =  "https://espp.su/sirius/img/" . $name;   
    $today = date("Y-m-d H:i:s"); 

move_uploaded_file($tmp_name, $uploadPath . $name);

  //     echo('OK');
        
        $query = "INSERT INTO dostigeniya (id_student, id_meropriyatiya, PicturePath, dt, subject, status, level, ball)
         VALUES
         ('$idStudent','$idMeropriatiya', '$fileName' , '$today', '$subject', '$status', '$level', '$ball')"; 
         
        if (!$mysqli->query($query)) 
        { // косяк однако
            $a=''; 
            $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
            $a.= "Запрос: " . $query . "\n";
            $a.='Errorcode: '.$mysqli->errno."\n";
            er_bd($a);        
        }
           
           
            return('OK');
	 
}

function updateDostig($idStudent, $idMeropriatiya, $file, $subject, $status, $level, $ball){
        GLOBAL $mysqli;
//return();
if(sizeof($file) ==0){
    $query = "UPDATE dostigeniya SET dt='$today', subject='$subject', status='$status', level='$level', ball='$ball' WHERE id_student = '$idStudent' AND id_meropriyatiya='$idMeropriatiya'";
         
        if (!$mysqli->query($query)) 
        { // косяк однако
            $a=''; 
            $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
            $a.= "Запрос: " . $query . "\n";
            $a.='Errorcode: '.$mysqli->errno."\n";
            er_bd($a);        
        }
           
           
            return('OK');
} else {
// Загружаем картинку ------------------------------------

$uploadPath = __DIR__.'/img/';

// Массив допустимых значений типа файла
$types = array('image/gif', 'image/png', 'image/jpeg');
// Максимальный размер файла
$size = 2048000;
 
	// Проверяем тип файла
	if (!in_array($file['type'], $types))
		return($file['type']);
		
	// Проверяем размер файла
	if ($file['size'] > $size)
		return($file['size']);
 
    $tmp_name = $file['tmp_name'];
    $name = time() . '_' . basename(encodestring($file["name"]));
    $fileName =  "https://espp.su/sirius/img/" . $name;   
    $today = date("Y-m-d H:i:s"); 

move_uploaded_file($tmp_name, $uploadPath . $name);

  //     echo('OK');
        
        $query = "UPDATE dostigeniya SET PicturePath='$fileName', dt='$today', subject='$subject', status='$status', level='$level', ball='$ball' WHERE id_student = '$idStudent' AND id_meropriyatiya='$idMeropriatiya'";
         
        if (!$mysqli->query($query)) 
        { // косяк однако
            $a=''; 
            $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
            $a.= "Запрос: " . $query . "\n";
            $a.='Errorcode: '.$mysqli->errno."\n";
            er_bd($a);        
        }
           
           
            return('OK');
}
	 
}

function searchProfilDostig($name){
    GLOBAL $mysqli;
    
    $query = "SELECT * FROM meropriyatia WHERE name = '$name' "; //AND direction LIKE '%$profil%'";
    $row = $mysqli->query($query);
    for ($data = []; $name_dost= mysqli_fetch_assoc($row); $data[] = $name_dost);
    
    if (!$mysqli->query($query)) 
{ // косяк однако
    $a=''; 
    $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
    $a.= "Запрос: " . $query . "\n";
    $a.='Errorcode: '.$mysqli->errno."\n";
    er_bd($a);        
}
mysqli_close($mysqli);

return $data;
}



function searchNameDostig($name){
    GLOBAL $mysqli;
    if ($name == "FULL"){
        $query = "SELECT DISTINCT name FROM meropriyatia WHERE 1";
    }
    else {
    $query = "SELECT DISTINCT name FROM meropriyatia WHERE name LIKE '%$name%'";
    }
    $row = $mysqli->query($query);
    $data = array();
 
    for ($data = []; $name_dost= mysqli_fetch_assoc($row); $data[] = $name_dost);
    
    if (!$mysqli->query($query)) 
{ // косяк однако
    $a=''; 
    $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
    $a.= "Запрос: " . $query . "\n";
    $a.='Errorcode: '.$mysqli->errno."\n";
    er_bd($a);        
}
mysqli_close($mysqli);

return  $data;
}


function infoStudent($familia,$imya,$otchestvo,$dateRozdenia,$snils,$obshestvo,$klass,$potok,$telefon) {
    GLOBAL $mysqli;

$query = "SELECT * FROM student WHERE snils = '$snils'"; // AND date_rozd = '$dateRozdenia'";
$row = $mysqli->query($query);
$result_user = mysqli_fetch_assoc($row);
$id=$result_user[id];
if(!$id){    
$query = "INSERT INTO student (familia, imya, otchestvo, date_rozd, snils, obshestvo, klass, napravl, potok, telephone)
 VALUES
 ('$familia','$imya','$otchestvo','$dateRozdenia','$snils','$obshestvo','$klass','','$potok','$telefon')"; 
//echo ($query); 
 
} else {
$query = "UPDATE student SET familia = '$familia', imya = '$imya', otchestvo = '$otchestvo', date_rozd = '$dateRozdenia', snils = '$snils', obshestvo = '$obshestvo', klass = '$klass', napravl = '', potok = '$potok', telephone = '$telefon' WHERE id = '$id'";
//echo ($query);
        }

if (!$mysqli->query($query)) 

{ // косяк однако
    $a=''; 
    $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
    $a.= "Запрос: " . $query . "\n";
    $a.='Errorcode: '.$mysqli->errno."\n";
    er_bd($a);        
}

$query = "SELECT * FROM student WHERE snils = '$snils'"; // AND date_rozd = '$dateRozdenia'";
$row = $mysqli->query($query);
$result_user = mysqli_fetch_assoc($row);
$id=$result_user[id];

return ($result_user);
}


function searchStudent($snils) {

GLOBAL $mysqli;
        
$query = "SELECT * FROM student WHERE snils = '$snils'";
$row = $mysqli->query($query);
$result_user = mysqli_fetch_assoc($row);
$id=$result_user[id];

if ($result_user) {
    
    $query = "SELECT * FROM `dostigeniya` join meropriyatia ON dostigeniya.id_meropriyatiya = meropriyatia.id where dostigeniya.id_student = $id";
    $row = $mysqli->query($query);
    for ($data = []; $result_dost= mysqli_fetch_assoc($row); $data[] = $result_dost);
    
$result['user']=$result_user;
$result['dostiz']=$data;

}
else{ $result='Empty'; }

if (!$mysqli->query($query)) 
{ // косяк однако
    $a=''; 
    $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
    $a.= "Запрос: " . $query . "\n";
    $a.='Errorcode: '.$mysqli->errno."\n";
    er_bd($a);        
}
mysqli_close($mysqli);

return ($result);
}

function encodestring($text) {
		$searchurl = array("а", "б","в", "г", "д", "е", "ё", "ж", "з", "и", "й", "к", "л", "м", "н", "о", "п", "р", "с", "т", "у", "ф", "х", "ц", "ч", "ш", "щ", "ъ", "ы", "ь", "э", "ю", "я", "А", "Б","В", "Г", "Д", "Е", "Ё", "Ж", "З", "И", "Й", "К", "Л", "М", "Н", "О", "П", "Р", "С", "Т", "У", "Ф", "Х", "Ц", "Ч", "Ш", "Щ", "Ъ", "Ы", "Ь", "Э", "Ю", "Я");
		$replaceurl = array("a", "b","v", "g", "d", "e", "jo", "zh", "z", "i", "j", "k", "l", "m", "n", "o", "p", "r", "s", "t", "u", "f", "h", "c", "ch", "sh", "w", "tz", "y", "mz", "je", "ju", "ja", "A", "B","V", "G", "D", "E", "JO", "ZH", "Z", "I", "J", "K", "L", "M", "N", "O", "P", "R", "S", "T", "U", "F", "H", "C", "CH", "SH", "W", "TZ", "Y", "MZ", "JE", "JU", "JA");
		$text = str_replace($searchurl, $replaceurl, $text);
		$searchurl_2 = array(" ", "+", "#", "$", "%", "^", "&", "*", "?", "\\", "/");
		$replaceurl_2 = array("_", "Plus", "No.", "Dollar", "Percent", "", "and", "", "", "", "");
		$text = str_replace($searchurl_2, $replaceurl_2, $text);
		return $text;
	}	
	
	function allStudents($obshestvo){
    GLOBAL $mysqli;
    
    $query = "SELECT * FROM student WHERE obshestvo = $obshestvo";
    
    if($obshestvo == "ALL"){
        $query = "SELECT * FROM student WHERE 1";
    }
    
    $row = $mysqli->query($query);
    
  //  $data = [
        //'student'=> [],
        //'dostig'=> [],
    //];
    $data = [];
    while ($student = $row->fetch_assoc()) {
    $data[] = $student;
//    $data['dosig'][] = allDostig($student['id']);
}
    
    if (!$mysqli->query($query)) 
{ // косяк однако
    $a=''; 
    $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
    $a.= "Запрос: " . $query . "\n";
    $a.='Errorcode: '.$mysqli->errno."\n";
    er_bd($a);        
}
//mysqli_close($mysqli);

//$data = allDostig(144);
//createXlsFile($data);
 return ($data);

}
   
function allDostig($student_id) {
        GLOBAL $mysqli;
    
 $query = "SELECT * FROM dostigeniya WHERE id_student = $student_id";
 //return $query;   
    $row = $mysqli->query($query);
    
    $data = [];
    
    while ($dostig = $row->fetch_assoc()) {
    $data[] = $dostig;
}
    if (!$mysqli->query($query)) 

{ // косяк однако
    $a=''; 
    $a.= "Ошибка: Наш запрос не удался и вот почему: \n";
    $a.= "Запрос: " . $query . "\n";
    $a.='Errorcode: '.$mysqli->errno."\n";
    er_bd($a);        
}
//mysqli_close($mysqli);

return $data;
        
}