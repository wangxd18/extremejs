<?php

//通过http请求获得所有需要加载的url的脚本
function getCodes(){
	$CODES = array();
    if( isset( $_POST['url']) )
        $url = $_POST['url'];
    if( isset($_POST['code']) )
        $code = $_POST['code'];
	if(isset($url) && is_array($url)){
	  foreach($url as $u){
			$CODES[] = file_get_contents($u);
		}
	}
	else if(isset($url) && is_string($url) && $url!=""){
		$CODES[]=file_get_contents($url);
	}
	if(isset($code) && is_array($code)){
	  foreach($code as $c){		//用array_merge 也可以
			$CODES[] = $c;
		}
	}
	else if(isset($code) && is_string($code) && $code!=""){
		$CODES[]=$code;
	}
	return $CODES;
}
$CODES = getCodes();

if( count($CODES)>1 ){
	// merge codes to one
	$finalCode = "{".(join("};{",$CODES))."};";
}
else{
	$finalCode = $CODES[0];
}
//var_dump( $finalCode );
//set POST variables
$url = 'http://localhost:8888/interp';
$jsSessionID = $_POST['session'];
$fields = array(
						'session'=>$jsSessionID,
						'code'=>json_encode($finalCode),
						'_' => 'EOS'
				);

$fields_string = http_build_query($fields);
//echo $fields_string;

//open connection
$ch = curl_init();

//$url = 'http://localhost:8888/largeFile.txt';

//set the url, number of POST vars, POST data
curl_setopt($ch,CURLOPT_URL,$url);
curl_setopt($ch,CURLOPT_POST,count($fields));
curl_setopt($ch,CURLOPT_POSTFIELDS,$fields_string);
curl_setopt($ch,CURLOPT_BUFFERSIZE,150000);
//curl_setopt($ch,CURLOPT_BINARYTRANSFER,TRUE);
//curl_setopt($ch,CURLOPT_RETURNTRANSFER,TRUE);
curl_setopt($ch,CURLOPT_HTTP_VERSION,CURL_HTTP_VERSION_1_1);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Connection: Keep-Alive',
    'Keep-Alive: 300'
));
//execute post , [result will be printed automatically as html]
curl_exec($ch);

//$rst = curl_exec($ch);$info = curl_getinfo($ch);echo strlen($rst);echo '获取'. $info['url'] . '耗时'. $info['total_time'] . '秒. size_download:' . $info['size_download'] . ' download_content_length:' . $info['download_content_length'] ;

//close connection
curl_close($ch);



?>

