# SaveBot — Render + GitHub (sem Cloudflare)

## Alterações
- Os dois chats chamam `/api/generateContent` no mesmo domínio Render.
- Removida a chamada direta ao Gemini e a chave Gemini literal do `computer_chat.html`.
- Removido o endereço do Cloudflare Worker do `index.html`.
- Backend Node.js/Express lê `GEMINI_API_KEY` exclusivamente do ambiente do servidor.
- Firebase Authentication e Firestore foram mantidos.
- Inclui Helmet, limite básico de requisições e limite de tamanho do corpo.

## Estrutura
```text
SaveBot/
├── public/
│   ├── index.html
│   └── computer_chat.html
├── server.js
├── package.json
├── .gitignore
└── .env.example
```

## GitHub
1. Faça backup do repositório atual.
2. Copie estes arquivos para a raiz do repositório SaveBot.
3. Confira que `.env` e qualquer chave real não estão no Git.
4. Faça commit e push.

## Render — Web Service
- Runtime: Node
- Branch: `main` (ou a branch usada)
- Root Directory: vazio
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health`

Em Environment, cadastre:
- `GEMINI_API_KEY` = chave nova do Google AI Studio
- `GEMINI_MODEL` = `gemini-2.5-flash`

Não coloque o valor da chave no GitHub, HTML ou JavaScript do navegador.

## Testes
1. Abra `/health` e confirme `{"status":"ok","service":"SaveBot"}`.
2. Teste o chat principal e `/computer_chat.html`.
3. No DevTools > Network, confirme que o navegador chama `/api/generateContent` no domínio Render, nunca diretamente o Google Gemini.
4. Procure `workers.dev` nos arquivos publicados: não deve existir. A configuração Firebase Web continua no cliente e é distinta da chave Gemini.

## Rotação de chave
O HTML original de computadores continha uma chave Gemini literal. Considere-a comprometida, revogue-a no Google AI Studio e cadastre uma chave nova apenas no Environment do Render.

## Limitações herdadas do original
- Texto e imagens/vídeos inline são encaminhados ao Gemini. A extração real de PDFs/Word e URLs externas pode exigir processamento adicional; o HTML original já tratava parte desses anexos com placeholders.
- Calendário/lembretes, análise documental e geração personalizada em `simulateBackendCall` eram simulações, não integrações reais. O chat passa a consultar a IA, mas não cria eventos ou lembretes reais.
- Inclua o domínio Render em Firebase Authentication > Authorized domains e mantenha Firestore Security Rules restritas ao usuário autenticado (`request.auth.uid`).
- A `apiKey` do Firebase Web é normalmente pública por desenho; proteja o projeto com regras, restrições apropriadas e App Check.
