# Site por público da Metal Esquadrias

Data: 13 de agosto de 2026

Status: aprovado para planejamento

## 1. Objetivo

O site deve transformar visitas em pedidos de orçamento pelo WhatsApp.

A página inicial separa arquitetos, construtoras e clientes finais. Cada página de público ordena os serviços mais relevantes.

O site deve usar português claro. O texto não deve usar jargões técnicos ou adjetivos sem prova.

## 2. Escopo

O projeto inclui estas páginas:

- Página inicial.
- Página para arquitetos.
- Página para construtoras.
- Página para casa e comércio.
- Índice de serviços.
- Página de cortinas e portas de rolo.
- Página de manutenção de cortinas.
- Página de portões.
- Página de escadas e guarda-corpos.
- Página de grades e sacadas.
- Página de pergolados e estruturas.
- Página de trabalhos realizados.
- Página sobre a fábrica.
- Página de contato.
- Página 404.

O projeto não inclui um painel administrativo, um banco de dados ou um formulário de contato.

O projeto não publica avaliações até existirem avaliações reais e autorizadas.

## 3. Públicos

### 3.1. Arquitetos

O arquiteto precisa enviar um detalhamento e confirmar se a empresa pode executar o projeto.

A página deve mostrar a análise do detalhamento, a medição e o orçamento por escrito.

### 3.2. Construtoras

A construtora precisa definir o escopo e o prazo antes da contratação.

A página deve apresentar os serviços para obras residenciais, comerciais e industriais.

### 3.3. Clientes finais

O cliente final pode precisar de um serviço para a casa, o comércio ou uma cortina existente.

A página deve pedir uma foto e uma medida aproximada. Este pedido reduz o esforço do primeiro contato.

## 4. Arquitetura de conteúdo

```text
Página inicial
├── Para arquitetos
├── Para construtoras
├── Para casa e comércio
├── Serviços
│   ├── Cortinas e portas de rolo
│   ├── Manutenção de cortinas
│   ├── Portões
│   ├── Escadas e guarda-corpos
│   ├── Grades e sacadas
│   └── Pergolados e estruturas
├── Trabalhos realizados
├── Sobre a fábrica
└── Contato
```

As páginas de público devem usar as páginas de serviço existentes. O site não deve duplicar uma página de serviço para cada público.

## 5. Rotas

| Página | Rota |
|---|---|
| Página inicial | `/` |
| Para arquitetos | `/para-arquitetos` |
| Para construtoras | `/para-construtoras` |
| Para casa e comércio | `/casa-e-comercio` |
| Serviços | `/servicos` |
| Cortinas e portas de rolo | `/servicos/cortinas-e-portas-de-rolo` |
| Manutenção de cortinas | `/servicos/manutencao-de-cortinas` |
| Portões | `/servicos/portoes` |
| Escadas e guarda-corpos | `/servicos/escadas-e-guarda-corpos` |
| Grades e sacadas | `/servicos/grades-e-sacadas` |
| Pergolados e estruturas | `/servicos/pergolados-e-estruturas` |
| Trabalhos realizados | `/trabalhos` |
| Sobre a fábrica | `/sobre` |
| Contato | `/contato` |
| Mapa do site | `/sitemap.xml` |
| Regras de busca | `/robots.txt` |

## 6. Página inicial

### 6.1. Abertura

Texto de apoio:

> Serralheria em Santa Cruz do Sul desde 1989

Título:

> Serralheria sob medida para sua casa, seu comércio ou sua obra

Texto:

> Atendemos Santa Cruz do Sul e a Região dos Vales. O processo inclui medição, orçamento por escrito e instalação.

CTA principal:

> Pedir orçamento no WhatsApp

CTA secundário:

> Ver trabalhos realizados

O topo deve usar três fotos reais. As fotos devem representar comércio, residência e obra.

### 6.2. Sinais de confiança

- Desde 1989.
- Medição no local.
- Orçamento por escrito.
- Instalação própria.

### 6.3. Escolha por público

O bloco deve usar estas opções:

- Sou arquiteto.
- Represento uma construtora.
- Preciso de serralheria.

Cada opção deve abrir a página do público correspondente.

### 6.4. Serviços

O bloco deve mostrar os seis grupos de serviço. Cortinas e portas de rolo devem ter mais destaque visual.

### 6.5. Como funciona

1. Envie uma foto e a medida aproximada.
2. A equipe avalia o local.
3. Você recebe o orçamento por escrito.
4. A equipe combina a fabricação e a instalação.

### 6.6. Trabalhos realizados

O bloco deve mostrar trabalhos reais. Cada legenda deve usar somente dados confirmados.

### 6.7. Sobre a empresa

O bloco deve apresentar a fábrica, a história desde 1989 e o endereço no Distrito Industrial.

### 6.8. Perguntas frequentes

O bloco deve explicar preço, medição, prazo, manutenção, projetos de arquitetos e formas de pagamento.

As respostas não devem publicar um prazo ou uma garantia sem confirmação para o serviço específico.

### 6.9. CTA final

Título:

> Tem uma foto do local?

Texto:

> Envie a foto e a medida aproximada. Isso ajuda a preparar a primeira orientação.

Botão:

> Mandar fotos no WhatsApp

## 7. Páginas por público

### 7.1. Para arquitetos

Título:

> Serralheria para projetos de arquitetura

Texto:

> Analisamos o detalhamento, medimos o local e preparamos um orçamento por escrito.

CTA:

> Enviar meu projeto no WhatsApp

Ordem dos serviços:

1. Escadas e guarda-corpos.
2. Grades e sacadas.
3. Pergolados e estruturas.
4. Portões.
5. Cortinas e portas de rolo.

### 7.2. Para construtoras

Título:

> Serralheria para obras residenciais, comerciais e industriais

Texto:

> Recebemos o projeto e definimos o escopo, o valor e o prazo no orçamento.

CTA:

> Enviar projeto para orçamento

Ordem dos serviços:

1. Pergolados e estruturas.
2. Escadas e guarda-corpos.
3. Grades e sacadas.
4. Portões.
5. Cortinas e portas de rolo.

### 7.3. Para casa e comércio

Título:

> Serralheria para sua casa ou seu comércio

Texto:

> Envie uma foto e a medida aproximada. A equipe orienta o próximo passo.

CTA:

> Enviar uma foto do local

A página deve separar os serviços em casa, comércio e manutenção.

## 8. Páginas de serviço

Cada página de serviço deve ter esta ordem:

1. Nome do serviço e cidade.
2. Fotos reais do serviço.
3. Usos e opções confirmadas.
4. Informações necessárias para o orçamento.
5. Etapas da medição até a instalação.
6. Perguntas frequentes.
7. CTA específico para o WhatsApp.

O site deve usar estes CTAs:

| Serviço | CTA |
|---|---|
| Cortinas e portas de rolo | Pedir orçamento de cortina |
| Manutenção de cortinas | Pedir avaliação da cortina |
| Portões | Pedir orçamento de portão |
| Escadas e guarda-corpos | Pedir orçamento de escada |
| Grades e sacadas | Pedir orçamento de grade |
| Pergolados e estruturas | Pedir orçamento de estrutura |

O preço deve aparecer somente após a medição. O orçamento deve informar o valor e o prazo antes da contratação.

A página de manutenção pode informar que a empresa atende cortinas instaladas por outras empresas.

## 9. WhatsApp

Todos os links devem usar o número `5551998493450`.

Cada página deve gerar uma mensagem própria. A mensagem deve informar a origem do contato.

| Página | Mensagem inicial |
|---|---|
| Página inicial | Olá, vim pela página inicial do site e quero pedir um orçamento. Posso enviar uma foto e a medida aproximada? |
| Para arquitetos | Olá, vim pela página para arquitetos e quero enviar um projeto para orçamento. |
| Para construtoras | Olá, vim pela página para construtoras e quero enviar um projeto para orçamento. |
| Casa e comércio | Olá, vim pela página para casa e comércio e quero pedir um orçamento. Posso enviar uma foto e a medida aproximada? |
| Cortinas | Olá, vim pela página de cortinas e portas de rolo e quero pedir um orçamento. |
| Manutenção | Olá, vim pela página de manutenção de cortinas e quero pedir uma avaliação. |
| Portões | Olá, vim pela página de portões e quero pedir um orçamento. |
| Escadas | Olá, vim pela página de escadas e guarda-corpos e quero pedir um orçamento. |
| Grades | Olá, vim pela página de grades e sacadas e quero pedir um orçamento. |
| Estruturas | Olá, vim pela página de pergolados e estruturas e quero pedir um orçamento. |

O cabeçalho deve ter um CTA para orçamento. O celular deve mostrar um CTA fixo na parte inferior.

## 10. Dados canônicos

O rodapé e os dados estruturados devem usar estes dados sem alterações:

```text
Nome:      Metal Esquadrias
Endereço:  R. Ver. Rudi Müler, 101 — Distrito Industrial
           Santa Cruz do Sul/RS, CEP 96835-743
Telefone:  (51) 3715-3326
WhatsApp:  (51) 99849-3450
Horário:   Seg a sex, 7h–12h e 13h–18h · Sáb e dom fechado
Instagram: @metalesquadrias
Fundação: 31/01/1989
```

## 11. Fotos

O site deve usar somente trabalhos executados pela empresa.

As fotos atuais do repositório podem aparecer no site. A implementação também pode usar fotos dos perfis oficiais da empresa no Instagram e no Facebook.

Cada foto obtida de uma rede social deve ter a URL da publicação registrada em `docs/fontes-das-fotos.md`.

Se uma página não tiver uma foto confirmada, a página deve omitir a galeria. O site não deve usar uma foto de banco, um render ou uma foto de outro serviço.

## 12. Direção visual

O design deve usar os tokens atuais do repositório.

- O fundo principal deve usar o papel claro.
- O texto deve usar os tons de ferro.
- O vermelho deve marcar a marca e os CTAs principais.
- Os cartões devem usar bordas finas.
- As sombras devem permanecer discretas.
- Os cantos devem permanecer pequenos.
- As fotos devem ter cortes consistentes.

O layout deve usar espaço amplo e títulos curtos. O site não deve copiar a identidade da C.H.I. Overhead Doors.

## 13. Princípios de decisão

O site deve aplicar estes princípios:

- Três opções de público reduzem o número de decisões iniciais.
- A mensagem deve mostrar o trabalho que cada público precisa concluir.
- O pedido de uma foto e uma medida reduz o esforço do primeiro contato.
- A data de fundação deve apresentar experiência com um fato verificável.
- Os CTAs devem informar a ação e o resultado.

O site não deve usar escassez, urgência ou prova social sem dados reais.

## 14. Arquitetura técnica

O site usará Go, HTMX e Tailwind CSS. A Vercel hospedará o servidor Go.

O Go deve usar `net/http` e `html/template`. O projeto deve evitar um framework de servidor nesta etapa.

O servidor deve entregar HTML completo para cada rota. O HTMX deve melhorar a galeria, sem controlar a navegação principal.

O Tailwind deve usar os tokens atuais como fonte de cor, tipografia e espaço.

### 14.1. Estrutura proposta

```text
main.go
go.mod
internal/site/
  app.go
  content.go
  render.go
  routes.go
web/templates/
  layouts/
  components/
  pages/
web/styles/
  input.css
public/
  images/
  scripts/htmx.min.js
  styles/app.css
```

O arquivo `main.go` deve iniciar o servidor na porta definida por `PORT`.

O pacote `internal/site` deve expor o manipulador HTTP para os testes.

Os templates devem ser incorporados no binário Go. Os arquivos públicos devem permanecer separados para entrega pela rede da Vercel.

O projeto deve manter uma cópia fixa do HTMX. A produção não deve depender de um CDN externo para carregar o HTMX.

O arquivo CSS gerado deve permanecer versionado. O processo de desenvolvimento deve gerar novamente esse arquivo após mudanças de estilo.

### 14.2. Fluxo de uma requisição

```text
Requisição
  ↓
Rota Go
  ↓
Conteúdo confirmado
  ↓
Template HTML
  ↓
Página completa ou trecho HTMX
```

Uma requisição HTMX da galeria deve receber somente o trecho da galeria. A resposta deve incluir `Vary: HX-Request`.

Uma requisição normal deve receber a página completa.

## 15. Componentes

O projeto deve ter estes componentes compartilhados:

- Cabeçalho.
- Rodapé com os dados canônicos.
- Abertura da página.
- Cartão de público.
- Cartão de serviço.
- Sinais de confiança.
- Galeria.
- Etapas do orçamento.
- Perguntas frequentes.
- CTA para o WhatsApp.
- Dados estruturados.

Cada componente deve receber dados. O componente não deve guardar texto específico de uma página.

## 16. Busca e dados estruturados

Cada página deve ter um título, uma meta description, uma URL canônica e um H1 próprio.

Todas as páginas devem incluir os dados `LocalBusiness`.

Cada página de serviço deve incluir os dados `Service`.

Cada página com perguntas frequentes deve incluir os dados `FAQPage`.

O site deve gerar `sitemap.xml` e `robots.txt`.

As imagens devem ter texto alternativo factual. O texto não deve inventar uma cidade, uma data ou um cliente.

## 17. Acessibilidade e resposta em telas

O site deve funcionar com teclado e leitor de tela.

Os links e botões devem mostrar um foco visível. Os botões devem ter uma área adequada para toque.

O contraste deve cumprir o nível AA. O layout deve funcionar em celular e computador.

As imagens devem declarar largura e altura. O navegador deve carregar primeiro somente a imagem principal.

## 18. Tratamento de falhas

A página 404 deve mostrar links para serviços e para o WhatsApp.

Uma falha no filtro deve manter a galeria atual. A página deve mostrar uma opção para tentar novamente.

Uma imagem ausente não deve criar um espaço quebrado. O servidor deve omitir o item sem imagem.

O servidor deve registrar o erro. A resposta não deve mostrar detalhes técnicos ao visitante.

## 19. Testes

Os testes Go devem verificar:

- Resposta 200 para todas as rotas públicas.
- Resposta 404 para uma rota desconhecida.
- Um título, uma meta description e um H1 por página.
- Dados canônicos idênticos no rodapé.
- Número e mensagem corretos em cada CTA do WhatsApp.
- Dados `LocalBusiness` em todas as páginas.
- Dados `Service` nas páginas de serviço.
- Dados `FAQPage` nas páginas com perguntas.
- Texto alternativo em todas as imagens publicadas.
- Resposta parcial para pedidos HTMX da galeria.
- Cabeçalho `Vary: HX-Request` na resposta parcial.
- Conteúdo correto do mapa do site.

A validação no navegador deve verificar:

- Navegação em celular e computador.
- Navegação por teclado.
- Foco visível.
- Contraste.
- Filtros da galeria.
- Links de telefone, endereço, Instagram e WhatsApp.
- Ausência de erros no console.

## 20. Critérios de aceitação

O projeto estará pronto quando cumprir todos estes critérios:

1. Todas as rotas desta especificação funcionam.
2. Cada público encontra os serviços relevantes na ordem definida.
3. Cada CTA abre o WhatsApp com a mensagem correta.
4. Todas as fotos mostram trabalhos reais da empresa.
5. Nenhuma página publica um fato sem fonte.
6. Os dados canônicos aparecem sem alterações.
7. Os dados estruturados correspondem ao conteúdo visível.
8. A navegação funciona sem HTMX.
9. Os filtros da galeria funcionam com HTMX.
10. Os testes automatizados passam.
11. A validação no navegador não encontra erros de navegação ou contraste.

## 21. Referências técnicas

- [Servidor Go na Vercel](https://vercel.com/changelog/zero-configuration-go-backend-support)
- [Documentação do HTMX](https://htmx.org/docs/)
- [CLI do Tailwind CSS](https://tailwindcss.com/docs/installation/tailwind-cli?web=1)
- [Site de referência da C.H.I. Overhead Doors](https://www.chiohd.com/)
