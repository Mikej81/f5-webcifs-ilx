//  Webified CIFS
//  Michael Coleman
//  Michael@f5.com

var http = require('http');
var f5 = require('f5-nodejs');
var express = require('express');
var app = express();
var SMB2 = require('smb2');
var multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });
var url_ops = require('url');
var qs = require('querystring');
var session = require('express-session');
var util = require('util');
var hexToBinary = require('hex-to-binary');
var Long = require("long");
var bodyParser = require('body-parser');


app.use(session({
  secret: 'ilx-secret-phrase',
  name: 'ilx_webcifs',
  resave: true,
  saveUninitialized: true
}));

var plugin = new f5.ILXPlugin();
plugin.startHttpServer(app);
//console.log("Server Started.");

var sess;

app.get('/favicon.ico', function(req, res) {
});

app.get('*', function (req, res) {
    
        var url_parts = url_ops.parse(req.url, true, true);
        // hostname is used for composition of the links for page object.
        // relative link in the <href> tag did not work.  I had to create absolute links including 
        // the hostname.

    url=url_parts.pathname;
    
	//Set up to allow dynamic Shares and SSO
	if ( req.session.domain) {
        shareDomain=req.session.domain;
        sharePath=req.session.sharepath;
        shareHost=req.session.winhost;
        shareUser=req.session.user;
        sharePass=req.session.pass;
        console.log ('session vars:-', req.session.domain,'-',req.session.sharepath, '-',req.session.winhost);
    } else {
        shareDomain=url_parts.query.domain;
        sharePath=url_parts.query.sharepath;
        shareHost=url_parts.query.winhost;
        shareUser=url_parts.query.user;
        sharePass=url_parts.query.pass;
        
        req.session.domain = shareDomain;
        req.session.sharepath = sharePath;
        req.session.winhost = shareHost;
        req.session.user = shareUser;
        req.session.pass = sharePass;
        console.log ('Query vars:', req.session.domain,'-',req.session.sharepath, '-',req.session.winhost,'-', req.session.user, '-', req.session.pass);
    }
  	//if (req.query.host && 
    //  req.query.share && 
    //  req.query.domain && 
    //  req.query.username && 
    //  req.query.password) {

  	//	var shareHost = decodeURIComponent(req.query.host);
  	//	var sharePath = decodeURIComponent(req.query.share);
  	//	var shareDomain = decodeURIComponent(req.query.domain);
  	//	var shareUser = decodeURIComponent(req.query.username);
  	//	var sharePass = decodeURIComponent(req.query.password);
    // } else {
  		//Static Connection Options
  		//var shareHost = '192.168.51.136';
  		//var sharePath = 'SHARE';
  		//This is a standalone Win7 Box, Match to AD DOMAIN if domain server
  		//var shareDomain = 'WIN-4KDIFNTK7S'; 
  		//var shareUser = 'administrator';
  		//var sharePass = 'pass@word1';
    // }
      var cnow = new Date();
      var cnowString = cnow.toDateString();

    console.log(cnowString + ' SMB2::Connection: //' + shareHost + '//' + sharePath + ' ' + shareDomain + ' user: ' + shareUser );
    var file_query = '';
    if (req.query.filename == null) {
    	file_query = req.url;
    	//console.log('no file: ' + file_query);
    } else {
    	file_query = decodeURIComponent(req.query.filename);
    	//console.log('its a file: ' + file_query);
    }

	//if (!/(?=\w+\.\w{3,4}$).+/.test(file_query)) {
		if (req.query.filename == null && req.url !== '/favicon.ico') {
		//THIS IS NOT A FILE OUTPUT READDIR
	    var smb2Client = new SMB2({
         share:'\\\\' + shareHost + '\\' + sharePath,
         domain: shareDomain,
         username: shareUser,
         password: sharePass
        });

		var http_resp = "<html><head><style> body { background-color: black; color: white; } ";
		http_resp += "table { border: 2px solid #33ccff; padding: 10px 40px; float: left; width: 1024px; background: #000000; border-radius: 15px; font-size: 16px; } ";
	    http_resp += "a { color: white; } ";
	    http_resp += "tr.border_bottom td { border-bottom: 2pt solid #66b3ff; }</style></head>";
	    http_resp += "<body>";
        http_resp += "<table><tr class='border_bottom'><td colspan=3>CIFS://" + shareHost + "/" + sharePath + "</td></tr>";
        http_resp += "<tr class='border_bottom'><td colspan=3>File Upload<br><br>";

	    if (req.query.upfile != null && req.query.uploadstatus != null) {
	    	var httpfilename = decodeURIComponent(req.query.upfile);
	    	var httpuploadstatus = decodeURIComponent(req.query.uploadstatus);
	    	http_resp += "<div style='background-color:green;'><b>Upload Status: </b>" + httpuploadstatus + "<br>";
	    	http_resp += "<b>Filename: </b>" + httpfilename + "<br></div><br>";
	    }

    http_resp += "<form method='post' enctype='multipart/form-data'><input type='file' name='file' accept='*'><input type='submit'></form>";
    http_resp += "</td></tr><tr class='border_bottom'><td colspan=3>Directory Listing</td></tr>";
    http_resp += "<tr class='border_bottom'><td>Name</td><td>Size (B)</td><td>Creation Date</td></tr>";
    
    try {
    	var options = req.url;
      	var options_dec = decodeURIComponent(options);

      	//var share_len = sharePath.length;
      	//var uri_len = options_dec.length;
      	//var tmp_share = '/' + sharePath;
      	
      	var dir_path = '';
      	var flip_path = '';

      	if (req.query.path == null){
      		flip_path = '';
      	} else {
      		dir_path = req.query.path;
      	 	flip_path = dir_path.replace(/\//g, "");
      	}

      	//Need to add ability to read multiple levels deep, cant get format right...
        smb2Client.readdir(flip_path, function(err, files) {

        	http_resp += '<tr><td><a href="/">..</a></td><td></td></tr>';
        var file_resp = '';
        var folder_resp = '';
    
    for (var i = 0, len = files.length; i < len; i++) {
      if (files[i] !== null) {
      	if (/(?=\w+\.\w{3,4}$).+/.test(files[i]) || files[i].FileAttributes.toString(16) !== '10') {
			//Convert MS LARGE INTEGER UInt64 to File size in Bytes
			var size_split = files[i].EndofFile.toString('hex').match(/.{1,2}/g).reverse().join("");
			var hexBin = hexToBinary(size_split);
			var fileSize = parseInt(hexBin, 2);
			//Convert MS FILETIME to Java DateTime
			var time_split = files[i].CreationTime.toString('hex').match(/.{1,2}/g).reverse().join("");
			var timeBin = hexToBinary(time_split);
			var filetime = parseInt(timeBin, 2);
			var msFiletime=filetime;
			var sec=Math.round(msFiletime/10000000);
			sec -= 11644473600;
			var datum = new Date(sec*1000);
			//console.log(datum.toGMTString());

          file_resp += '<tr><td><a href="?share=' + sharePath + '&path=' + flip_path + '&filename=' + files[i].Filename + '">' + files[i].Filename + '</a></td><td>' + fileSize + '</td><td>' + datum.toGMTString() + '</td></tr>';
        } else {
          if ((files[i].Filename.indexOf('.') || files[i].Filename.indexOf('..')) && files[i].Filename.length > 2) {
      		folder_resp += '<tr><td><a href="?share=' + sharePath + '&path=' + flip_path + '/' + files[i].Filename + '">[ ' + files[i].Filename + ' ]</a></td><td></td><td></td></tr>';
      	  //console.log(files[i].FileAttributes.toString(16));
        }
        }
      }
      }
        http_resp += folder_resp;
        http_resp += file_resp;
        http_resp += '</table></body></html>';
        res.send(http_resp);
      });
    } catch(e){
      //console.log(e);
      res.send(err);
    }
      smb2Client.close();
	} else {
      //THIS IS A FILE, DOWNLOAD THAT SHIZ!
      var dnow = new Date();
      var dnowString = dnow.toDateString();

      var dpath = decodeURIComponent(req.query.path);
      if (dpath){
        dpath += '\\';
      }
      var dname = decodeURIComponent(req.query.filename);

      console.log('[ ' + dnowString + ' WEBCIFS USER: ' + shareUser +' Downloading: ' + dpath + dname + ']');
    
    var smb2Client = new SMB2({
         share:'\\\\' + shareHost + '\\' + sharePath,
         domain: shareDomain,
         username: shareUser,
         password: sharePass,
     autoCloseTimeout: 100000
    });
    
    smb2Client.readFile(dpath + dname, {'encoding': 'base64'}, function(err, data){
      try {
       res.header('Content-disposition', 'attachment; filename=' + dname);
       res.header("Content-Type", "application/octet-stream");
       var buf = new Buffer(data, 'base64');
       res.send(buf);
       
      } catch(e){
   	      console.log(e);
          res.send(err);
          smb2Client.close();
        }
        smb2Client.close();
      });
	}
});
app.post('/', upload.single('file'), function(req,res) {
	//POST FILE
		//Set up to allow dynamic Shares and SSO
  	if (req.body.host && 
      req.body.share && 
      req.body.domain && 
      req.body.username && 
      req.body.password) {
  		console.log('this passed somehow');
  		var shareHost = decodeURIComponent(req.body.host);
  		var sharePath = decodeURIComponent(req.body.share);
  		var shareDomain = decodeURIComponent(req.body.domain);
  		var shareUser = decodeURIComponent(req.body.username);
  		var sharePass = decodeURIComponent(req.body.password);
    } else {
  		//Static Connection Options
  		var shareHost = '192.168.51.136';
  		var sharePath = 'SHARE';
  		//This is a standalone Win7 Box, Match to AD DOMAIN if domain server
  		var shareDomain = 'WIN-4KDIFNTK7S'; 
  		var shareUser = 'administrator';
  		var sharePass = 'pass@word1';
    }

	 var smb2Client = new SMB2({
         share:'\\\\' + shareHost + '\\' + sharePath,
         domain: shareDomain,
         username: shareUser,
         password: sharePass,
     autoCloseTimeout: 100000
    });

    smb2Client.writeFile(req.file.originalname, req.file.buffer, {'encoding': null}, function (err) {
     try {
       res.redirect(302, '/?upfile=' + req.file.originalname + '&uploadstatus=success');
 	 }catch(e) {
 	  console.log(e);
 	  res.send(e);
 	  smb2Client.close();
     }
     smb2Client.close();
    });
    });
