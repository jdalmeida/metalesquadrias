import { createFileRoute } from "@tanstack/react-router";
import { AudienceHero } from "#/components/audience/AudienceHero";
import { AudienceServices } from "#/components/audience/AudienceServices";
import { FinalCta } from "#/components/home/FinalCta";
import { Footer } from "#/components/home/Footer";
import { Gallery } from "#/components/home/Gallery";
import { Header } from "#/components/home/Header";
import { SERVICE_ORDER } from "#/lib/services";
import { WHATSAPP_MESSAGES } from "#/lib/site";

const TITLE = "Serralheria para sua casa ou seu comércio — Metal Esquadrias";
const DESCRIPTION =
	"Envie uma foto e a medida aproximada. Portões, escadas, grades, sacadas, pergolados e cortinas de ferro sob medida em Santa Cruz do Sul.";

const PHOTOS = [
	{ src: "/assets/portao-garagem.jpg", caption: "Portão de garagem" },
	{ src: "/assets/portao-social.jpg", caption: "Portão social" },
	{ src: "/assets/sacada.jpg", caption: "Guarda-corpo de sacada" },
	{
		src: "/assets/grade-janela-ornamental.jpg",
		caption: "Grade de janela com ornamento",
	},
	{
		src: "/assets/cobertura-garagem.jpg",
		caption: "Cobertura metálica de garagem",
	},
	{ src: "/assets/cobertura-curva.jpg", caption: "Cobertura curva" },
	{
		src: "/assets/cortina-fachada-comercial.jpg",
		caption: "Cortina de ferro em comércio",
	},
	{
		src: "/assets/cortina-interna.jpg",
		caption: "Cortina de ferro — vista interna",
	},
	{
		src: "/assets/corrimao-externo.jpg",
		caption: "Corrimão de escada externa",
	},
];

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
					photo="/assets/portao-garagem.jpg"
					photoAlt="Portão de garagem fabricado sob medida"
				/>
				<AudienceServices
					order={SERVICE_ORDER}
					placement="services_casa_comercio"
				/>
				<Gallery photos={PHOTOS} />
				<FinalCta
					message={WHATSAPP_MESSAGES.casaEComercio}
					placement="final_cta_casa_comercio"
				/>
			</main>
			<Footer />
		</>
	);
}
