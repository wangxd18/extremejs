<?php
$timezone = "Asia/Shanghai";
if(function_exists('date_default_timezone_set'))
	date_default_timezone_set($timezone);
$timeStamp = date("Y-n-j G:i:s");
$appName = $_POST['appName'];
$offloaded= $_POST['offloaded'];
$dataArray = $_POST['dataArray'];
$userAgent = $_POST['userAgent'];
//var_dump($dataArray);

$basedir = '../data/';
$file = $basedir.$appName.'.'.$offloaded.'.csv';

$str = join(",",$dataArray);
$str .= ",".$timeStamp.",".$userAgent.",\n";
//$str = $sohuPages[$i][0].','.$sohuPages[$i][1].','.$sohuPages[$i][4].','.$sohuPages[$i][2].','.$sohuPages[$i][3].",\n";

if(is_readable($file) == false){    // if there is no data, write
	$fp=fopen($file, 'w');
	if( $fp!=FALSE ){
		//for excel
		fwrite($fp,chr(0xEF).chr(0xBB).chr(0xBF));
		fwrite($fp,"T,C,S,N,D,OBJ,CTX,time,userAgent,\n");
		fwrite($fp,$str);
		fclose($fp);
        echo "Success";
	} else {
        echo "Failed: Cannot open file.";
    }
} else {    // else append
	$fp=fopen($file, 'a');
	if( $fp!=FALSE ){
		fwrite($fp,$str);
		fclose($fp);
        echo "Success";
	} else {
        echo "Failed: Cannot open file.";
	}
}
?>
