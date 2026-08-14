import { createFileRoute } from "@tanstack/react-router";
import { About } from "#/components/home/About";
import { AudiencePicker } from "#/components/home/AudiencePicker";
import { Faq } from "#/components/home/Faq";
import { FinalCta } from "#/components/home/FinalCta";
import { Footer } from "#/components/home/Footer";
import { Gallery } from "#/components/home/Gallery";
import { Header } from "#/components/home/Header";
import { Hero } from "#/components/home/Hero";
import { HowItWorks } from "#/components/home/HowItWorks";
import { Services } from "#/components/home/Services";
import { TrustBar } from "#/components/home/TrustBar";

const TITLE = "Metal Esquadrias — Serralheria em Santa Cruz do Sul";
const DESCRIPTION =
	"Serralheria em Santa Cruz do Sul: portões, escadas, grades, sacadas, pergolados e cortinas de ferro automatizadas, sob medida, com medição e instalação.";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: TITLE },
			{ name: "description", content: DESCRIPTION },
			{ property: "og:title", content: TITLE },
			{ property: "og:description", content: DESCRIPTION },
			{ property: "og:type", content: "website" },
		],
	}),
	component: Home,
});

function Home() {
	return (
		<>
			<Header />
			<main>
				<Hero />
				<TrustBar />
				<AudiencePicker />
				<Services />
				<HowItWorks />
				<Gallery />
				<About />
				<Faq />
				<FinalCta />
			</main>
			<Footer />
		</>
	);
}
