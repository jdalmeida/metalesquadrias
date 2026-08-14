import type { LucideIcon } from "lucide-react";
import {
	DoorClosed,
	Fence,
	MessageCircle,
	Milestone,
	Tent,
	Wrench,
} from "lucide-react";
import { WHATSAPP_MESSAGES, whatsappHref } from "#/lib/site";

type Service = {
	name: string;
	description: string;
	icon: LucideIcon;
	photo?: string;
	cta: string;
	message: string;
	featured?: boolean;
};

const SERVICES: Service[] = [
	{
		name: "Cortinas e portas de rolo",
		description:
			"Automatizadas, com motor e chave de comando. Também instalamos em porta já existente.",
		icon: DoorClosed,
		photo: "/assets/cortina4.jpg",
		cta: "Pedir orçamento de cortina",
		message: WHATSAPP_MESSAGES.cortinas,
		featured: true,
	},
	{
		name: "Escadas e guarda-corpos",
		description: "Fabricação sob medida, com acabamento definido no orçamento.",
		icon: Milestone,
		photo: "/assets/escada.jpg",
		cta: "Pedir orçamento de escada",
		message: WHATSAPP_MESSAGES.escadas,
	},
	{
		name: "Grades e sacadas",
		description: "Para janela, sacada ou área comum de condomínio.",
		icon: Fence,
		photo: "/assets/grade_janela.jpg",
		cta: "Pedir orçamento de grade",
		message: WHATSAPP_MESSAGES.grades,
	},
	{
		name: "Portões",
		description: "Portão social e basculante, sob medida para sua obra.",
		icon: Wrench,
		cta: "Pedir orçamento de portão",
		message: WHATSAPP_MESSAGES.portoes,
	},
	{
		name: "Manutenção de cortinas",
		description:
			"Atendemos cortinas e portas automatizadas instaladas por outra empresa.",
		icon: Wrench,
		cta: "Pedir avaliação da cortina",
		message: WHATSAPP_MESSAGES.manutencao,
	},
	{
		name: "Pergolados e estruturas",
		description: "Estruturas de ferro sob medida para área externa.",
		icon: Tent,
		cta: "Pedir orçamento de estrutura",
		message: WHATSAPP_MESSAGES.estruturas,
	},
];

function ServiceCard({ service }: { service: Service }) {
	const Icon = service.icon;
	return (
		<div
			className={`flex flex-col overflow-hidden rounded-lg border border-border-default bg-card ${
				service.featured ? "sm:col-span-2 sm:flex-row lg:col-span-3" : ""
			}`}
		>
			{service.photo ? (
				<img
					src={service.photo}
					alt={service.name}
					className={`h-44 w-full object-cover ${service.featured ? "sm:h-auto sm:w-72" : ""}`}
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

export function Services() {
	return (
		<section
			id="servicos"
			className="border-b border-border-subtle bg-background"
		>
			<div className="page-wrap py-16 md:py-20">
				<h2 className="font-heading text-2xl font-bold text-strong md:text-3xl">
					Serviços
				</h2>
				<p className="mt-2 max-w-lg text-foreground">
					Peça de ferro sob medida, fabricada e instalada pela nossa equipe.
				</p>
				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{SERVICES.map((service) => (
						<ServiceCard key={service.name} service={service} />
					))}
				</div>
			</div>
		</section>
	);
}
