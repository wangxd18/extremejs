extern "C" {
#include <ngx_config.h>
#include <ngx_core.h>
#include <ngx_http.h>
#include <nginx.h>
}

#include "v8.h"
#include <string>
#include <stdio.h>
#include <stdlib.h>

using namespace std;
using namespace v8;


#define INIT_FILE_SIZE 24000

	// The callback that is invoked by v8 whenever the JavaScript 'print'
	// function is called.  Prints its arguments on stdout separated by
	// spaces and ending with a newline.
	v8::Handle<v8::Value> Print(const v8::Arguments& args) {
		bool first = true;
		for (int i = 0; i < args.Length(); i++) {
		  v8::HandleScope handle_scope;
		  if (first) {
		    first = false;
		    printf("[V8Js out]:: ");
		  } else {
		    printf(" ");
		  }
		  v8::String::Utf8Value str(args[i]);
			const char* cstr = *str ? *str : "<string conversion failed>";
		  printf("%s", cstr);
		}
		printf("\n");
	//  fflush(stdout);
		return v8::Undefined();
	}

class V8Js {
private:
  // Create a stack-allocated handle scope.
//  HandleScope handle_scope;
  // Create a new context.
  Persistent<Context> context;

public:
	int lastRunTime;
	V8Js(){
	}
	~V8Js(){
	  // Dispose the persistent context.
	  context.Dispose();
	}

string run(string code){
	v8::HandleScope handle_scope;
		Context::Scope context_scope(context);

//		string toEval = ("var __CODE__ = "+code+";var __RESULT__= eval(__CODE__);'(Migrator.updateSingleObject(Migrator.objects,Migrator.deserializeObjects('+Migrator.quote(Migrator.serializeObjectsBasic())+')));'+JSON.stringify(Migrator.stringify(__RESULT__))");
		string toEval = "var __VARIABLES__=eval("+code+");var __RESPONSE__;if(Object.prototype.toString.apply(__VARIABLES__)=='[object Array]'){Migrator.curUid = __VARIABLES__[3];Migrator.updateObjects(Migrator.deserializeObjects(__VARIABLES__[0]));var __CONTEXT__ = Migrator.deserializeContext(__VARIABLES__[1]),__GLOBAL_NAMES__=[];if(__CONTEXT__==null){__RESPONSE__=null}else{for(var __INDEX__ in __CONTEXT__.globals)if(Object.hasOwnProperty.call(__CONTEXT__.globals,__INDEX__))__GLOBAL_NAMES__.push(__INDEX__);var __RESULT__=eval(__VARIABLES__[2]+'.apply(__CONTEXT__.ths,__CONTEXT__.args)');__RESPONSE__=JSON.stringify([Migrator.serializeObjects(Migrator.getGlobals(__GLOBAL_NAMES__),__CONTEXT__.args,__CONTEXT__.ths),Migrator.serializeContext(__GLOBAL_NAMES__,[],__CONTEXT__.ths),Migrator.stringify(__RESULT__),Migrator.curUid])}}else if(__VARIABLES__){__RESPONSE__=JSON.stringify(__VARIABLES__)}else{__RESPONSE__='undefined'}__RESPONSE__";


		printf("\n=======JS code to eval========\n%s\n",toEval.c_str());
		TryCatch trycatch;
		Handle<String> source = String::New(toEval.c_str());
//		Handle<String> source = String::New(toEvalJustForDebug.c_str());
		Handle<Script> script = Script::Compile(source);
		if( script.IsEmpty()) { 
			printf("Error while compiling script. \n");
			ReportException(&trycatch);
			return "null";
		}
		Handle<Value> result = script->Run();
		if (result.IsEmpty()) {
			ReportException(&trycatch);
		  return "null";
		}
		else {
			String::AsciiValue ascii(result);
			return string(*ascii);	
		}
}

string run(char* code){
	return run( (string)(code) );
}

bool runCodeOnly(string code){
		v8::HandleScope handle_scope;
		Context::Scope context_scope(context);
		string toEval = ("var __CODE__ = "+code+";var __RESULT__= eval(__CODE__)");
		TryCatch trycatch;
		Handle<String> source = String::New(toEval.c_str());
//		Handle<String> source = String::New(toEvalJustForDebug.c_str());
		Handle<Script> script = Script::Compile(source);
		if( script.IsEmpty()) { 
			printf("Error while compiling script. \n");
			ReportException(&trycatch);
		  return false;
		}
		Handle<Value> result = script->Run();
		if (result.IsEmpty()) {
			ReportException(&trycatch);
		  return false;
		}
		else {
			return true;	
		}
}

bool initMigrator(){
	v8::HandleScope handle_scope;
	// Create a template for the global object.
	v8::Handle<v8::ObjectTemplate> global = v8::ObjectTemplate::New();
	// Bind the global 'print' function to the C++ Print callback.
	global->Set(v8::String::New("print"), v8::FunctionTemplate::New(Print));
	context = Context::New(NULL,global);
	FILE * fs = fopen("/home/carl/local/ngxv8/init.txt","rb");
	if( fs == NULL ) 
		return false;
	fseek(fs, 0, SEEK_END);
	int size = ftell(fs);
	rewind(fs);
	char * buffer = new char[size+1];
	buffer[size]='\0';
	for (int i = 0; i < size;) {
		int read = fread(&buffer[i], 1, size - i, fs);
		i += read;
	}
	fclose(fs);
	bool success = runCodeOnly((string)buffer);
	delete buffer;
	if( success )
		printf("=========== Init Migrator done. ============\n");
	else
		printf("***************************************\n*************** Init Migrator failed. *************\n***************************************\n");
	return success;
}

// Extracts a C string from a V8 Utf8Value.
const char* ToCString(const v8::String::Utf8Value& value) {
  return *value ? *value : "<string conversion failed>";
}

void ReportException(v8::TryCatch* try_catch) {
  v8::HandleScope handle_scope;
  v8::String::Utf8Value exception(try_catch->Exception());
  const char* exception_string = ToCString(exception);
  v8::Handle<v8::Message> message = try_catch->Message();
  if (message.IsEmpty()) {
    // V8 didn't provide any extra information about this error; just
    // print the exception.
    printf("%s\n", exception_string);
    ngx_log_stderr(NGX_LOG_STDERR,"%s\n", exception_string);
  } else {
    // Print (filename):(line number): (message).
    v8::String::Utf8Value filename(message->GetScriptResourceName());
    const char* filename_string = ToCString(filename);
    int linenum = message->GetLineNumber();
    char * ngxErrorString = new char[1024];
    int pos=0;
    
    printf("%s:%i: %s\n", filename_string, linenum, exception_string);
    pos+=sprintf(ngxErrorString+pos,"%s:%i: %s\n", filename_string, linenum, exception_string);
    // Print line of source code.
    v8::String::Utf8Value sourceline(message->GetSourceLine());
    const char* sourceline_string = ToCString(sourceline);
    // Print wavy underline (GetUnderline is deprecated).
    int start = message->GetStartColumn(),end = message->GetEndColumn(),len=strlen(sourceline_string );
    int startOutputPoint=0,endOutputPoint=len;
    if( len < 240 ){
	    printf("%s\n", sourceline_string);
	    pos+=sprintf(ngxErrorString+pos,"%s\n", sourceline_string);
	  }
	  else{
	  	startOutputPoint = start>80?start-80:0;
	  	endOutputPoint = (len-end)>100?end+100:len;
	  	printf("%.*s\n", endOutputPoint-startOutputPoint, sourceline_string);
 	    pos+=sprintf(ngxErrorString+pos,"%.*s\n", endOutputPoint-startOutputPoint, sourceline_string);
	  }
    for (int i = startOutputPoint; i < start; i++) {
      printf(" ");
      pos+=sprintf(ngxErrorString+pos," ");
    }
    for (int i = start; i < end; i++) {
      printf("^");
      pos+=sprintf(ngxErrorString+pos,"^");
    }
    printf("\n");
    pos+=sprintf(ngxErrorString+pos,"\n");
    ngxErrorString[pos]='\0';
    ngx_log_stderr(NGX_LOG_STDERR,"%s\n", ngxErrorString);
    v8::String::Utf8Value stack_trace(try_catch->StackTrace());
    if (stack_trace.length() > 0) {
      const char* stack_trace_string = ToCString(stack_trace);
      printf("%s\n", stack_trace_string);
      ngx_log_stderr(NGX_LOG_STDERR,"%s\n", stack_trace_string);
    }
  }
}


};







