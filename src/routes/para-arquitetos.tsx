import { createFileRoute } from "@tanstack/react-router";
import { AudienceHero } from "#/components/audience/AudienceHero";
import { AudienceServices } from "#/components/audience/AudienceServices";
import { FinalCta } from "#/components/home/FinalCta";
import { Footer } from "#/components/home/Footer";
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
					photo="/assets/guarda_corpo.jpg"
					photoAlt="Guarda-corpo de ferro fabricado sob medida"
				/>
				<AudienceServices
					order={[...SERVICE_ORDER]}
					placement="services_arquitetos"
				/>
				<FinalCta
					message={WHATSAPP_MESSAGES.paraArquitetos}
					placement="final_cta_arquitetos"
				/>
			</main>
			<Footer />
		</>
	);
}
