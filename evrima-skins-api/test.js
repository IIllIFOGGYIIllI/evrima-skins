const {spawn}=require("child_process");
const p=spawn(process.execPath,["server.js"],{cwd:__dirname,env:{...process.env,PORT:"33491",PUBLIC_BASE_URL:"http://127.0.0.1:33491",FRONTEND_URL:"http://127.0.0.1:33492/",SESSION_SECRET:"test-session",SERVER_BRIDGE_TOKEN:"test-bridge",SERVER_ID:"foggy-test"},stdio:["ignore","pipe","pipe"]});
let finished=false;function done(code,msg){if(finished)return;finished=true;if(msg)console.log(msg);p.kill();process.exit(code)}
setTimeout(async()=>{try{
 let r=await fetch("http://127.0.0.1:33491/health"),d=await r.json();if(!d.ok)throw Error("health failed");
 r=await fetch("http://127.0.0.1:33491/api/public/status");d=await r.json();if(d.server!=="foggy-test")throw Error("status failed");
 r=await fetch("http://127.0.0.1:33491/api/server/commands",{headers:{Authorization:"Bearer test-bridge"}});d=await r.json();if(!Array.isArray(d.commands))throw Error("server auth failed");
 done(0,"FOGGY API smoke tests passed");
}catch(e){console.error(e);done(1)}},650);setTimeout(()=>done(1,"timeout"),5000);
