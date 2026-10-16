# FORGE · openGym — teste pessoal não comercial

Fork com animações originais de 180px, sem modificações. Preserve NOTICE.md e catalogue/media/NOTICE.md. Código sob AGPL; mídia não está sob AGPL.

## Compilar

Node 22. npm --prefix frontend ci; VITE_DEMO=1 npm --prefix frontend run build; node scripts/catalogue/stage-media.mjs frontend/dist

Publique frontend/dist como site estático. HashRouter dispensa rewrite. Perfil vazio, idioma inicial pt-BR, dados locais no navegador. Não há contas nem sincronização. Exportar backup nas configurações. Reset demo limpa o perfil local. Não publicar dados pessoais no repositório. As restrições clínicas do Titan FORGE não são importadas.
