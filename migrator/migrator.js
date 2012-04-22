
//============== js part start ===================
// require JSON and jQuery

//set Array.prototype.__type__ as Array
Array.prototype.__type__ = 'Array';
Date.prototype.__type__='Date';
var __appid__ = '<?php echo $_GET["app"] ?>';

_Migrator = window.Migrator;

Migrator = {
	sessionID : '<?php echo genRandomString(25) ?>',	
	domain : '192.168.1.239',
	
	profileInfo:{
		lastData : [],
		variableArray : {D:[],OBJ:[],CTX:[]},
		timeArray : {T:[],C:[],S:[],N:[]},
		avg: function(a){
			sum=0;
			for( var i=0; i<a.length; i++ ){
				sum+=a[i];
			}
			return sum/a.length;
		},
		addData : function (a){
			this.lastData = a;
			this.timeArray.T.push(a[0]);
			this.timeArray.C.push(a[1]);
			this.timeArray.S.push(a[2]);
			this.timeArray.N.push(a[3]);
			this.variableArray.D.push(a[4]+a[5]);
			this.variableArray.OBJ.push(a[4]);
			this.variableArray.CTX.push(a[5]);
		},
        getDataArray : function(){
            return{
                T: this.avg(this.timeArray.T).toFixed(2),
                C: this.avg(this.timeArray.C).toFixed(2),
                S: this.avg(this.timeArray.S).toFixed(2),
                N: this.avg(this.timeArray.N).toFixed(2),
                D: this.avg(this.variableArray.D).toFixed(2),
                OBJ: this.avg(this.variableArray.OBJ).toFixed(2),
                CTX: this.avg(this.variableArray.CTX).toFixed(2),
            };
        },
		totalStatistics : function(){
			return 'T:'+this.avg(this.timeArray.T).toFixed(2)+';C:'+this.avg(this.timeArray.C).toFixed(2)+';S:'+this.avg(this.timeArray.S).toFixed(2)+';N:'+this.avg(this.timeArray.N).toFixed(2)+'. D:'+this.avg(this.variableArray.D).toFixed(2)+'; OBJ:'+this.avg(this.variableArray.OBJ).toFixed(2)+'; CTX:'+this.avg(this.variableArray.CTX).toFixed(2);
		}
	},
	state : 'initializing',

	config : function(){ return typeof MIGRATOR_CONFIG == 'object' ? MIGRATOR_CONFIG : {}},
	curUid : 0,
	objects : {},
	objectVisitedFlagName : '__OBJECT_VISITED_FLAG__'+Math.random().toString().substring(2,8),

	isDomNode : function(obj){
		function testAttrs(p){
			var attrs = ['insertBefore', 'replaceChild', 'removeChild', 'appendChild', 'hasChildNodes', 'cloneNode', 'normalize', 'isSupported', 'hasAttributes', 'lookupPrefix', 'isDefaultNamespace', 'lookupNamespaceURI', 'addEventListener', 'removeEventListener', 'isSameNode', 'isEqualNode', 'compareDocumentPosition', 'dispatchEvent', 'ELEMENT_NODE', 'ATTRIBUTE_NODE', 'TEXT_NODE', 'CDATA_SECTION_NODE', 'ENTITY_REFERENCE_NODE', 'ENTITY_NODE', 'PROCESSING_INSTRUCTION_NODE', 'COMMENT_NODE', 'DOCUMENT_NODE', 'DOCUMENT_TYPE_NODE', 'DOCUMENT_FRAGMENT_NODE', 'NOTATION_NODE', 'DOCUMENT_POSITION_DISCONNECTED', 'DOCUMENT_POSITION_PRECEDING', 'DOCUMENT_POSITION_FOLLOWING', 'DOCUMENT_POSITION_CONTAINS', 'DOCUMENT_POSITION_CONTAINED_BY', 'DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC'];
			for( var i=0; i<attrs.length; i++ )
				if( p[attrs[i]] == null )
					return false;
			return true;
		};
		var proto = obj.__proto__;
		while( proto!=null ){
			if( testAttrs(proto) )
				return true;
			else
				proto = proto.__proto__;
		}
		return false;
	},

	isLargeObj : function(obj) {
		var los = ['window','document','dojo','jQuery','JSON'];
		for(var i=0; i<los.length; i++ ){
			if( window[los[i]] != undefined && obj === window[los[i]])
				return true;
		}
		return false;
	},

	hasOnlyUid : function(obj) {
		for (var i in obj) {
			if (!Object.hasOwnProperty.call(obj, i)) 
			if( i!='__uid__') return false;
		}
		return true;
	},

	getObjByUid : function( uid ) {
		if( typeof uid == 'undefined' ){
			console.log('Error in getObjByUid: uid is undefined.');
			return null;
		}
		return this.objects[uid] ? this.objects[uid] : null;
	},

	checkGlobals : function (globalNames){
		function trim(str){	//string.trim
			if( typeof str != 'string' ) return str;
			var ls = /^\s*/; //Leading space regualr expression
			var ts = /\s*$/; //Trailing space regualr expression
			return str.replace(ls,'').replace(ts,'');
		};
		var globalNames = globalNames?globalNames:this.config().globals,tokens=[],curObj;
		if( typeof globalNames != 'undefined' ) {
			for ( var i in globalNames )
				if (Object.hasOwnProperty.call(globalNames, i)){
					if( globalNames[i] == '' ) continue;
					if( typeof globalNames[i] != 'string' ){
						console.log('Error while checkGlobals: config.globals contains non-string member'+globalNames[i]);
						return false;
					}
					// handle nested object
					tokens = trim(globalNames[i]).split('.');
					curObj = '';
					for( var j=0; j<tokens.length; j++ ){
						curObj += curObj==''? tokens[j] : '.'+tokens[j];
						if( eval( 'typeof '+curObj ) == 'undefined' && j!=tokens.length-1 ){
							eval(curObj+'={};');	//build new obj
						}
						// else if curObj is not a object and it is not the tail
						else if( eval( 'typeof '+curObj ) != 'object' && j!=tokens.length-1){
							console.log('Error while checkGlobals: config.globals contains non-string member');
							return false;
						}
					}
				}
		}
		return true;
	},

	getGlobals : function(globalNames){
		var globalNames = globalNames?globalNames:this.config().globals?this.config().globals:[],globals=[];
		this.checkGlobals(globalNames);
		if( typeof globalNames != 'undefined' ) {
			for ( var i in globalNames )
				if (Object.hasOwnProperty.call(globalNames, i))
					globals.push(eval(globalNames[i]));
		}
		return globals;
	},

	getArguments : function(args){
		var argArray = [];
		for( var i=0; i < args.length; i++ )
			argArray.push(args[i]);
		return argArray;
	},


	//get obj uid. if uid not exist, generate a new one.
	getuid: function (obj){
		if( typeof obj != 'object' || obj == null ) return null;
		if( typeof obj.__uid__ != 'undefined' )
			return obj.__uid__;
		else 
			return obj.__uid__ = this.curUid ++;
	},

	fixObjectsUid : function(){
		for ( var i in this.objects )
				if (Object.hasOwnProperty.call(this.objects, i)){
					this.objects[i].__uid__=i;
				}
	},

	gernerateUid : function(){
		return Math.random().toString().substring(2);
	},

//------ serialize & deserialize part-------------

	quote : function quote(string) {
				var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        escapable.lastIndex = 0;
				meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\'' : '\\\'',
            '\\': '\\\\',
        };
        return escapable.test(string) ?
            '\"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '\"' :
            '\"' + string + '\"';
    },
	stringify : function (obj){
		// return json string if not object
		if( typeof obj != 'object'  ) return JSON.stringify(obj);
		if( obj == null ) return 'null';
		// wrapping object 
		var partial = [];
		
		//for Date objects;
		if(obj.__type__ === 'Date'){
			return '{'+this.quote('__type__') + ':' + this.quote(obj.__type__) + ','+ this.quote('value') +':{' + this.quote('time')+':'+ obj.getTime() + '}}';
		}

		for ( var i in obj ) {
			if (i!='deserialize' && Object.hasOwnProperty.call(obj, i)){
				if( typeof obj[i] == 'object' && obj[i] != null  && obj[i] != undefined 
				&& typeof obj[i]!='function' && typeof obj[i]!='undefined' ){
					if( obj[i].__uid__ != null && !this.isDomNode(obj[i]) && !this.isLargeObj(obj[i]) )
						partial.push( this.quote(i)+':{'+this.quote('__uid__')+':'+this.getuid(obj[i])+'}'  );
				}
				else
					partial.push( this.quote(i)+':'+JSON.stringify(obj[i]));
			}
		}
		return (typeof obj.__type__ === 'string') ?
			// class object
			'{'+this.quote('__type__') + ':' + this.quote(obj.__type__) + ','+ this.quote('value') +':{' + partial.join(',') + '}}' :
			// ordinary object
			'{' + partial.join(',') + '}' ;
	},

	parse : function( objStr ) {
		if( typeof objStr != 'string' ){
			console.log('objStr is not string\ntype: '+typeof objStr+'\nJSON: '+JSON.stringify(objStr));
			return null;
		}
		try {
			obj = JSON.parse(objStr);
		} catch(e) {
				try {
					eval( 'obj =('+objStr+');');
				} catch(e){
					console.log('Error in parse : objStr is Invalid JSON String');
					return null;
				}
		}
		if( typeof obj != 'object' )
			return obj;
		// object is in Migrator.objects
		else if(obj.__type__!=null && typeof obj.value=='object' && obj.value.__uid__!=null && this.objects[obj.value.__uid__]!=null ) 
			return this.objects[obj.value.__uid__];
		// obj with __type__, but not in Migrator.objects
		else if(obj.__type__!=null && typeof obj.value=='object' && obj.value.__uid__ == null){
			return this.rebuildObject(obj);	// rebuild class object
		}
		// ordinary object, with no __type__
		else if(obj.__type__==null ){
			for( var i in obj )
				if( typeof obj[i] === 'object' && Object.hasOwnProperty.call(obj, i) && obj[i].__uid__!=null)
					obj[i] = this.objects[obj[i].__uid__];
			return obj;
		}
		else {
			console.log('[error]parse: invalid object attrs');
			return null;
		}

	},

	rebuildObject : function ( obj ) {
		if( typeof obj != 'object' || obj == null ){
			console.log('obj is not object or obj is null: ' + JSON.stringify(obj) );
			return null;
		}
		
		// Date objects
		if(obj.__type__=='Date' && typeof obj.value=='object' && obj.value.time!=null ){
			return new Date(obj.value.time);
		}

		var tempobj,objValue, cons;
		if( typeof obj.__type__ == 'string' && typeof obj.value == 'object'
	//	 && typeof obj.value.__uid__ != 'undefined'
		 ){	//class object
			// if there is a customized constructor, use it to rebuild the object
			if( this.config().constructors && this.config().constructors[obj.__type__] )
				cons = this.config().constructors[obj.__type__];
			else
				cons = this.defaultConstructor;
			objValue = obj.value;
		} else {
			//ordinary object
			tempobj = {};
			objValue = obj;
			cons = this.defaultConstructor;
		}

/*		// parse object iteratively
		for( var i in objValue ) {
			if( typeof objValue[i] === 'object' && Object.hasOwnProperty.call(objValue, i) && objValue[i] != null)
				objValue[i] = this.rebuildObject(objValue[i]);
		}
*/
		if( typeof obj.__type__ != 'string' ){
			return objValue;
		} else {
//			return this.updateSingleObject(cons(objValue, obj.__type__ ),objValue);
			return cons(objValue, obj.__type__ );
		}
	},

	defaultConstructor : function ( value, type ){
		eval( 'var obj = new ' + type +'();' );
		for ( var i in value ) 
			if( Object.hasOwnProperty.call(value, i))
				obj[i] = value[i];
		return obj;
	},

	//update objects from globals, arguments, this
	//assign an uid to object, traversal to remove duplicate objs
	refreshObjects : function (arr) {
//	console.log('in refreshObjects: curUid: '+this.curUid);
		for( var i in arr ) {		//update globals to objects, duplicate objs removed
			if( typeof arr[i] == 'object' && arr[i] != null && Object.hasOwnProperty.call(arr, i)) {
				if( this.isDomNode(arr[i]) || this.isLargeObj(arr[i])) continue;
				if( i== undefined || i=='undefined' ){
					console.log('undefined:'+i+'---'+JSON.stringify(objs[i]));
					continue;
				}
				/*
				if( arr[i].__refreshed__==null ){
					arr[i].__refreshed__ = true;
					if( arr[i].__is_this_flag__ == true )		//handle this object
						this.refreshThisObject( arr[i] );
					else 
						this.refreshObjects( arr[i] );		//update objects iteratively
					delete arr[i].__refreshed__;
				}
				this.objects[this.getuid(arr[i])] = arr[i];
				*/
				if( !arr[i][this.objectVisitedFlagName] ){
					arr[i][this.objectVisitedFlagName] = true;
					if( arr[i] && arr[i].__is_this_flag__ == true )		//handle this object
						this.refreshThisObject( arr[i] );
					else 
						this.refreshObjects( arr[i] );		//update objects iteratively
				}
				this.objects[this.getuid(arr[i])] = arr[i];
			}
		}
	},

	// refresh this object
	// in case of super large this object, refresh it with config
	refreshThisObject : function( obj ) {
		if( typeof obj != 'object' ){
			console.log('Error in refreshThisObject: non-object argument.' + JSON.stringify(obj));
			return;
		}
		if( obj.__is_this_flag__ != true ){
			this.refreshObjects( obj );
			return;
		}
		//looks for config
		var exist = false;
		var CONFIG = this.config(), fName;
		if( obj.__function_name__ == null || !CONFIG.functions){
			this.refreshObjects( obj );
			return;
		}else
			fName = obj.__function_name__;
		// thisAttr index
		for( var ti = 0; ti<CONFIG.functions.length; ti++ )
			if( CONFIG.functions[ti] === fName ){
				exist = true;
				break;
			}
		if( !exist || !CONFIG.thisAttrs || Object.prototype.toString.apply(CONFIG.thisAttrs) != '[object Array]' || !CONFIG.thisAttrs[ti] || Object.prototype.toString.apply(CONFIG.thisAttrs[ti]) != '[object Array]' || CONFIG.thisAttrs[ti].length == 0){
//			console.log('Warning in refreshThisObject: config not found');
			this.refreshObjects( obj );
			return;
		}

		// attrs need to be serialized 
		var attr = CONFIG.thisAttrs[ti];
		for( var i=0; i<attr.length; i++ ){
			if( typeof obj[attr[i]] == 'object' && obj[attr[i]] != null &&
				Object.hasOwnProperty.call(obj, attr[i]) ){
				if( this.isDomNode(obj[attr[i]]) || this.isLargeObj(obj[attr[i]])) continue;
				if( attr[i]== undefined || attr[i]=='undefined' ){
					console.log('undefined:'+attr[i]+'---'+JSON.stringify(obj[attr[i]]));
					continue;
				}
				if( !obj[attr[i]][this.objectVisitedFlagName] ){
					obj[attr[i]][this.objectVisitedFlagName]= true;
					this.refreshObjects( obj[attr[i]] );		//update objects iteratively
				}
				this.objects[this.getuid(obj[attr[i]])] = obj[attr[i]];
			}
		}
	},

	deleteVisitedFlag : function () {
		var objs = this.objects;
		for(var i in objs){
			if(!Object.hasOwnProperty.call(objs, i)) continue;
			if( objs[i][this.objectVisitedFlagName] )
				delete objs[i][this.objectVisitedFlagName] ;
		}
	},

	serializeObjects : function (globals,args,ths) {
		var arr = globals.concat(args);
        if(ths)
            ths.__is_this_flag__ = true;
		arr.push(ths);
		this.fixObjectsUid();
		this.refreshObjects(arr);
		this.deleteVisitedFlag();
		if( ths && ths.__is_this_flag__ != null )
			delete ths.__is_this_flag__;
		return this.serializeObjectsBasic();
	},

	serializeObjectsBasic : function(){
		var objs = this.objects, partial = [];
		for ( var i in objs ) {
			if( i== undefined || i=='undefined'){
				console.log('undefined:'+i+'---'+objs[i]); continue;
			}
			if( Object.hasOwnProperty.call(objs, i) && typeof objs[i]!='function' &&
				 typeof objs[i]!='undefined' && objs[i]!=null && objs[i]!=undefined &&    
				 !this.isDomNode(objs[i]) && !this.isLargeObj(objs[i]) )
				partial.push(this.quote(i)+':'+this.stringify(objs[i]));
		}
		return '{'+partial.join(',')+'}';
	},

	deserializeObjects : function (objStr) {
		var obj;
		if( typeof objStr === 'string' ) {
			try {
				obj = JSON.parse(objStr);
			} catch(e) {
				try {
					eval( 'obj =('+objStr+');');
				} catch(e){
					console.log('Error in deserializeObjects : Invalid JSON String\n'+e+'\n');
					return null;
				}
			}
		}
		else if ( typeof objStr === 'object' ) {
			obj = objStr;
		}else {
			console.log('objStr is neither JSON string nor object');
		}
		if( typeof obj != 'object' || obj == null ) return null;
		for ( var i in obj ) {
			if( !Object.hasOwnProperty.call(obj, i)) continue;
			if( typeof obj[i] != 'object' || obj[i]==null ) continue;
			// ordinary object
			if( obj[i].__type__==null && obj[i].value == null && obj[i].__uid__ != null) {
				for( var j in obj[i] ) {
					if(	Object.hasOwnProperty.call(obj[i], j) && obj[i][j]!=null && typeof obj[i][j] === 'object' && typeof obj[i][j].__uid__ != 'undefined' && typeof obj[obj[i][j].__uid__] != 'undefined') {
				//		obj[i][j] = this.rebuildObject(obj[obj[i][j].__uid__]);
							obj[i][j] = obj[obj[i][j].__uid__];
					}
				}
			//	obj[i] = this.rebuildObject(obj[i]);
			} 
			// class object
			else if ( obj[i].__type__!=null && obj[i].value != null && obj[i].__uid__ == null) {
				for( var j in obj[i].value ) {
					if( Object.hasOwnProperty.call(obj[i].value, j) && obj[i]['value'][j]!=null && typeof obj[i]['value'][j] === 'object' && typeof obj[i]['value'][j].__uid__ != 'undefined' ) {
//						obj[i]['value'][j] = this.rebuildObject(obj[obj[i]['value'][j].__uid__]);
						obj[i]['value'][j] = obj[obj[i]['value'][j].__uid__];
					}
				}
				obj[i] = this.rebuildObject(obj[i]);
			}
			else {console.log('Error: invalid obj while deserializing objects');}
		}
		return obj;
	},

	// update this.objects without replacing it
	updateObjects: function(obj){
		for( var i in obj ) {
			if( !Object.hasOwnProperty.call(obj, i)) continue;
			if( this.objects[i] == null )
				this.objects[i] = obj[i];
			else
				this.updateSingleObject( this.objects[i], obj[i] );
		}

	},

	updateSingleObject : function( tobj, sobj ) {
		for( var i in sobj ) {
			if( !Object.hasOwnProperty.call(sobj, i) || typeof sobj[i] === 'undefined') continue;
			// if target obj has no this attr, or it is not a object, just replace it
			if( typeof tobj[i] === 'undefined' || typeof tobj[i] != 'object')
				tobj[i] = sobj[i];
			else {	//else recursively handle it
				if( !this.isDomNode(sobj[i]) && !this.isLargeObj(sobj[i]) )
					this.updateSingleObject( tobj[i], sobj[i] );
			}
		}
		return tobj;
	},

	getFunctionThisObject : function(funcName){ //for server use
		var nms = funcName.split('.');
		var obj = window;
		for( var i=0; i<nms.length-1; i++ ){
			obj[nms[i]] = obj[nms[i]] || {};
            obj = obj[nms[i]];
        }
	    return obj;
	},

	getObjectByName : function(nm){
		var nms = nm.split('.');
		var obj = window;
		for( var i=0; i<nms.length-1&&typeof obj =='object'; i++ )
			obj = obj[nms[i]];
		if( typeof obj == 'object' )
			return obj;
		else
			return {};
	},

	serializeContext : function ( globalNames, args,ths ) {
		var globals={};
		var thsStr = ths && typeof ths.__uid__ != 'undefined' ? '{'+this.quote('__uid__')+':'+ths.__uid__+'}' : 'null';
		for ( var i=0; i < globalNames.length; i++ ){
			var nms = globalNames[i].split('.');
			var o = this.getObjectByName(globalNames[i]);
			globals[globalNames[i]] = o[nms[nms.length-1]];
		}
		return '{'+this.quote('globals')+':'+this.stringify(globals)+','+this.quote('args')+':'+this.stringify(args)+','+this.quote('ths')+':'+thsStr+'}';
	},

	deserializeContext : function ( ctxstr ) {
		var obj,i;
		if( typeof ctxstr === 'string'){
			try {
				eval( 'obj =('+ctxstr+');');
			} catch(e) {
				try {
					obj = JSON.parse(ctxstr);
				} catch(e){
					console.log('Error in deserializeContext: Invalid JSON String.\n'+e+'\n');
					return null;
				}
			}
		}
		else if ( typeof ctxstr === 'object' ) {
			obj = ctxstr;
		}else {
			console.log('ctxstr is neither JSON string nor object.\n'+ctxstr);
		}
		
		if( typeof obj != 'object'  || obj == null || obj.globals==null || obj.args==null || typeof obj.globals!='object' || typeof obj.args!='object' ||typeof obj.ths!='object'){
			console.log( 'Error: invalid context string while in deserializeContext.\n'+JSON.stringify(obj) );
			return null;
		}
		this.checkGlobals();
		for( i in obj.globals ) {
			if( !Object.hasOwnProperty.call(obj.globals, i)) continue;
			var nms = i.split('.');
			var o = this.getObjectByName(i);
			if( obj.globals[i] == null ){
				o[nms[nms.length-1]]=null;
				continue;
			}
			if( typeof obj.globals[i] != 'object' ){
				o[nms[nms.length-1]]=obj.globals[i];
				continue;
			}
			if( obj.globals[i].__uid__ != null && typeof this.objects[obj.globals[i].__uid__] == 'object' ){
                //copy target object's UNIQUE property to source object
                var to = o[nms[nms.length-1]], so = this.objects[obj.globals[i].__uid__];
                for( j in to){
			        if( !Object.hasOwnProperty.call(to, j) || typeof to[j] === 'undefined' || typeof so[j] !== 'undefined') continue;
                    so[j] = to[j];
                }
				o[nms[nms.length-1]] = this.objects[obj.globals[i].__uid__];
				continue;
			}
		}
		var temparr = [];
		if((typeof obj.args == 'object' && obj.args.__type__=='Array')|| Object.prototype.toString.apply(obj.args) === '[object Array]'){
	//		obj.args = this.rebuildObject(obj.args);
			obj.args = obj.args.value;
			for( i in obj.args ) {
				if( !Object.hasOwnProperty.call(obj.args, i) ) continue;
				if( typeof obj.args[i] == 'object' && obj.args[i].__uid__ != null &&
					 typeof this.objects[obj.args[i].__uid__] == 'object' ){
					obj.args[i]=this.objects[obj.args[i].__uid__];
				}
				temparr.push(obj.args[i]);
			}
		}
		obj.args = temparr;

		if( obj.ths && typeof obj.ths == 'object' && obj.ths.__uid__ != null &&
			 typeof this.objects[obj.ths.__uid__] == 'object' ){
			obj.ths=this.objects[obj.ths.__uid__];
		}
		return obj;
/////////////////////////
// still need to reflect the upper arguments and this pointer
////////////////////////////		

	},


//--migration part-------------
	getFunctionName : function getFunctionName(func){
		if (func.__name__ == null ){
			var fstr = func.toString();
			func.__name__ = /function\s+([^\s\(]+)/i.test(fstr) ? RegExp.$1 : '__Anonymous_'+Math.random().toString().substring(2)+'__';
		}
		return func.__name__;
	},

	// Migrate function to server
	migrateToServer : function migrateToServer(func){

		if( typeof func != 'function' ) {
			console.log('func is not a function: '+JSON.stringify(func));
			return null;
		}
		
		//server_flag used to avoid move to server duplicated
		//if func has moved to server, just return
		if(func.__server_flag__) return func;

		//send function definition to server
		var functionString = func.toString();
		var funcName = this.getFunctionName(func);

		var params ={
			session : Migrator.sessionID,
			code: 'Migrator.getFunctionThisObject("'+funcName+'");'+funcName+' = '+functionString+';'
		};
		$.ajax({
			url: 'http://'+Migrator.domain+'/migrator/interp.php',   //proxy page
			type: 'post',      //POST method
            async: false,      //ajax sync
            data: params,
			success: function(msg) {
            //console.log('definition of function '+funcName+' moved to server.');
            }
		});

		// return stub function
		var stubFunction = function(){
			var start = new Date().getTime();
			
            var ajaxval = null, _this = this, _arguments = arguments, _originalFunction = arguments.callee.originalFunction;
            if(INTERP_SERVER_ERROR){
                var result = _originalFunction.apply(_this,_arguments);
                return result;
            }

			var thisT = this==window||this==document ? null : this;
			if(thisT)
                thisT.__function_name__ = funcName;
			//serialize objects graph
			var objsStr = Migrator.serializeObjects(Migrator.getGlobals(),Migrator.getArguments(arguments),thisT);
			//serialize context variables
			var globalNames = Migrator.config().globals ? Migrator.config().globals : [];
			var ctxStr = Migrator.serializeContext(globalNames, Migrator.getArguments(arguments), thisT );

			var middle1 = new Date().getTime();

            // send ajax request
			$.ajax({
				url: 'http://'+Migrator.domain+'/migrator/interp.php',   //proxy page
				type: 'post',      //POST method
				async: false,      //ajax sync
				data: {
                    session : Migrator.sessionID,
                    code:JSON.stringify([objsStr,ctxStr,funcName,Migrator.curUid])
                },
				success: function(msg) {
					var middle2 = new Date().getTime();
					var end, serverRunTime, during, networkTime, migratorTime, objLength, ctxLength;
					objLength = objsStr.length;
					ctxLength = ctxStr.length;
					//msg is a array in format like [objects,context,result]
					var info = eval(msg);
					if(Object.prototype.toString.apply(info)=='[object Array]' && info.length>3){
						Migrator.curUid = info[3];
						Migrator.updateObjects(Migrator.deserializeObjects(info[0]));
						Migrator.deserializeContext(info[1]);
						objLength = (objLength + info[0].length)/2;
						ctxLength = (ctxLength + info[1].length)/2;
						if( info[2] == null ){
							ajaxval = null;
						}
						else {
							ajaxval = Migrator.parse(info[2]);
						}
                        end = new Date().getTime();
                        serverRunTime = serverRunTime ? serverRunTime : 0;
                        during = end - start;
                        networkTime = (middle2-middle1)-serverRunTime;
                        migratorTime = (T1=end-middle2)+(T2=middle1-start);
                        Migrator.profileInfo.addData([during,migratorTime,serverRunTime,networkTime,objLength,ctxLength]);
					}
					else{
                        console.log(funcName+': Remote excution failed.');
                        INTERP_SERVER_ERROR = true;
                        ajaxval = _originalFunction.apply(_this,_arguments);
					}
				},	//success callback function end
                error: function(){   // if ajax request failed.
                    console.log(funcName+' error: Remote excution failed.');
                    INTERP_SERVER_ERROR = true;
                    ajaxval = _originalFunction.apply(_this,_arguments);
                }
			});	//$.ajax end
			return ajaxval;
		};	// stubFunction ends
		stubFunction.__name__ = funcName;
        stubFunction.originalFunction = func; //backup originalFunction
		stubFunction.__server_flag__ = true;	//set server_flag
		return stubFunction;
	},	// migrateToServer end.

	serverLoadUrls : function serverLoadUrls(urls){
		if( urls.length>0 ) {

			$.ajax({
					url: 'http://'+Migrator.domain+'/migrator/interp.php',   //接收页面
					type: 'post',      //POST方式发送数据
					async: true,      //ajax同步
					data: {
						session : this.sessionID,
						url: urls
					},
					success: function(msg) {
                        //console.log('ajax load urls finished.');
                    }
				});
		}
	},

	loadConfig : function loadConfig(){
		//if top frame's config is NO_MIGRATION
		if( typeof window != 'undefined' && typeof window.top != window && typeof window.top.MIGRATION_FLAG != 'undefined' && window.top.MIGRATION_FLAG != true){
			window.__MIGRATOR__STATE__ = 'ready';
			return ;
		}
//		console.log(  'window.top.MIGRATION_FLAG: '+window.top.MIGRATION_FLAG );
		if(typeof MIGRATOR_CONFIG != 'undefined'){
			if(Object.prototype.toString.apply(MIGRATOR_CONFIG.urls) === '[object Array]'){
				//server load config
				Migrator.serverLoadUrls(MIGRATOR_CONFIG.urls);
			}
			if(Object.prototype.toString.apply(MIGRATOR_CONFIG.functions) === '[object Array]'){
				var fs = MIGRATOR_CONFIG.functions;
				for( var i=0; i<fs.length; i++) {
					if ( fs[i] != '' && eval( 'typeof '+fs[i] ) == 'function'){
						eval( fs[i]+'.__name__='+Migrator.quote(fs[i]));
						eval('('+fs[i]+'=Migrator.migrateToServer('+fs[i]+'));');
					}
				}
			}
		}
		window.__MIGRATOR__STATE__ = 'ready';
		INTERP_SERVER_ERROR = false;
	}

};

//==============================
