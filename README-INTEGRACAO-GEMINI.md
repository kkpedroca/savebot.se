# SaveBot — integração segura com Gemini API

Este pacote atualiza os dois arquivos HTML enviados (`index.html` e `computer_chat.html`) para chamar o Gemini por meio de um Cloudflare Worker. A chave **não fica no HTML, no navegador nem no GitHub**.

## 1. Arquivos
- `index.html`: chat principal SaveBot, usando o Worker já configurado no projeto.
- `computer_chat.html`: chat de computadores, apontando para o mesmo Worker.
- `worker.js`: backend Cloudflare Worker que recebe o histórico, consulta Gemini 2.0 Flash e devolve a resposta.

## 2. Configurar o Secret no Cloudflare
No painel Cloudflare:
1. Abra **Workers & Pages** e selecione o Worker `savebot` (o endereço atual é `savebot.pedrogt998.workers.dev`).
2. Entre em **Settings → Variables and Secrets**.
3. Adicione uma variável do tipo **Secret** chamada `GEMINI_API_KEY`.
4. Cole a chave nova do Google AI Studio no campo de valor e salve.
5. Faça deploy/publicação do código de `worker.js` no Worker existente.

Não coloque a chave em `worker.js`, nos arquivos HTML, em commits ou em mensagens públicas. Como uma chave foi compartilhada anteriormente, revogue-a no Google AI Studio e gere outra antes de cadastrar o Secret.

## 3. Publicar
- Substitua os arquivos correspondentes no repositório pelos HTML deste pacote.
- Publique `worker.js` no Worker que atende `https://savebot.pedrogt998.workers.dev/`.
- O endpoint esperado é `POST https://savebot.pedrogt998.workers.dev/api/generateContent`.

Se o domínio público do site for diferente dos domínios listados em `ALLOWED_ORIGINS`, acrescente o domínio exato à lista no início de `worker.js`.

## 4. Teste
Abra o SaveBot, envie uma pergunta simples no chat principal e depois teste a página `computer_chat.html`. No DevTools → Network, a chamada deve ir para `/api/generateContent` no domínio do Worker, não diretamente para `generativelanguage.googleapis.com`.

## Observações
- O backend repassa o conteúdo do histórico e os anexos em formato `inline_data` já montados pelo front-end.
- Os recursos avançados que ainda usam `simulateBackendCall` continuam sendo simulações/implementações separadas; esta integração habilita a chamada normal ao Gemini.
- O Worker não registra a chave nem armazena o conteúdo das conversas.
