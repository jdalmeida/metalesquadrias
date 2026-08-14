import type { LucideIcon } from "lucide-react";
import { DoorClosed, Fence, Milestone, Tent, Wrench } from "lucide-react";
import { WHATSAPP_MESSAGES } from "#/lib/site";

export type ServiceId =
	| "cortinas"
	| "escadas"
	| "grades"
	| "portoes"
	| "manutencao"
	| "estruturas";

export type Service = {
	id: ServiceId;
	name: string;
	description: string;
	icon: LucideIcon;
	photo?: string;
	cta: string;
	message: string;
};

export const SERVICES: Record<ServiceId, Service> = {
	cortinas: {
		id: "cortinas",
		name: "Cortinas e portas de rolo",
		description:
			"Automatizadas, com motor e chave de comando. Também instalamos em porta já existente.",
		icon: DoorClosed,
		photo: "/assets/cortina4.jpg",
		cta: "Pedir orçamento de cortina",
		message: WHATSAPP_MESSAGES.cortinas,
	},
	escadas: {
		id: "escadas",
		name: "Escadas e guarda-corpos",
		description: "Fabricação sob medida, com acabamento definido no orçamento.",
		icon: Milestone,
		photo: "/assets/escada.jpg",
		cta: "Pedir orçamento de escada",
		message: WHATSAPP_MESSAGES.escadas,
	},
	grades: {
		id: "grades",
		name: "Grades e sacadas",
		description: "Para janela, sacada ou área comum de condomínio.",
		icon: Fence,
		photo: "/assets/grade_janela.jpg",
		cta: "Pedir orçamento de grade",
		message: WHATSAPP_MESSAGES.grades,
	},
	portoes: {
		id: "portoes",
		name: "Portões",
		description: "Portão social e basculante, sob medida para sua obra.",
		icon: Wrench,
		cta: "Pedir orçamento de portão",
		message: WHATSAPP_MESSAGES.portoes,
	},
	manutencao: {
		id: "manutencao",
		name: "Manutenção de cortinas",
		description:
			"Atendemos cortinas e portas automatizadas instaladas por outra empresa.",
		icon: Wrench,
		cta: "Pedir avaliação da cortina",
		message: WHATSAPP_MESSAGES.manutencao,
	},
	estruturas: {
		id: "estruturas",
		name: "Pergolados e estruturas",
		description: "Estruturas de ferro sob medida para área externa.",
		icon: Tent,
		cta: "Pedir orçamento de estrutura",
		message: WHATSAPP_MESSAGES.estruturas,
	},
};

export const SERVICE_ORDER: ServiceId[] = [
	"cortinas",
	"escadas",
	"grades",
	"portoes",
	"manutencao",
	"estruturas",
];
