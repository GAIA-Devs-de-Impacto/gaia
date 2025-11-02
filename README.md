# Agente de IA para Lixo Eletrônico (GAIA REEE)

GAIA REEE (Agente de Inteligência Artificial para Gerenciamento de Resíduos de Equipamentos Eletroeletrônicos) é uma aplicação web inovadora projetada para auxiliar os usuários no descarte correto de lixo eletrônico. Utilizando o poder da API Google Gemini, o GAIA REEE oferece uma interface interativa e inteligente para identificar resíduos, encontrar os pontos de coleta mais próximos e educar sobre a importância da reciclagem de eletrônicos.

## ✨ Funcionalidades

A aplicação é dividida em três módulos principais, cada um projetado para uma necessidade específica do usuário:

### 1. 📸 Identificar Resíduo (Analisador de Imagem)
- **O que faz?** Permite que o usuário envie uma foto de um item eletrônico. A IA analisa a imagem, identifica o tipo de resíduo e fornece instruções detalhadas sobre como e onde descartá-lo corretamente.
- **Tecnologia:** Utiliza o modelo multimodal `gemini-2.5-flash` para processar a imagem e o texto da solicitação do usuário.

### 2. 🎙️ Agente ao Vivo (Conversa por Voz)
- **O que faz?** Oferece uma experiência de conversação em tempo real com um agente de IA. Os usuários podem falar diretamente com o agente para tirar dúvidas, solicitar informações e obter ajuda para encontrar pontos de coleta. A IA utiliza a geolocalização do usuário para fornecer as recomendações mais relevantes.
- **Tecnologia:** Implementado com a API Live do Gemini (`gemini-2.5-flash-native-audio-preview-09-2025`), estabelecendo um fluxo de áudio bidirecional para transcrição de entrada/saída e respostas de voz sintetizadas.

### 3. 💬 Chat de Texto (ChatBot com Aterramento)
- **O que faz?** Um chatbot de texto onde os usuários podem fazer perguntas sobre lixo eletrônico. O bot fornece respostas atualizadas e contextuais, utilizando a busca do Google e o Google Maps para encontrar informações e locais de descarte.
- **Tecnologia:** Usa o modelo `gemini-2.5-flash` com aterramento (grounding) nas ferramentas do Google Search e Google Maps, combinado com um banco de dados interno de coletores parceiros para fornecer respostas precisas e geolocalizadas. A funcionalidade de Text-to-Speech (`gemini-2.5-flash-preview-tts`) permite ouvir as respostas do agente.

## 🛠️ Tecnologias Utilizadas

- **Frontend:**
  - **React:** Biblioteca para construção da interface de usuário.
  - **TypeScript:** Superset do JavaScript que adiciona tipagem estática.
  - **Tailwind CSS:** Framework de CSS utilitário para estilização rápida.

- **Inteligência Artificial (Google Gemini API):**
  - `gemini-2.5-flash`: Para análise de imagem e geração de texto no chatbot.
  - `gemini-2.5-flash-native-audio-preview-09-2025`: Para a experiência de conversação por voz em tempo real.
  - `gemini-2.5-flash-preview-tts`: Para a conversão de texto em fala.
  - **Grounding (Google Search & Maps):** Para fornecer respostas atualizadas e baseadas em localização no chatbot.

- **APIs do Navegador:**
  - **Geolocation API:** Para obter a localização do usuário e personalizar as recomendações.
  - **Web Audio API:** Para capturar e reproduzir áudio no navegador.

## 🚀 Como Executar

Para executar este projeto, você precisará de uma chave de API do Google Gemini.

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/gaia-reee.git
   ```

2. **Instale as dependências:**
   O projeto utiliza um `importmap` no `index.html` para carregar as dependências (React, @google/genai) diretamente de um CDN, portanto, uma etapa de instalação tradicional com `npm install` pode não ser necessária se você estiver executando em um ambiente que suporte isso.

3. **Configure sua Chave de API:**
   A aplicação espera que a chave da API do Google Gemini esteja disponível como uma variável de ambiente (`process.env.API_KEY`). Em ambientes de desenvolvimento como o AI Studio, essa variável é injetada automaticamente.

4. **Inicie a aplicação:**
   Abra o arquivo `index.html` em um servidor de desenvolvimento local ou em seu navegador.

## 📂 Estrutura do Projeto
```
/
├── public/
├── src/
│   ├── components/      # Componentes React reutilizáveis (ImageAnalyzer, LiveAgent, ChatBot, Icons)
│   ├── data/            # Dados estáticos (lista de coletores parceiros)
│   ├── services/        # Lógica de comunicação com a API Gemini
│   ├── utils/           # Funções utilitárias (processamento de áudio)
│   ├── App.tsx          # Componente principal que gerencia a navegação por abas
│   ├── index.tsx        # Ponto de entrada da aplicação React
│   └── types.ts         # Definições de tipos TypeScript
├── index.html           # Arquivo HTML principal
└── README.md            # Este arquivo
```

## 👥 Autores

Este projeto foi desenvolvido por:

- **Vitoriano Martin** - [GitHub](https://github.com/VitorianoFM/)
- **Felipe Fuhrmann** - [GitHub](https://github.com/FelipeFuhrmann/)
- **Lilian Ferreira** - [GitHub](https://github.com/LilianFerreira/)

---

*Construído com ❤️ e o poder da IA para um planeta mais sustentável.*
