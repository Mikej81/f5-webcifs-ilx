# ILXWebCifs
##iRuleLX Webified CIFS Project

F5 BIG-IP iRulesLX (Unsupported) Project for Webified CIFS Shares.

![alt tag](http://i.imgur.com/7oO4D8xm.png)

Currently supports SMB2:ReadDir, SMB2:ReadFile, SMB2:WriteFile

Modified SMB2 Library to allow additional file attriute return for SMB2::READDIR

-EndofFile: File Size on Disk (UInt64 to Hex, to Binary, to Bytes.)

-CreationDate: File Creation Date (UInt64 to Int32, to Hex, to Binary, to Java GMT.)

##TODO:
-NFS Support?

-MkDir, 

-Rename, 

-additional error handling, 

-Addition Error handling for multi level paths. (currently supports 1 path deep and back to top options.)
