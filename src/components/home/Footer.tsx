import { Instagram } from "lucide-react";
import { NAP } from "#/lib/site";

export function Footer() {
	return (
		<footer className="bg-dark-2">
			<div className="page-wrap grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr]">
				<div>
					<img
						src="/assets/logo-horizontal-white.svg"
						alt="Metal Esquadrias"
						className="h-8 w-auto"
					/>
					<p className="mt-4 max-w-xs text-sm text-on-dark-muted">
						Serralheria de fábrica em Santa Cruz do Sul, especializada em ferro
						sob medida.
					</p>
					<a
						href={NAP.instagramHref}
						target="_blank"
						rel="noreferrer"
						className="mt-4 inline-flex items-center gap-2 text-sm text-on-dark hover:text-primary"
					>
						<Instagram className="size-4" />
						{NAP.instagramHandle}
					</a>
				</div>

				<div>
					<h3 className="text-sm font-semibold text-on-dark">Endereço</h3>
					<p className="mt-3 text-sm text-on-dark-muted">
						{NAP.street}
						<br />
						{NAP.neighborhood}
						<br />
						{NAP.city}/{NAP.state}, CEP {NAP.zip}
					</p>
				</div>

				<div>
					<h3 className="text-sm font-semibold text-on-dark">Contato</h3>
					<p className="mt-3 text-sm text-on-dark-muted">
						<a href={NAP.phoneHref} className="text-on-dark-muted hover:text-primary">
							{NAP.phoneDisplay}
						</a>
						<br />
						WhatsApp: {NAP.whatsappDisplay}
						<br />
						{NAP.hours}
					</p>
				</div>
			</div>

			<div className="border-t border-border-on-dark">
				<div className="page-wrap flex flex-col gap-2 py-5 text-xs text-on-dark-muted sm:flex-row sm:justify-between">
					<span>
						© {new Date().getFullYear()} {NAP.name}
					</span>
					<span>Desde {NAP.founded}</span>
				</div>
			</div>
		</footer>
	);
}
