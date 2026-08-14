import { PostHogProvider as BasePostHogProvider } from "@posthog/react";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { env } from "#/env";

const projectToken = env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = env.VITE_PUBLIC_POSTHOG_HOST;

if (typeof window !== "undefined") {
	if (!projectToken || !posthogHost) {
		if (import.meta.env.DEV) {
			const missingVariable = !projectToken
				? "VITE_PUBLIC_POSTHOG_PROJECT_TOKEN"
				: "VITE_PUBLIC_POSTHOG_HOST";

			throw new Error(
				`${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
			);
		}
	} else {
		posthog.init(projectToken, {
			api_host: posthogHost,
			defaults: "2025-05-24",
			capture_exceptions: {
				capture_unhandled_errors: true,
				capture_unhandled_rejections: true,
				capture_console_errors: false,
			},
		});
	}
}

interface PostHogProviderProps {
	children: ReactNode;
}

export default function PostHogProvider({ children }: PostHogProviderProps) {
	return <BasePostHogProvider client={posthog}>{children}</BasePostHogProvider>;
}
