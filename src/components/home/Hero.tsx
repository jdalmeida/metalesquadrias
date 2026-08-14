import { MessageCircle } from "lucide-react";
import { WHATSAPP_MESSAGES, whatsappHref } from "#/lib/site";

export function Hero() {
	return (
		<section id="top" className="border-b border-border-subtle bg-background">
			<div className="page-wrap grid gap-10 py-14 md:grid-cols-2 md:items-center md:py-20">
				<div>
					<p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
						Serralheria em Santa Cruz do Sul desde 1989
					</p>
					<h1 className="mt-4 font-heading text-4xl leading-[1.05] font-bold tracking-tight text-strong md:text-5xl">
						Serralheria{" "}
						<span className="underline decoration-primary decoration-4 underline-offset-4">
							sob medida
						</span>{" "}
						para sua casa, seu comércio ou sua obra
					</h1>
					<p className="mt-5 max-w-md text-lg text-foreground">
						Atendemos Santa Cruz do Sul e a Região dos Vales. O processo inclui
						medição, orçamento por escrito e instalação.
					</p>
					<div className="mt-8 flex flex-wrap gap-3">
						<a
							href={whatsappHref(WHATSAPP_MESSAGES.home)}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
						>
							<MessageCircle className="size-4" />
							Pedir orçamento no WhatsApp
						</a>
						<a
							href="#trabalhos"
							className="inline-flex items-center gap-2 rounded-md border border-border-strong px-5 py-3 text-sm font-semibold text-strong transition-colors hover:bg-muted"
						>
							Ver trabalhos realizados
						</a>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<img
						src="/assets/transvizion_externa.jpg"
						alt="Transvision instalada em fachada comercial"
						className="col-span-2 h-56 w-full rounded-lg object-cover shadow-md md:h-64"
					/>
					<img
						src="/assets/grade_residencial.jpg"
						alt="Grade de ferro residencial"
						className="h-40 w-full rounded-lg object-cover shadow-sm"
					/>
					<img
						src="/assets/escada.jpg"
						alt="Escada de ferro em obra"
						className="h-40 w-full rounded-lg object-cover shadow-sm"
					/>
				</div>
			</div>
		</section>
	);
}
