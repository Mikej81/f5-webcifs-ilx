var express = require('express');
var app = express();
var server = require('http').Server(app);
var SMB2 = require('smb2');
var multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

server.listen({
    host: '127.0.0.1', 
    port: 1112
});

//Static Connection Options
var shareHost = '192.168.51.132';
var sharePath = 'SHARE';
//This is a standalone Win7 Box, Match to AD DOMAIN if domain server
var shareDomain = 'WIN-4KDIFNTK7S'; 
var shareUser = 'administrator';
var sharePass = 'pass@word1';

app.get('*', function (req, res) {
	//Set up to allow dynamic Shares and SSO
	
	//var shareHost = decodeURIComponent(req.query.host);
	//var sharePath = decodeURIComponent(req.query.share);
	//var shareDomain = decodeURIComponent(req.query.domain);
	//var shareUser = decodeURIComponent(req.query.username);
	//var sharePass = decodeURIComponent(req.query.password);
    
    //var smb2Client = new SMB2({
    //	share:'\\\\' + shareHost + '\\' + sharePath,
    //	domain: shareDomain,
    //	username: shareUser,
    //	password: sharePass
    //})


	if (!/(?=\w+\.\w{3,4}$).+/.test(req.url)) {
		//THIS IS NOT A FILE OUTPUT READDIR
	    var smb2Client = new SMB2({
         share:'\\\\' + shareHost + '\\' + sharePath,
         domain: shareDomain,
         username: shareUser,
         password: sharePass
        });
	var http_resp = "<html><body><h2>Webified CIFS</h2><br><br>";
    http_resp += "<table border=1><tr><td>File Upload<br><br>";
    if (req.query.file != null && req.query.uploadstatus != null) {
    	var httpfilename = decodeURIComponent(req.query.file);
    	var httpuploadstatus = decodeURIComponent(req.query.uploadstatus);
    	http_resp += "<div style='background-color:green;'><b>Upload Status: </b>" + httpuploadstatus + "<br>";
    	http_resp += "<b>Filename: </b>" + httpfilename + "<br></div><br>";
    }
    http_resp += "<form method='post' enctype='multipart/form-data'><input type='file' name='file' accept='*'><input type='submit'></form>";
    http_resp += "</td></tr><tr><td>Directory Listing<br><br>";
    http_resp += '<ul>';
    
    try {
        smb2Client.readdir('', function(err, files) {
    
    for (var i = 0, len = files.length; i < len; i++) {
      if (files[i] !== null) {
          http_resp += '<li><a href="/share/' + files[i] + '">' + files[i] + '</a></li>'
      }
      }
        http_resp += '</ul>';
        res.send(http_resp);
      });
    } catch(e){
      console.log(e);
      res.send(err);
    }
      smb2Client.close();
	} else {
      //THIS IS A FILE, DOWNLOAD THAT SHIT!
      //Currently only set up for 1 level deep, so it needs some work.
      var options = req.url;
      var options_dec = decodeURIComponent(options);
      var options_split = options_dec.split('/');
      var share = options_split[1];
      var tmp_path = options_split[2];
      var tmp_name = options_split[3];
      if (!tmp_name) {
        var name = tmp_path;
        var path = '';
      }
    
    var smb2Client = new SMB2({
         share:'\\\\' + shareHost + '\\' + sharePath,
         domain: shareDomain,
         username: shareUser,
         password: sharePass,
     autoCloseTimeout: 100000
    });
    
    smb2Client.readFile(path + name, {'encoding': 'base64'}, function(err, data){
      try {
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
	};

});
app.post('/', upload.single('file'), function(req,res) {
	//POST FILE
	 //console.log(req.file);

	 var smb2Client = new SMB2({
         share:'\\\\' + shareHost + '\\' + sharePath,
         domain: shareDomain,
         username: shareUser,
         password: sharePass,
     autoCloseTimeout: 100000,
     debug: true
    });

    smb2Client.writeFile(req.file.originalname, req.file.buffer, {'encoding': null}, function (err) {
     try {
       res.redirect(302, '/?file=' + req.file.originalname + '&uploadstatus=success');
 	 }catch(e) {
 	  console.log(e);
 	  res.send(e);
 	  smb2Client.close();
     }
     smb2Client.close();
    });
    });
