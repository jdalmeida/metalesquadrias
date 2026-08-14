const PHOTOS = [
	{ src: "/assets/cortina4.jpg", caption: "Cortina de ferro automatizada" },
	{
		src: "/assets/transvizion_externa.jpg",
		caption: "Transvision — vista externa",
	},
	{
		src: "/assets/transvizion_interna.jpg",
		caption: "Transvision — vista interna",
	},
	{ src: "/assets/escada.jpg", caption: "Escada de ferro" },
	{ src: "/assets/escada1.jpg", caption: "Escada de ferro — detalhe" },
	{ src: "/assets/guarda_corpo.jpg", caption: "Guarda-corpo" },
	{ src: "/assets/grade_residencial.jpg", caption: "Grade residencial" },
	{ src: "/assets/grade_janela.jpg", caption: "Grade de janela" },
	{ src: "/assets/grade_condomínio.jpg", caption: "Grade — condomínio" },
];

export function Gallery() {
	return (
		<section
			id="trabalhos"
			className="border-b border-border-subtle bg-background"
		>
			<div className="page-wrap py-16 md:py-20">
				<h2 className="font-heading text-2xl font-bold text-strong md:text-3xl">
					Trabalhos realizados
				</h2>
				<p className="mt-2 max-w-lg text-foreground">
					Fotos de peças executadas pela nossa equipe.
				</p>
				<div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
					{PHOTOS.map((photo) => (
						<figure
							key={photo.src}
							className="overflow-hidden rounded-lg border border-border-default"
						>
							<img
								src={photo.src}
								alt={photo.caption}
								className="h-48 w-full object-cover"
							/>
							<figcaption className="bg-card px-3 py-2 text-xs font-medium text-foreground">
								{photo.caption}
							</figcaption>
						</figure>
					))}
				</div>
			</div>
		</section>
	);
}
