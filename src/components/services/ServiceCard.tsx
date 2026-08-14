import { usePostHog } from "@posthog/react";
import { MessageCircle } from "lucide-react";
import type { Service } from "#/lib/services";
import { whatsappHref } from "#/lib/site";

export function ServiceCard({
	service,
	featured,
	placement,
}: {
	service: Service;
	featured?: boolean;
	placement: string;
}) {
	const posthog = usePostHog();
	const Icon = service.icon;
	return (
		<div
			className={`flex flex-col overflow-hidden rounded-lg border border-border-default bg-card ${
				featured ? "sm:col-span-2 sm:flex-row lg:col-span-3" : ""
			}`}
		>
			{service.photo ? (
				<img
					src={service.photo}
					alt={service.name}
					className={`h-44 w-full object-cover ${featured ? "sm:h-auto sm:w-72" : ""}`}
				/>
			) : (
				<div className="flex h-44 w-full items-center justify-center bg-muted sm:h-auto sm:min-h-44">
					<Icon className="size-10 text-primary" />
				</div>
			)}
			<div className="flex flex-1 flex-col p-5">
				<Icon className="size-5 text-primary" />
				<h3 className="mt-3 font-heading text-lg font-semibold text-strong">
					{service.name}
				</h3>
				<p className="mt-2 flex-1 text-sm text-foreground">
					{service.description}
				</p>
				<a
					href={whatsappHref(service.message)}
					onClick={() =>
						posthog.capture("whatsapp_quote_requested", {
							placement,
							service: service.name,
						})
					}
					target="_blank"
					rel="noreferrer"
					className="mt-4 inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover"
				>
					<MessageCircle className="size-4" />
					{service.cta}
				</a>
			</div>
		</div>
	);
}
