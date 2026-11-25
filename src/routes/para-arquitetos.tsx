import { createFileRoute } from "@tanstack/react-router";
import { AudienceHero } from "#/components/audience/AudienceHero";
import { AudienceServices } from "#/components/audience/AudienceServices";
import { FinalCta } from "#/components/home/FinalCta";
import { Footer } from "#/components/home/Footer";
import { Gallery } from "#/components/home/Gallery";
import { Header } from "#/components/home/Header";
import { WHATSAPP_MESSAGES } from "#/lib/site";

const TITLE = "Serralheria para projetos de arquitetura — Metal Esquadrias";
const DESCRIPTION =
	"Analisamos o detalhamento, medimos o local e preparamos um orçamento por escrito para escadas, grades, pergolados, portões e cortinas de ferro.";

const SERVICE_ORDER = [
	"escadas",
	"grades",
	"estruturas",
	"portoes",
	"cortinas",
] as const;

const PHOTOS = [
	{
		src: "/assets/escada-metalica-preta.jpg",
		caption: "Escada metálica com guarda-corpo",
	},
	{
		src: "/assets/escada-guarda-corpo.jpg",
		caption: "Escada com guarda-corpo",
	},
	{ src: "/assets/guarda-corpo-rampa.jpg", caption: "Guarda-corpo de rampa" },
	{ src: "/assets/sacada.jpg", caption: "Guarda-corpo de sacada" },
	{
		src: "/assets/grade-janela-detalhe.jpg",
		caption: "Grade de janela — detalhe do ornamento",
	},
	{ src: "/assets/gradil-portao.jpg", caption: "Gradil e portão residencial" },
	{ src: "/assets/cobertura-patio.jpg", caption: "Cobertura metálica" },
	{ src: "/assets/cobertura-curva.jpg", caption: "Cobertura curva" },
	{ src: "/assets/transvision-loja.jpg", caption: "Transvision em loja" },
];

export const Route = createFileRoute("/para-arquitetos")({
	head: () => ({
		meta: [
			{ title: TITLE },
			{ name: "description", content: DESCRIPTION },
			{ property: "og:title", content: TITLE },
			{ property: "og:description", content: DESCRIPTION },
			{ property: "og:type", content: "website" },
		],
	}),
	component: ParaArquitetos,
});

function ParaArquitetos() {
	return (
		<>
			<Header />
			<main>
				<AudienceHero
					kicker="Para arquitetos"
					title="Serralheria para projetos de arquitetura"
					text="Analisamos o detalhamento, medimos o local e preparamos um orçamento por escrito."
					ctaLabel="Enviar meu projeto no WhatsApp"
					whatsappMessage={WHATSAPP_MESSAGES.paraArquitetos}
					placement="hero_arquitetos"
					photo="/assets/escada-metalica-preta.jpg"
					photoAlt="Escada metálica com guarda-corpo fabricada sob medida"
				/>
				<AudienceServices
					order={[...SERVICE_ORDER]}
					placement="services_arquitetos"
				/>
				<Gallery photos={PHOTOS} />
				<FinalCta
					message={WHATSAPP_MESSAGES.paraArquitetos}
					placement="final_cta_arquitetos"
				/>
			</main>
			<Footer />
		</>
	);
}
