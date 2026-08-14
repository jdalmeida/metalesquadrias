import { NAP } from "#/lib/site";

export function About() {
	return (
		<section id="sobre" className="border-b border-border-subtle bg-background">
			<div className="page-wrap grid gap-8 py-16 md:grid-cols-[1fr_1.2fr] md:items-center md:py-20">
				<img
					src="/assets/grade_condomínio.jpg"
					alt="Fábrica da Metal Esquadrias no Distrito Industrial"
					className="h-64 w-full rounded-lg object-cover shadow-sm md:h-80"
				/>
				<div>
					<h2 className="font-heading text-2xl font-bold text-strong md:text-3xl">
						Sobre a fábrica
					</h2>
					<p className="mt-4 max-w-xl text-foreground">
						Somos uma serralheria de fábrica no Distrito Industrial de Santa
						Cruz do Sul. Fabricamos peças de ferro sob medida desde{" "}
						{NAP.founded}, com medição no local, orçamento por escrito e
						instalação feita pela nossa equipe.
					</p>
				</div>
			</div>
		</section>
	);
}
