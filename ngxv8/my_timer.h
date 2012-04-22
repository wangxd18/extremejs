/***************** 
  File   -   my_timer.h 

    A   lightweight   timer   program. 
    (Supported   by   both   Win32   and   Linux   Platform!) 

    [Usage] 
                ================================== 
                CMyTimer   obj; 
obj.BeginCount();   //Begin   to   count 

... 
...         //All   elapsed   process 

time   =   obj.EndCount();       //calculate 
                                                  //the   elapsed   time 
                ================================== 

    [Author] 
YangSongX   (yangsongx_freebsd@yahoo.com) 

    [History] 

    2004-12-11 
    ========= 
        Porting   this   file   to   Linux. 
It   seems   to   work   well   :)   (Under   RedHat   Linux-Kernel-2.4.9) 

    2003-11 
    ======= 
        Create   this   file   first. 

  ******/ 

#ifndef   _MY_TIMER_HH 
#define   _MY_TIMER_HH 
#include   <sys/time.h>
class   CMyTimer 
{ 
	struct   timeval   tmStart; 
	struct   timeval   tmEnd; 

public: 

	CMyTimer(){}; 

///////////////////////////////////////////////////////////////////////////////////////// 
// 
//   函数     :     void   CMyTimer::BeginCount() 
// 
//   作用     :     开始计时 
// 
	void BeginCount(){ 
		gettimeofday(&tmStart,NULL); 
	}; 

///////////////////////////////////////////////////////////////////////////////////////// 
// 
//   函数     :     void   CMyTimer::EndCount() 
// 
//   作用     :     对应于BeginCount调用,   返回二者之间的时间间隔 
//                     (单位   -   ms) 
//
	float EndCount(){ 
		float ret; 
		gettimeofday(&tmEnd,NULL); 
		ret=(float)((tmEnd.tv_usec-tmStart.tv_usec)+(tmEnd.tv_sec-tmStart.tv_sec)*1000000); 
		ret/=(float)1000; 
		return   ret; 
	} 
}; 


#endif   /*_MY_TIMER_HH*/ 
