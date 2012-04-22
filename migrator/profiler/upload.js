function uploadProfilerData(domain, appName, offloaded, dataArray, callback){
    var paramData = {
        appName : appName,
        offloaded: offloaded? 'offloaded':'local',
        dataArray: dataArray || {},
        userAgent: navigator.userAgent.toString().replace(/[,|;]/g,'-')
    }
    $.ajax({
	    url: 'http://'+domain+'/migrator/profiler/savedata.php',   //接收页面
		type: 'post',      //POST方式发送数据
        async: true,
        data: paramData,
        success: function(msg) {
            callback(msg);
        }
    });
}
