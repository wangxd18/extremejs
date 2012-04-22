dijit={_Widget:null, _Templated:null};
dojo = {
	provide : function(){},
	require : function(){},
	moduleUrl : function(){return null},
	declare : function(className,superclass,props){
		function trim(str){	//string.trim
			if( typeof str != 'string' ) return str;
			var ls = /^\s*/; //Leading space regualr expression
			var ts = /\s*$/; //Trailing space regualr expression
			return str.replace(ls,'').replace(ts,'');
		}

		// crack parameters
		if(typeof className != "string"){
			props = superclass;
			superclass = className;
			className = "";
		}
		props = props || {};

		var tokens = trim(className).split('.');
		var curObj = '',i;
		// build obj chains
		for(i=0;i<tokens.length;i++){
			if( tokens[i] == '' ) break;
			curObj += curObj==''? tokens[i] : '.'+tokens[i];
			if( eval( 'typeof '+curObj ) == 'undefined' ){
				eval(curObj+'={};');	//build new obj
				continue;
			}
			else if( eval( 'typeof '+curObj )!= 'object' && i!=tokens.length-1 ){
				console.log('Error in dojo.declare: '+curObj+' is non-obj attr');
			}
		}
		var ctor = new Function, proto = props;
		for( i in proto ){
			if( !Object.hasOwnProperty.call(proto, i) ) continue;
			ctor.prototype[i] = proto[i];
		}
		ctor.prototype.__type__ = className;
		if(className != '')
			eval( className + '= ctor;' );
		return ctor;
	},
};
imashup={core:{componentTypeManager:{registerComponentType:function(){}}}};
