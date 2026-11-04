// Capture the browser's offer early; never manufacture a native install prompt.
let promptEvent=null,installed=false;
const subscribers=new Set();
const emit=()=>subscribers.forEach(fn=>fn());
export const standalone=()=>typeof window!=='undefined'&&(window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true);
if(typeof window!=='undefined'){
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;emit()});
 window.addEventListener('appinstalled',()=>{installed=true;promptEvent=null;emit()});
}
export const installSnapshot=()=>installed||standalone()?'installed':promptEvent?'ready':'manual';
export const subscribeInstall=listener=>{subscribers.add(listener);return ()=>subscribers.delete(listener)};
export const useChromeForInstall=(ua=typeof navigator!=='undefined'?navigator.userAgent:'')=>/Android/i.test(ua)&&/SamsungBrowser|SamsungInternet/i.test(ua);
export async function requestInstall(){
 if(useChromeForInstall())return 'use-chrome';
 const event=promptEvent;if(!event)return 'manual';promptEvent=null;emit();
 try{await event.prompt();const choice=await event.userChoice;return choice?.outcome==='accepted'?'accepted':'dismissed'}catch{return 'manual'}
}
