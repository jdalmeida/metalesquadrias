import { Award, ClipboardCheck, Ruler, Wrench } from "lucide-react";

const SIGNALS = [
	{ icon: Award, label: "Desde 1989" },
	{ icon: Ruler, label: "Medição no local" },
	{ icon: ClipboardCheck, label: "Orçamento por escrito" },
	{ icon: Wrench, label: "Instalação própria" },
];

export function TrustBar() {
	return (
		<div className="border-b border-border-subtle bg-muted">
			<div className="page-wrap flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 text-center">
				{SIGNALS.map(({ icon: Icon, label }) => (
					<div
						key={label}
						className="flex items-center gap-2 text-sm font-medium text-strong"
					>
						<Icon className="size-4 text-primary" />
						{label}
					</div>
				))}
			</div>
		</div>
	);
}
