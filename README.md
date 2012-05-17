The backend of ExtremeJS works on linux. The following installing step works fine on ubuntu10.10. Apache and php are required to run examples.

#### 1.Install v8 and nginx.

* Download v8 source code from [here](https://developers.google.com/v8/build).
* Compile source code.
* Copy libv8.so and libv8preparser.so to /usr/lib

```cp libv8.so libv8preparser.so /usr/lib```


#### 2.Set ngxv8 module's config
```cd extremejs/ngxv8```

Use any text editor you like to open _config_ file in the directory. Set _CORE_INCS_ and _CORE_LIBS_ as the _v8_ source code's directory. Then save and quit.

Open _v8js.h_，look for _fopen_，set _fopen_'s arguments to "path/to/this/ngxv8/directory/init.txt".


#### 3.Download and compile nginx。
Download nginx source code from [here](http://nginx.org/download/). Extract and then enter the source code directory. Run the following steps to config and install nginx with ngxv8 module.

```
./configure 
  --prefix=/home/username/local/nginx
  --add-module=/home/username/local/extremejs/ngxv8
  --with-ld-opt="-lstdc++ -ldl -lpthread"
  --sbin-path=/usr/local/sbin
  --with-cc-opt="-Wno-deprecated -fomit-frame-pointer -pthread"
  --without-http_rewrite_module
  --without-http_fastcgi_module
  --without-http_scgi_module
  --without-http_proxy_module
  --without-http_split_clients_module
  --without-http_uwsgi_module
  --without-http_gzip_module
```

Replace _--prefix_ with the path you want to install nginx. Replace _--add-module_ with the _ngxv8_'s path in step 2.
After configuration, compile and install nginx.

```
make
make install
```
When installed, copy _nginx.conf_ to /path/to/nginx/conf.

Start nginx。

```sudo /usr/local/sbin/nginx;```


#### 4.Run examples.
Enter apache's htdocs：

```cd /path/to/your/apache/htdocs;```

Replace /path/to/your/apache/ with your apache path.

Set symbolic link to extremejs/migrator or copy it. 

```ln -s /path/to/your/extremejs/migrator```

Enter migrator directory,open _migrator.js_.

Look up for _domain : '192.168.1.239'_,replace the ip location with your server domain or ip.



#### 5. Start apache and run examples.
Visit [http://yourdomain/migrator/examples/gobang/gobangc.html](http://yourdomain/migrator/examples/gobang/gobangc.html) and [http://yourdomain/migrator/examples/gobang/gobang.html](http://yourdomain/migrator/examples/gobang/gobang.html).

Replace _yourdomain_ with your server domain or ip. gobang.html is gobang game with extremejs working. gobangc.html is the local version.

Click start to play gobang game. Enjoy it!
