<?php
session_start();
$appid = $_GET["app"];
if(isset($appid)){
	//read config
	$basedir = "app-configs/";
	$file = $basedir.$appid.".conf";
	$configStr = '';
	if (is_readable($file) == false) {
		die('//config file is unreadable');
	} else {
		echo "//file exist\n";
		$configStr = file_get_contents($file);
		echo $configStr;
	} 
}

?>

