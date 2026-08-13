# Site por público Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o site completo da Metal Esquadrias e preparar a publicação na Vercel.

**Architecture:** Um servidor Go entrega HTML completo com `net/http` e `html/template`. O HTMX troca somente a galeria filtrada.

**Tech Stack:** Go 1.26, HTMX 2.0.10, Tailwind CSS 4.3.3, Vercel CLI 58.11.0 e testes da biblioteca padrão.

## Global Constraints

- Use português claro e sem jargões técnicos no site.
- Use somente fatos confirmados nos documentos do projeto.
- Use somente fotos de trabalhos executados pela Metal Esquadrias.
- Não publique avaliações, prazos, garantias ou preços sem uma confirmação específica.
- Use `5551998493450` em todos os links do WhatsApp.
- Use uma mensagem do WhatsApp específica para cada página.
- Use `LocalBusiness` em todas as páginas.
- Use `Service` em cada página de serviço.
- Use `FAQPage` em cada página que mostra perguntas frequentes.
- Use um título, uma meta description, uma URL canônica e um H1 em cada página.
- Mantenha a navegação principal funcional sem HTMX.
- Use o HTMX somente para os filtros da galeria.
- Mantenha uma cópia fixa do HTMX no repositório.
- Mantenha o CSS gerado no repositório.
- Use os tokens atuais em `design_system/tokens/`.
- Use este nome: `Metal Esquadrias`.
- Use este endereço: `R. Ver. Rudi Müler, 101 — Distrito Industrial`.
- Use esta cidade e CEP: `Santa Cruz do Sul/RS, CEP 96835-743`.
- Use este telefone: `(51) 3715-3326`.
- Use este WhatsApp: `(51) 99849-3450`.
- Use este horário: `Seg a sex, 7h–12h e 13h–18h · Sáb e dom fechado`.
- Use este Instagram: `@metalesquadrias`.
- Use esta data de fundação: `31/01/1989`.
- Use esta região de atendimento: `Região dos Vales`.
- Use instalação própria como fato confirmado.
- Informe que a Naport fornece as cortinas e portas de rolo.
- Informe que a empresa aceita detalhamentos de arquitetos.
- Informe que a empresa atende cortinas instaladas por outras empresas.
- Informe a entrada antecipada e o saldo após a instalação.
- Informe que existe uma opção de parcelamento.
- O orçamento deve informar o valor e o prazo antes da contratação.
- Não adicione um banco de dados, CMS ou formulário de contato.
- Não adicione um framework de servidor Go.
- A Vercel deve detectar o servidor por `main.go`.

## File Map

- `main.go`: inicia o servidor na porta definida por `PORT`.
- `go.mod`: fixa o módulo e a versão do Go.
- `package.json`: fixa Tailwind, HTMX e Vercel CLI.
- `package-lock.json`: fixa a árvore de dependências Node.
- `.gitignore`: ignora dependências e arquivos locais.
- `internal/site/app.go`: cria o roteador e liga as rotas ao renderizador.
- `internal/site/model.go`: define os dados usados pelo conteúdo e pelos templates.
- `internal/site/content_global.go`: guarda NAP, navegação, etapas e sinais de confiança.
- `internal/site/content_pages.go`: guarda páginas institucionais e páginas por público.
- `internal/site/content_services.go`: guarda o índice e as páginas de serviço.
- `internal/site/gallery.go`: valida filtros e seleciona fotos disponíveis.
- `internal/site/render.go`: renderiza páginas completas e trechos HTMX.
- `internal/site/schema.go`: cria `LocalBusiness`, `Service` e `FAQPage`.
- `internal/site/seo.go`: cria o mapa do site e o arquivo de busca.
- `internal/site/*_test.go`: verifica conteúdo, rotas, schemas, galeria e acessibilidade.
- `web/embed.go`: incorpora os templates no binário Go.
- `web/templates/layouts/base.html`: define o documento HTML compartilhado.
- `web/templates/components/*.html`: define os componentes com dados.
- `web/templates/pages/*.html`: define cada tipo de página.
- `web/styles/input.css`: importa Tailwind e mapeia os tokens existentes.
- `public/styles/app.css`: guarda o CSS gerado e versionado.
- `public/scripts/htmx.min.js`: guarda o HTMX fixo e versionado.
- `public/images/*`: guarda logotipos e fotos aprovadas.
- `docs/fontes-das-fotos.md`: registra a origem e o uso de cada foto.
- `README.md`: explica o desenvolvimento, os testes e a publicação.

---

### Task 1: Servidor Go, templates e ferramentas

**Files:**

- Create: `go.mod`
- Create: `package.json`
- Create: `package-lock.json`
- Create: `.gitignore`
- Create: `main.go`
- Create: `internal/site/app.go`
- Create: `internal/site/model.go`
- Create: `internal/site/render.go`
- Create: `internal/site/test_helpers_test.go`
- Create: `internal/site/app_test.go`
- Create: `web/embed.go`
- Create: `web/templates/layouts/base.html`
- Create: `web/templates/pages/home.html`
- Create: `web/styles/input.css`
- Create: `public/styles/app.css`
- Create: `public/scripts/htmx.min.js`

**Interfaces:**

- Consumes: `design_system/tokens/*.css`.
- Produces: `site.New(Options) (http.Handler, error)`.
- Produces: `web.Templates embed.FS`.
- Produces: `npm run build:css` and `npm run vendor:htmx`.

- [ ] **Step 1: Write the failing server tests**

Create `internal/site/test_helpers_test.go`:

```go
package site

import (
	"io"
	"io/fs"
	"log"
	"net/http"
	"testing"
	"testing/fstest"
)

func newTestHandler(t *testing.T) http.Handler {
	t.Helper()
	publicFS := fstest.MapFS{
		"styles/app.css":       &fstest.MapFile{Data: []byte("body{}")},
		"scripts/htmx.min.js": &fstest.MapFile{Data: []byte("window.htmx={}")},
	}
	handler, err := New(Options{
		Logger: log.New(io.Discard, "", 0),
		PublicFS: fs.FS(publicFS),
	})
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	return handler
}
```

Create `internal/site/app_test.go`:

```go
package site

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHomeReturnsHTML(t *testing.T) {
	response := httptest.NewRecorder()
	newTestHandler(t).ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/", nil))
	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
	if !strings.Contains(response.Body.String(), "Serralheria sob medida para sua casa, seu comércio ou sua obra") {
		t.Fatal("home does not contain the approved H1")
	}
}

func TestPublicAssetReturnsContent(t *testing.T) {
	response := httptest.NewRecorder()
	newTestHandler(t).ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/assets/styles/app.css", nil))
	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
}
```

- [ ] **Step 2: Run the tests and verify the failure**

Run:

```bash
go test ./internal/site -run 'TestHomeReturnsHTML|TestPublicAssetReturnsContent' -v
```

Expected: FAIL because `New`, `Options`, and the templates do not exist.

- [ ] **Step 3: Add the fixed toolchain**

Create `go.mod`:

```go
module metalesquadrias.com.br/site

go 1.26.0
```

Create `package.json`:

```json
{
  "name": "metal-esquadrias-site",
  "private": true,
  "scripts": {
    "build:css": "tailwindcss -i ./web/styles/input.css -o ./public/styles/app.css --minify",
    "watch:css": "tailwindcss -i ./web/styles/input.css -o ./public/styles/app.css --watch",
    "vendor:htmx": "cp ./node_modules/htmx.org/dist/htmx.min.js ./public/scripts/htmx.min.js",
    "check:assets": "npm run build:css && git diff --exit-code -- public/styles/app.css"
  },
  "devDependencies": {
    "@tailwindcss/cli": "4.3.3",
    "htmx.org": "2.0.10",
    "tailwindcss": "4.3.3",
    "vercel": "58.11.0"
  }
}
```

Create `.gitignore`:

```gitignore
node_modules/
.vercel/
metal-esquadrias
*.test
```

Run:

```bash
npm install
mkdir -p public/styles public/scripts
npm run vendor:htmx
```

Expected: npm creates `package-lock.json` and the fixed HTMX file.

- [ ] **Step 4: Add the server interfaces**

Create these exact types in `internal/site/model.go`:

```go
package site

type Site struct {
	Name string
	BaseURL string
	Phone string
	WhatsApp string
	WhatsAppE164 string
}

type CTA struct {
	Label string
	Message string
	URL string
}

type Page struct {
	Path string
	Template string
	Title string
	MetaDescription string
	H1 string
	Eyebrow string
	Intro string
	CTA CTA
}

type ViewData struct {
	Site Site
	Page Page
}
```

Create `internal/site/app.go` with this interface:

```go
type Options struct {
	Logger *log.Logger
	PublicFS fs.FS
}

func New(options Options) (http.Handler, error)
```

Reject a missing logger or public file system.

Serve `PublicFS` below `/assets/` with `http.FileServer`.

Render the approved home opening at `/`.

- [ ] **Step 5: Add embedded templates and the renderer**

Create `web/embed.go`:

```go
package web

import "embed"

// Templates contains the site templates.
//
//go:embed templates/layouts/*.html templates/pages/*.html
var Templates embed.FS
```

Create `internal/site/render.go` with these exact methods:

```go
func newRenderer(logger *log.Logger) (*renderer, error)
func (r *renderer) page(w http.ResponseWriter, status int, data ViewData)
func (r *renderer) internalError(w http.ResponseWriter, err error)
```

Render the page template into a buffer first.

Pass the trusted result to the base template as `template.HTML`.

Log the technical error and show `Não foi possível carregar a página.`.

Create a base template with title, description, canonical URL, CSS, HTMX, and page content.

Load the current Archivo and IBM Plex families with this stylesheet URL:

```text
https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap
```

Escape each ampersand as `&amp;` in the HTML attribute.

Create the home template with the approved eyebrow, H1, intro, and CTA.

- [ ] **Step 6: Add the Vercel-compatible entry point**

Create `main.go`:

```go
package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"metalesquadrias.com.br/site/internal/site"
)

func main() {
	logger := log.New(os.Stdout, "metal-esquadrias ", log.LstdFlags)
	handler, err := site.New(site.Options{Logger: logger, PublicFS: os.DirFS("public")})
	if err != nil {
		logger.Fatal(err)
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	server := &http.Server{
		Addr: ":" + port,
		Handler: handler,
		ReadHeaderTimeout: 5 * time.Second,
	}
	logger.Printf("servidor disponível em http://localhost:%s", port)
	logger.Fatal(server.ListenAndServe())
}
```

- [ ] **Step 7: Map the design tokens into Tailwind**

Create `web/styles/input.css`:

```css
@import "tailwindcss";
@import "../../design_system/tokens/colors.css";
@import "../../design_system/tokens/spacing.css";
@import "../../design_system/tokens/typography.css";
@source "../templates";

@theme inline {
  --color-brand: var(--red-700);
  --color-brand-hover: var(--red-800);
  --color-paper: var(--paper);
  --color-paper-dim: var(--paper-dim);
  --color-iron: var(--iron-950);
  --color-iron-muted: var(--iron-500);
  --color-line: var(--iron-200);
  --font-display: var(--font-display);
  --font-body: var(--font-body);
}

@layer base {
  body { background: var(--surface-page); color: var(--text-body); font-family: var(--font-body); }
  h1, h2, h3 { color: var(--text-strong); font-family: var(--font-display); }
  :focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 3px; }
}
```

Run:

```bash
npm run build:css
gofmt -w main.go internal/site/*.go web/embed.go
go test ./...
go vet ./...
npm run check:assets
```

Expected: all commands exit with status 0.

- [ ] **Step 8: Commit the server foundation**

```bash
git add .gitignore go.mod main.go package.json package-lock.json internal/site web public/styles/app.css public/scripts/htmx.min.js
git commit -m "feat: add Go site foundation"
```

### Task 2: Catálogo de páginas, metadados e rotas

**Files:**

- Modify: `internal/site/model.go`
- Create: `internal/site/content_global.go`
- Create: `internal/site/content_pages.go`
- Create: `internal/site/content_services.go`
- Create: `internal/site/content_test.go`
- Modify: `internal/site/app.go`
- Modify: `internal/site/app_test.go`
- Create: `web/templates/pages/generic.html`
- Create: `web/templates/pages/not-found.html`

**Interfaces:**

- Consumes: `site.New(Options)` and `renderer.page` from Task 1.
- Produces: `DefaultCatalog() Catalog` with all page records.
- Produces: `Catalog.Page(path string) (Page, bool)`.
- Produces: `Catalog.WhatsAppURL(message string) string`.
- Produces: `Catalog.PublicPages() []Page` in route order.

- [ ] **Step 1: Write the failing catalog tests**

Create `internal/site/content_test.go`:

```go
package site

import "testing"

func TestCatalogContainsEveryPublicPage(t *testing.T) {
	want := []string{
		"/", "/para-arquitetos", "/para-construtoras", "/casa-e-comercio", "/servicos",
		"/servicos/cortinas-e-portas-de-rolo", "/servicos/manutencao-de-cortinas",
		"/servicos/portoes", "/servicos/escadas-e-guarda-corpos",
		"/servicos/grades-e-sacadas", "/servicos/pergolados-e-estruturas",
		"/trabalhos", "/sobre", "/contato",
	}
	catalog := DefaultCatalog()
	for _, path := range want {
		page, ok := catalog.Page(path)
		if !ok {
			t.Errorf("catalog does not contain %q", path)
			continue
		}
		if page.Title == "" || page.MetaDescription == "" || page.H1 == "" {
			t.Errorf("page %q has incomplete metadata", path)
		}
		if page.CTA.Message == "" || page.CTA.URL == "" {
			t.Errorf("page %q has an incomplete CTA", path)
		}
	}
}

func TestPageMetadataAndMessagesAreUnique(t *testing.T) {
	catalog := DefaultCatalog()
	titles := map[string]string{}
	descriptions := map[string]string{}
	messages := map[string]string{}
	for _, page := range catalog.PublicPages() {
		if prior := titles[page.Title]; prior != "" {
			t.Errorf("pages %q and %q share a title", prior, page.Path)
		}
		if prior := descriptions[page.MetaDescription]; prior != "" {
			t.Errorf("pages %q and %q share a description", prior, page.Path)
		}
		if prior := messages[page.CTA.Message]; prior != "" {
			t.Errorf("pages %q and %q share a message", prior, page.Path)
		}
		titles[page.Title] = page.Path
		descriptions[page.MetaDescription] = page.Path
		messages[page.CTA.Message] = page.Path
	}
}
```

Add `TestPublicRoutesReturn200` and `TestUnknownRouteReturnsCustom404` to `app_test.go`.

The route test must request all 14 paths from `TestCatalogContainsEveryPublicPage`.

The 404 test must expect status 404 and `Esta página não foi encontrada`.

- [ ] **Step 2: Run the catalog tests and verify the failure**

Run:

```bash
go test ./internal/site -run 'TestCatalog|TestPageMetadata|TestPublicRoutes|TestUnknownRoute' -v
```

Expected: FAIL because the catalog and public routes do not exist.

- [ ] **Step 3: Expand the content model**

Add these exact types to `model.go`:

```go
type PageKind string

const (
	PageHome PageKind = "home"
	PageAudience PageKind = "audience"
	PageServiceIndex PageKind = "service-index"
	PageService PageKind = "service"
	PageWorks PageKind = "works"
	PageAbout PageKind = "about"
	PageContact PageKind = "contact"
	PageNotFound PageKind = "not-found"
)

type NavItem struct { Label, Path string }
type Proof struct { Title, Text string }
type Step struct { Number, Title, Text string }
type FAQ struct { Question, Answer string }

type Audience struct {
	ID string
	Title string
	Description string
	Path string
	ServiceIDs []string
}

type Service struct {
	ID string
	Name string
	Path string
	H1 string
	Intro string
	CTA CTA
	BudgetNeeds []string
	Uses []string
	FAQs []FAQ
	ImageCategory string
	Featured bool
}

type Work struct {
	ID string
	Category string
	Path string
	Alt string
	Caption string
	Width int
	Height int
}

type Catalog struct {
	Site Site
	Navigation []NavItem
	Pages map[string]Page
	Order []string
	Audiences []Audience
	Services []Service
	Works []Work
	Proofs []Proof
	Steps []Step
}
```

Add `Street`, `CityLine`, `Hours`, `Instagram`, `InstagramURL`, `Founded`, and `ServiceArea` to `Site`.

Add `Kind`, `Robots`, `AudienceID`, `ServiceID`, and `FAQs` to `Page`.

Add `Navigation []NavItem` to `ViewData`.

`Catalog.View` and `Catalog.NotFoundView` must include the global navigation.

- [ ] **Step 4: Add the canonical global content**

Create `content_global.go` with `defaultSite() Site`.

Use every exact NAP value from Global Constraints.

Use `https://www.instagram.com/metalesquadrias/` for `InstagramURL`.

Use this navigation order:

1. `Serviços` points to `/servicos`.
2. `Trabalhos` points to `/trabalhos`.
3. `Para arquitetos` points to `/para-arquitetos`.
4. `Para construtoras` points to `/para-construtoras`.
5. `Sobre` points to `/sobre`.
6. `Contato` points to `/contato`.

Use these proof records:

| Title | Text |
|---|---|
| `Desde 1989` | `Fábrica no Distrito Industrial de Santa Cruz do Sul.` |
| `Medição no local` | `A equipe confere o espaço antes do orçamento final.` |
| `Orçamento por escrito` | `O documento informa o valor e o prazo antes da contratação.` |
| `Instalação própria` | `A equipe da Metal Esquadrias faz a instalação.` |

Use these process records:

| Number | Title | Text |
|---|---|---|
| `1` | `Envie uma foto` | `Inclua uma medida aproximada e informe a cidade.` |
| `2` | `A equipe avalia o local` | `A medição confirma as dimensões e o serviço necessário.` |
| `3` | `Você recebe o orçamento` | `O orçamento por escrito informa o valor e o prazo.` |
| `4` | `A equipe combina a instalação` | `A fabricação e a instalação seguem o que foi aprovado.` |

Implement these exact methods:

```go
func (c Catalog) WhatsAppURL(message string) string
func (c Catalog) Page(path string) (Page, bool)
func (c Catalog) PublicPages() []Page
func (c Catalog) View(page Page) ViewData
func (c Catalog) NotFoundView() ViewData
```

Use `url.QueryEscape` inside `WhatsAppURL`.

- [ ] **Step 5: Add every page record**

Create `content_pages.go` and `content_services.go`.

Use this exact source table:

| Path | Title | Meta description | H1 |
|---|---|---|---|
| `/` | `Metal Esquadrias \| Serralheria em Santa Cruz do Sul` | `Serralheria em Santa Cruz do Sul: portões, escadas, grades, sacadas, pergolados e cortinas de ferro sob medida.` | `Serralheria sob medida para sua casa, seu comércio ou sua obra` |
| `/para-arquitetos` | `Serralheria para arquitetos em Santa Cruz do Sul` | `Envie o detalhamento do projeto. A Metal Esquadrias mede o local e prepara o orçamento por escrito.` | `Serralheria para projetos de arquitetura` |
| `/para-construtoras` | `Serralheria para construtoras em Santa Cruz do Sul` | `Serralheria para obras residenciais, comerciais e industriais, com escopo, valor e prazo no orçamento.` | `Serralheria para obras residenciais, comerciais e industriais` |
| `/casa-e-comercio` | `Serralheria para casa e comércio em Santa Cruz do Sul` | `Envie uma foto e uma medida aproximada para pedir um orçamento de serralheria para casa ou comércio.` | `Serralheria para sua casa ou seu comércio` |
| `/servicos` | `Serviços de serralheria em Santa Cruz do Sul` | `Conheça os serviços da Metal Esquadrias para casas, comércios, projetos e obras na Região dos Vales.` | `Serviços de serralheria sob medida` |
| `/servicos/cortinas-e-portas-de-rolo` | `Cortinas e portas de rolo em Santa Cruz do Sul` | `Peça a medição e o orçamento de cortinas e portas de rolo para seu comércio ou outro espaço.` | `Cortinas e portas de rolo em Santa Cruz do Sul` |
| `/servicos/manutencao-de-cortinas` | `Manutenção de cortinas em Santa Cruz do Sul` | `Peça uma avaliação de cortinas e portas de rolo, inclusive de itens instalados por outra empresa.` | `Manutenção de cortinas e portas de rolo em Santa Cruz do Sul` |
| `/servicos/portoes` | `Portões sob medida em Santa Cruz do Sul` | `Peça a medição e o orçamento por escrito de um portão sob medida para sua casa, comércio ou obra.` | `Portões sob medida em Santa Cruz do Sul` |
| `/servicos/escadas-e-guarda-corpos` | `Escadas e guarda-corpos em Santa Cruz do Sul` | `Envie uma foto ou um projeto para pedir o orçamento de uma escada ou um guarda-corpo sob medida.` | `Escadas e guarda-corpos em Santa Cruz do Sul` |
| `/servicos/grades-e-sacadas` | `Grades e sacadas em Santa Cruz do Sul` | `Peça a medição e o orçamento por escrito de grades e estruturas para sacadas feitas sob medida.` | `Grades e sacadas em Santa Cruz do Sul` |
| `/servicos/pergolados-e-estruturas` | `Pergolados e estruturas em Santa Cruz do Sul` | `Envie uma foto ou um projeto para pedir o orçamento de um pergolado ou uma estrutura sob medida.` | `Pergolados e estruturas em Santa Cruz do Sul` |
| `/trabalhos` | `Trabalhos realizados pela Metal Esquadrias` | `Veja fotos de cortinas, portões, escadas, guarda-corpos, grades e sacadas executados pela empresa.` | `Trabalhos realizados` |
| `/sobre` | `Sobre a Metal Esquadrias em Santa Cruz do Sul` | `Conheça a fábrica da Metal Esquadrias, no Distrito Industrial de Santa Cruz do Sul desde 1989.` | `Uma serralheria de fábrica desde 1989` |
| `/contato` | `Contato da Metal Esquadrias em Santa Cruz do Sul` | `Veja o WhatsApp, telefone, endereço e horário da Metal Esquadrias em Santa Cruz do Sul.` | `Fale com a Metal Esquadrias` |

Use this exact CTA source table:

| Path | Label | WhatsApp message |
|---|---|---|
| `/` | `Pedir orçamento no WhatsApp` | `Olá, vim pela página inicial do site e quero pedir um orçamento. Posso enviar uma foto e a medida aproximada?` |
| `/para-arquitetos` | `Enviar meu projeto no WhatsApp` | `Olá, vim pela página para arquitetos e quero enviar um projeto para orçamento.` |
| `/para-construtoras` | `Enviar projeto para orçamento` | `Olá, vim pela página para construtoras e quero enviar um projeto para orçamento.` |
| `/casa-e-comercio` | `Enviar uma foto do local` | `Olá, vim pela página para casa e comércio e quero pedir um orçamento. Posso enviar uma foto e a medida aproximada?` |
| `/servicos` | `Pedir orçamento de serralheria` | `Olá, vim pela página de serviços do site e quero pedir um orçamento.` |
| `/servicos/cortinas-e-portas-de-rolo` | `Pedir orçamento de cortina` | `Olá, vim pela página de cortinas e portas de rolo e quero pedir um orçamento.` |
| `/servicos/manutencao-de-cortinas` | `Pedir avaliação da cortina` | `Olá, vim pela página de manutenção de cortinas e quero pedir uma avaliação.` |
| `/servicos/portoes` | `Pedir orçamento de portão` | `Olá, vim pela página de portões e quero pedir um orçamento.` |
| `/servicos/escadas-e-guarda-corpos` | `Pedir orçamento de escada` | `Olá, vim pela página de escadas e guarda-corpos e quero pedir um orçamento.` |
| `/servicos/grades-e-sacadas` | `Pedir orçamento de grade` | `Olá, vim pela página de grades e sacadas e quero pedir um orçamento.` |
| `/servicos/pergolados-e-estruturas` | `Pedir orçamento de estrutura` | `Olá, vim pela página de pergolados e estruturas e quero pedir um orçamento.` |
| `/trabalhos` | `Pedir orçamento pelo WhatsApp` | `Olá, vim pela página de trabalhos realizados e quero pedir um orçamento.` |
| `/sobre` | `Falar com a Metal Esquadrias` | `Olá, vim pela página sobre a fábrica e quero pedir um orçamento.` |
| `/contato` | `Pedir orçamento no WhatsApp` | `Olá, vim pela página de contato e quero pedir um orçamento.` |

Use `generic` as the temporary template for all new public pages.

Create a separate `not-found` record with `noindex,follow`.

Use this 404 message: `Olá, não encontrei a página que procurava e quero pedir um orçamento.`

Use `Página não encontrada | Metal Esquadrias` as the 404 title.

Use this 404 meta description:

```text
A página solicitada não foi encontrada. Veja os serviços ou fale com a Metal Esquadrias.
```

Use `/404` as its internal canonical path and exclude it from `PublicPages()`.

Create these six base service records before building the catalog:

| ID | Name | Path | Featured |
|---|---|---|---|
| `cortinas` | `Cortinas e portas de rolo` | `/servicos/cortinas-e-portas-de-rolo` | `true` |
| `manutencao-cortinas` | `Manutenção de cortinas` | `/servicos/manutencao-de-cortinas` | `false` |
| `portoes` | `Portões` | `/servicos/portoes` | `false` |
| `escadas` | `Escadas e guarda-corpos` | `/servicos/escadas-e-guarda-corpos` | `false` |
| `grades` | `Grades e sacadas` | `/servicos/grades-e-sacadas` | `false` |
| `estruturas` | `Pergolados e estruturas` | `/servicos/pergolados-e-estruturas` | `false` |

- [ ] **Step 6: Add data-driven templates and routes**

Create `generic.html` with one H1, intro, and current-page CTA.

Create `not-found.html` with links to `/servicos` and the current-page CTA.

Use `Esta página não foi encontrada` as the 404 H1.

Register all public paths from `Catalog.PublicPages()`.

Each route closure must compare `request.URL.Path` with the page path.

Render the custom 404 when these paths differ.

Render `Catalog.NotFoundView()` for every unmatched path.

Do not redirect an unmatched path to the home page.

- [ ] **Step 7: Run the task checks**

Run:

```bash
gofmt -w internal/site/*.go
go test ./internal/site -v
go test ./...
go vet ./...
```

Expected: all commands exit with status 0.

- [ ] **Step 8: Commit the catalog and routes**

```bash
git add internal/site web/templates/pages
git commit -m "feat: add site routes and page catalog"
```

### Task 3: Layout, shared components and structured data

**Files:**

- Modify: `internal/site/model.go`
- Modify: `internal/site/render.go`
- Create: `internal/site/schema.go`
- Create: `internal/site/schema_test.go`
- Modify: `internal/site/app_test.go`
- Modify: `web/embed.go`
- Modify: `web/templates/layouts/base.html`
- Create: `web/templates/components/header.html`
- Create: `web/templates/components/footer.html`
- Create: `web/templates/components/whatsapp-cta.html`
- Create: `web/templates/components/proofs.html`
- Create: `web/templates/components/process.html`
- Create: `web/templates/components/faq.html`
- Create: `web/templates/components/service-card.html`
- Create: `web/templates/components/audience-card.html`

**Interfaces:**

- Consumes: `Catalog`, `Page`, and `ViewData` from Task 2.
- Produces: `schemaGraph(Site, Page, *Service) map[string]any`.
- Produces: named templates for later page tasks.
- Produces: one current-page WhatsApp CTA in the header and mobile bar.

- [ ] **Step 1: Write the failing layout tests**

Add `TestEveryPublicPageContainsMetadataNAPAndWhatsApp` to `app_test.go`.

For each public page, verify these exact visible values:

```go
wantNAP := []string{
	"Metal Esquadrias",
	"R. Ver. Rudi Müler, 101 — Distrito Industrial",
	"Santa Cruz do Sul/RS, CEP 96835-743",
	"(51) 3715-3326",
	"(51) 99849-3450",
	"Seg a sex, 7h–12h e 13h–18h · Sáb e dom fechado",
	"@metalesquadrias",
}
```

Also verify the page title, description, H1, canonical URL, and CTA URL.

Count `<h1` and require exactly one result.

- [ ] **Step 2: Write the failing schema tests**

Create `schema_test.go` with a helper that extracts `application/ld+json`.

Decode the result with `encoding/json` into `map[string]any`.

Add these exact test functions:

```go
func TestEveryPageContainsLocalBusinessSchema(t *testing.T)
func TestServicePagesContainServiceSchema(t *testing.T)
func TestPagesWithFAQContainFAQSchema(t *testing.T)
func TestSchemaUsesCanonicalValues(t *testing.T)
```

Verify schema nodes by their `@type` value.

Do not verify the schema with string fragments only.

Run:

```bash
go test ./internal/site -run 'TestEveryPublicPage|TestEveryPageContains|TestServicePages|TestPagesWithFAQ|TestSchemaUses' -v
```

Expected: FAIL because the footer and schemas do not exist.

- [ ] **Step 3: Build the structured-data graph**

Add `Schema map[string]any` to `ViewData`.

Create `schema.go` with this function shape:

```go
func schemaGraph(site Site, page Page, service *Service) map[string]any {
	graph := []map[string]any{localBusinessSchema(site)}
	if service != nil {
		graph = append(graph, serviceSchema(site, *service))
	}
	if len(page.FAQs) > 0 {
		graph = append(graph, faqSchema(page.FAQs))
	}
	return map[string]any{
		"@context": "https://schema.org",
		"@graph": graph,
	}
}
```

`localBusinessSchema` must return these values:

```go
map[string]any{
	"@type": "LocalBusiness",
	"@id": site.BaseURL + "/#empresa",
	"name": site.Name,
	"url": site.BaseURL,
	"telephone": site.Phone,
	"foundingDate": "1989-01-31",
	"areaServed": site.ServiceArea,
	"sameAs": []string{site.InstagramURL},
	"address": map[string]any{
		"@type": "PostalAddress",
		"streetAddress": site.Street,
		"addressLocality": "Santa Cruz do Sul",
		"addressRegion": "RS",
		"postalCode": "96835-743",
		"addressCountry": "BR",
	},
	"openingHoursSpecification": []map[string]any{
		{
			"@type": "OpeningHoursSpecification",
			"dayOfWeek": []string{"Monday", "Tuesday", "Wednesday", "Thursday", "Friday"},
			"opens": "07:00",
			"closes": "12:00",
		},
		{
			"@type": "OpeningHoursSpecification",
			"dayOfWeek": []string{"Monday", "Tuesday", "Wednesday", "Thursday", "Friday"},
			"opens": "13:00",
			"closes": "18:00",
		},
	},
}
```

`serviceSchema` must use `name`, `url`, `areaServed`, and the provider `@id`.

`faqSchema` must map every visible question to one accepted answer.

Change `Catalog.View` and `Catalog.NotFoundView` to add the graph.

- [ ] **Step 4: Add safe JSON output to the renderer**

Add this function before template parsing:

```go
jsonForHTML := func(value any) (template.JS, error) {
	encoded, err := json.Marshal(value)
	if err != nil {
		return "", fmt.Errorf("encode structured data: %w", err)
	}
	return template.JS(encoded), nil
}
```

Register it as `json` in a `template.FuncMap`.

Only pass static server-owned values to this function.

- [ ] **Step 5: Build the semantic base layout**

Replace the base template with these items:

1. Add a `Pular para o conteúdo` link before the header.
2. Render the shared header.
3. Render the page content in `<main id="conteudo">`.
4. Render the shared footer.
5. Render the mobile WhatsApp bar.
6. Add `meta robots` only when `Page.Robots` has a value.
7. Disable `historyRestoreAsHxRequest` with the HTMX meta configuration.
8. Add the structured-data graph.

Use this exact schema element:

```html
<script type="application/ld+json">{{json .Schema}}</script>
```

Use this exact HTMX configuration:

```html
<meta name="htmx-config" content='{"historyRestoreAsHxRequest":false}'>
```

- [ ] **Step 6: Add shared components**

Change `web/embed.go` to include `templates/components/*.html`.

Create these exact named templates:

```text
header        receives ViewData
footer        receives ViewData
whatsapp-cta receives CTA
proofs        receives []Proof
process       receives []Step
faq           receives []FAQ
service-card  receives Service
audience-card receives Audience
```

The header must use this logo element:

```html
<a href="/" aria-label="Metal Esquadrias, página inicial">
  <img src="/assets/images/logo-horizontal.svg" alt="Metal Esquadrias" width="280" height="56">
</a>
```

Use a native `<details>` element for the mobile menu.

The desktop and mobile menus must contain the same navigation items.

The footer must show every canonical NAP value without changes.

Use `tel:+555137153326` for the telephone link.

Use this address URL:

```text
https://www.google.com/maps/search/?api=1&query=R.+Ver.+Rudi+Müler,+101,+Santa+Cruz+do+Sul,+RS
```

Use `rel="noopener noreferrer"` on external links that open a new tab.

The CTA component must use an `<a>` element.

The FAQ component must use `<details>` and `<summary>`.

The mobile bar must use the current page CTA.

- [ ] **Step 7: Run the task checks**

Run:

```bash
gofmt -w internal/site/*.go web/embed.go
go test ./internal/site -v
go test ./...
go vet ./...
```

Expected: all commands exit with status 0.

- [ ] **Step 8: Commit the layout and schemas**

```bash
git add internal/site web
git commit -m "feat: add shared layout and structured data"
```

### Task 4: Página inicial e fotos aprovadas

**Files:**

- Modify: `internal/site/model.go`
- Modify: `internal/site/content_pages.go`
- Create: `internal/site/home_test.go`
- Modify: `internal/site/test_helpers_test.go`
- Modify: `web/templates/pages/home.html`
- Create: `public/images/1.jpg`
- Create: `public/images/2.jpg`
- Create: `public/images/3.jpg`
- Create: `public/images/4.jpg`
- Create: `public/images/5.jpg`
- Create: `public/images/6.jpg`
- Create: `public/images/7.jpg`
- Create: `public/images/cortina4.jpg`
- Create: `public/images/escada1.jpg`
- Create: `public/images/logo-horizontal.svg`
- Create: `public/images/logo-horizontal-white.svg`

**Interfaces:**

- Consumes: shared components from Task 3.
- Produces: `HomeContent` for the `home` template.
- Produces: the approved `Work` records used by later galleries.

- [ ] **Step 1: Write the failing home tests**

Create `home_test.go` with these exact test functions:

```go
func TestHomeUsesApprovedOpening(t *testing.T)
func TestHomeShowsAudienceChoicesInOrder(t *testing.T)
func TestHomeShowsSixServices(t *testing.T)
func TestHomeShowsProofsAndProcess(t *testing.T)
func TestHomeImagesHaveAltTextAndDimensions(t *testing.T)
func TestHomeLoadsOnlyFirstHeroImageEagerly(t *testing.T)
func TestHomeShowsApprovedFAQAnswers(t *testing.T)
```

Verify these audience links in this order:

```text
/para-arquitetos
/para-construtoras
/casa-e-comercio
```

Verify that the first hero image has `fetchpriority="high"`.

Verify that all other photos have `loading="lazy"`.

Verify six service-card links and four process steps.

Run:

```bash
go test ./internal/site -run TestHome -v
```

Expected: FAIL because the complete home content does not exist.

- [ ] **Step 2: Copy only the approved repository assets**

Run these mechanical copy commands:

```bash
mkdir -p public/images
cp design_system/assets/*.jpg public/images/
cp design_system/assets/logo-horizontal.svg public/images/
cp design_system/assets/logo-horizontal-white.svg public/images/
```

Do not fetch a social or stock photo in this task.

Add all copied public paths to the `fstest.MapFS` in `test_helpers_test.go`.

- [ ] **Step 3: Add the work records**

Use these exact records in `content_pages.go`:

| File | Category | Alt text | Caption | Size |
|---|---|---|---|---|
| `1.jpg` | `cortinas` | `Cortina metálica fechada em uma entrada comercial` | `Cortina metálica` | `1920x1080` |
| `2.jpg` | `portoes` | `Portão metálico instalado em uma residência` | `Portão metálico` | `1920x1080` |
| `3.jpg` | `grades` | `Guarda-corpo metálico instalado em uma sacada` | `Guarda-corpo metálico` | `1920x1080` |
| `4.jpg` | `portoes` | `Portão e grade metálica instalados em frente a uma residência` | `Portão e grade metálica` | `1920x1080` |
| `5.jpg` | `grades` | `Fechamento metálico instalado ao redor de um terreno` | `Fechamento metálico` | `1920x1080` |
| `6.jpg` | `cortinas` | `Cortina metálica instalada em uma abertura` | `Cortina metálica` | `1920x1080` |
| `7.jpg` | `escadas` | `Escada metálica com guarda-corpo` | `Escada e guarda-corpo` | `1920x1080` |
| `cortina4.jpg` | `cortinas` | `Porta de rolo metálica instalada em uma fachada comercial` | `Porta de rolo metálica` | `1600x716` |
| `escada1.jpg` | `escadas` | `Escada metálica instalada junto a uma parede` | `Escada metálica` | `1600x716` |

Do not add a city, date, customer, or material to a caption.

- [ ] **Step 4: Add the complete home data**

Add this type to `model.go`:

```go
type HomeContent struct {
	HeroWorks []Work
	Audiences []Audience
	Services []Service
	Proofs []Proof
	Steps []Step
	Works []Work
	FAQs []FAQ
}
```

Add `Content any` to `ViewData`.

Use `1.jpg`, `2.jpg`, and `5.jpg` in the hero.

Use this approved opening:

```text
Serralheria em Santa Cruz do Sul desde 1989
Serralheria sob medida para sua casa, seu comércio ou sua obra
Atendemos Santa Cruz do Sul e a Região dos Vales. O processo inclui medição, orçamento por escrito e instalação.
```

Use `Ver trabalhos realizados` as the secondary CTA to `/trabalhos`.

Use these audience card labels:

```text
Sou arquiteto
Represento uma construtora
Preciso de serralheria
```

Use these complete audience card records:

| ID | Title | Description | Path |
|---|---|---|---|
| `arquitetos` | `Sou arquiteto` | `Envie seu detalhamento para a equipe avaliar o projeto e o local.` | `/para-arquitetos` |
| `construtoras` | `Represento uma construtora` | `Envie o projeto para definir o escopo no orçamento.` | `/para-construtoras` |
| `casa-comercio` | `Preciso de serralheria` | `Envie uma foto e uma medida aproximada do local.` | `/casa-e-comercio` |

Show cortinas first and mark that service with `Featured: true`.

Use these home questions and answers:

| Question | Answer |
|---|---|
| `Como funciona o preço?` | `Cada peça depende da medida e do local. A equipe mede e envia um orçamento por escrito.` |
| `A medição é feita no local?` | `Sim. A equipe combina a medição antes de preparar o orçamento final.` |
| `Qual é o prazo?` | `O prazo depende do local e do tipo de peça. O orçamento informa o prazo antes da contratação.` |
| `Vocês fazem manutenção de cortinas instaladas por outra empresa?` | `Sim. A equipe avalia cortinas e portas de rolo instaladas por outras empresas.` |
| `Vocês recebem projeto de arquiteto?` | `Sim. Envie o detalhamento para a equipe avaliar o projeto e o local.` |
| `Como funciona o pagamento?` | `O pagamento inclui uma entrada antecipada e o restante após a instalação. Há opção de parcelamento.` |

Copy these questions into `Page.FAQs` for the `FAQPage` schema.

- [ ] **Step 5: Build the complete home template**

Render these sections in this order:

1. Hero with three photos and two CTAs.
2. Four proof records.
3. Three audience cards.
4. Six service cards.
5. Four process steps.
6. A preview of six work photos.
7. The factory section.
8. Six FAQ items.
9. The final WhatsApp CTA.

Use this final CTA copy:

```text
Tem uma foto do local?
Envie a foto e a medida aproximada. Isso ajuda a preparar a primeira orientação.
Mandar fotos no WhatsApp
```

Use the home message in both WhatsApp CTAs.

Use this exact factory section copy:

```text
Uma serralheria de fábrica desde 1989
A Metal Esquadrias fica no Distrito Industrial de Santa Cruz do Sul.
A equipe mede o local, prepara o orçamento por escrito e faz a instalação.
```

- [ ] **Step 6: Run the task checks**

Run:

```bash
gofmt -w internal/site/*.go
go test ./internal/site -run TestHome -v
go test ./...
go vet ./...
```

Expected: all commands exit with status 0.

- [ ] **Step 7: Commit the home page**

```bash
git add internal/site web/templates/pages/home.html public/images
git commit -m "feat: build the home page"
```

### Task 5: Páginas por público e índice de serviços

**Files:**

- Modify: `internal/site/model.go`
- Modify: `internal/site/content_pages.go`
- Modify: `internal/site/content_services.go`
- Create: `internal/site/audience_test.go`
- Create: `web/templates/pages/audience.html`
- Create: `web/templates/pages/service-index.html`

**Interfaces:**

- Consumes: `Audience`, `Service`, and the shared service-card template.
- Produces: `AudienceContent` and `ServiceIndexContent`.
- Produces: ordered service lists for each audience.

- [ ] **Step 1: Write the failing audience tests**

Create `audience_test.go` with these exact tests:

```go
func TestArchitectServiceOrder(t *testing.T)
func TestBuilderServiceOrder(t *testing.T)
func TestHouseAndCommerceGroups(t *testing.T)
func TestAudiencePagesUseApprovedCopyAndCTA(t *testing.T)
func TestServiceIndexShowsEveryService(t *testing.T)
```

Use these expected service ID lists:

```go
architect := []string{"escadas", "grades", "estruturas", "portoes", "cortinas"}
builder := []string{"estruturas", "escadas", "grades", "portoes", "cortinas"}
house := []string{"portoes", "escadas", "grades", "estruturas"}
commerce := []string{"cortinas", "portoes", "grades"}
maintenance := []string{"manutencao-cortinas"}
```

Run:

```bash
go test ./internal/site -run 'TestArchitect|TestBuilder|TestHouse|TestAudience|TestServiceIndex' -v
```

Expected: FAIL because the audience content does not exist.

- [ ] **Step 2: Add audience view models**

Add these types to `model.go`:

```go
type ServiceGroup struct {
	Title string
	Intro string
	Services []Service
}

type AudienceContent struct {
	Services []Service
	Groups []ServiceGroup
	Steps []Step
}

type ServiceIndexContent struct {
	Services []Service
	Steps []Step
}
```

Add catalog helpers with these signatures:

```go
func (c Catalog) ServicesByID(ids []string) []Service
func (c Catalog) AudienceByID(id string) (Audience, bool)
func (c Catalog) ServiceByID(id string) (Service, bool)
```

- [ ] **Step 3: Add exact audience content**

Use this architect copy:

```text
Serralheria para projetos de arquitetura
Analisamos o detalhamento, medimos o local e preparamos um orçamento por escrito.
Envie o projeto com as medidas, os desenhos e as informações já definidas.
```

Use this builder copy:

```text
Serralheria para obras residenciais, comerciais e industriais
Recebemos o projeto e definimos o escopo, o valor e o prazo no orçamento.
Envie o projeto, o endereço da obra e a necessidade de prazo.
```

Use this house and commerce copy:

```text
Serralheria para sua casa ou seu comércio
Envie uma foto e a medida aproximada. A equipe orienta o próximo passo.
```

The house and commerce page must use these groups:

| Group | Intro | Service IDs |
|---|---|---|
| `Para sua casa` | `Portões, escadas, guarda-corpos, grades e estruturas feitas para o local.` | `portoes, escadas, grades, estruturas` |
| `Para seu comércio` | `Cortinas, portões e grades para novas instalações ou mudanças no espaço.` | `cortinas, portoes, grades` |
| `Para uma cortina existente` | `A equipe avalia o item, inclusive quando outra empresa fez a instalação.` | `manutencao-cortinas` |

- [ ] **Step 4: Build the audience and service-index templates**

The audience template must render these sections:

1. H1, intro, and current-page CTA.
2. Ordered services or the three service groups.
3. The four process steps.
4. A final current-page CTA.

The service-index template must render these sections:

1. H1 and a short introduction.
2. All six service cards.
3. The four process steps.
4. A final current-page CTA.

Use this exact service-index introduction:

```text
Escolha o serviço que mais se aproxima do que você precisa.
Se ainda tiver dúvida, envie uma foto e uma medida aproximada pelo WhatsApp.
```

Give the cortinas card more visual weight through `Featured`.

Do not duplicate service details on an audience page.

- [ ] **Step 5: Run the task checks**

Run:

```bash
gofmt -w internal/site/*.go
go test ./internal/site -run 'TestArchitect|TestBuilder|TestHouse|TestAudience|TestServiceIndex' -v
go test ./...
go vet ./...
```

Expected: all commands exit with status 0.

- [ ] **Step 6: Commit the audience pages**

```bash
git add internal/site web/templates/pages
git commit -m "feat: add audience and service pages"
```

### Task 6: Páginas detalhadas de serviço

**Files:**

- Modify: `internal/site/model.go`
- Modify: `internal/site/content_services.go`
- Create: `internal/site/service_test.go`
- Create: `web/templates/pages/service.html`
- Create: `web/templates/components/work-gallery.html`

**Interfaces:**

- Consumes: service records, work records, process steps, and shared components.
- Produces: `ServiceContent` for all six service routes.
- Produces: a visible FAQ that matches each `FAQPage` schema.

- [ ] **Step 1: Write the failing service-page tests**

Create `service_test.go` with these exact test functions:

```go
func TestEveryServicePageHasRequiredSections(t *testing.T)
func TestServicePagesUseSpecificCTA(t *testing.T)
func TestServicePagesDoNotPromisePriceDeadlineOrWarranty(t *testing.T)
func TestMaintenancePageAcceptsItemsInstalledByOthers(t *testing.T)
func TestCurtainPageNamesNaportAsSupplier(t *testing.T)
func TestServiceGalleryUsesOnlyMatchingWork(t *testing.T)
func TestServiceWithoutConfirmedPhotoOmitsGallery(t *testing.T)
```

For every service page, require these section headings:

```text
Onde este serviço é usado
O que enviar para o orçamento
Como funciona
Perguntas frequentes
```

Require the exact current-page CTA label and WhatsApp URL.

Reject `prazo médio`, `garantia de`, `a partir de R$`, and `preço fixo`.

Run:

```bash
go test ./internal/site -run 'TestEveryService|TestService|TestMaintenance|TestCurtain' -v
```

Expected: FAIL because the detailed service template does not exist.

- [ ] **Step 2: Add the service view model**

Add this exact type to `model.go`:

```go
type ServiceContent struct {
	Service Service
	Works []Work
	Steps []Step
}
```

Set the `service` template for all service pages.

Copy each service FAQ list into its matching `Page.FAQs`.

- [ ] **Step 3: Add exact service introductions and budget needs**

Use this exact content:

| ID | Intro | Uses | Budget needs |
|---|---|---|---|
| `cortinas` | `A equipe mede o local, prepara o orçamento e faz a instalação. A Naport fornece as cortinas e portas de rolo.` | `Entradas de comércios`, `Outras aberturas que precisam de uma cortina ou porta de rolo` | `Foto da abertura`, `Largura e altura aproximadas`, `Cidade e bairro`, `Informação sobre o uso do espaço` |
| `manutencao-cortinas` | `A equipe avalia cortinas e portas de rolo, inclusive quando outra empresa fez a instalação.` | `Cortina que não abre ou não fecha`, `Cortina que trava durante o movimento`, `Item instalado por outra empresa` | `Foto da cortina`, `Descrição do problema`, `Largura e altura aproximadas`, `Cidade e bairro` |
| `portoes` | `A equipe mede o local e prepara um portão conforme o espaço e o uso informado no orçamento.` | `Casas`, `Comércios`, `Obras residenciais, comerciais e industriais` | `Foto da entrada`, `Largura e altura aproximadas`, `Forma de abertura desejada`, `Cidade e bairro` |
| `escadas` | `Envie uma foto ou um detalhamento. A medição confirma as dimensões antes do orçamento final.` | `Escadas`, `Guarda-corpos`, `Projetos de arquitetos e obras` | `Foto do local`, `Medidas aproximadas`, `Detalhamento disponível`, `Cidade e bairro` |
| `grades` | `A equipe mede o local e prepara o orçamento para grades, fechamentos e estruturas para sacadas.` | `Grades`, `Fechamentos`, `Estruturas para sacadas` | `Foto do local`, `Largura e altura aproximadas`, `Detalhamento disponível`, `Cidade e bairro` |
| `estruturas` | `Envie uma foto ou um detalhamento para a equipe avaliar o local e o serviço.` | `Pergolados`, `Estruturas metálicas conforme o projeto`, `Obras residenciais, comerciais e industriais` | `Foto do local`, `Medidas aproximadas`, `Detalhamento ou desenho disponível`, `Cidade e bairro` |

Do not add material, motor, pintura, automação, or acabamento options without confirmation.

- [ ] **Step 4: Add exact service FAQs**

Every service page must include these four questions:

| Question | Answer |
|---|---|
| `Como o preço é definido?` | `O preço depende das medidas, do local e do item. A equipe envia o valor no orçamento por escrito.` |
| `Qual é o prazo?` | `O prazo depende do local e do tipo de peça. O orçamento informa o prazo antes da contratação.` |
| `Como funciona a garantia?` | `A garantia depende do item. O orçamento informa as condições aplicáveis antes da contratação.` |
| `Como funciona o pagamento?` | `O pagamento inclui uma entrada antecipada e o restante após a instalação. Há opção de parcelamento.` |

Add this curtain question:

```text
Quem fornece a cortina ou porta de rolo?
A Naport fornece as cortinas e portas de rolo. A Metal Esquadrias mede o local, prepara o orçamento e faz a instalação.
```

Add this maintenance question:

```text
Vocês atendem uma cortina instalada por outra empresa?
Sim. A equipe avalia o item e informa o serviço necessário no orçamento.
```

Add this question to portões, escadas, grades, and estruturas:

```text
Posso enviar um projeto de arquiteto?
Sim. Envie o detalhamento para a equipe avaliar o projeto e o local.
```

- [ ] **Step 5: Attach only matching photos**

Use these exact category mappings:

```go
map[string]string{
	"cortinas": "cortinas",
	"portoes": "portoes",
	"escadas": "escadas",
	"grades": "grades",
}
```

Omit the gallery for `manutencao-cortinas` and `estruturas`.

Do not present an installation photo as a maintenance photo.

- [ ] **Step 6: Build the service template**

Render these sections in this order:

1. H1, intro, and current-page CTA.
2. Matching work gallery when it has confirmed photos.
3. Uses.
4. Budget needs.
5. Four process steps.
6. Service FAQs.
7. Final current-page CTA.

Every image must use its factual alt text, width, and height.

Load every service gallery image with `loading="lazy"`.

- [ ] **Step 7: Run the task checks**

Run:

```bash
gofmt -w internal/site/*.go
go test ./internal/site -run 'TestEveryService|TestService|TestMaintenance|TestCurtain' -v
go test ./...
go vet ./...
```

Expected: all commands exit with status 0.

- [ ] **Step 8: Commit the service pages**

```bash
git add internal/site web/templates
git commit -m "feat: add detailed service pages"
```

### Task 7: Galeria HTMX e páginas institucionais

**Files:**

- Modify: `internal/site/model.go`
- Modify: `internal/site/app.go`
- Modify: `internal/site/render.go`
- Modify: `internal/site/content_pages.go`
- Create: `internal/site/gallery.go`
- Create: `internal/site/gallery_test.go`
- Create: `web/templates/components/gallery.html`
- Create: `web/templates/pages/works.html`
- Create: `web/templates/pages/about.html`
- Create: `web/templates/pages/contact.html`
- Modify: `web/templates/pages/not-found.html`
- Create: `docs/fontes-das-fotos.md`

**Interfaces:**

- Consumes: approved `Work` records and injected `PublicFS`.
- Produces: `filterWorks([]Work, string) ([]Work, error)`.
- Produces: `availableWorks(fs.FS, []Work, *log.Logger) []Work`.
- Produces: `renderer.fragment(http.ResponseWriter, int, string, any)`.
- Produces: full and partial responses for `/trabalhos`.

- [ ] **Step 1: Write the failing gallery tests**

Create `gallery_test.go` with these exact test functions:

```go
func TestWorksPageFiltersWithoutHTMX(t *testing.T)
func TestWorksPageReturnsGalleryFragmentForHTMX(t *testing.T)
func TestWorksResponseVariesByHXRequest(t *testing.T)
func TestInvalidHTMXFilterDoesNotReplaceGallery(t *testing.T)
func TestMissingImageIsOmittedAndLogged(t *testing.T)
func TestWorksPageShowsRetryControl(t *testing.T)
```

For an HTMX request, set `HX-Request: true`.

Require the partial response to omit `<html` and `<head`.

Require `Vary: HX-Request` on full and partial responses.

Require status 422 for an invalid HTMX filter.

Require only `portoes` records for `?tipo=portoes`.

Run:

```bash
go test ./internal/site -run 'TestWorks|TestInvalidHTMX|TestMissingImage' -v
```

Expected: FAIL because the filter and partial renderer do not exist.

- [ ] **Step 2: Add the gallery model and filter rules**

Add this exact type to `model.go`:

```go
type GalleryView struct {
	Active string
	Works []Work
	ShowError bool
}
```

Accept only these filter values:

```go
var workFilters = map[string]string{
	"todos": "Todos",
	"cortinas": "Cortinas",
	"portoes": "Portões",
	"escadas": "Escadas",
	"grades": "Grades e sacadas",
}
```

Treat an empty value as `todos`.

Return a defined error for every other value.

Trim `/assets/` from each public path before calling `fs.Stat`.

Log the missing path and omit its record.

- [ ] **Step 3: Add the HTMX response behavior**

Add this renderer interface:

```go
func (r *renderer) fragment(w http.ResponseWriter, status int, name string, data any)
func normalizedFilter(filter string) string
func (c Catalog) WorksView(gallery GalleryView) ViewData
```

The works handler must follow this flow:

```go
filter := request.URL.Query().Get("tipo")
works, err := filterWorks(availableWorks(options.PublicFS, catalog.Works, options.Logger), filter)
w.Header().Add("Vary", "HX-Request")

if err != nil && request.Header.Get("HX-Request") == "true" {
	http.Error(w, "Não foi possível aplicar o filtro.", http.StatusUnprocessableEntity)
	return
}

view := GalleryView{Active: normalizedFilter(filter), Works: works, ShowError: err != nil}
if request.Header.Get("HX-Request") == "true" {
	renderer.fragment(w, http.StatusOK, "gallery", view)
	return
}

renderer.page(w, http.StatusOK, catalog.WorksView(view))
```

For an invalid normal request, show all work and set `ShowError`.

Do not use HTMX for any other public route.

- [ ] **Step 4: Build the works page and gallery fragment**

Create links for all five filters.

Each filter link must have a valid `href` for navigation without JavaScript.

Add `hx-get`, `hx-target="#galeria"`, `hx-swap="outerHTML"`, and `hx-push-url="true"`.

Use `aria-current="true"` on the active filter.

Use `<section id="galeria" aria-live="polite">` as the fragment root.

Add this hidden error block before the gallery:

```html
<div id="erro-filtro" hidden role="alert">
  <p>Não foi possível aplicar o filtro.</p>
  <a href="/trabalhos" hx-get="/trabalhos" hx-target="#galeria">Tentar novamente</a>
</div>
```

Use an HTMX response-error event on the filter container to show this block.

Do not replace the current gallery after a 422 response.

- [ ] **Step 5: Build the about, contact, and 404 pages**

Use this exact about copy:

```text
A Metal Esquadrias é uma serralheria de fábrica no Distrito Industrial de Santa Cruz do Sul.
A empresa iniciou suas atividades em 31 de janeiro de 1989.
A equipe mede o local, prepara o orçamento por escrito e faz a instalação.
A equipe fabrica a maioria das peças. A Naport fornece as cortinas e portas de rolo.
```

The about page must link to services, works, and its WhatsApp CTA.

The contact page must show WhatsApp, telephone, address, hours, and Instagram.

Use the exact canonical values from Global Constraints.

The 404 page must link to services and its page-specific WhatsApp CTA.

- [ ] **Step 6: Record the photo sources**

Create `docs/fontes-das-fotos.md` with one row for each of the nine JPEG files.

Use `Arquivo original do repositório` as the source for each current image.

Record its factual category, alt text, and public path.

Add this rule below the table:

```text
Registre a URL da publicação antes de usar uma foto do Instagram ou do Facebook.
Não use a foto quando a publicação oficial não puder ser confirmada.
```

Do not add a social URL because this plan uses no social photo.

- [ ] **Step 7: Run the task checks**

Run:

```bash
gofmt -w internal/site/*.go
go test ./internal/site -run 'TestWorks|TestInvalidHTMX|TestMissingImage' -v
go test ./...
go vet ./...
```

Expected: all commands exit with status 0.

- [ ] **Step 8: Commit the gallery and institutional pages**

```bash
git add internal/site web/templates docs/fontes-das-fotos.md
git commit -m "feat: add work gallery and company pages"
```

### Task 8: Sitemap, robots e regras de resposta

**Files:**

- Modify: `internal/site/app.go`
- Create: `internal/site/seo.go`
- Create: `internal/site/seo_test.go`

**Interfaces:**

- Consumes: `Catalog.PublicPages()` and `Site.BaseURL`.
- Produces: `sitemapXML(Catalog) ([]byte, error)`.
- Produces: `robotsText(Site) string`.
- Produces: `/sitemap.xml` and `/robots.txt`.

- [ ] **Step 1: Write the failing SEO route tests**

Create `seo_test.go` with these exact test functions:

```go
func TestSitemapContainsEveryPublicCanonicalURLOnce(t *testing.T)
func TestSitemapOmits404AndFilterQueries(t *testing.T)
func TestSitemapUsesXMLContentType(t *testing.T)
func TestRobotsAllowsCrawlingAndLinksSitemap(t *testing.T)
func TestRobotsUsesTextContentType(t *testing.T)
```

Decode the sitemap with `encoding/xml`.

Require these 14 canonical URLs exactly once.

Reject `/404`, `?tipo=`, and every URL outside the canonical domain.

Run:

```bash
go test ./internal/site -run 'TestSitemap|TestRobots' -v
```

Expected: FAIL because the SEO routes do not exist.

- [ ] **Step 2: Build the sitemap from the catalog**

Create these types in `seo.go`:

```go
type sitemapURLSet struct {
	XMLName xml.Name `xml:"urlset"`
	XMLNS string `xml:"xmlns,attr"`
	URLs []sitemapURL `xml:"url"`
}

type sitemapURL struct {
	Location string `xml:"loc"`
}
```

Implement `sitemapXML` with `xml.MarshalIndent`.

Use `http.StatusInternalServerError` when XML generation fails.

Log the technical error and show `Não foi possível gerar o mapa do site.`.

- [ ] **Step 3: Add the exact robots response**

Return this exact body from `robotsText`:

```text
User-agent: *
Allow: /
Sitemap: https://metalesquadrias.com.br/sitemap.xml
```

End the response with one newline.

Use `application/xml; charset=utf-8` for the sitemap.

Use `text/plain; charset=utf-8` for robots.

- [ ] **Step 4: Register the SEO routes**

Register exact GET handlers before the not-found handler.

Do not include either SEO route in the visible navigation.

Do not add query strings or fragment identifiers to the sitemap.

- [ ] **Step 5: Run the task checks**

Run:

```bash
gofmt -w internal/site/*.go
go test ./internal/site -run 'TestSitemap|TestRobots' -v
go test ./...
go vet ./...
```

Expected: all commands exit with status 0.

- [ ] **Step 6: Commit the SEO routes**

```bash
git add internal/site
git commit -m "feat: add sitemap and robots routes"
```

### Task 9: Direção visual, resposta em telas e acessibilidade

**Files:**

- Modify: `web/styles/input.css`
- Modify: `web/templates/layouts/base.html`
- Modify: `web/templates/components/*.html`
- Modify: `web/templates/pages/*.html`
- Modify: `public/styles/app.css`
- Create: `internal/site/accessibility_test.go`

**Interfaces:**

- Consumes: the current design tokens and semantic templates.
- Produces: responsive component classes with AA color pairs.
- Produces: one generated, minified, and versioned CSS file.

- [ ] **Step 1: Write the failing accessibility tests**

Create `accessibility_test.go` with these exact tests:

```go
func TestPublishedImagesHaveAltWidthAndHeight(t *testing.T)
func TestPageHasSkipLinkAndMainLandmark(t *testing.T)
func TestInteractiveElementsExposeVisibleFocusStyle(t *testing.T)
func TestPrimaryColorPairsMeetContrastTargets(t *testing.T)
```

Request every public route in the image test.

Inspect each rendered `<img>` tag for nonempty `alt`, `width`, and `height` attributes.

Use this exact contrast case table:

```go
cases := []struct {
	name string
	foreground string
	background string
	minimum float64
}{
	{"body on paper", "#22262B", "#F6F5F2", 4.5},
	{"muted on paper", "#5B636D", "#F6F5F2", 4.5},
	{"white on brand", "#FFFFFF", "#B60000", 4.5},
	{"focus on paper", "#E23A2E", "#F6F5F2", 3.0},
}
```

Implement the WCAG relative-luminance formula inside the test file.

Run:

```bash
go test ./internal/site -run 'TestPublishedImages|TestPageHas|TestInteractive|TestPrimaryColor' -v
```

Expected: FAIL until all templates and focus styles meet the rules.

- [ ] **Step 2: Add the shared layout classes**

Add these component classes to `input.css` with Tailwind `@apply`:

```css
@layer components {
  .site-container { @apply mx-auto w-full max-w-[1200px] px-5 md:px-8; }
  .section-space { @apply py-14 md:py-20 lg:py-24; }
  .section-heading { @apply max-w-3xl text-3xl font-bold tracking-tight md:text-4xl; }
  .eyebrow { @apply mb-4 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-brand; }
  .button-primary { @apply inline-flex min-h-11 items-center justify-center bg-brand px-5 py-3 font-semibold text-white; }
  .button-primary:hover { @apply bg-brand-hover; }
  .button-secondary { @apply inline-flex min-h-11 items-center justify-center border border-iron px-5 py-3 font-semibold text-iron; }
  .card { @apply border border-line bg-white p-6 shadow-sm; border-radius: var(--radius-md); }
  .photo-frame { @apply overflow-hidden bg-paper-dim; border-radius: var(--radius-sm); }
  .photo-frame img { @apply h-full w-full object-cover; }
  .mobile-whatsapp { @apply fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white p-3 md:hidden; }
}
```

Keep borders thin, shadows quiet, and corners small.

Do not add gradients, glass effects, large pills, or animated background effects.

- [ ] **Step 3: Style the hero and content grids**

Use a single column below `md` and two columns above `lg`.

Use `clamp(2.5rem, 7vw, 4.25rem)` for the home H1.

Use a three-cell image collage on desktop.

Keep all image cuts consistent with `object-fit: cover`.

Use responsive grids for audience, service, proof, process, and gallery cards.

Give the featured curtain card a two-column span only where space permits.

Add enough bottom padding on mobile so the fixed CTA does not cover content.

- [ ] **Step 4: Style interaction and reduced motion**

Use a three-pixel focus ring with a three-pixel offset.

Keep every primary control at least 44 pixels high.

Do not remove the native focus indicator without a replacement.

Add this reduced-motion rule:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

Use `aria-expanded` behavior supplied by native `<details>`.

Do not add custom menu JavaScript.

- [ ] **Step 5: Apply semantic classes to every template**

Make sure headings follow one logical order on every page.

Use one H1 and section-level H2 elements.

Use lists for service, proof, process, and contact collections.

Use `aria-label` when a link label does not describe its target.

Use `aria-live="polite"` only for the gallery result and filter status.

Keep the skip link hidden until it receives focus.

- [ ] **Step 6: Generate CSS and run checks**

Run:

```bash
npm run build:css
gofmt -w internal/site/*.go
go test ./internal/site -run 'TestPublishedImages|TestPageHas|TestInteractive|TestPrimaryColor' -v
go test ./...
go vet ./...
npm run check:assets
```

Expected: all commands exit with status 0.

- [ ] **Step 7: Commit the visual system**

```bash
git add internal/site/accessibility_test.go web public/styles/app.css
git commit -m "feat: apply responsive accessible styles"
```

### Task 10: Critérios de aceitação e documentação

**Files:**

- Create: `internal/site/acceptance_test.go`
- Create: `README.md`
- Modify: `docs/fontes-das-fotos.md`

**Interfaces:**

- Consumes: the complete handler and all public assets.
- Produces: one acceptance suite for the complete site.
- Produces: exact local and deployment procedures.

- [ ] **Step 1: Write the failing acceptance tests**

Create `acceptance_test.go` with these exact test functions:

```go
func TestEveryPageHasOneTitleDescriptionCanonicalAndH1(t *testing.T)
func TestEveryWhatsAppLinkUsesPageNumberAndMessage(t *testing.T)
func TestEveryPublishedImageExists(t *testing.T)
func TestNavigationWorksWithoutHTMXAttributes(t *testing.T)
func TestVisibleFAQMatchesFAQSchema(t *testing.T)
func TestSiteCopyOmitsForbiddenClaims(t *testing.T)
func TestContactLinksUseCanonicalTargets(t *testing.T)
```

Use `DefaultCatalog()` as the source for page paths and messages.

Parse each WhatsApp URL with `net/url`.

Require host `wa.me`, path `/5551998493450`, and the exact `text` query value.

Use `os.DirFS("../../public")` for the published image test.

Reject these copy fragments without case sensitivity:

```text
excelência
impecável
incomparável
qualidade superior
líder de mercado
satisfação garantida
melhor custo-benefício
prazo médio
preço fixo
```

Run:

```bash
go test ./internal/site -run 'TestEveryPage|TestEveryWhatsApp|TestEveryPublished|TestNavigation|TestVisibleFAQ|TestSiteCopy|TestContactLinks' -v
```

Expected: fix any uncovered acceptance gap before the suite passes.

- [ ] **Step 2: Add the development README**

Create `README.md` with these sections:

1. `Requisitos` lists Go 1.26 and Node.js 24.
2. `Instalação` runs `npm install`.
3. `Desenvolvimento` runs the CSS watcher and Go server.
4. `Testes` runs the complete check sequence.
5. `Atualização do HTMX` explains the fixed copy command.
6. `Fotos` links to `docs/fontes-das-fotos.md`.
7. `Vercel` explains preview and production deployment.

Use this exact local development sequence:

```bash
npm install
npm run watch:css
PORT=3000 go run .
```

State that the CSS watcher and Go server use separate terminals.

Use this exact verification sequence:

```bash
npm run build:css
npm run check:assets
go test -race ./...
go vet ./...
go build ./...
```

State that `npm run vendor:htmx` only runs after an approved HTMX version change.

- [ ] **Step 3: Run every local check from a clean process**

Run:

```bash
npm ci
npm run build:css
npm run check:assets
go test -race ./...
go vet ./...
go build ./...
git diff --check
```

Expected: all commands exit with status 0.

- [ ] **Step 4: Start the server and run HTTP smoke checks**

Start the server in one terminal:

```bash
PORT=3000 go run .
```

Run these checks in another terminal:

```bash
curl -fsS http://localhost:3000/ >/dev/null
curl -fsS http://localhost:3000/servicos/cortinas-e-portas-de-rolo >/dev/null
curl -fsS http://localhost:3000/trabalhos?tipo=portoes >/dev/null
curl -fsS -H 'HX-Request: true' http://localhost:3000/trabalhos?tipo=portoes >/dev/null
curl -fsS http://localhost:3000/sitemap.xml >/dev/null
curl -fsS http://localhost:3000/robots.txt >/dev/null
```

Expected: every request exits with status 0.

- [ ] **Step 5: Commit the acceptance suite and README**

```bash
git add internal/site/acceptance_test.go README.md docs/fontes-das-fotos.md public/styles/app.css
git commit -m "test: add site acceptance checks"
```

### Task 11: Browser verification and Vercel deployment

**Files:**

- Modify only when verification finds a defect.

**Interfaces:**

- Consumes: the complete repository and Vercel project access.
- Produces: a verified preview and production deployment.
- Produces: the custom domain connection for `metalesquadrias.com.br`.

- [ ] **Step 1: Load the required verification skills**

Use `vercel:agent-browser-verify` for the local server and preview deployment.

Use `vercel:deployments-cicd` before the first Vercel CLI mutation.

Use `superpowers:systematic-debugging` before changing code after a failure.

- [ ] **Step 2: Verify the local site in a browser**

Start `PORT=3000 go run .`.

Check the home page at 390 by 844 pixels.

Check the home page at 1440 by 900 pixels.

Check all public routes from the catalog.

Check the mobile menu with the keyboard.

Check every focus indicator with Tab and Shift+Tab.

Check that no content creates horizontal scrolling.

Check that the mobile WhatsApp CTA does not cover footer content.

Check that the browser console contains no error.

- [ ] **Step 3: Verify the complete gallery flow**

Open `/trabalhos` without a query.

Select each gallery filter.

Confirm that HTMX changes only the gallery section.

Confirm that the URL changes after each successful filter.

Disable JavaScript and repeat one filter through its normal link.

Request an invalid filter and confirm that the current gallery remains visible.

Use `Tentar novamente` and confirm that all work returns.

- [ ] **Step 4: Verify all contact targets**

Check the telephone link target `tel:+555137153326`.

Check the address link opens the canonical address.

Check the Instagram link opens the official profile URL.

Check one WhatsApp CTA on every page.

Confirm the number and decoded message against `DefaultCatalog()`.

Do not send a WhatsApp message during verification.

- [ ] **Step 5: Create and verify a Vercel preview**

Run:

```bash
npx vercel link --yes --project metal-esquadrias
preview_url=$(npx vercel deploy --yes)
npx vercel inspect "$preview_url" --wait
npx vercel curl / --deployment "$preview_url"
```

Expected: the deployment reaches `Ready` and the home request succeeds.

Repeat the local browser checks against `preview_url`.

Verify that CSS, HTMX, logos, and JPEG files return status 200.

If Vercel omits `public/`, stop and inspect the deployment output before a code change.

- [ ] **Step 6: Fix preview-only defects with tests**

Use the systematic debugging skill for each defect.

Add a failing regression test when the defect can run locally.

Run the full local verification sequence after each fix.

Commit each verified fix with a focused message.

Create a new preview and repeat the affected browser flow.

- [ ] **Step 7: Publish production and connect the domain**

Run:

```bash
production_url=$(npx vercel deploy --prod --yes)
npx vercel inspect "$production_url" --wait
```

Expected: production reaches `Ready`.

Inspect the current domain state:

```bash
npx vercel domains inspect metalesquadrias.com.br
```

If the domain is not assigned, add it to the linked project:

```bash
npx vercel domains add metalesquadrias.com.br metal-esquadrias
```

Inspect the domain again and request the home page:

```bash
npx vercel domains inspect metalesquadrias.com.br
curl -fsS https://metalesquadrias.com.br/ >/dev/null
```

Expected: the custom domain returns the production home page.

If Vercel requests DNS changes, report the exact records and stop domain work.

Do not change DNS without separate authority.

- [ ] **Step 8: Run final production verification**

Repeat all browser checks on `https://metalesquadrias.com.br`.

Check `/sitemap.xml` and `/robots.txt` on the custom domain.

Check one service schema with a structured-data validator.

Check the home FAQ schema with the same validator.

Run `git status --short` and report all remaining changes.

Use `superpowers:verification-before-completion` before the completion claim.

## Technical References

- [Vercel zero-configuration Go support](https://vercel.com/changelog/zero-configuration-go-backend-support)
- [Vercel CLI deployment](https://vercel.com/docs/cli/deploying-from-cli)
- [Vercel custom domain setup](https://vercel.com/docs/domains/set-up-custom-domain)
- [HTMX requests, responses, and caching](https://htmx.org/docs/)
- [Tailwind CSS CLI](https://tailwindcss.com/docs/installation/tailwind-cli?web=1)
