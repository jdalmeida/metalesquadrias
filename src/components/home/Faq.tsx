const FAQS = [
	{
		q: "Quanto custa?",
		a: "Cada peça é feita sob medida, então o preço sai depois da medição. O orçamento é gratuito e sem compromisso.",
	},
	{
		q: "Como funciona a medição?",
		a: "Você envia uma foto e a medida aproximada pelo WhatsApp. Com isso a equipe já te dá uma ideia antes de agendar a medição no local.",
	},
	{
		q: "Qual o prazo de entrega?",
		a: "O prazo depende do local e do tipo de peça — tudo é sob medida. Você recebe o prazo por escrito no orçamento, antes de fechar.",
	},
	{
		q: "Tem garantia?",
		a: "Depende da peça. A condição de garantia vem descrita no orçamento.",
	},
	{
		q: "Vocês atendem projeto de arquiteto?",
		a: "Sim. Recebemos o detalhamento e confirmamos a execução, ou desenvolvemos a solução junto com você.",
	},
	{
		q: "Fazem manutenção de cortina que não foi instalada por vocês?",
		a: "Sim, atendemos cortinas e portas automatizadas instaladas por outra empresa.",
	},
	{
		q: "Formas de pagamento?",
		a: "Orçamento sem compromisso. Parte do valor é paga antes da fabricação, o restante após a instalação, com opção de parcelamento.",
	},
];

export function Faq() {
	return (
		<section id="faq" className="border-b border-border-subtle bg-background">
			<div className="page-wrap py-16 md:py-20">
				<h2 className="font-heading text-2xl font-bold text-strong md:text-3xl">
					Perguntas frequentes
				</h2>
				<div className="mt-8 max-w-2xl divide-y divide-border-default border-y border-border-default">
					{FAQS.map((faq) => (
						<details key={faq.q} className="group py-4">
							<summary className="flex cursor-pointer list-none items-center justify-between font-medium text-strong">
								{faq.q}
								<span className="text-primary transition-transform group-open:rotate-45">
									+
								</span>
							</summary>
							<p className="mt-2 text-sm text-foreground">{faq.a}</p>
						</details>
					))}
				</div>
			</div>
		</section>
	);
}
