import React from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
const TEMPLATE = [
 ['9h · Café da manhã','2 fatias integrais com 3 colheres de sopa de frango desfiado e um pouco de requeijão. Café com leite. Alternativa: 2 ovos no lugar do frango.'],
 ['11h40 · Almoço','Metade do prato com legumes e salada; 3–4 colheres de sopa de arroz, 1 concha média de feijão e 1 bife grande ou 2 pequenos. Batata ou mandioca pode substituir parte do arroz.'],
 ['Após o almoço','Uma fruta com o café. Se quiser chocolate, escolha uma porção, como um bombom, como sobremesa.'],
 ['15h · Lanche','1 pote de iogurte natural e 1 fruta. Acrescente 1–2 colheres de sopa de aveia se ainda sentir fome antes das 17h.'],
 ['17h · Antes de sair','1 pão francês ou 2 fatias integrais com frango e requeijão, ou queijo branco e tomate. Transporte refrigerado e guarde na geladeira do trabalho.'],
 ['Após o treino · Jantar','Use o almoço como referência. Opções: frango com mandioca e legumes; massa à bolonhesa com salada. Em dias sem treino, ajuste o lanche das 17h à fome e ao horário do jantar.'],
 ['Flexibilidade e acompanhamento','Duas refeições flexíveis no fim de semana e uma terceira ocasional na semana. Pizza (até 3 fatias), hambúrguer ou churrasco como opções. Cerveja é opcional. Não pule refeições para compensar. Compare médias de peso e cintura após duas semanas, junto com fome e rendimento.']
].map(([title,text])=>({title,text}))
export default function Nutrition(){
 const plan=useStore(s=>s.S.forgeNutrition);const update=useStore(s=>s.update)
 const save=next=>update(s=>{s.forgeNutrition=next})
 const edit=(i,key,value)=>save(plan.map((row,j)=>i===j?{...row,[key]:value}:row))
 return <div className="narrow" style={{padding:'20px 16px 100px'}}><h1>Minha alimentação</h1><p>Suas refeições e ajustes, salvos neste perfil do navegador. Exporte um backup nas configurações para guardar uma cópia.</p>
 {!plan ? <><p>Comece com o modelo em medidas caseiras que discutimos ou escreva seu próprio plano. As porções são iniciais e precisam de ajuste pela sua evolução; compartilhar o link não compartilha suas edições.</p><button className="btn" onClick={()=>save(TEMPLATE.map(x=>({...x})))}>Usar modelo em medidas caseiras</button> <button className="btn" onClick={()=>save([{title:'Minha refeição',text:''}])}>Criar meu plano</button></> : <>
 {plan.map((row,i)=><section key={i} style={{margin:'20px 0',padding:16,border:'1px solid var(--sep)',borderRadius:16}}><label style={{display:'block'}}>Horário / refeição<input style={{display:'block',width:'100%',margin:'8px 0'}} value={row.title} onChange={e=>edit(i,'title',e.target.value)}/></label><label style={{display:'block'}}>Alimentos e porções<textarea style={{display:'block',width:'100%',minHeight:125,marginTop:8}} value={row.text} onChange={e=>edit(i,'text',e.target.value)}/></label><button className="btn" onClick={()=>save(plan.filter((_,j)=>j!==i))}>Remover refeição</button></section>)}
 <button className="btn" onClick={()=>save([...plan,{title:'Nova refeição',text:''}])}>Adicionar refeição</button><p>Alterações salvas automaticamente neste navegador. Estes dados não sincronizam entre aparelhos.</p></>}
 <p><Link to="/plan">Abrir meu treino</Link> · <Link to="/home">Início</Link></p></div>
}
