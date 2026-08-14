import { MessageCircle } from "lucide-react";
import { NAP, WHATSAPP_MESSAGES, whatsappHref } from "#/lib/site";

const NAV_LINKS = [
	{ href: "#servicos", label: "Serviços" },
	{ href: "#trabalhos", label: "Trabalhos" },
	{ href: "#sobre", label: "Sobre" },
	{ href: "#faq", label: "Perguntas" },
];

export function Header() {
	return (
		<header className="sticky top-0 z-50 border-b border-border-subtle bg-background/90 backdrop-blur">
			<div className="page-wrap flex h-[var(--header-h)] items-center justify-between gap-3 sm:gap-6">
				<a href="#top" className="shrink-0">
					<img
						src="/assets/logo-horizontal.svg"
						alt="Metal Esquadrias"
						className="h-6 w-auto sm:h-8"
					/>
				</a>
				<nav className="hidden items-center gap-7 md:flex">
					{NAV_LINKS.map((link) => (
						<a
							key={link.href}
							href={link.href}
							className="nav-link text-sm font-medium"
						>
							{link.label}
						</a>
					))}
				</nav>
				<div className="flex items-center gap-4">
					<a
						href={NAP.phoneHref}
						className="hidden text-sm font-medium text-foreground lg:inline"
					>
						{NAP.phoneDisplay}
					</a>
					<a
						href={whatsappHref(WHATSAPP_MESSAGES.home)}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover sm:px-4"
					>
						<MessageCircle className="size-4" />
						<span className="hidden sm:inline">Pedir orçamento</span>
					</a>
				</div>
			</div>
		</header>
	);
}
