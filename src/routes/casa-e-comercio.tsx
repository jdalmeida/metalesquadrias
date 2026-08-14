import { createFileRoute } from "@tanstack/react-router";
import { AudienceHero } from "#/components/audience/AudienceHero";
import { AudienceServices } from "#/components/audience/AudienceServices";
import { FinalCta } from "#/components/home/FinalCta";
import { Footer } from "#/components/home/Footer";
import { Header } from "#/components/home/Header";
import { SERVICE_ORDER } from "#/lib/services";
import { WHATSAPP_MESSAGES } from "#/lib/site";

const TITLE = "Serralheria para sua casa ou seu comércio — Metal Esquadrias";
const DESCRIPTION =
	"Envie uma foto e a medida aproximada. Portões, escadas, grades, sacadas, pergolados e cortinas de ferro sob medida em Santa Cruz do Sul.";

export const Route = createFileRoute("/casa-e-comercio")({
	head: () => ({
		meta: [
			{ title: TITLE },
			{ name: "description", content: DESCRIPTION },
			{ property: "og:title", content: TITLE },
			{ property: "og:description", content: DESCRIPTION },
			{ property: "og:type", content: "website" },
		],
	}),
	component: CasaEComercio,
});

function CasaEComercio() {
	return (
		<>
			<Header />
			<main>
				<AudienceHero
					kicker="Para casa e comércio"
					title="Serralheria para sua casa ou seu comércio"
					text="Envie uma foto e a medida aproximada. A equipe orienta o próximo passo."
					ctaLabel="Enviar uma foto do local"
					whatsappMessage={WHATSAPP_MESSAGES.casaEComercio}
					placement="hero_casa_comercio"
					photo="/assets/transvizion_interna.jpg"
					photoAlt="Cortina de ferro instalada em comércio"
				/>
				<AudienceServices
					order={SERVICE_ORDER}
					placement="services_casa_comercio"
				/>
				<FinalCta
					message={WHATSAPP_MESSAGES.casaEComercio}
					placement="final_cta_casa_comercio"
				/>
			</main>
			<Footer />
		</>
	);
}
