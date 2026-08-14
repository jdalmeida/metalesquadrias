import { createFileRoute } from "@tanstack/react-router";
import { AudienceHero } from "#/components/audience/AudienceHero";
import { AudienceServices } from "#/components/audience/AudienceServices";
import { FinalCta } from "#/components/home/FinalCta";
import { Footer } from "#/components/home/Footer";
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
					photo="/assets/escada1.jpg"
					photoAlt="Escada de ferro fabricada para obra"
				/>
				<AudienceServices
					order={[...SERVICE_ORDER]}
					placement="services_construtoras"
				/>
				<FinalCta
					message={WHATSAPP_MESSAGES.paraConstrutoras}
					placement="final_cta_construtoras"
				/>
			</main>
			<Footer />
		</>
	);
}
