"use strict";const e=require("node-syphon");let o,n,r;(()=>{try{process.stdin.resume(),["exit","SIGINT","SIGUSR1","SIGUSR2","uncaughtException","SIGTERM"].forEach((e=>{process.on(e,(()=>{(r||n)&&(console.log("End program",e),clearInterval(o),null==n||n.dispose(),null==r||r.dispose(),n=null,r=null)}))})),n=new e.SyphonServerDirectory,n.on(e.SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,(e=>{console.log("SERVER ANNOUNCE",e),console.log(n.servers)})),n.on(e.SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification,(e=>{console.log("SERVER RETIRE",e),console.log(n.servers)})),n.listen(),o=setInterval((()=>{n.servers.length>0&&!r?(console.log("GO"),r=new e.SyphonOpenGLClient(n.servers[n.servers.length-1])):0===n.servers.length&&r?(console.log("GO DISP"),r.dispose(),r=null):r&&(console.log(r.newFrame),console.log(r.width,r.height))}),1e3/60)}catch(s){console.error(s),process.exit(0)}})();
