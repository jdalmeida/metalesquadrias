import { createFileRoute } from "@tanstack/react-router";
import { AudienceHero } from "#/components/audience/AudienceHero";
import { AudienceServices } from "#/components/audience/AudienceServices";
import { FinalCta } from "#/components/home/FinalCta";
import { Footer } from "#/components/home/Footer";
import { Gallery } from "#/components/home/Gallery";
import { Header } from "#/components/home/Header";
import { WHATSAPP_MESSAGES } from "#/lib/site";

const TITLE =
	"Serralheria para obras residenciais, comerciais e industriais — Metal Esquadrias";
const DESCRIPTION =
	"Recebemos o projeto e definimos o escopo, o valor e o prazo no orçamento. Pergolados, escadas, grades, portões e cortinas de ferro para obra.";

const SERVICE_ORDER = [
	"estruturas",
	"escadas",
	"grades",
	"portoes",
	"cortinas",
] as const;

const PHOTOS = [
	{
		src: "/assets/estrutura-pavilhao.jpg",
		caption: "Estrutura metálica de pavilhão",
	},
	{
		src: "/assets/escada-industrial.jpg",
		caption: "Escada e mezanino em pavilhão",
	},
	{ src: "/assets/escada-externa-preta.jpg", caption: "Escada metálica" },
	{ src: "/assets/portao-pavilhao.jpg", caption: "Portão de pavilhão" },
	{
		src: "/assets/portoes-pavilhao.jpg",
		caption: "Portões em pavilhão industrial",
	},
	{
		src: "/assets/cortinas-pavilhao.jpg",
		caption: "Cortinas de ferro em pavilhão",
	},
	{
		src: "/assets/cortina-pavilhao.jpg",
		caption: "Cortina de ferro em pavilhão",
	},
	{
		src: "/assets/transvision-pavilhao.jpg",
		caption: "Transvision em pavilhão",
	},
	{ src: "/assets/marquise.jpg", caption: "Marquise metálica" },
];

export const Route = createFileRoute("/para-construtoras")({
	head: () => ({
		meta: [
			{ title: TITLE },
			{ name: "description", content: DESCRIPTION },
			{ property: "og:title", content: TITLE },
			{ property: "og:description", content: DESCRIPTION },
			{ property: "og:type", content: "website" },
		],
	}),
	component: ParaConstrutoras,
});

function ParaConstrutoras() {
	return (
		<>
			<Header />
			<main>
				<AudienceHero
					kicker="Para construtoras"
					title="Serralheria para obras residenciais, comerciais e industriais"
					text="Recebemos o projeto e definimos o escopo, o valor e o prazo no orçamento."
					ctaLabel="Enviar projeto para orçamento"
					whatsappMessage={WHATSAPP_MESSAGES.paraConstrutoras}
					placement="hero_construtoras"
					photo="/assets/estrutura-pavilhao.jpg"
					photoAlt="Estrutura metálica de pavilhão"
				/>
				<AudienceServices
					order={[...SERVICE_ORDER]}
					placement="services_construtoras"
				/>
				<Gallery photos={PHOTOS} />
				<FinalCta
					message={WHATSAPP_MESSAGES.paraConstrutoras}
					placement="final_cta_construtoras"
				/>
			</main>
			<Footer />
		</>
	);
}
