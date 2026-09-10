const fsp=require("fs/promises");
const path=require("path");
function validSteam(value){return /^\d{17}$/.test(String(value||""))}
function validDiscord(value){return /^\d{15,22}$/.test(String(value||""))}
function cleanText(value,max=64){return String(value||"").replace(/[\r\n\t]/g," ").replace(/\s+/g," ").trim().slice(0,max)}
class AccountLinkStore{
  constructor(filePath){this.filePath=path.resolve(String(filePath||""));this.byDiscord=new Map();this.bySteam=new Map();this.ready=false}
  async init(){await fsp.mkdir(path.dirname(this.filePath),{recursive:true});try{const raw=JSON.parse(await fsp.readFile(this.filePath,"utf8"));for(const item of Array.isArray(raw?.links)?raw.links:[]){const link=this.normalize(item);if(!link||this.byDiscord.has(link.discordId)||this.bySteam.has(link.steam))continue;this.byDiscord.set(link.discordId,link);this.bySteam.set(link.steam,link)}}catch(e){if(e?.code!=="ENOENT")console.error("[FOGGY API] account link store load failed",e?.message||e)}this.ready=true;return this}
  normalize(raw){const discordId=String(raw?.discordId||""),steam=String(raw?.steam||"");if(!validDiscord(discordId)||!validSteam(steam))return null;return{discordId,steam,username:cleanText(raw?.username),displayName:cleanText(raw?.displayName),linkedAt:Math.max(0,Number(raw?.linkedAt)||Date.now()),updatedAt:Math.max(0,Number(raw?.updatedAt)||Date.now())}}
  getByDiscord(id){return this.byDiscord.get(String(id||""))||null}
  getBySteam(id){return this.bySteam.get(String(id||""))||null}
  async persist(){const payload={version:1,updatedAt:Date.now(),links:[...this.byDiscord.values()].sort((a,b)=>a.discordId.localeCompare(b.discordId))};const temp=this.filePath+".tmp";await fsp.writeFile(temp,JSON.stringify(payload,null,2)+"\n",{encoding:"utf8",mode:0o600});await fsp.rename(temp,this.filePath)}
  async link({discordId,steam,username="",displayName=""}){discordId=String(discordId||"");steam=String(steam||"");if(!validDiscord(discordId)||!validSteam(steam)){const e=new Error("Invalid account identity");e.code="INVALID_IDENTITY";throw e}const a=this.getByDiscord(discordId),b=this.getBySteam(steam);if(a&&a.steam!==steam){const e=new Error("This Discord account is already linked to another Steam account");e.code="DISCORD_ALREADY_LINKED";throw e}if(b&&b.discordId!==discordId){const e=new Error("This Steam account is already linked to another Discord account");e.code="STEAM_ALREADY_LINKED";throw e}const now=Date.now(),link={discordId,steam,username:cleanText(username)||(a?.username||b?.username||""),displayName:cleanText(displayName)||(a?.displayName||b?.displayName||""),linkedAt:a?.linkedAt||b?.linkedAt||now,updatedAt:now};this.byDiscord.set(discordId,link);this.bySteam.set(steam,link);await this.persist();return link}
  async unlinkDiscord(discordId){const link=this.getByDiscord(discordId);if(!link)return null;this.byDiscord.delete(link.discordId);this.bySteam.delete(link.steam);await this.persist();return link}
  count(){return this.byDiscord.size}
}
module.exports={AccountLinkStore,validSteam,validDiscord};
