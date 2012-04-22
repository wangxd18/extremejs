	var Profile = function (){
		this.testData = {};
		this.dataArray = {T:[],C:[],S:[],N:[],D:[],OBJ:[],CTX:[]};
		this.curUid = 0;
		this.avg = function(a){
			sum=0;
			for( var i=0; i<a.length; i++ ){
				sum+=a[i];
			}
			return sum/a.length;
		};

        this.removeAllData = function(){
            this.testData = {};
            this.dataArray = {T:[],C:[],S:[],N:[],D:[],OBJ:[],CTX:[]};
            this.curUid = 0;
        }
		
		this.getuid = function(){
			return this.curUid++;
		};
		
		this.addTestData = function (testname,timeArray,variableArray){
			if(this.testData[testname] == null ){
				this.testData[testname] = {
					uid : this.getuid(),
					T : this.avg(timeArray.T),
					C : this.avg(timeArray.C),
					S : this.avg(timeArray.S),
					N : this.avg(timeArray.N),
					D : this.avg(variableArray.D),
					OBJ : this.avg(variableArray.OBJ),
					CTX : this.avg(variableArray.CTX),
					times : 1,
				};
			}
			else{
				this.testData[testname].T = (this.avg(timeArray.T)+this.testData[testname].times*this.testData[testname].T)/(this.testData[testname].times+1);
				this.testData[testname].C = (this.avg(timeArray.C)+this.testData[testname].times*this.testData[testname].C)/(this.testData[testname].times+1);
				this.testData[testname].S = (this.avg(timeArray.S)+this.testData[testname].times*this.testData[testname].S)/(this.testData[testname].times+1);
				this.testData[testname].N = (this.avg(timeArray.N)+this.testData[testname].times*this.testData[testname].N)/(this.testData[testname].times+1);
				this.testData[testname].D = (this.avg(variableArray.D)+this.testData[testname].times*this.testData[testname].D)/(this.testData[testname].times+1);
				this.testData[testname].OBJ = (this.avg(variableArray.OBJ)+this.testData[testname].times*this.testData[testname].OBJ)/(this.testData[testname].times+1);
				this.testData[testname].CTX = (this.avg(variableArray.CTX)+this.testData[testname].times*this.testData[testname].CTX)/(this.testData[testname].times+1);
				this.testData[testname].times ++;
			}
		};
		
        //filter function(testname,testdata[testname])
		this.generateDataArray = function (filter){
            this.dataArray = {T:[],C:[],S:[],N:[],D:[],OBJ:[],CTX:[]};
			var o = this.testData;
			for( var i in o ){
				if (!Object.hasOwnProperty.call(o, i)) continue;
                if ( filter && !filter(i,o[i])) continue;      //filter
				this.dataArray.T.push(o[i].T);
				this.dataArray.C.push(o[i].C);
				this.dataArray.S.push(o[i].S);
				this.dataArray.N.push(o[i].N);
				this.dataArray.D.push(o[i].D);
				this.dataArray.OBJ.push(o[i].OBJ);
				this.dataArray.CTX.push(o[i].CTX);
			}
		};
		
        this.getDataArray = function(filter){
            this.generateDataArray(filter);
            return{
                T: this.avg(this.dataArray.T).toFixed(2),
                C: this.avg(this.dataArray.C).toFixed(2),
                S: this.avg(this.dataArray.S).toFixed(2),
                N: this.avg(this.dataArray.N).toFixed(2),
                D: this.avg(this.dataArray.D).toFixed(2),
                OBJ: this.avg(this.dataArray.OBJ).toFixed(2),
                CTX: this.avg(this.dataArray.CTX).toFixed(2),
            };
        };

		this.detailStatistics = function(html){
			var str="";
			var html = typeof html=='undefined'?true:html;
			var o = this.testData;
			for( var i in o ){
				if (!Object.hasOwnProperty.call(o, i)) continue;
				str += '['+ i +'] ';
				str +='T:'+o[i].T.toFixed(2)+';';
				str +='C:'+o[i].C.toFixed(2)+';';
				str +='S:'+o[i].S.toFixed(2)+';';
				str +='N:'+o[i].N.toFixed(2)+';';
				str +='D:'+o[i].D.toFixed(2)+'.';
				str +='OBJ:'+o[i].OBJ.toFixed(2)+'.';
				str +='CTX:'+o[i].CTX.toFixed(2)+'.';
				str +=' '+o[i].times+'times.'
				str += html?'<br/>':'\n';
			}
			return str;
		};
		
		this.totalStatistics = function(){
			this.generateDataArray();
			return 'T:'+this.avg(this.dataArray.T).toFixed(2)+';C:'+this.avg(this.dataArray.C).toFixed(2)+';S:'+this.avg(this.dataArray.S).toFixed(2)+';N:'+this.avg(this.dataArray.N).toFixed(2)+'. D:'+this.avg(this.dataArray.D).toFixed(2)+'; OBJ:'+this.avg(this.dataArray.OBJ).toFixed(2)+'; CTX:'+this.avg(this.dataArray.CTX).toFixed(2);
		};
        
        //filter function(testname,testdata[testname])
        this.filterStatistics = function(filter){
			this.generateDataArray(filter);
			return 'T:'+this.avg(this.dataArray.T).toFixed(2)+';C:'+this.avg(this.dataArray.C).toFixed(2)+';S:'+this.avg(this.dataArray.S).toFixed(2)+';N:'+this.avg(this.dataArray.N).toFixed(2)+'. D:'+this.avg(this.dataArray.D).toFixed(2)+'; OBJ:'+this.avg(this.dataArray.OBJ).toFixed(2)+'; CTX:'+this.avg(this.dataArray.CTX).toFixed(2);
        }

	};



