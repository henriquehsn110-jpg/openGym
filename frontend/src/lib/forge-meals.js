export const LEGACY_TEMPLATE = [
 ['9h · Café da manhã','2 fatias integrais com 3 colheres de sopa de frango desfiado e um pouco de requeijão. Café com leite. Alternativa: 2 ovos no lugar do frango.'],
 ['11h40 · Almoço','Metade do prato com legumes e salada; 3–4 colheres de sopa de arroz, 1 concha média de feijão e 1 bife grande ou 2 pequenos. Batata ou mandioca pode substituir parte do arroz.'],
 ['Após o almoço','Uma fruta com o café. Se quiser chocolate, escolha uma porção, como um bombom, como sobremesa.'],
 ['15h · Lanche','1 pote de iogurte natural e 1 fruta. Acrescente 1–2 colheres de sopa de aveia se ainda sentir fome antes das 17h.'],
 ['17h · Antes de sair','1 pão francês ou 2 fatias integrais com frango e requeijão, ou queijo branco e tomate. Transporte refrigerado e guarde na geladeira do trabalho.'],
 ['Após o treino · Jantar','Use o almoço como referência. Opções: frango com mandioca e legumes; massa à bolonhesa com salada. Em dias sem treino, ajuste o lanche das 17h à fome e ao horário do jantar.'],
 ['Flexibilidade e acompanhamento','Duas refeições flexíveis no fim de semana e uma terceira ocasional na semana. Pizza (até 3 fatias), hambúrguer ou churrasco como opções. Cerveja é opcional. Não pule refeições para compensar. Compare médias de peso e cintura após duas semanas, junto com fome e rendimento.']
].map(([title,text])=>({title,text}))


// Three alternatives are choices for one meal, not foods to combine in the same meal.
export const TEMPLATE = [
 {id:'breakfast',title:'9h · Café da manhã',text:'Escolha uma opção. Café sem açúcar ou com a quantidade habitual registrada; o leite faz parte da refeição.',options:[
  {name:'Sanduíche de frango',text:'2 fatias de pão integral + 4 colheres de sopa de frango desfiado (cerca de 80 g) + tomate. Café com 150 ml de leite.'},
  {name:'Ovos e pão',text:'2 ovos mexidos + 2 fatias de pão integral + 1 fruta pequena. Café com 150 ml de leite.'},
  {name:'Iogurte com aveia',text:'1 pote de iogurte natural (170 g) + 3 colheres de sopa de aveia (30 g) + 1 banana + 2 colheres de sopa de leite em pó (20 g).'}]},
 {id:'lunch',title:'11h40 · Almoço',text:'Escolha uma opção. Inclua legumes e salada; ajuste o tempero e registre o óleo usado no preparo.',options:[
  {name:'Arroz, feijão e frango',text:'4 colheres de sopa de arroz cozido (cerca de 100 g) + 1 concha média de feijão (100 g) + 1 filé de frango (150 g pronto) + legumes e salada.'},
  {name:'Carne e batata',text:'1 bife magro (150 g pronto) + 1 batata média a grande cozida (180 g) + meia concha de feijão + legumes e salada.'},
  {name:'Peixe e mandioca',text:'1 filé de peixe (180 g pronto) + 3 pedaços pequenos de mandioca cozida (120 g) + meia concha de feijão + legumes e salada.'}]},
 {id:'dessert',title:'Após o almoço · Sobremesa opcional',text:'Se quiser sobremesa, escolha uma opção. Não é uma refeição adicional obrigatória.',options:[
  {name:'Fruta',text:'1 laranja, maçã ou pera média.'},
  {name:'Iogurte',text:'1 pote de iogurte natural (170 g), com canela se gostar.'},
  {name:'Chocolate',text:'1 porção pequena de chocolate (cerca de 20 g), conforme sua preferência.'}]},
 {id:'snack',title:'15h · Lanche',text:'Escolha uma opção. Se a fome persistir, registre para ajustar a porção junto ao restante do dia.',options:[
  {name:'Iogurte e fruta',text:'1 pote de iogurte natural (170 g) + 1 fruta + 2 colheres de sopa de aveia (20 g).'},
  {name:'Pão com queijo',text:'2 fatias de pão integral + 2 fatias médias de queijo minas frescal (60 g) + tomate.'},
  {name:'Vitamina',text:'250 ml de leite + 1 banana + 2 colheres de sopa de aveia (20 g), batidos sem açúcar adicional.'}]},
 {id:'preworkout',title:'17h · Antes de sair',text:'Escolha uma opção para o treino das 19h. Transporte alimentos perecíveis refrigerados. Em dias sem treino, ajuste este lanche à fome e ao jantar.',options:[
  {name:'Sanduíche de frango',text:'1 pão francês + 4 colheres de sopa de frango desfiado (cerca de 80 g) + tomate.'},
  {name:'Tapioca com ovos',text:'1 tapioca com 3 colheres de sopa de goma hidratada (50 g) + 2 ovos mexidos.'},
  {name:'Iogurte, banana e aveia',text:'1 pote de iogurte natural (170 g) + 1 banana + 3 colheres de sopa de aveia (30 g).'}]},
 {id:'dinner',title:'Após o treino · Jantar',text:'Escolha uma opção. Não precisa eliminar carboidratos à noite. Em dias sem treino, mantenha a refeição e ajuste as porções conforme a evolução.',options:[
  {name:'Prato do dia',text:'4 colheres de sopa de arroz cozido (100 g) + 1 concha média de feijão (100 g) + 150 g de frango ou carne magra prontos + legumes e salada.'},
  {name:'Macarrão à bolonhesa',text:'1 prato raso de macarrão cozido (150 g) + carne moída magra (120 g pronta) com molho de tomate + salada.'},
  {name:'Frango com mandioca',text:'1 filé de frango (150 g pronto) + mandioca cozida (150 g) + legumes e salada.'}]},
 {id:'flexibility',title:'Flexibilidade e acompanhamento',text:'Duas refeições flexíveis no fim de semana e uma terceira ocasional durante a semana, ajustadas à sua rotina. Não pule refeições para compensar. Compare média de peso, cintura, fome e rendimento após duas semanas. As opções são sugestões de composição: não têm calorias e proteínas idênticas e não constituem uma meta energética individual calculada.'}
]
export const cloneMeals = () => structuredClone(TEMPLATE)
