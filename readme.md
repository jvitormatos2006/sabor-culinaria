# Sabor Culinária

Sabor Culinária é uma aplicação web para compartilhar e avaliar publicações gastronômicas. Os usuários podem visualizar as publicações e, após o login, podem curtir, descurtir e comentar nelas.

## Estrutura do Projeto

O projeto é dividido em duas partes principais:

*   **`frontend/`**: Contém a interface do usuário, construída com HTML, CSS e JavaScript puro.
*   **`backend/`**: Contém a lógica do lado do servidor, construída com PHP e um banco de dados MySQL.

### Frontend

O frontend é uma aplicação de página única (SPA) que carrega e exibe dinamicamente as publicações do backend.

*   `index.html`: O arquivo HTML principal.
*   `styles.css`: A folha de estilo para a aplicação.
*   `app.js`: O código JavaScript que lida com as interações do usuário, requisições à API e manipulação do DOM.
*   `assets/`: Contém imagens e ícones usados na aplicação.

### Backend

O backend fornece uma API RESTful para o frontend.

*   `api/`: Contém os endpoints da API.
    *   `login.php`: Lida com a autenticação do usuário.
    *   `logout.php`: Lida com o logout do usuário.
    *   `publications.php`: Busca as publicações no banco de dados.
    *   `avaliacao.php`: Lida com as avaliações do usuário (curtidas, descurtidas, comentários).
*   `db.php`: Contém as configurações de conexão com o banco de dados e funções auxiliares.
*   `index.php`: O ponto de entrada principal para o backend.

## Banco de Dados

A aplicação usa um banco de dados MySQL chamado `sabor_culinaria`. O esquema do banco de dados não está definido no projeto, mas com base no código, ele deve conter pelo menos as seguintes tabelas:

*   `usuario`: Armazena informações do usuário (id, nome, email, senha, etc.).
*   `publicacao`: Armazena informações da publicação (id, título, local, etc.).
*   `avaliacao`: Armazena as avaliações do usuário para cada publicação.

## Configuração

1.  **Banco de Dados:**
    *   Crie um banco de dados MySQL chamado `sabor_culinaria`.
    *   Crie as tabelas necessárias (`usuario`, `publicacao`, `avaliacao`) e popule-as com alguns dados.
2.  **Backend:**
    *   Certifique-se de ter um servidor PHP (como XAMPP ou WAMP) em execução.
    *   Atualize as credenciais do banco de dados em `backend/db.php` se forem diferentes do padrão (`root` sem senha).
3.  **Frontend:**
    *   Abra o arquivo `frontend/index.html` em seu navegador.

## Como Usar
*   Inicie o servidor PHP e o MySQL para o backend com o XAMPP.
*   Caso apareça o erro de que a porta 3306 ja esteja em uso, use o Win+R e digite services.msc, localize o serviço do MySQL e clique com o botão direito para parar o serviço.
*   Abra o link http://localhost/phpmyadmin/index.php?route=/server/sql para acessar o phpMyAdmin.
    *   Insira o seguinte script:
```sql
CREATE DATABASE sabor culinaria;
USE sabor culinaria;

CREATE TABLE empresa (
  id_empresa INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) NULL,
  endereco VARCHAR(255) NULL,
  logo VARCHAR(255) NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

INSERT INTO empresa (id_empresa, nome, cnpj, endereco, logo, createdAt, updatedAt) VALUES
(1, 'Sabor do Brasil', NULL, NULL, 'logo_sabor_do_brasil.png', '2023-11-23 10:49:17', '2021-02-22 09:13:55');

-- ==========================================
-- 2. Tabela USUARIO
-- ==========================================
CREATE TABLE usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  nickname VARCHAR(255) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  foto VARCHAR(255) NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

INSERT INTO usuario (id_usuario, nome, email, nickname, senha, foto, createdAt, updatedAt) VALUES
(1, 'usuario01', 'usuario01@usuario.com', 'usuario_01', '123456', 'https://i.ibb.co/ycbbrQsq/usuario-01.jpg', '2023-06-22 09:13:55', '2023-06-22 09:14:55'),
(2, 'usuario02', 'usuario02@usuario.com', 'usuario_02', '654321', 'https://i.ibb.co/60tcFB2v/usuario-02.jpg', '2023-02-22 09:13:55', '2023-08-22 09:13:58'),
(3, 'usuario03', 'usuario03@usuario.com', 'usuario_03', '987654', 'https://i.ibb.co/V04qr4Lp/usuario-03.jpg', '2023-02-22 09:13:55', '2023-08-22 09:15:55');

-- ==========================================
-- 3. Tabela PUBLICACAO
-- ==========================================
CREATE TABLE publicacao (
  id_publicacao INT AUTO_INCREMENT PRIMARY KEY,
  titulo_prato VARCHAR(255) NOT NULL,
  descricao TEXT NULL,
  foto VARCHAR(255) NULL,
  local VARCHAR(255) NULL,
  cidade VARCHAR(255) NULL,
  empresa_id INT NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (empresa_id) REFERENCES empresa(id_empresa)
);

INSERT INTO publicacao (id_publicacao, titulo_prato, descricao, foto, local, cidade, empresa_id, createdAt, updatedAt) VALUES
(1, 'Iscas de Peixe Frito', NULL, 'https://i.ibb.co/bRBRhv3Z/publicacao01.png', 'Local 01', 'Maceio-AL', 1, '2023-02-22 09:15:55', '2023-09-22 09:18:55'),
(2, 'Farofa/Cuscuz com Salada e Ovo Cozido', NULL, 'https://i.ibb.co/qvpHmfw/publicacao02.png', 'Local 02', 'Minas Gerais-MG', 1, '2023-02-22 09:10:55', '2023-09-22 09:16:55'),
(3, 'Costeleta de Porco Grelhada', NULL, 'https://i.ibb.co/mCRN5vQz/publicacao03.png', 'Local 03', 'Rio de Janeiro-RJ', 1, '2023-05-22 09:13:55', '2023-02-22 09:15:55');

-- ==========================================
-- 4. Tabela AVALIACAO
-- ==========================================
CREATE TABLE avaliacao (
  id_avaliacao INT AUTO_INCREMENT PRIMARY KEY,
  nota INT NOT NULL,
  comentario VARCHAR(255) NULL,
  data_avaliacao DATETIME NOT NULL,
  id_usuario INT NOT NULL,
  id_publicacao INT NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_publicacao) REFERENCES publicacao(id_publicacao)
);

INSERT INTO avaliacao (id_avaliacao, nota, comentario, data_avaliacao, id_usuario, id_publicacao) VALUES
(1, 1, NULL, '2025-10-29 09:45:36', 1, 1),
(2, 1, NULL, '2025-10-25 16:38:50', 2, 1),
(3, 1, NULL, '2025-10-29 10:11:48', 1, 2),
(4, 5, NULL, '2025-10-25 16:58:36', 3, 3),
(5, 5, NULL, '2025-10-25 17:00:50', 1, 3);
```
*   Depois de criado, acesse http://localhost/sabor_culinaria/frontend/