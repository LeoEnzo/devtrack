# Roteiro para apresentar o DevTrack em entrevistas

Este documento existe por um motivo: **ter um projeto bom não basta — você precisa saber contá-lo.** Recrutador técnico raramente lê o código inteiro; ele faz perguntas e observa como você pensa.

---

## 1. Pitch de 60 segundos (decore a estrutura, não as palavras)

> “O DevTrack é uma aplicação full stack que resolve um problema que eu tive na prática: perder o controle das candidaturas de emprego.
>
> No front, React com TypeScript e um kanban com drag & drop nativo, mais um dashboard com taxa de resposta, funil e próximos passos.
>
> No back, uma API REST em Node.js e Express, com validação Zod, autenticação JWT e senhas com scrypt. A persistência é SQLite usando o módulo nativo do Node, sem ORM — o que me deixou com SQL explícito e zero dependência de banco.
>
> O projeto tem 14 testes de integração, roda CI no GitHub Actions e está publicado no Render. O maior aprendizado foi decidir escopo e terminar: entregar algo pequeno, funcionando e explicável.”

**Não comece pela stack.** Comece pelo problema e pelo resultado.

---

## 2. Demo ao vivo — roteiro de 3 minutos

1. **Login** com a conta demo. Comente: “o token JWT é emitido aqui e fica no `localStorage`”.
2. **Quadro**: mostre o card com follow-up atrasado em vermelho. “O dashboard usa a mesma data para priorizar.”
3. **Arraste um card** entre colunas e recarregue a página. “A atualização é otimista: o card move na hora, o PATCH vai em segundo plano; se falhar, eu reverto.”
4. **Crie uma candidatura** e mostre a validação (deixe empresa vazia ou URL inválida). “O Zod valida na API e as mensagens voltam por campo.”
5. **Dashboard**: mostre taxa de resposta, funil e atividade semanal. Explique a regra em uma frase: “taxa de resposta = processos que tiveram alguma resposta / candidaturas enviadas, excluindo as salvas”.
6. **Encerre com o que faria diferente**: “a maior dívida é o SQLite; com muitos usuários, migraria para Postgres mantendo as queries isoladas em um único arquivo”.

> Se a demo estiver lenta (plano free hiberna), tenha as screenshots do README abertas como plano B.

---

## 3. Arquitetura em 2 minutos

```text
React (Vite) ──HTTP/JSON──▶ Express ──SQL──▶ SQLite
   kanban, dashboard, auth        Zod, JWT, scrypt
```

- **Monorepo com npm workspaces**: `web/` e `server/`.
- **Em dev**, o Vite faz proxy de `/api` para `localhost:4000`.
- **Em produção**, o Express serve o build do Vite — um serviço só, menos CORS e menos deploy.
- **Camadas no servidor**: rota → validação (Zod) → repositório (db.ts) → SQLite. O `db.ts` concentra o SQL, o que facilita trocar o banco.
- **Autenticação**: `POST /auth/login` compara a senha com o hash `scrypt` e assina um JWT com validade de 7 dias. O middleware `requireAuth` valida o Bearer token em todas as rotas de dados.
- **Isolamento**: toda query filtra por `user_id`, inclusive no `DELETE`. Os testes cobrem isso.

---

## 4. Perguntas prováveis — e respostas honestas

### “Por que SQLite?”

“Porque o projeto é de portfólio e roda em um serviço só. O SQLite do Node (`node:sqlite`) me deu persistência real sem instalar banco, sem Docker e sem ORM — e me forçou a escrever SQL. O limite é claro: escrita concorrente e escala horizontal. Se virasse produto, o próximo passo é Postgres com Drizzle ou Prisma. Como todo o SQL está em `db.ts`, a migração é localizada.”

### “Como você guarda a senha?”

“Nunca em texto puro. Uso `scrypt` do `node:crypto` com salt aleatório de 16 bytes e chave de 64 bytes, no formato `scrypt:salt:hash`. Na verificação, recalculo e comparo com `timingSafeEqual` para evitar timing attack. Escolhi scrypt em vez de bcrypt para não depender de módulo com build nativo.”

### “Onde fica o JWT? Isso não é inseguro?”

“Fica no `localStorage` e vai no header `Authorization: Bearer`. É simples e funciona, mas eu sei o trade-off: qualquer XSS consegue ler. Em produção eu migraria para cookie `httpOnly` + `SameSite`, com proteção CSRF — e investiria em CSP. Deixei isso explícito no README e no roadmap porque decisão consciente vale mais do que fingir que não existe.”

### “Como você garante que um usuário não vê os dados de outro?”

“Não confio em nenhum id vindo do cliente. O `user_id` vem sempre do token, e todas as consultas incluem `WHERE user_id = ?`. Um `GET /applications/:id` de outro usuário retorna 404 — e não 403, para não vazar a existência do registro. Há um teste de integração específico para isso.”

### “Por que 404 e não 403?”

“Porque 403 confirmaria que o recurso existe. 404 não entrega informação nenhuma.”

### “Como funciona o drag & drop? Usou qual lib?”

“Nenhuma. Usei a API nativa do HTML5 (`draggable`, `dragstart`, `dragover`, `drop`). No drop eu chamo um PATCH. A atualização é otimista: movo o card no estado na hora e guardo a lista anterior; se a requisição falhar, restauro e mostro um erro. O que falta é suporte a teclado — por isso o roadmap inclui `dnd-kit`, que já resolve acessibilidade.”

### “O que acontece se a API cair?”

“O cliente HTTP lança um erro com mensagem amigável (‘não foi possível falar com o servidor’). No quadro, a movimentação é revertida; no formulário, o modal continua aberto com a mensagem, sem perder o que foi digitado. Ainda não há retry automático nem fila offline — anotado como evolução.”

### “Como você testou?”

“Com `node:test` e `fetch`, sem Jest nem Supertest. Cada execução sobe o app em uma porta aleatória com um arquivo SQLite temporário. Cobri cadastro, duplicidade de e-mail, validação, login certo e errado, rotas sem token, CRUD, filtros, estatísticas e isolamento entre usuários. Roda em cerca de 2 segundos no CI.”

### “O que não está testado?”

“Testes de componente/E2E no front, o drag & drop e o fluxo de erro de rede. Também não há teste de carga. É a lacuna mais óbvia — o próximo passo seria Playwright para um smoke test de login → criar → arrastar.”

### “Como você calcula a taxa de resposta?”

“`respostas / candidaturas enviadas`. Resposta = triagem, entrevista, oferta ou recusada. Enviadas = total menos as salvas. Ou seja: uma vaga salva e não aplicada não derruba minha taxa. O funil e a atividade semanal são calculados no servidor, em uma única leitura das candidaturas do usuário.”

### “Por que validar com Zod se o TypeScript já tipa?”

“Porque o TypeScript some em runtime. O cliente pode mandar qualquer JSON. O Zod é a fronteira: valida formato, tamanho e enums, e devolve erros por campo. Os tipos são inferidos do schema, então não duplico definição.”

### “Como você faria para escalar?”

“Primeiro, mediria. Depois: Postgres gerenciado, índices adequados (já tenho em `user_id, status`), paginação na listagem, cache das estatísticas, rate limiting nas rotas de auth, logs estruturados e métricas. O SQLite vira gargalo de escrita; a API stateless permite escalar horizontalmente.”

### “O que você faria diferente?”

“Três coisas: (1) começaria pelo deploy para descobrir problemas de ambiente cedo; (2) escreveria o README antes do código, para cortar escopo; (3) testaria o caminho de erro antes do caminho feliz. E trocaria o token no localStorage por cookie `httpOnly` desde o início.”

### “Qual foi o maior desafio?”

Tenha uma resposta real e específica. Exemplos possíveis:
- “Fazer o drop funcionar em colunas vazias — precisei de `preventDefault` no `dragover` e de um estado de destaque; no começo o navegador bloqueava o drop.”
- “O `node:sqlite` não tem ORM, então tive que cuidar manualmente do mapeamento snake_case ↔ camelCase e dos tipos.”
- “Descobrir que o Windows travava o arquivo do banco temporário no `after` dos testes; resolvi fechando a conexão antes do cleanup.”

---

## 5. Como não vender o projeto como “só mais um CRUD”

O que diferencia um CRUD de um projeto de portfólio é **o que você decidiu**:

| CRUD genérico | Como apresentar o DevTrack |
| --- | --- |
| “Fiz um cadastro de vagas” | “Resolvi um problema meu de organização e medi o resultado” |
| “Usei React e Node” | “Escolhi X por causa de Y; o trade-off foi Z” |
| “Tem login” | “Autenticação JWT, scrypt, isolamento por usuário e teste específico” |
| “Tem drag & drop” | “Drag & drop nativo com atualização otimista e rollback” |
| “Tem dashboard” | “Defini a regra de negócio da taxa de resposta e documentei” |
| “Está no GitHub” | “CI verde, 14 testes, deploy e README com decisões” |

Frase de fechamento:

> “O projeto é pequeno de propósito. Preferi entregar algo completo, testado e publicado a um monte de feature pela metade. E consigo explicar cada arquivo.”

---

## 6. Plano de estudo de 14 dias (1h/dia)

| Dia | Tema | O que fazer |
| --- | --- | --- |
| 1 | Visão geral | Ler `README`, `db.ts` e `app.ts`; desenhar o fluxo no papel |
| 2 | Express | Entender middlewares, ordem das rotas, error handler e a assinatura de 4 argumentos |
| 3 | Validação | Ler `schemas.ts`; testar erros no Insomnia/curl; entender `z.infer` |
| 4 | Autenticação | Ler `auth.ts`; explicar scrypt, salt, timingSafeEqual e JWT |
| 5 | Autorização | Seguir o `userId` do token até cada `WHERE user_id = ?` |
| 6 | SQL | Escrever queries do zero: listar, filtrar, atualizar dinamicamente |
| 7 | Testes | Ler a suíte; quebrar uma rota de propósito e ver o teste falhar |
| 8 | React | Fluxo de estado: App → BoardPage → modal; onde está a “fonte da verdade” |
| 9 | Drag & drop | Estudar os eventos nativos; reproduzir em um exemplo mínimo |
| 10 | CSS | Entender variáveis, grid do kanban, breakpoints |
| 11 | Deploy | Refazer o deploy do zero; explicar `render.yaml` |
| 12 | Simulação | Gravar você mesmo respondendo às perguntas da seção 4 |
| 13 | Melhorias | Implementar uma melhoria pequena e abrir PR (ex.: acessibilidade do DnD) |
| 14 | Descanso ativo | Revisar pitch e demo; publicar um post sobre o que aprendeu |

**Meta:** conseguir responder “por que?” para qualquer linha do projeto, não decorar.

---

## 7. Perguntas para fazer ao entrevistador

1. “Como o time decide o que entra no próximo ciclo? Existe espaço para dívida técnica?”
2. “Qual é o maior desafio técnico do time hoje?”
3. “Como é o processo de code review e o que se espera de um dev júnior nos primeiros 90 dias?”

---

## 8. Erros que evitam uma má impressão

- Dizer “é só um CRUD” — você desvaloriza o próprio trabalho.
- Inventar experiência: se não sabe, diga “não sei, mas eu investigaria assim…”. Isso pontua mais que blefe.
- Criticar a empresa atual/anterior.
- Falar 10 minutos sem pausa. Pitch de 60s, depois espere perguntas.
- Não saber onde está o código: tenha o repositório aberto e saiba navegar nele.
