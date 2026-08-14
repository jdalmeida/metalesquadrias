import { usePostHog } from "@posthog/react";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_MESSAGES, whatsappHref } from "#/lib/site";

export function FinalCta() {
	const posthog = usePostHog();

	return (
		<section className="bg-dark">
			<div className="page-wrap flex flex-col items-start justify-between gap-6 py-14 md:flex-row md:items-center">
				<div>
					<h2 className="font-heading text-2xl font-bold text-on-dark md:text-3xl">
						Tem uma foto do local?
					</h2>
					<p className="mt-2 max-w-md text-on-dark-muted">
						Envie a foto e a medida aproximada. Isso ajuda a preparar a primeira
						orientação.
					</p>
				</div>
				<a
					href={whatsappHref(WHATSAPP_MESSAGES.home)}
					onClick={() =>
						posthog.capture("whatsapp_quote_requested", {
							placement: "final_cta",
						})
					}
					target="_blank"
					rel="noreferrer"
					className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
				>
					<MessageCircle className="size-4" />
					Mandar fotos no WhatsApp
				</a>
			</div>
		</section>
	);
}
