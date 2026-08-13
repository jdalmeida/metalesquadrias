# Site Metal Esquadrias

Contexto do projeto. Ler antes de qualquer alteração.

## O que é

Site da Metal Esquadrias, serralheria de fábrica em Santa Cruz do Sul/RS.

## Documentos que governam este repositório

| Documento | Define |
|---|---|
| `docs/01-voz.md` | Como a empresa fala. Vale para todo texto do site. |
| `docs/02-fluxo-do-lead.md` | Como o cliente chega e converte. Origem do backlog. |

Em caso de conflito entre um pedido pontual e esses documentos, apontar o conflito antes de executar.

## Dados canônicos (NAP)

Devem aparecer idênticos no site, no Perfil da Empresa no Google, no Instagram, no Facebook e em qualquer diretório. Inconsistência de NAP prejudica ranqueamento local e confunde extração por IA.

```
Nome:      Metal Esquadrias
Endereço:  R. Ver. Rudi Müler, 101 — Distrito Industrial
           Santa Cruz do Sul/RS, CEP 96835-743
Telefone:  (51) 3715-3326
WhatsApp:  (51) 99849-3450
Horário:   Seg a sex, 7h–12h e 13h–18h · Sáb e dom fechado
Instagram: @metalesquadrias
Fundação:  1989
```

## Regras inegociáveis

1. **Nunca inventar fato.** Ano de fundação, prazo, garantia, raio de atendimento e preço só entram no site depois de confirmados pelo proprietário. Placeholder visível é preferível a texto plausível. Fato publicado é citado por modelo de IA e se propaga.
2. **Nunca depoimento ou avaliação fabricada.** A empresa tem zero avaliações no Google hoje; o componente some quando não há dados.
3. **Nunca foto de banco de imagens ou render.** Só trabalho executado.
4. **Adjetivo vazio é proibido** — ver lista em `docs/01-voz.md`.
5. **Todo link de WhatsApp leva mensagem pré-preenchida específica da página.** É o que identifica a origem do lead sem ferramenta nenhuma.
6. **Toda página é landing page:** H1 próprio, meta description própria, NAP no rodapé, CTA próprio, schema próprio.
7. **Schema obrigatório:** `LocalBusiness` global; `Service` nas páginas de serviço; `FAQPage` onde houver FAQ.
