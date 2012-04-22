extern "C" {
#include <ngx_config.h>
#include <ngx_core.h>
#include <ngx_http.h>
#include <nginx.h>
}

#include <v8.h>
#include <v8-debug.h>

#include <cstdlib>
#include <cstring>
#include <string>
#include <map>
#include "parser.h" //by carl
#include "v8js.h"	//by carl
#include "my_timer.h"
#define CODE ("code")
#define SESSION ("session")
typedef map<string, V8Js* > V8JSMap;
typedef V8JSMap::iterator V8JSMapIterator;

using namespace std;
using namespace v8;

extern ngx_module_t  ngx_http_v8_embed_module;	//used if this file is not .c

static char *ngx_http_v8_embed_set(ngx_conf_t *cf, ngx_command_t *cmd, void *conf);	//main module
static void *ngx_http_v8_create_loc_conf(ngx_conf_t *cf);
static ngx_int_t ngx_http_v8_init_process(ngx_cycle_t *cycle);

static void v8_embed_handler ( ngx_http_request_t * r ) ;
static uint8_t * get_raw_http_body ( ngx_http_request_t * r , size_t * body_len );



typedef struct { 
unsigned long consume ; 
char * ini_buf ; 
size_t buflen ; //the lenght of the ini_buf 
} ngx_http_p2s_conf_t ; 

typedef struct {
    ngx_uint_t done;
    ngx_flag_t waiting;
} ngx_http_v8_embed_ctx_t;

typedef struct {
	char * ini_buf;
	size_t buflen;
}ngx_http_v8_loc_conf_t;

//The set-up
static ngx_command_t  ngx_http_v8_commands[] = {
    { ngx_string("v8_interprete"),
        NGX_HTTP_LOC_CONF|NGX_CONF_NOARGS,
        ngx_http_v8_embed_set,
        NGX_HTTP_LOC_CONF_OFFSET,
        0,
        NULL },
    ngx_null_command
};

static ngx_http_module_t ngx_http_v8_embed_module_ctx = {
    NULL,                                /* preconfiguration */
    NULL,                                /* postconfiguration */

    NULL, 			        /* create main configuration */
    NULL,                                /* init main configuration */

    NULL,                                /* create server configuration */
    NULL,                                /* merge server configuration */

    ngx_http_v8_create_loc_conf,         /* create location configuration */
    NULL				/* merge location configuration */
};

ngx_module_t  ngx_http_v8_embed_module = {
    NGX_MODULE_V1,
    &ngx_http_v8_embed_module_ctx,       /* module context */
    ngx_http_v8_commands,          /* module directives */
    NGX_HTTP_MODULE,               /* module type */
    NULL,                          /* init master */
    NULL,                          /* init module */
    ngx_http_v8_init_process,      /* init process */
    NULL,                          /* init thread */
    NULL,                          /* exit thread */
    NULL,                          /* exit process */
    NULL,                          /* exit master */
    NGX_MODULE_V1_PADDING
};
// end of set-up

ngx_int_t ngx_http_v8_init_process(ngx_cycle_t *cycle)
{
    ngx_core_conf_t         *ccf;
    ccf = reinterpret_cast<ngx_core_conf_t*>(ngx_get_conf(cycle->conf_ctx, ngx_core_module));
    return NGX_OK;
}

static void *
ngx_http_v8_create_loc_conf(ngx_conf_t *cf)
{
    ngx_http_v8_loc_conf_t *conf;
    conf = static_cast<ngx_http_v8_loc_conf_t*>(
        ngx_pcalloc(cf->pool, sizeof(ngx_http_v8_loc_conf_t)));
    if (conf == NULL) {
        return NGX_CONF_ERROR;
    }
    return conf;
}

/**
* @brief Get the HTTP body data from the ngx_http_request_t struct.
* @warning DONNOT release the return pointer.
* @param[in] ngx_http_request_t * r -
* The HTTP request of NGINX struct which holds the HTTP data.
* @param[out] size_t * body_len - The body data length will stored here.
* @return uint8_t* - A pointer to a memory where 
* stored the HTTP body raw binary data.
* The memory is allocated from nginx memory pool,
* so the caller don't need to warry about the memory release work.
*/
static uint8_t * get_raw_http_body ( ngx_http_request_t * r , size_t * body_len ){
//	printf ( "%s\n" , "**********This is the get_raw_http_body**********") ; 
	ngx_chain_t * bufs = r -> request_body -> bufs ; 
		    * body_len = 0 ; 

	ngx_buf_t * buf = NULL ; 
	uint8_t * data_buf = NULL ; 
	size_t content_length = 0 ; 

	if ( r -> headers_in.content_length == NULL ){ 
		ngx_log_stderr(NGX_LOG_STDERR,"No content_length in request body.");
		printf("No content_length in request body.\n");  
		return NULL ; 
	} 	

	// malloc space for data_buf 
	content_length = atoi ( ( char * ) ( r -> headers_in . content_length -> value . data ) ) ; 
	data_buf = ( uint8_t * ) ngx_palloc ( r -> pool , content_length + 1 ) ; 
	size_t buf_length = 0 ; 

	while ( bufs ){ 
		buf = bufs -> buf ; 
		bufs = bufs -> next ; 
		buf_length = buf -> last - buf -> pos ; 
		if ( * body_len + buf_length > content_length ){ 
			memcpy ( data_buf + * body_len , buf -> pos , content_length - * body_len ) ;
			* body_len = content_length ; 
			break ; 
		} 
		memcpy ( data_buf + * body_len , buf -> pos , buf -> last - buf -> pos ) ; 
		* body_len += buf -> last - buf -> pos ; 
	} 
	if ( * body_len ){ 
		data_buf [ * body_len ] = '\0' ; 
	} 
	return data_buf ; 
}


V8JSMap mapV8;
V8Js* curV8;
V8Js* getCurV8(string sessionID){
	V8JSMapIterator it = mapV8.find(sessionID);
	//if exists, return
	if(it != mapV8.end()){
		return (V8Js*)(it->second);
	}
	//else create a new v8js
	else {
		V8Js* v8 = new V8Js();
		mapV8.insert(V8JSMap::value_type(sessionID,v8));
		v8->initMigrator();	//init Migrator code
		return v8;
	}
}

/** 
* Process the client request. 
* The main part of this v8_interpreter module.
* The client post data has stored in <code>r</code> 
*/ 
static void v8_embed_handler ( ngx_http_request_t * r ) 
{
	printf ( "%s\n" , "*******process_handler*******") ; 

	CMyTimer timer;timer.BeginCount();int serverRunTime;
	ngx_http_v8_embed_ctx_t  *ctx;
	
	ctx = (ngx_http_v8_embed_ctx_t*)ngx_http_get_module_ctx(r, ngx_http_v8_embed_module);
	

	size_t bodylen = 0 ; 
	uint8_t * contents = get_raw_http_body ( r , & bodylen ) ; 
	char * post;
	post= (char*) contents;
	
// now - the JS code interpreter
	string rst = "(null)";
	char * endPos;
	int pNum;
	StringMap postPairs;
	StringMapIterator it;
	
	endPos = strstr( post, "&_=EOS" );
	if( endPos )
		*endPos = 0;
	else 
		post[strlen(post)] = 0;

	if( (pNum = httpPostParser(post,postPairs))!=-1){	//set post data key/value pairs to postPairs
		//get Session ID
		it = postPairs.find(SESSION);
		if( it!=postPairs.end()){
//			printf("SESSION :: %s\n", it->second.c_str());
			curV8 = getCurV8(it->second);  //set curV8 using Session ID
		} else {
			ngx_log_stderr(NGX_LOG_STDERR,"Can not find sessionID in post-data. \n" );
			printf("Error, Can not find sessionID.\n");
			rst = "null";
		}
		//run js code
		it = postPairs.find(CODE);
		if( it!=postPairs.end() ){
//			printf("code: %s\n", (it->second).c_str() );
			rst = curV8->run(it->second);
		} else {
			ngx_log_stderr(NGX_LOG_STDERR,"Can not find code in post-data. \n" );
			printf("Error, Can not find code.\n");
			rst = "null";
		}
	} else {
		ngx_log_stderr(NGX_LOG_STDERR,"Can not find key/value pairs in post-data.\n" );
		printf("Error, Can not find code.\n");
		rst = "null";
	}
	
	serverRunTime = (int)(timer.EndCount());
	char timeStr[100];
	sprintf(timeStr,"var serverRunTime=%d;", serverRunTime);
	rst = timeStr + rst;
// end JS code

//	printf("\nresult: %s \nlen:%d\n======================\n", rst.c_str(), rst.size() );

	ngx_int_t rc = NGX_DONE ; 
	ngx_buf_t * b = NULL ; 
	ngx_chain_t out ; 
	u_char* rstStr = (u_char*) (rst.c_str());
	int rstLen = rst.size();
	
	

	
	/* Prepare for output, 128 is preserved for robust */ 
	b = (ngx_buf_t*)ngx_pcalloc( r->pool, sizeof(ngx_buf_t));
	if ( b == NULL ) 
	{ 
		ngx_log_stderr(NGX_LOG_STDERR,"Cannot create temp buf b.\n");
		printf("Cannot create temp buf b.\n");
		ngx_http_finalize_request ( r , NGX_HTTP_INTERNAL_SERVER_ERROR ) ; 
		return ; 
	}
	
	b -> pos = rstStr;
	b -> last = rstStr + rstLen;

	b->memory = 1;
	b -> last_buf = 1 ; /* there will be no more buffers in the request */ 

	out . buf = b ; 
	out . next = NULL ; 

	r -> headers_out . status = NGX_HTTP_OK ; 
	r -> headers_out . content_length_n = rstLen ; 
	r -> headers_out . content_type . len = sizeof ( "text/plain" )-1 ; 
	r -> headers_out . content_type . data = ( u_char * ) "text/plain" ; 
	rc = ngx_http_send_header ( r ) ; 
	if ( rc == NGX_ERROR || rc > NGX_OK || r -> header_only ) 
	{ 
		ngx_http_finalize_request ( r , NGX_HTTP_INTERNAL_SERVER_ERROR ) ; 
		return ; 
	}

	rc = ngx_http_output_filter ( r , & out );
	while( rc == NGX_AGAIN ) {
		rc = ngx_http_output_filter ( r , & out );
	}
	ngx_http_finalize_request ( r , rc ) ; 

}

static ngx_int_t
ngx_http_v8_handler_request(ngx_http_request_t *r)
{
//	printf ( "%s\n" , "*******query_handler*******" ) ; 
	ngx_int_t rc = NGX_DONE ; 
	rc = ngx_http_read_client_request_body ( r , v8_embed_handler ) ; 	// this request call the v8_embed_handler handler to process the data
	if ( rc >= NGX_HTTP_SPECIAL_RESPONSE )
		return rc;
	
	return NGX_DONE;
}

static char *
ngx_http_v8_embed_set(ngx_conf_t *cf, ngx_command_t *cmd, void *conf)
{
    ngx_http_v8_loc_conf_t      *v8lcf;
    ngx_http_core_loc_conf_t    *clcf;
    ngx_str_t                   *value;

    v8lcf = static_cast<ngx_http_v8_loc_conf_t *>(conf);
    value = static_cast<ngx_str_t *>(cf->args->elts);


    clcf = static_cast<ngx_http_core_loc_conf_t *>(
        ngx_http_conf_get_module_loc_conf(cf, ngx_http_core_module));
    clcf->handler = ngx_http_v8_handler_request;	// specify which handler to use

    return NGX_CONF_OK;
}
