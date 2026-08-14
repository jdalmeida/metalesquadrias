import { usePostHog } from "@posthog/react";
import { Building2, HardHat, Wrench } from "lucide-react";

const AUDIENCES = [
	{ icon: HardHat, label: "Sou arquiteto", href: "/para-arquitetos" },
	{
		icon: Building2,
		label: "Represento uma construtora",
		href: "/para-construtoras",
	},
	{ icon: Wrench, label: "Preciso de serralheria", href: "/casa-e-comercio" },
];

export function AudiencePicker() {
	const posthog = usePostHog();

	return (
		<section className="bg-dark">
			<div className="page-wrap py-14 md:py-16">
				<h2 className="max-w-lg font-heading text-2xl font-bold text-on-dark md:text-3xl">
					O certo, na medida certa, entregue no prazo combinado
				</h2>
				<p className="mt-3 max-w-lg text-on-dark-muted">
					Cada trabalho de ferro é sob medida. Diga o que você precisa e a gente
					mostra o serviço certo.
				</p>
				<div className="mt-8 grid gap-4 sm:grid-cols-3">
					{AUDIENCES.map(({ icon: Icon, label, href }) => (
						<a
							key={label}
							href={href}
							onClick={() =>
								posthog.capture("audience_selected", { audience: label })
							}
							className="group flex items-center gap-3 rounded-lg border border-border-on-dark bg-dark-2 p-5 transition-colors hover:border-primary"
						>
							<Icon className="size-5 shrink-0 text-primary" />
							<span className="font-medium text-on-dark">{label}</span>
						</a>
					))}
				</div>
			</div>
		</section>
	);
}
