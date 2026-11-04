// @vitest-environment happy-dom
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {it,expect,vi} from 'vitest'
import {MemoryRouter} from 'react-router-dom'
vi.mock('../lib/api.js',()=>({api:vi.fn()}))
import InstallApp from './InstallApp.jsx'
import ForgeHome from '../views/ForgeHome.jsx'
import {useStore,freshState} from '../store/useStore.js'
import {ensureForgeMeals} from '../lib/forge-profile.js'
globalThis.IS_REACT_ACT_ENVIRONMENT=true
it('offers manual instructions when the browser has not offered installation',async()=>{
 const host=document.createElement('div'),root=createRoot(host);act(()=>root.render(<InstallApp/>));await act(async()=>host.querySelector('button').click());expect(host.textContent).toContain('Adicionar à tela inicial');expect(host.textContent).toContain('dados separados');act(()=>root.unmount())
})
it('offers native installation only from an actual browser event and hides after appinstalled',async()=>{
 const host=document.createElement('div'),root=createRoot(host),prompt=vi.fn(()=>Promise.resolve());act(()=>root.render(<InstallApp/>));const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=prompt;event.userChoice=Promise.resolve({outcome:'accepted'});
 act(()=>window.dispatchEvent(event));expect(event.defaultPrevented).toBe(true);expect(host.textContent).toContain('Instalar FORGE');await act(async()=>host.querySelector('button').click());expect(prompt).toHaveBeenCalledOnce();expect(host.textContent).toContain('Conclua a instalação');act(()=>window.dispatchEvent(new Event('appinstalled')));expect(host.innerHTML).toBe('');act(()=>root.unmount())
})
it('shows an old session explicitly without overwriting or deleting it',()=>{
 const s=freshState();ensureForgeMeals(s);s.active={name:'Upper A',start:Date.now()-80*60*60*1000,entries:[]};useStore.setState({S:s});const before=structuredClone(s.active),host=document.createElement('div'),root=createRoot(host);act(()=>root.render(<MemoryRouter><ForgeHome/></MemoryRouter>));expect(host.textContent).toContain('SESSÃO ANTIGA EM ABERTO');expect(host.textContent).toContain('Revisar sessão antiga');expect([...host.querySelectorAll('a')].find(a=>a.textContent.includes('Abrir minha ficha')).getAttribute('href')).toBe('/my-training');expect(useStore.getState().S.active).toEqual(before);act(()=>root.unmount())
})
