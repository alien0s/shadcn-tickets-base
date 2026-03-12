🎯 Fluxo de Onboarding do ClienteEtapa 1 — Landing Page / Planosseuapp.com/planos

→ Cliente escolhe um plano
→ Clica em "Assinar"Etapa 2 — Criação de Contaseuapp.com/cadastro

→ Nome completo
→ Email
→ Senha
→ Clica em "Criar conta"Aqui ele ainda não tem empresa, só um usuário criado.Etapa 3 — Onboarding (a tela que você mencionou)seuapp.com/onboarding

→ "Como vai se chamar sua empresa no sistema?"
   [ minhaempresa        ].seuapp.com
   
→ Verifica se o slug está disponível (em tempo real)
→ Clica em "Confirmar"✅ Aqui o tenant é criado e vinculado ao usuário
✅ O slug vira o subdomínio deleEtapa 4 — Redirecionamento→ Sistema cria:
   - O tenant no banco
   - O usuário como "admin" desse tenant
   - O subdomínio: minhaempresa.seuapp.com

→ Redireciona para:
   minhaempresa.seuapp.com/dashboardEtapa 5 — Logins futurosseuapp.com/login  (ou minhaempresa.seuapp.com/login)

→ Email + senha
→ Backend identifica o tenant pelo subdomínio ou pelo email
→ Gera JWT com tenant_id
→ Redireciona pro dashboard🗺️ Visão Geral do FluxoLanding Page
    ↓
Escolhe Plano
    ↓
Cadastro (email + senha)
    ↓
Onboarding → define o slug "minhaempresa"
    ↓
Tenant criado no banco
    ↓
Redireciona → minhaempresa.seuapp.com/dashboard
    ↓
Logins futuros → minhaempresa.seuapp.com/login🔑 Ponto importanteNa Etapa 3 você pode deixar bem visual pra ele:
"Seu sistema ficará disponível em:"
minhaempresa.seuapp.com
Isso dá percepção de valor imediata — ele já sente que tem um espaço próprio antes mesmo de pagar. 💡