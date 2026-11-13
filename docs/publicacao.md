# Publicando o DevTrack (GitHub + LinkedIn + outros)

Guia prático, na ordem. Leva cerca de **2 a 3 horas** no total (fora o tempo de deploy).

---

## 0. Antes de publicar — checklist de 5 minutos

- [ ] `npm test` e `npm run build` passando.
- [ ] Trocar **“Seu Nome”**, `SEU-USUARIO` (no README, inclusive no badge da CI) e os links no final do `README.md`.
- [ ] Conferir se as 4 screenshots estão em `docs/screenshots/`.
- [ ] Testar o fluxo completo localmente: cadastro → criar card → arrastar → dashboard.
- [ ] Escolher o nome do repositório: **`devtrack`** (curto e fácil de lembrar).
- [ ] Ter uma conta no GitHub e no LinkedIn atualizadas (foto, headline, “Sobre”).

---

## 1. Git e GitHub

> **Neste computador o Git ainda não está instalado.** Instale com um destes comandos e reabra o terminal:

```powershell
winget install --id Git.Git -e --source winget
```

Ou baixe em <https://git-scm.com/download/win>.

### Primeiro commit

```bash
# na pasta do projeto
git init
git config user.name "Seu Nome"
git config user.email "seu@email.com"

git add .
git commit -m "feat: DevTrack - rastreador de candidaturas full stack"

git branch -M main
```

### Criar o repositório e enviar

1. No GitHub: **New repository** → nome `devtrack` → **Public** → **não** marque “Add a README”.
2. Copie a URL e rode:

```bash
git remote add origin https://github.com/SEU-USUARIO/devtrack.git
git push -u origin main
```

O `.gitignore` já protege `node_modules/`, o banco em `server/data/` e arquivos `.env`.

> Dica: faça commits pequenos e com mensagens no padrão `feat:`, `fix:`, `docs:`, `test:`. Recrutadores olham o histórico.

---

## 2. Deixar o repositório com cara de portfólio

Na página do repositório, clique na engrenagem ao lado de **About**:

**Descrição (escolha uma):**

> Rastreador de candidaturas full stack com kanban, dashboard de métricas e autenticação JWT. React 19 + Node.js + TypeScript + SQLite.

> Organize sua busca por vagas: kanban com drag & drop, funil de candidaturas e alertas de follow-up. Projeto full stack em React, Express e TypeScript.

**Topics** (cole um por um):

```text
react nodejs typescript express sqlite vite jwt rest-api kanban fullstack portfolio
```

**Website:** cole a URL do deploy (passo 3). Enquanto não tiver, deixe vazio.

**Outros ajustes:**

- Em **Settings → Social preview**, suba `docs/screenshots/dashboard.png` (imagem que aparece ao compartilhar o link).
- Fixe o repositório no seu perfil (**Customize your pins**).
- Confirme se o GitHub Actions está verde (aba **Actions**).

---

## 3. Deploy (Render)

O projeto já tem `render.yaml` pronto.

1. Crie uma conta em <https://render.com> (pode entrar com GitHub).
2. **New → Blueprint** → selecione o repositório `devtrack`.
3. O Render lê o `render.yaml` e cria o serviço com build, start, health check e disco.
4. Confirme. O primeiro deploy leva alguns minutos.
5. Abra `https://SEU-APP.onrender.com/api/health` e depois a raiz do site.
6. Teste: login demo → criar card → arrastar → recarregar a página (os dados devem persistir).

### Se quiser 100% grátis

Remova o bloco `disk` do `render.yaml` e use o plano free. O banco SQLite é recriado com os dados demo a cada deploy — aceitável para demo, mas **deixe isso claro no LinkedIn**: “demo pública, dados podem resetar”.

Alternativa para o front: Vercel + API no Render. Nesse caso configure:

- No Render: `WEB_ORIGIN=https://seu-app.vercel.app`
- Na Vercel: `VITE_API_URL=https://sua-api.onrender.com/api`

### Depois do deploy

- [ ] Link abre em aba anônima e mostra a tela de login.
- [ ] Botão “Ver demonstração” funciona.
- [ ] Cadastro novo funciona.
- [ ] Nenhum erro no console (F12).
- [ ] Atualize o campo **Website** no GitHub.
- [ ] Adicione o link no topo do README, se quiser (`**🔗 Demo:** ...`).

---

## 4. LinkedIn — 3 posts prontos

Regras que aumentam alcance:

- **Não coloque o link no corpo do post** — deixe no **primeiro comentário** e diga “link nos comentários”. O LinkedIn reduz a entrega de posts com link externo.
- Use de **3 a 5 hashtags**, no fim.
- Poste entre **terça e quinta, 8h–10h** (horário de Brasília).
- Nas primeiras 2 horas, responda **todos** os comentários.
- Imagem: use `dashboard.png` ou monte um carrossel de 3 slides (problema → board → dashboard). Tamanho 1200×627 ou 1080×1350.

### Post 1 — Lançamento (o mais importante)

```text
Sabe a planilha que a gente cria para organizar a busca por emprego
e abandona na terceira linha? Eu transformei a minha em um produto.

Durante minha busca por vaga de dev, eu vivia perdido: não sabia
em qual etapa estava cada processo, esquecia follow-ups e não tinha
ideia da minha taxa de resposta.

Então construí o DevTrack. 🚀

É uma aplicação full stack que:
• organiza candidaturas em um kanban com drag & drop
• mostra entrevistas, ofertas, funil e taxa de resposta
• avisa quando um follow-up está atrasado
• tem login, cadastro e dados isolados por usuário

Stack: React 19 + TypeScript no front, Node.js + Express + Zod na API,
SQLite nativo, JWT com senha protegida por scrypt, testes de integração
e CI no GitHub Actions.

O que mais aprendi não foi a stack — foi terminar. Escopo pequeno,
entregar, publicar e depois melhorar.

Demo e código estão nos comentários. 👇
Feedback é muito bem-vindo, principalmente de quem contrata dev júnior.

#desenvolvimentoweb #react #nodejs #typescript #carreiratech
```

**Primeiro comentário:**

```text
🔗 Demo: https://SEU-APP.onrender.com
💻 Código: https://github.com/SEU-USUARIO/devtrack

Conta demo: demo@devtrack.dev / devtrack123
```

### Post 2 — Técnico (para ser visto como dev, não só como “entusiasta”)

```text
Um detalhe que quase ninguém vê no meu projeto, mas que mudou o código:

Eu implementei o drag & drop do kanban sem biblioteca nenhuma.

Por que? Queria entender o que acontece por baixo do React. Usei a
API nativa do HTML5 (dragstart, dragover, drop) e, principalmente,
fiz atualização otimista:

1. O card muda de coluna na hora, sem esperar a API
2. A requisição PATCH é enviada em segundo plano
3. Se o servidor falhar, o card volta para a coluna original e um
   aviso aparece

Isso deixa a interface instantânea e me obrigou a pensar em estados
de erro — algo que a maioria dos tutoriais ignora.

Outras decisões que consigo defender em entrevista:
• node:sqlite em vez de ORM → SQL explícito e zero dependência de banco
• scrypt do node:crypto em vez de bcrypt → sem build nativo
• Zod na borda da API → erro de validação vira mensagem no formulário
• node:test + fetch em vez de Jest/Supertest → 14 testes rodando em ~2s

Código aberto. Adoro trocar ideia sobre arquitetura e trade-offs. 👇

#nodejs #react #typescript #engenhariadesoftware #desenvolvimentoweb
```

### Post 3 — retrospectiva / aprendizado (gera comentários)

```text
Terminei meu projeto de portfólio. E, se pudesse voltar 3 semanas,
mudaria 3 coisas:

1. Ter começado pelo deploy.
Deixar para publicar no final fez eu descobrir problemas de ambiente
quando já estava cansado do projeto.

2. Ter escrito o README antes do código.
Documentar o problema e o escopo me ajudou a cortar features que não
agregavam.

3. Ter testado o fluxo de erro antes do caminho feliz.
Drag & drop bonito não vale nada se a API cai e o card some.

O saldo: uma aplicação full stack de verdade — autenticação, API REST,
testes, CI e deploy — e muito mais confiança para falar sobre código.

O que você faria diferente? 👇

#carreiratech #devjunior #portfolio #programacaoweb
```

### Versão em inglês (para recrutadores internacionais)

```text
I built a job application tracker to solve my own problem: losing track
of interviews and follow-ups.

DevTrack is a full stack app with:
• Kanban board with native drag & drop
• Metrics dashboard (response rate, funnel, weekly activity)
• JWT auth with scrypt-hashed passwords
• REST API with Express + Zod, SQLite, 14 integration tests, CI/deploy

Stack: React 19, TypeScript, Node.js, Express, Vite.

Demo and code in the comments. Open to junior/entry-level roles. 👇

#webdev #react #nodejs #typescript #opensource
```

---

## 5. Seção “Projetos” do LinkedIn

Em **Perfil → Adicionar seção → Projetos**:

- **Nome:** DevTrack — rastreador de candidaturas
- **Link:** URL da demo
- **Descrição:**

```text
Aplicação full stack para organizar candidaturas de emprego em um kanban,
com dashboard de funil, taxa de resposta e alertas de follow-up.
Front-end em React 19 + TypeScript (Vite); API em Node.js + Express com
validação Zod e autenticação JWT; persistência em SQLite; 14 testes de
integração com node:test; CI no GitHub Actions; deploy no Render.
```

- **Skills:** React.js, Node.js, TypeScript, Express.js, SQL, REST APIs, Git, GitHub Actions

---

## 6. Outros lugares para publicar

| Onde | O que fazer |
| --- | --- |
| **GitHub** | README do perfil com card do projeto + repo fixado |
| **Currículo** | Adicionar como “Projeto pessoal” com 2–3 bullets (veja abaixo) |
| **Portfólio pessoal** | Card com screenshot, descrição de 3 linhas e botões “Demo” / “Código” |
| **dev.to / Medium** | Artigo técnico: “Como fiz um kanban com drag & drop nativo no React” |
| **TabNews** | Post no formato “Show HN”: o que é, por que fiz, o que aprendi |
| **Reddit** | r/brdev e r/ProgramacaoBrasil (leia as regras de self-promotion; conte a história, não só o link) |
| **Discords / Slacks de comunidades** | Canal `#showcase` ou `#projetos` |
| **Wellfound / Trampos / Programathor** | Perfil com link do projeto |

### Bullets prontos para o currículo

```text
DevTrack — Rastreador de candidaturas (projeto pessoal)
• Desenvolvi uma aplicação full stack (React 19 + TypeScript, Node.js + Express)
  com kanban de candidaturas, dashboard de métricas e autenticação JWT.
• Modelei a API REST com validação Zod, isolamento de dados por usuário e
  persistência em SQLite; implementei drag & drop nativo com atualização otimista.
• Escrevi 14 testes de integração, configurei CI no GitHub Actions e realizei
  o deploy em produção no Render.
```

---

## 7. Rotina de divulgação (2 semanas)

| Dia | Ação |
| --- | --- |
| D1 | Publicar o Post 1 + primeiro comentário com links |
| D2 | Responder comentários e enviar o projeto para 3 colegas pedirem feedback |
| D4 | Publicar o artigo técnico no dev.to e compartilhar nos stories |
| D6 | Post 2 (técnico) |
| D8 | Atualizar a seção Projetos + currículo + portfólio |
| D10 | Postar no TabNews/Reddit (com contexto, sem spam) |
| D12 | Post 3 (retrospectiva) e pedir indicação de vaga nos comentários |
| D14 | Revisar métricas: visualizações, cliques no link, mensagens recebidas |

**Meta realista:** 1.500+ visualizações, 30+ reações e 3–5 conversas. O objetivo não é viralizar — é ter uma prova concreta de trabalho para mostrar.

---

## 8. Checklist final

- [ ] Repositório público, README com screenshots e CI verde.
- [ ] Demo no ar e testada em aba anônima.
- [ ] LinkedIn com projeto na seção Projetos e 3 posts publicados.
- [ ] Currículo atualizado com o projeto.
- [ ] Link do projeto no topo do perfil e na headline, se fizer sentido.
- [ ] Você consegue explicar **qualquer** arquivo do projeto (veja `docs/roteiro-entrevista.md`).
