// @vitest-environment happy-dom
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it} from 'vitest'
import Media from './Media.jsx'
import {useStore,freshState} from '../store/useStore.js'
import {importedDemonstrations} from '../lib/forge-import-media.js'

globalThis.IS_REACT_ACT_ENVIRONMENT=true

it('shows a matching animation for a custom imported name without rewriting its saved id',()=>{
 const ex={id:'personal-id',custom:true,n:'Terra romeno com halteres',bp:'full body',eq:'other'}
 const state={...freshState(),customEx:[ex],routines:[{id:'r',name:'A',ex:[{id:ex.id,sets:3,reps:10}]}]}
 useStore.setState({S:state,user:null})
 const host=document.createElement('div'),root=createRoot(host)
 try{
  act(()=>root.render(<Media ex={ex}/>))
  expect(host.querySelector('.forge-loop-button')).toBeTruthy()
  expect(host.querySelector('.forge-loop-still').src).toContain('/1459.webp')
  expect(importedDemonstrations(ex)[0]).toMatchObject({id:'1459',eq:'dumbbell'})
  expect(useStore.getState().S).toEqual(state)
 }finally{act(()=>root.unmount())}
})

it('offers machine and Smith demonstrations as separate choices for an alternative prescription',()=>{
 const ex={id:'custom-hip',custom:true,n:'Elevação pélvica na máquina ou Smith'}
 useStore.setState({S:freshState(),user:null})
 const host=document.createElement('div'),root=createRoot(host)
 try{
  act(()=>root.render(<Media ex={ex}/>))
  expect(host.querySelector('.forge-loop-button')).toBeNull()
  const choices=[...host.querySelectorAll('.forge-quick-links button')]
  expect(choices).toHaveLength(2)
  act(()=>choices[0].click())
  expect(host.querySelector('.forge-loop-still').src).toContain('/2146.webp')
  act(()=>choices[1].click())
  expect(host.querySelector('.forge-loop-still').src).toContain('/3110.webp')
 }finally{act(()=>root.unmount())}
})

it('keeps explicit personal media and unknown custom movements on their own media path',()=>{
 expect(importedDemonstrations({id:'custom',custom:true,n:'Mesa flexora',url:'https://example.com/my-video'})).toEqual([])
 expect(importedDemonstrations({id:'custom',custom:true,n:'Mesa flexora especial desconhecida'})).toEqual([])
 expect(importedDemonstrations({id:'0586',n:'Mesa flexora'})).toEqual([])
 expect(importedDemonstrations({id:'custom',custom:true,n:'Crucifixo inverso na máquina'})[0]).toMatchObject({id:'0602',eq:'leverage machine'})
})
