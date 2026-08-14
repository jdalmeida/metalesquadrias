import { ServiceCard } from "#/components/services/ServiceCard";
import { SERVICES, type ServiceId } from "#/lib/services";

export function AudienceServices({
	order,
	placement,
}: {
	order: ServiceId[];
	placement: string;
}) {
	return (
		<section id="servicos" className="bg-background">
			<div className="page-wrap py-16 md:py-20">
				<h2 className="font-heading text-2xl font-bold text-strong md:text-3xl">
					Serviços
				</h2>
				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{order.map((id) => (
						<ServiceCard
							key={id}
							service={SERVICES[id]}
							placement={placement}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
