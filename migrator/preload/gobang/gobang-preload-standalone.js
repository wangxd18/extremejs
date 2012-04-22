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
dojo.declare(
    "Gobang",
    [],
    {
		
		inputnode: null,
		outputnode:null,
		regretnode:null,regretnum:0,
		helpnode:null,helpnum:0,
		debuginfo:null,
		row:15,col:15,Win:3,posScore:0.8,
		TopScore:19999.0,
		steps:null,stepn:0,
		playable:false,
		piece:[" ","O","X","W"],
		gBoard:new Array(),
		nowPiece:0,
		Level:1,
		lr:7,rr:7,lc:7,rc:7,searchnode:0,
		dx:[1, 1,1,0, 0,-1,-1,-1],
		dy:[1,-1,0,1,-1, 0, 1,-1],
		scoreTable:[0.0,1.0,10.0,51.0,256,200000.0],
		
		init:function(n){
			var i,j;
			var num,s;
		//	alert("start init row:"+this.row+" col:"+this.col);
			this.playable=true;
			this.Level=n;
			this.nowPiece=1;
			this.gBoard = new Array(this.row);
			this.regretnum=3;
			this.regretnode.innerHTML="Regret("+this.regretnum+")";
			this.helpnum=3;
			this.helpnode.innerHTML="Help("+this.helpnum+")";
			//alert("Init Step1");
			for (i=0;i<this.row;i++){
				this.gBoard[i] = new Array(this.col);
				for (j=0;j<this.col;j++)
				 this.gBoard[i][j]=0;
			}
			for (num = 0; num < this.row * this.col; num++) {
				s="s";
				for (i = 100; num < i; i = Math.floor(i / 10)) 
					s = s + "0";
				if (num != 0) 
					s = s + num;
				//alert("Num="+num+" ID="+s);
				document.getElementById(s).innerHTML =" ";
			}
			this.stepn=0;
			this.steps=new Array(this.row*this.col);
	//		document.getElementById("outputInfo").innerHTML=" Your turn!";
			
			//alert("InitOk!");
		},
/*		constructor:function(){
			init(1);
		},*/
		checkWin:function(board){
			var i,j,k,l;
			var row,col;
			var dx,dy;
			var judge=false;
			row=this.row; col=this.col; dx=this.dx; dy=this.dy;
			for (i=0;i<row&&!judge;i++)
				for (j=0;j<col&&!judge;j++)
				if (board[i][j])
				for (k=0;k<8&&!judge;k++)
					if (4*dx[k]+i<row&&4*dx[k]+i>=0&&4*dy[k]+j<col&&4*dy[k]+j>=0){
						judge=true;
						for (l=0;l<5&&judge;l++)	
							if (board[l*dx[k]+i][l*dy[k]+j]!=board[i][j]) judge=false;
						if (judge){
							if (board[i][j]==this.nowPiece) alert("You Win!");
							else alert("You Lose!");
							//this.playable=false;
							return judge;
						}
					}
			return judge;
		},
		scoreLine:function(line,nowp,len){
			var i,j,cn,c0,ct,reval;
		//	document.getElementById("s002").innerHTML="K";
			reval=0;
			for (i=0;i<=len-4;i++){
				cn=0; c0=0;ct=0;
				for (j=0;j<5;j++)
					if (line[j+i]==nowp) cn++;
					else if (line[j+i]==0) c0++;
					else ct++;
				if (ct == 0) {
					if (cn == 4 && i < len - 4 && line[i] == 0 && line[i + 5] == 0) {
						reval+=this.scoreTable[4]*10;
//						this.debuginfo.innerHTML="Get double 4";
					}else	reval += this.scoreTable[cn];
					if (cn==5) return this.TopScore;
				}
			}
			return reval;
		},
		scoreBoard:function(board,nowp,x,y){
			var k,l,reval,low,up,line;
			var ddx=[0,1,1,1];
			var ddy=[1,0,1,-1];
			var row,col;
			row=this.row; col=this.col;
			reval=0;
			line=new Array(20);
			for (k=0;k<4;k++){
				low = -4; if (x+low*ddx[k]<0) low=-1*x; if (y+low*ddy[k]<0) low=-1*y;
				up = 4; if (x+up*ddx[k]>row-1) up =row-1-x; if (y+up*ddy[k]>col-1) up=col-1-y;
				if (k==3){
					if (y+low*ddy[k]>col-1) low = y+1-col;
					if (y+up*ddy[k]<0) up = y;
				}
				for (l = 0; l <= up - low; l++) {
					//if ((l + low) * ddx[k] + x<0||(l + low) * ddx[k] + x>=row||(l + low) * ddy[k] + y<0||(l + low) * ddy[k] + y>=col)
					//alert("X:"+x+" Y:"+y+" ERROR L:"+l+" X:"+((l + low) * ddx[k] + x)+" Y:"+((l + low) * ddy[k] + y));
					line[l] = board[(l + low) * ddx[k] + x][(l + low) * ddy[k] + y];
					
				}
				reval+=this.scoreLine(line,nowp,up-low);
				if (reval>=this.TopScore) return this.TopScore;
			}
			return reval;
			
		},
		cal:function(board,level,nowp){
			var reType={x:0,y:0,val:0},type={x:0,y:0,val:0};
			var first=true;
			var val,i,j;
			var lr,rr,lc,rc,row,col,posScore;
			var boardScore;
			lr=this.lr;rr=this.rr; lc=this.lc;rc=this.rc;row=this.row;col=this.col;posScore=this.posScore;
			for (i = lr; i <= rr; i++) {
				for (j = lc; j <= rc; j++) 
					if (board[i][j] == 0) {
						val = ((row - i) * (i + 1) + (col - j) * (j + 1)) * posScore;
						board[i][j] = nowp;
						val+= this.scoreBoard(board, nowp, i, j);
						if (val>this.TopScore){
							reType = {x:i,y:j,val:this.TopScore};
							board[i][j]=0;
							return reType;
						}
						val -= this.scoreBoard(board, nowp%2 + 1, i, j);
						if (level > 0) {
							type = this.cal(board, level - 1, nowp % 2 + 1);
						}
						else {
							type = {
								x: 0,
								y: 0,
								val: 0
							};
							this.searchnode++;
						}
						if (type.val>this.scoreTable[4]*10) val=val/4;
						val = val - type.val;
						if (first || (val > reType.val)) {
							first = false;
							reType.x = i;
							reType.y = j;
							reType.val = val;
						}
						board[i][j] = 0;
					}
			}
			return reType;
		},
		updateRange:function(x,y){
			if (x-4<this.lr) this.lr=x-4;
			if (x+4>this.rr) this.rr=x+4;
			if (y-4<this.lc) this.lc=y-4;
			if (y+4>this.rc) this.rc=y+4;
			if (this.lr<0) this.lr=0;
			if (this.rr>this.row-1) this.rr=this.row-1;
			if (this.lc<0) this.lc=0;
			if (this.rc>this.col-1) this.rc=this.col-1;
		},
		fill:function(board,level,nowp){
			var i,j,ans;
			var num;
			var s;
			num=0;
			this.searchnode=0;
			for (i=0;i<this.row;i++)
				for (j=0;j<this.col;j++)
					if (board[i][j]!=0){
						num++;
					}
	
			var start = new Date().getTime();
			ans = this.cal(board,level,nowp);
			var timeConsume = new Date().getTime() - start;
			if( typeof window.profileInfo != 'undefined'){
				window.profileInfo.addTestData('Gobang',{T:[timeConsume],C:[timeConsume],S:[0],N:[0]},{D:[0],OBJ:[0],CTX:[0]});
			}
			if(!cn_display){
				this.debuginfo.innerHTML=' T:'+timeConsume;
			}

			this.steps[this.stepn] = ans.x*this.col+ans.y;
			this.stepn=this.stepn+1;
			this.outputnode.innerHTML="Step "+this.stepn+" Computer put "+ans.x+" "+ans.y+" Your turn!";
			board[ans.x][ans.y]=nowp;
			num = ans.x*this.col+ans.y;
			this.updateRange(ans.x,ans.y);
			s="s";
			for (i=100;num<i;i=Math.floor(i/10))
				s=s+"0";
			if (num!=0)	s=s+num;
			if( cn_display === false ){ //如为中文，则不显示此信息
				this.debuginfo.innerHTML="Searched "+this.searchnode+this.debuginfo.innerHTML;
			}
            var classTag = (nowp%2==0) ? 'white' : 'black';
			$('#'+s).addClass(classTag);
			this.checkWin(board);
		},
		
		nextStep:function(evt){
			this.debuginfo.innerHTML="";
			if (this.playable) {
				var sId, s;
				if( evt.target != null ){
					sId = evt.target;
					s = sId.id.substring(1, 4);
				}else{	//evt is td's id
					s = evt.substring(1, 4);
					sId = document.getElementById(evt);
				}
				var x, y;
				x = Math.floor(s / 15);
				y = (s/1) % 15;
				if (this.gBoard[x][y] == 0) {
					this.updateRange(x, y);
					
					s = this.piece;
					this.steps[this.stepn] = x*this.col+y;
					this.stepn=this.stepn+1;
					this.gBoard[x][y] = this.nowPiece;
                    var classTag = (this.nowPiece%2==0) ? 'white' : 'black';
                    $(sId).addClass(classTag);
					if (this.checkWin(this.gBoard) == false) {
						this.fill(this.gBoard, this.Level, this.nowPiece%2+1);
					}
				}
				else {
					alert(" x:" + x + " y:" + y + " has a piece..");
				}
			}
		},
		postCreate: function(){
			var list = this.id.split('_');
		},
		
		onInit: function(){
			if (this.inputnode.value && this.inputnode.value != "") {
				this.init(this.inputnode.value/1);
				this.outputnode.innerHTML="Start a new Game! Your turn!";
			}
		},		
		onRegret:function(){
			var x1,y1,x2,y2,i,s,num1,num2;
			if (this.playable&&this.stepn>0&&this.regretnum>0){
				this.regretnum--;
				this.regretnode.innerHTML="Regret("+this.regretnum+")";
				this.stepn--;
				x1 = Math.floor(this.steps[this.stepn]/this.col);
				y1 = this.steps[this.stepn]%this.col;
				s="s";
				for (i=100;this.steps[this.stepn]<i;i=Math.floor(i/10))
				s=s+"0";
				if (this.steps[this.stepn]!=0)	s=s+this.steps[this.stepn];
				document.getElementById(s).innerHTML="";
				this.stepn--;
				x2 = Math.floor(this.steps[this.stepn]/this.col);
				y2 = this.steps[this.stepn]%this.col;
				s="s";
				for (i=100;this.steps[this.stepn]<i;i=Math.floor(i/10))
				s=s+"0";
				if (this.steps[this.stepn]!=0)	s=s+this.steps[this.stepn];
				document.getElementById(s).innerHTML="";
				this.gBoard[x1][y1]=0;
				this.gBoard[x2][y2]=0;
				this.outputnode.innerHTML = "Regret successed, Your turn!";				
			}else{
				this.outputnode.innerHTML = "Regret failed, Your turn!";
			}
		},
		oninput: function(){
			
		},
		onHelp:function(){
			
			if (this.playable&&this.helpnum>0) {
				this.helpnum = this.helpnum - 1;
				this.helpnode.innerHTML = "Help(" + this.helpnum + ")";
				this.fill(this.gBoard, this.Level, this.nowPiece % 2);
				this.fill(this.gBoard, this.Level, this.nowPiece%2 + 1);
			}
		},
		onSwitch:function(){
			if (this.playable) {
				this.nowPiece = this.nowPiece % 2 + 1;
				this.fill(this.gBoard, this.Level, this.nowPiece % 2 + 1);
			}
		}
	}

);
