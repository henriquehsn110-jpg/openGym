import React,{useState,useSyncExternalStore} from 'react'
import {installSnapshot,subscribeInstall,requestInstall} from '../lib/forge-install.js'
export default function InstallApp({compact=false}){
 const state=useSyncExternalStore(subscribeInstall,installSnapshot,()=> 'manual');const [open,setOpen]=useState(false),[message,setMessage]=useState('');
 if(state==='installed')return null;
 async function install(){const result=await requestInstall();if(result==='accepted')setMessage('Pedido enviado ao Android. Conclua a instalação na janela do navegador.');else if(result==='dismissed')setMessage('Você pode instalar depois pelo menu do navegador.');else setOpen(true)}
 return <section className={'forge-install'+(compact?' compact':'')} aria-label="Instalar FORGE"><div><strong>FORGE na tela inicial</strong><p>Abra seus treinos como aplicativo no celular.</p></div><button className="forge-btn forge-secondary" onClick={install}>{state==='ready'?'Instalar FORGE':'Instalar no celular'} ↓</button>
 {message&&<p aria-live="polite">{message}</p>}{open&&<div className="forge-install-help"><h3>Como instalar</h3><ol><li>Abra este endereço no navegador completo do celular. Se estiver na janela com “X”, use o menu para abrir no navegador.</li><li><strong>Chrome:</strong> menu ⋮ → Adicionar à tela inicial → Instalar.</li><li><strong>Samsung Internet:</strong> menu → Adicionar página a → Tela inicial. Se aparecer “Instalar”, use essa opção.</li></ol><p>Abra primeiro no mesmo navegador em que estão seus registros. Samsung Internet e Chrome mantêm dados separados. Use Backup nos ajustes para transferir seus dados, sem limpar o navegador.</p><p>Os vídeos do YouTube precisam de internet.</p><button className="forge-text-btn" onClick={()=>setOpen(false)}>Fechar instruções</button></div>}
 </section>
}
