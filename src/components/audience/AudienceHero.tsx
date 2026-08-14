import { usePostHog } from "@posthog/react";
import { MessageCircle } from "lucide-react";
import { whatsappHref } from "#/lib/site";

export function AudienceHero({
	kicker,
	title,
	text,
	ctaLabel,
	whatsappMessage,
	placement,
	photo,
	photoAlt,
}: {
	kicker: string;
	title: string;
	text: string;
	ctaLabel: string;
	whatsappMessage: string;
	placement: string;
	photo: string;
	photoAlt: string;
}) {
	const posthog = usePostHog();

	return (
		<section className="border-b border-border-subtle bg-background">
			<div className="page-wrap grid gap-10 py-14 md:grid-cols-2 md:items-center md:py-20">
				<div>
					<p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
						{kicker}
					</p>
					<h1 className="mt-4 font-heading text-4xl leading-[1.05] font-bold tracking-tight text-strong md:text-5xl">
						{title}
					</h1>
					<p className="mt-5 max-w-md text-lg text-foreground">{text}</p>
					<div className="mt-8">
						<a
							href={whatsappHref(whatsappMessage)}
							onClick={() =>
								posthog.capture("whatsapp_quote_requested", { placement })
							}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
						>
							<MessageCircle className="size-4" />
							{ctaLabel}
						</a>
					</div>
				</div>

				<img
					src={photo}
					alt={photoAlt}
					className="h-64 w-full rounded-lg object-cover shadow-md md:h-80"
				/>
			</div>
		</section>
	);
}
