var express = require('express');
var app = express();
var server = require('http').Server(app);
var SMB2 = require('smb2');
var multer = require('multer');
var bcdDate = require('bcd-date');
var Int64BE = require("int64-buffer").Int64BE;
var Uint64BE = require("int64-buffer").Uint64BE;
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

server.listen({
    host: '127.0.0.1', 
    port: 1112
});

app.get('*', function (req, res) {
	//Set up to allow dynamic Shares and SSO
  	if (req.query.host && 
      req.query.share && 
      req.query.domain && 
      req.query.username && 
      req.query.password) {
  		console.log('this passed somehow');
  		var shareHost = decodeURIComponent(req.query.host);
  		var sharePath = decodeURIComponent(req.query.share);
  		var shareDomain = decodeURIComponent(req.query.domain);
  		var shareUser = decodeURIComponent(req.query.username);
  		var sharePass = decodeURIComponent(req.query.password);
    } else {
  		//Static Connection Options
  		var shareHost = '192.168.51.136';
  		var sharePath = 'SHARE';
  		//This is a standalone Win7 Box, Match to AD DOMAIN if domain server
  		var shareDomain = 'WIN-4KDIFNTK7S'; 
  		var shareUser = 'administrator';
  		var sharePass = 'pass@word1';
    }

    console.log('Connection: //' + shareHost + '//' + sharePath + ' ' + shareDomain + ' user: ' + shareUser + ' pass: ' + sharePass);
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
		http_resp += "table { border: 2px solid #33ccff; padding: 10px 40px; float: left; width: 50%; background: #000000; border-radius: 15px; font-size: 16px; } ";
	    http_resp += "a { color: white; } ";
	    http_resp += "tr.border_bottom td { border-bottom: 2pt solid #66b3ff; }</style></head>";
	    http_resp += "<body>";
        http_resp += "<table><tr class='border_bottom'><td>CIFS://" + shareHost + "/" + sharePath + "</td></tr>";
        http_resp += "<tr class='border_bottom'><td>File Upload<br><br>";
    if (req.query.upfile != null && req.query.uploadstatus != null) {
    	var httpfilename = decodeURIComponent(req.query.upfile);
    	var httpuploadstatus = decodeURIComponent(req.query.uploadstatus);
    	http_resp += "<div style='background-color:green;'><b>Upload Status: </b>" + httpuploadstatus + "<br>";
    	http_resp += "<b>Filename: </b>" + httpfilename + "<br></div><br>";
    }
    http_resp += "<form method='post' enctype='multipart/form-data'><input type='file' name='file' accept='*'><input type='submit'></form>";
    http_resp += "</td></tr><tr class='border_bottom'><td>Directory Listing</td></tr>";
    //http_resp += '<tr><td>Name</td><td></td></tr>';
    
    try {
    	var options = req.url;
      	var options_dec = decodeURIComponent(options);

      	var share_len = sharePath.length;
      	var uri_len = options_dec.length;
      	var tmp_share = '/' + sharePath;
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

        	http_resp += '<tr><td><a href="/">..</a></td></tr>';
    
    for (var i = 0, len = files.length; i < len; i++) {
      if (files[i] !== null) {
      	if (/(?=\w+\.\w{3,4}$).+/.test(files[i]) || files[i].FileAttributes.toString(16) !== '10') {
          var sizebuffer = new Buffer(files[i].AllocationSize);
          var big = new Uint64BE(sizebuffer); // a big number with 64 bits 
          console.log(big);
          var filedec = parseInt(big.toNumber(), 2);
          var filestr = big.toString(16); 
          console.log(filedec);
          console.log(filestr);

          http_resp += '<tr><td><a href="?share=' + sharePath + '&path=' + flip_path + '&filename=' + files[i].Filename + '">' + files[i].Filename + '</a></td></tr>';
      	  //console.log(files[i].Filename + ' : ' + files[i].FileAttributes.toString(16));
          //console.log(files[i].Filename + ' : ' + files[i].FileAttributes.toString(16));
        } else {
          if ((files[i].Filename.indexOf('.') || files[i].Filename.indexOf('..')) && files[i].Filename.length > 2) {
      		http_resp += '<tr><td><a href="?share=' + sharePath + '&path=' + flip_path + '/' + files[i].Filename + '">[ ' + files[i].Filename + ' ]</a></td></tr>';
      	  //console.log(files[i].FileAttributes.toString(16));
        }
        }
      }
      }
        http_resp += '</table></body></html>';
        res.send(http_resp);
      });
    } catch(e){
      console.log(e);
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
       res.redirect(302, '/?upfile=' + req.file.originalname + '&uploadstatus=success');
 	 }catch(e) {
 	  console.log(e);
 	  res.send(e);
 	  smb2Client.close();
     }
     smb2Client.close();
    });
    });
