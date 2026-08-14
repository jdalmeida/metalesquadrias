const STEPS = [
	"Envie uma foto e a medida aproximada.",
	"A equipe avalia o local.",
	"Você recebe o orçamento por escrito.",
	"A equipe combina a fabricação e a instalação.",
];

export function HowItWorks() {
	return (
		<section className="border-b border-border-subtle bg-muted">
			<div className="page-wrap py-16 md:py-20">
				<h2 className="font-heading text-2xl font-bold text-strong md:text-3xl">
					Como funciona
				</h2>
				<ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{STEPS.map((step, index) => (
						<li key={step} className="flex flex-col gap-2">
							<span className="font-mono text-3xl font-semibold text-primary">
								{String(index + 1).padStart(2, "0")}
							</span>
							<p className="text-sm font-medium text-strong">{step}</p>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
