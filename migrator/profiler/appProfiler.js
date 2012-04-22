//Author: Carl
//Date: 2010.11.17
//Source file: profiler.js
//require: jquery.js

mProfiler = function (){
	_mProfiler = window.mProfiler;

}

mProfiler.configContent = "";
mProfiler.totalTime = 0;
mProfiler.isChrome = window.navigator.userAgent.match(/Chrome\/([\d.]+)/).length>0;
mProfiler.ignoreFunctions = ['(program)','(root)','(garbage collector)','alert','console.log','confirm','set innerHTML',
    'PostMessage','d.event.fix','d.fn.extend.removeClass','set className','d.fn.d.init','d.extend.type','d.event.handle',
    'chrome.Event.detach_','chrome.Event.removeListener','OpenChannelToExtension','CloseChannel','chrome.Event.dispatch',
    'd.extend.now','chrome-extension://mgijmajocgfcbeboacabfgobmjgjcoja/content_js_min.js','chromeHidden.validate',
    'chrome-extension://alelhddbbhepgpmgidjdcjakblofbmce/javascripts/content_script.js','n.SearchBox.App.getTemplate'];

mProfiler.ignoreFunctions.indexOf = function (str){
    for(var i=0; i<this.length; i++){
        if(str === this[i]){
            return i;
        }
    }
    return -1;
}
//set default profiler config
mProfiler.config = {};
mProfiler.config.keepChildren = false;
mProfiler.config.filterRate = 0.01;

//require jquery
$(document).ready(function(){
		if(confirm("Want to profile?")){
			mProfiler.popupProfileButton();
		}
		});

//pop up a div shows "start" and "stop" button
//require jquery
mProfiler.popupProfileButton = function(){
	if(typeof $ == "undefined") return false;
	if($("#mProfilerControlDiv").length ==0 ){
		$("body").append("<style type='text/css'>#mProfilerControlDiv {z-index:99999;top:10%;left:10%; display: none; position: absolute; background: #FFF; border:solid 1px #6e8bde; } #mProfilerControlDiv h4 { color: black; cursor:default; height: 18px; font-size: 14px; font-weight:bold; text-align: left; padding-left: 8px; padding-top: 4px; padding-bottom: 2px; background: #ccc; }  #mProfilerControlDiv button{min-height:35px;min-width:100px;}</style>");
	
		$("body").append("<div id='mProfilerControlDiv'><h4>App Profiler :</h4><div style='clear:both'/><button id='mProfilerStart'>Start</button> <button id='mProfilerStop'>Stop</button></div>");
	}
	$("#mProfilerStart").click(function(){
			if(mProfiler.isChrome)
				console.profile();
				});
	$("#mProfilerStop").click(function(){
			if(mProfiler.isChrome){
		   		console.profileEnd();
				$("#mProfilerStop").attr("disabled",true);
				$("#mProfilerControlDiv").fadeOut(600);
				$("#mProfilerStop").attr("disabled",false);
				mProfiler.popupConfig();	//pop up config div
				}
			});
	$("#mProfilerControlDiv").fadeIn(600);

}

//pop up a textarea to show the config script text
//user can modify the content and then deploy the rules to server
//require jquery
mProfiler.popupConfig = function(){
	if(typeof $ == "undefined") return false;
	if($("#mProfilerConfigDiv").length ==0 )
		$("body").append("<style type='text/css'>#mProfilerConfigDiv {z-index:99999;top:10%;left:10%;width:820px; display: none; position: absolute; background: #FFF; border:solid 1px #6e8bde; } #mProfilerConfigDiv h4 { color: black; cursor:default; height: 18px; font-size: 14px; font-weight:bold; text-align: left; padding-left: 8px; padding-top: 4px; padding-bottom: 2px; background: #ccc; } #mProfilerConfigDiv span{color:black;text-align:left;font-size:14px;}  #mProfilerConfigText{height:400px;width:800px; font-size: 14px;} #mProfilerConfigBody { clear: both; margin: 4px; padding: 2px; } #mProfilerConfigDiv button{min-height:35px;min-width:100px;}</style>");

	$("body").append("<div id='mProfilerConfigDiv'><h4>Migrator Configuration :</h4><div id='mProfilerConfigBody'><textarea id='mProfilerConfigText'/><div style='clear:both'/><button id='mProfilerConfigOK'>OK</button></div></div>");

	this.configContent = this.genConfig();
	$("#mProfilerConfigText").text(this.configContent);
    $("#mProfilerConfigOK").click(function(){
	        $("#mProfilerConfigDiv").fadeOut(500);
            });
	$("#mProfilerConfigDiv").fadeIn(500);

}

//call methods to generate config script text
mProfiler.genConfig = function(keepChildren,filterRate){
	if (typeof keepChildren != "undefined") this.config.keepChildren = keepChildren;
	if (typeof filterRate != "undefined") this.config.filterRate = filterRate;
	var configStr = this.getMigrationRules(this.getProfileNodes(this.getConsoleFiles()));
	return configStr;
}

//Get the console profiler's result.
//IMPORTANT: Only chrome supported right now.
mProfiler.getConsoleFiles = function(){
	// if chrome
	if(this.isChrome)
	{
		if(console.profiles.length>=1) //return the latest profile result
			return console.profiles[console.profiles.length-1].head;
        console.log("Cannot find profile results.");
	}
	else {
        console.log("Not using Chrome.");
		return null;
    }
}


//////////////////////////////////////
//input: getConsoleFiles()
//	type: ScriptProfileNode
//	attr: callUID : Number
//		  children : Array[ScriptProfileNode]
//		  children.length : Number
//		  functionName : String
//		  lineNumber : Number
//		  numberOfCalls : Number
//		  selfTime : Number /ms
//		  totalTime : Number /ms
//		  url : String
//		  visible : boolean
///////////////////////////////////////
//output: Array of function profiles rules
//profile rules format:
//		  functionName : String
//		  url : String
//		  timeCost : Number
//		  numberOfCalls : Number 
//
//////////////////////////////////////
// analyse the profile result
mProfiler.getProfileNodes = function (rootNode){
	if(!rootNode) return null;
	var keepChildren = mProfiler.config.keepChildren;
	var filterRate = mProfiler.config.filterRate;

	var nodes = new Array();
	function getNoChildren(node){		//return a node without childrens
		return { callUID : node.callUID,
				functionName : node.functionName,
		//		lineNumber : node.lineNumber,
		//      numberOfCalls : node.numberOfCalls, //always 0, should be a bug
				selfTime : node.selfTime,
				totalTime : node.totalTime,
		//		url : node.url,
				visible : node.visible
		};
	}

	var totalTime = 0;
	for(var i=0; i<rootNode.children.length; i++){
		var a = rootNode.children[i];
		if(mProfiler.ignoreFunctions.indexOf(a.functionName) === -1 ){
				totalTime += a.totalTime;
			}
	}
	this.totalTime = totalTime;
	(function TraversalRecursive (node){		//Recursively push all nodes into a array
		for(var i=0; i<node.children.length; i++)
			TraversalRecursive(node.children[i]);
		if( keepChildren )	//remain children nodes
			nodes.push(node);
		else
			nodes.push(getNoChildren(node));
	})(rootNode);

    //remove duplicates
    var tempNodes = new Array(),names=new Array(), index;
    for(i=0; i<nodes.length; ++i){
        index = names.indexOf(nodes[i].functionName);
        if(  index === -1 ){
            tempNodes.push(nodes[i]);
            names.push(nodes[i].functionName);
        }
        else {
            tempNodes[index].selfTime += nodes[i].selfTime;
            tempNodes[index].totalTime += nodes[i].totalTime;
        }
    }
	nodes = tempNodes.filter(function(a){
			return (a.selfTime > totalTime*filterRate)			//get functions cost more than filterRate*totalTime
		   		&& (mProfiler.ignoreFunctions.indexOf(a.functionName) === -1 );
			});
	nodes.sort(function(a,b){	//order by descending selfTime
			return b.selfTime-a.selfTime;
			});
	return nodes;
}

//from nodes objects to migration rules format
//generate config script text
mProfiler.getMigrationRules = function (nodes){
	if (!nodes) return "";
	var str = [];
	str.push("//This CONFIG script is auto generated for offloading javascript functions.");
	str.push("//You can set unsuitable rules to comments or remove them if necessary.");
	str.push("//Then copy this as your app's offloading config.");
	str.push("MIGRATOR_CONFIG={");
    str.push("\tfunctions:[");

	for(var i=0; i<nodes.length; i++){
		var tstr = "\t\t'"+nodes[i].functionName+"',//"+
			"function self time cost: "+nodes[i].selfTime.toFixed(1)+"ms, "+
			(nodes[i].selfTime*100/this.totalTime).toFixed(2)+"% out of total app cost.";
		str.push(tstr);
	}
	str.push("\t]");
	str.push("};");
	return str.join('\n');
}

