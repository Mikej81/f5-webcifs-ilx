# ILXWebCifs
## iRuleLX Webified CIFS Project

F5 BIG-IP iRulesLX (Unsupported) Project for Webified CIFS Shares.

The SMB2 library has been modified for this project: https://github.com/Mikej81/node-smb2

Dependencies:

```javascript
var express = require('express');
var app = express();
var server = require('http').Server(app);
var SMB2 = require('smb2');
var multer = require('multer');
var hexToBinary = require('hex-to-binary');
var Long = require("long");
var bodyParser = require('body-parser');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });
```

### Interface:

![alt tag](http://i.imgur.com/M447vvdl.png)

### Directory Browsing:

![alt tag](http://i.imgur.com/isXT1Ckl.png)

### Logging:

![alt tag](http://i.imgur.com/u3QnVO6l.png)

Currently supports SMB2:ReadDir, SMB2:ReadFile, SMB2:WriteFile

Modified SMB2 Library to allow additional file attriute return for SMB2::READDIR

* EndofFile: File Size on Disk (UInt64 to Hex, to Binary, to Bytes.)

* CreationDate: File Creation Date (UInt64 to Int32, to Hex, to Binary, to Java GMT.)

* APM Session Vars, QueryStrings, Form Fields can be passed for connection settings.

* Added Streaming Profile Support.

## TODO:
* NFS Support?

* MkDir, 

* Rename, 

* additional error handling, 

* Addition Error handling for multi level paths. (currently supports 1 path deep and back to top options.)
