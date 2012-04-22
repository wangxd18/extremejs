
var inputnode,
    outputnode,
    regretnode,
    regretnum =0,
    helpnode,
    helpnum = 0,
    debuginfo;

var row = 15,
    col = 15,
    Win = 3,
    posScore = 0.8,
    TopScore = 19999.0,
    steps,
    stepn = 0,
    playable = false,
    piece = [" ","O","X","W"],
    nowPiece = 0,
    Level = 1,
    lr = 7,
    rr = 7,
    lc = 7,
    rc = 7,
    searchnode = 0,
    dx = [1, 1,1,0, 0,-1,-1,-1],
    dy = [1,-1,0,1,-1, 0, 1,-1],
    scoreTable = [0.0,1.0,10.0,51.0,256,200000.0];

function init(level){
    var i,j;
    var num,s;
    playable=true;
    Level=level;
    nowPiece=1;
    this.gBoard = new Array(row);
    regretnum=3;
    regretnode.innerHTML="Regret("+regretnum+")";
    helpnum=3;
    helpnode.innerHTML="Help("+helpnum+")";
    //alert("Init Step1");
    for (i=0;i<row;i++){
        this.gBoard[i] = new Array(col);
        for (j=0;j<col;j++)
         this.gBoard[i][j]=0;
    }
    for (num = 0; num < row * col; num++) {
        s="s";
        for (i = 100; num < i; i = Math.floor(i / 10)) 
            s = s + "0";
        if (num != 0) 
            s = s + num;
        $('#'+s).removeClass('white').removeClass('black');
    }
    stepn=0;
    steps=new Array(row*col);
    if( typeof window.profileInfo !== 'undefined'){
        window.profileInfo.removeAllData();
    }
}

function checkWin(){
    var i,j,k,l;
    var judge=false;

    for (i=0;i<row&&!judge;i++)
        for (j=0;j<col&&!judge;j++)
        if (this.gBoard[i][j])
        for (k=0;k<8&&!judge;k++)
            if (4*dx[k]+i<row&&4*dx[k]+i>=0&&4*dy[k]+j<col&&4*dy[k]+j>=0){
                judge=true;
                for (l=0;l<5&&judge;l++)	
                    if (this.gBoard[l*dx[k]+i][l*dy[k]+j]!=this.gBoard[i][j]) judge=false;
                if (judge){
                    if (this.gBoard[i][j]==nowPiece){
                        outputnode.innerHTML="You Win!";
                        alert("You Win!");
                    }
                    else{
                        outputnode.innerHTML="You Lose!";
                        alert("You Lose!");
                    }
                    //playable=false;
                    return judge;
                }
            }
    return judge;
}

function scoreLine(line,nowp,len){
    var i,j,cn,c0,ct,reval;
    reval=0;
    for (i=0;i<=len-4;i++){
        cn=0; c0=0;ct=0;
        for (j=0;j<5;j++)
            if (line[j+i]==nowp) cn++;
            else if (line[j+i]==0) c0++;
            else ct++;
        if (ct == 0) {
            if (cn == 4 && i < len - 4 && line[i] == 0 && line[i + 5] == 0) {
                reval+=scoreTable[4]*10;
            }else	reval += scoreTable[cn];
            if (cn==5) return TopScore;
        }
    }
    return reval;
}

function scoreBoard(nowp,x,y){
    var k,l,reval,low,up,line;
    var ddx=[0,1,1,1];
    var ddy=[1,0,1,-1];
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
            line[l] = this.gBoard[(l + low) * ddx[k] + x][(l + low) * ddy[k] + y];
        }
        reval+=this.scoreLine(line,nowp,up-low);
        if (reval>=TopScore) return TopScore;
    }
    return reval;
}

function calculate(level,nowp){
    var reType={x:0,y:0,val:0},type={x:0,y:0,val:0};
    var first=true;
    var val,i,j;
    var boardScore;

    for (i = lr; i <= rr; i++) {
        for (j = lc; j <= rc; j++) 
            if (this.gBoard[i][j] == 0) {
                val = ((row - i) * (i + 1) + (col - j) * (j + 1)) * posScore;
                this.gBoard[i][j] = nowp;
                val+= this.scoreBoard(nowp, i, j);
                if (val>TopScore){
                    reType = {x:i,y:j,val:TopScore};
                    this.gBoard[i][j]=0;
                    return reType;
                }
                val -= this.scoreBoard(nowp%2 + 1, i, j);
                if (level > 0) {
                    type = this.calculate(level - 1, nowp % 2 + 1);
                }
                else {
                    type = {x:0,y:0,val:0};
                    searchnode++;
                }
                if (type.val>scoreTable[4]*10) val=val/4;
                val = val - type.val;
                if (first || (val > reType.val)) {
                    first = false;
                    reType.x = i;
                    reType.y = j;
                    reType.val = val;
                }
                this.gBoard[i][j] = 0;
            }
    }
    return reType;
}

function updateRange(x,y){
    if (x-4<lr) lr=x-4;
    if (x+4>rr) rr=x+4;
    if (y-4<lc) lc=y-4;
    if (y+4>rc) rc=y+4;
    if (lr<0) lr=0;
    if (rr>row-1) rr=row-1;
    if (lc<0) lc=0;
    if (rc>col-1) rc=col-1;
}

function fill(level,nowp){
    var i,j,ans;
    var num;
    var s;
    num=0;
    searchnode=0;
    for (i=0;i<row;i++)
        for (j=0;j<col;j++)
            if (this.gBoard[i][j]!=0){
                num++;
            }
    var start = new Date().getTime();
    ans = this.calculate(level,nowp);
    var timeConsume = new Date().getTime() - start;
    if( typeof window.profileInfo !== 'undefined'){
        window.profileInfo.addTestData('Gobang',{T:[timeConsume],C:[timeConsume],S:[0],N:[0]},{D:[0],OBJ:[0],CTX:[0]});
    }
    if(!cn_display){
        debuginfo.innerHTML=' T:'+timeConsume;
    }

    steps[stepn] = ans.x*col+ans.y;
    stepn=stepn+1;
    outputnode.innerHTML="Step "+stepn+" Computer put "+ans.x+" "+ans.y+" Your turn!";
    this.gBoard[ans.x][ans.y]=nowp;
    num = ans.x*col+ans.y;
    this.updateRange(ans.x,ans.y);
    s="s";
    for (i=100;num<i;i=Math.floor(i/10))
        s=s+"0";
    if (num!=0)	s=s+num;
    if( cn_display === false ){ //如为中文，则不显示此信息
        debuginfo.innerHTML="Searched "+searchnode+debuginfo.innerHTML;
    }
    var classTag = (nowp%2==0) ? 'white' : 'black';
    $('#'+s).addClass(classTag);
    this.checkWin();
}

function nextStep(evt){
    debuginfo.innerHTML="";
    if (playable) {
        var sId, s;
        if( typeof evt.target !== 'undefined' ){
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
            
            s = piece;
            steps[stepn] = x*col+y;
            stepn=stepn+1;
            this.gBoard[x][y] = nowPiece;
            var classTag = (nowPiece%2==0) ? 'white' : 'black';
            $(sId).addClass(classTag);
            if (this.checkWin() == false) {
                this.fill(Level, nowPiece%2+1);
            }
        }
        else {
            alert(" x:" + x + " y:" + y + " has a piece..");
        }
    }
}

function postCreate(){
    var list = id.split('_');
}

function onInit(){
    if (inputnode.value && inputnode.value != "") {
        this.init(inputnode.value/1);
        outputnode.innerHTML="Start a new Game! Your turn!";
    }
}

function onRegret(){
    var x1,y1,x2,y2,i,s,num1,num2;
    if (playable&&stepn>0&&regretnum>0){
        regretnum--;
        regretnode.innerHTML="Regret("+regretnum+")";
        stepn--;
        x1 = Math.floor(steps[stepn]/col);
        y1 = steps[stepn]%col;
        s="s";
        for (i=100;steps[stepn]<i;i=Math.floor(i/10))
        s=s+"0";
        if (steps[stepn]!=0)	s=s+steps[stepn];
        document.getElementById(s).innerHTML="";
        stepn--;
        x2 = Math.floor(steps[stepn]/col);
        y2 = steps[stepn]%col;
        s="s";
        for (i=100;steps[stepn]<i;i=Math.floor(i/10))
        s=s+"0";
        if (steps[stepn]!=0)	s=s+steps[stepn];
        document.getElementById(s).innerHTML="";
        this.gBoard[x1][y1]=0;
        this.gBoard[x2][y2]=0;
        outputnode.innerHTML = "Regret successed, Your turn!";				
    }else{
        outputnode.innerHTML = "Regret failed, Your turn!";
    }
}

function oninput(){
    
}

function onHelp(){
    if (playable&&helpnum>0) {
        helpnum = helpnum - 1;
        helpnode.innerHTML = "Help(" + helpnum + ")";
        this.fill(this.gBoard, Level, nowPiece % 2);
        this.fill(this.gBoard, Level, nowPiece%2 + 1);
    }
}

function onSwitch(){
    if (playable) {
        nowPiece = nowPiece % 2 + 1;
        this.fill(this.gBoard, Level, nowPiece % 2 + 1);
    }
}

var Gobang = {
    gBoard: new Array(),
    init: init,
    checkWin: checkWin,
    scoreLine: scoreLine,
    scoreBoard: scoreBoard,
    calculate: calculate,
    updateRange: updateRange,
    fill: fill,
    nextStep: nextStep,
    postCreate: postCreate,
    onInit: onInit,
    onRegret: onRegret,
    oninput: oninput,
    onHelp: onHelp,
    onSwitch: onSwitch
};

