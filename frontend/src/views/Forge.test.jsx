// @vitest-environment happy-dom
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {expect,it,vi} from 'vitest'
vi.mock('../lib/api.js',()=>({api:vi.fn()}))
import Nutrition from './Nutrition.jsx'
import {useStore,freshState} from '../store/useStore.js'
import {youtubeId} from '../components/YouTubeDemo.jsx'
globalThis.IS_REACT_ACT_ENVIRONMENT=true
it('keeps meal edits inside profile and does not overwrite routines',()=>{
 const routine={id:'keep',name:'My routine',ex:[]};useStore.setState({S:{...freshState(),routines:[routine]},user:null})
 const host=document.createElement('div'),root=createRoot(host)
 act(()=>root.render(<MemoryRouter><Nutrition/></MemoryRouter>))
 expect(useStore.getState().S.forgeNutrition).toBeUndefined()
 act(()=>[...host.querySelectorAll('button')].find(b=>b.textContent.includes('Usar modelo')).click())
 expect(useStore.getState().S.forgeNutrition).toHaveLength(7)
 expect(useStore.getState().S.routines[0]).toEqual(routine)
 act(()=>root.unmount())
 const host2=document.createElement('div'),root2=createRoot(host2)
 act(()=>root2.render(<MemoryRouter><Nutrition/></MemoryRouter>))
 expect(host2.querySelectorAll('textarea')).toHaveLength(7)
 act(()=>root2.unmount())
})
it('only embeds verified YouTube hostnames and video IDs',()=>{
 expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
 expect(youtubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
 expect(youtubeId('https://youtube.com.attacker.test/watch?v=dQw4w9WgXcQ')).toBe(null)
 expect(youtubeId('javascript:alert(1)')).toBe(null)
})
