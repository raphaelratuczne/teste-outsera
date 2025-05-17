# API Golden Raspberry Awards - Pior Filme

Esta é uma API RESTful desenvolvida em Node.js que permite consultar a lista de indicados e vencedores da categoria "Pior Filme" do Golden Raspberry Awards. A API fornece um endpoint para identificar os produtores com o maior e o menor intervalo entre dois prêmios consecutivos.

A aplicação lê dados de um arquivo CSV na inicialização e os armazena em um banco de dados SQLite em memória.

## Pré-requisitos

- **Node.js**: Versão 14.x ou superior (inclui npm). Você pode baixar em [nodejs.org](https://nodejs.org/).

## Configuração do Projeto

1.  **Clone o Repositório (ou copie os arquivos)**
    Se você recebeu os arquivos como um `.zip`, extraia-os para uma pasta de sua escolha. Se for um repositório git:

    ```bash
    git clone <url-do-repositorio>
    cd nome-da-pasta-do-projeto
    ```

2.  **Instale as Dependências**
    Navegue até o diretório raiz do projeto (onde o arquivo `package.json` está localizado) e execute o seguinte comando no seu terminal para instalar todas as dependências necessárias:

    ```bash
    npm install
    ```

3.  **Configure o Arquivo de Dados (`movielist.csv`)**

    - Crie uma pasta chamada `data` na raiz do projeto, se ela ainda não existir.
    - Dentro da pasta `data`, coloque o arquivo CSV contendo os dados dos filmes. O arquivo **deve** se chamar `movielist.csv`.
    - **Formato do CSV:**
      - O delimitador deve ser ponto e vírgula (`;`).
      - A primeira linha deve ser o cabeçalho: `year;title;studios;producers;winner`
      - O campo `winner` deve ser "yes" para vencedores ou ficar vazio para indicados.

    **Exemplo de `data/movielist.csv`:**

    ```csv
    year;title;studios;producers;winner
    1980;Can't Stop the Music;Associated Film Distribution;Allan Carr;yes
    1980;Cruising;Lorimar Productions, United Artists;Jerry Weintraub;
    1980;The Formula;MGM, United Artists;Steve Shagan;
    2015;Fantastic Four;20th Century Fox, Marvel Entertainment;Simon Kinberg, Gregory Goodman, Hutch Parker, Matthew Vaughn, Bryan Singer;yes
    2015;Fifty Shades of Grey;Universal Pictures, Focus Features;Michael De Luca, Dana Brunetti, E. L. James;yes
    2016;Hillary's America: The Secret History of the Democratic Party;D'Souza Media;Gerald R. Molen;yes
    2017;The Emoji Movie;Columbia Pictures;Michelle Raimo Kouyate;yes
    ```

## Estrutura do Projeto

O projeto segue uma estrutura de pastas organizada por responsabilidades:

```
.
├── __tests__/             # Testes de integração
├── controllers/          # Controladores (lógica de requisição/resposta HTTP)
├── data/                 # Arquivos de dados (ex: movielist.csv)
├── services/             # Lógica de negócios da aplicação
├── utils/                # Funções utilitárias
├── database.js           # Configuração e acesso ao banco de dados
├── server.js             # Configuração do servidor Express e rotas principais
├── package.json          # Metadados do projeto e dependências
├── README.md             # Este arquivo
└── ... (outros arquivos de configuração)
```

## Executando a Aplicação

Após a instalação das dependências e configuração do arquivo CSV, você pode iniciar o servidor.

- **Para produção/uso normal:**

  ```bash
  npm start
  ```

- **Para desenvolvimento (com reinício automático ao salvar arquivos, se `nodemon` estiver instalado como devDependency):**
  ```bash
  npm run dev
  ```

Por padrão, o servidor será iniciado em `http://localhost:3000`. Você verá mensagens no console indicando que o servidor está rodando e os endpoints disponíveis.

## Executando os Testes

O projeto utiliza Jest para testes de integração e Supertest para realizar requisições HTTP à API durante os testes.

1.  **Certifique-se de que as dependências de desenvolvimento estão instaladas:**
    Se você executou `npm install` (ou `yarn install`) conforme as instruções de configuração, as dependências de teste (`jest`, `supertest`, `cross-env`) já devem estar instaladas.

2.  **Execute os testes:**
    No diretório raiz do projeto, execute o seguinte comando:

    ```bash
    npm test
    ```

    ou, se estiver usando Yarn:

    ```bash
    yarn test
    ```

Isso executará a suíte de testes de integração localizada na pasta `__tests__`. Os testes verificam o comportamento dos endpoints da API, incluindo diferentes cenários de filtragem e a lógica de cálculo de intervalos de prêmios dos produtores.

## Endpoints da API

1.  **Listar Filmes (Indicados e Vencedores)**

    - **URL:** `/movies`
    - **Método:** `GET`
    - **Parâmetros de Query (opcionais):**
      - `year` (integer): Filtra filmes por ano. Ex: `?year=1980`
      - `winner` (boolean): Filtra por vencedores (`true`) ou não vencedores (`false`). Ex: `?winner=true`
    - **Exemplos:**
      - `http://localhost:3000/movies` (Lista todos os filmes)
      - `http://localhost:3000/movies?year=2015` (Lista filmes do ano de 2015)
      - `http://localhost:3000/movies?winner=true` (Lista todos os filmes vencedores)
      - `http://localhost:3000/movies?year=2015&winner=true` (Lista filmes vencedores de 2015)
    - **Resposta (Sucesso - 200 OK):**
      ```json
      [
        {
          "id": 1,
          "year": 1980,
          "title": "Can't Stop the Music",
          "studios": "Associated Film Distribution",
          "producers": "Allan Carr",
          "winner": true
        }
        // ... outros filmes
      ]
      ```

2.  **Obter Intervalos de Prêmios dos Produtores**
    - **URL:** `/producers/win-intervals`
    - **Método:** `GET`
    - **Descrição:** Retorna os produtores com o maior intervalo entre dois prêmios consecutivos e os produtores que obtiveram dois prêmios mais rapidamente.
    - **Exemplo:**
      - `http://localhost:3000/producers/win-intervals`
    - **Resposta (Sucesso - 200 OK):**
      ```json
      {
        "min": [
          {
            "producer": "Producer Name",
            "interval": 1,
            "previousWin": 2008,
            "followingWin": 2009
          }
          // ... outros produtores com o mesmo intervalo mínimo
        ],
        "max": [
          {
            "producer": "Another Producer",
            "interval": 10,
            "previousWin": 1990,
            "followingWin": 2000
          }
          // ... outros produtores com o mesmo intervalo máximo
        ]
      }
      ```
      Se não houver produtores com dois ou mais prêmios, ou nenhum filme vencedor, os arrays `min` e `max` estarão vazios.

## Considerações

- O banco de dados é em memória (SQLite), portanto, os dados são carregados do CSV toda vez que a aplicação é iniciada e são perdidos quando a aplicação é encerrada.
