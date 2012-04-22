//this is used as post data parser.

#include <cstring>
#include <string>
#include <vector>
#include <map>
#include <ext/hash_map>
using namespace std;
using namespace __gnu_cxx;

struct str_hash
{
    size_t operator()(const string& str) const
    {
        return __stl_hash_string(str.c_str());
    }
};

typedef map<string, string> StringMap;
typedef StringMap::iterator StringMapIterator;
typedef hash_map<string, string, str_hash> HashString;
typedef HashString::iterator HashStringIterator;

void urldecode(char *p)
{
	int i=0;
	while(*(p+i))
	{
		 if ((*p=*(p+i)) == '%')
		 {
		  *p=*(p+i+1) >= 'A' ? ((*(p+i+1) & 0XDF) - 'A') + 10 : (*(p+i+1) - '0');
		  *p=(*p) * 16;
		  *p+=*(p+i+2) >= 'A' ? ((*(p+i+2) & 0XDF) - 'A') + 10 : (*(p+i+2) - '0');
		  i+=2;
		 }
		 else if (*(p+i)=='+')
		 {
		  *p=' ';
		 }
		 p++;
	}
	*p='\0';
}

string unEscape(char * str){
	char * rst = new char[strlen(str)+1];
	strcpy(rst,str);
	urldecode(rst);
	return string(rst);
}


string unEscape(string str){
	char * rst = new char[str.length()+1];
	strcpy(rst,str.c_str());
	return unEscape(rst);
}

void stringSplit(string str, string delim, vector<string>& results){
	int cutAt;
	results.clear();
	while( (cutAt = str.find_first_of(delim)) != (int)str.npos ){
		if(cutAt > 0){
			results.push_back(str.substr(0,cutAt));
		}
		str = str.substr(cutAt+1);
	}
	if(str.length() > 0){
		results.push_back(str);
	}
}

int httpPostParser( string post_data, StringMap& map){
	vector<string> pairs;
	stringSplit(post_data,"&",pairs);
	vector<string> curPair;
	int pairCounter =0;
	for ( vector<string>::iterator i=pairs.begin();i!=pairs.end();i++){
		stringSplit(*i,"=",curPair);
		if(curPair.size() == 2 ){  //is a pair?
			map.insert(StringMap:: value_type(unEscape(curPair[0]), unEscape(curPair[1])));
			pairCounter++;
		}
		else{
			return -1;
		}
	}
	return pairCounter;
}
int httpPostParser( char * post_data, StringMap& map){
	return httpPostParser(string(post_data),map);
}

int httpPostParser( string post_data, HashString& map){
	vector<string> pairs;
	stringSplit(post_data,"&",pairs);
	vector<string> curPair;
	int pairCounter =0;
	for ( vector<string>::iterator i=pairs.begin();i!=pairs.end();i++){
		stringSplit(*i,"=",curPair);
		if(curPair.size() == 2 ){  //is a pair?
						map.insert(HashString:: value_type(unEscape(curPair[0]), unEscape(curPair[1])));
			pairCounter++;
		}
		else{
			return -1;
		}
	}
	return pairCounter;
}
int httpPostParser( char * post_data, HashString& map){
	return httpPostParser(string(post_data),map);
}

/*
void unEscape(string& str){
	str = string(unEscape(str.c_str());
	return;
}
*/








