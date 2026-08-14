import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import PostHogProvider from "../integrations/posthog/provider";
import { NAP } from "../lib/site";

import appCss from "../styles.css?url";

const LOCAL_BUSINESS_SCHEMA = {
	"@context": "https://schema.org",
	"@type": "LocalBusiness",
	name: NAP.name,
	telephone: NAP.phoneHref.replace("tel:", ""),
	address: {
		"@type": "PostalAddress",
		streetAddress: `${NAP.street} — ${NAP.neighborhood}`,
		addressLocality: NAP.city,
		addressRegion: NAP.state,
		postalCode: NAP.zip,
		addressCountry: "BR",
	},
	sameAs: [NAP.instagramHref],
	foundingDate: String(NAP.founded),
};

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Metal Esquadrias",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
		scripts: [
			{
				src: "https://www.googletagmanager.com/gtag/js?id=G-FGKVHYM2KT",
				async: true,
			},
			{
				children: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-FGKVHYM2KT');`,
			},
			{
				type: "application/ld+json",
				children: JSON.stringify(LOCAL_BUSINESS_SCHEMA),
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="pt-BR">
			<head>
				<HeadContent />
			</head>
			<body>
				<PostHogProvider>
					{children}
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
						]}
					/>
				</PostHogProvider>
				<Scripts />
			</body>
		</html>
	);
}
