export const WHATSAPP_NUMBER = "5551998493450";

export const NAP = {
	name: "Metal Esquadrias",
	street: "R. Ver. Rudi Müler, 101",
	neighborhood: "Distrito Industrial",
	city: "Santa Cruz do Sul",
	state: "RS",
	zip: "96835-743",
	phoneDisplay: "(51) 3715-3326",
	phoneHref: "tel:+555137153326",
	whatsappDisplay: "(51) 99849-3450",
	hours: "Seg a sex, 7h–12h e 13h–18h · Sáb e dom fechado",
	instagramHandle: "@metalesquadrias",
	instagramHref: "https://instagram.com/metalesquadrias",
	founded: 1989,
};

export function whatsappHref(message: string) {
	return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_MESSAGES = {
	home: "Olá, vim pela página inicial do site e quero pedir um orçamento. Posso enviar uma foto e a medida aproximada?",
	cortinas:
		"Olá, vim pelo site da Metal Esquadrias e quero pedir um orçamento de cortina de ferro ou porta de rolo.",
	manutencao:
		"Olá, vim pelo site da Metal Esquadrias e quero pedir uma avaliação de manutenção de cortina ou porta de rolo.",
	portoes:
		"Olá, vim pelo site da Metal Esquadrias e quero pedir um orçamento de portão.",
	escadas:
		"Olá, vim pelo site da Metal Esquadrias e quero pedir um orçamento de escada ou guarda-corpo.",
	grades:
		"Olá, vim pelo site da Metal Esquadrias e quero pedir um orçamento de grade ou sacada.",
	estruturas:
		"Olá, vim pelo site da Metal Esquadrias e quero pedir um orçamento de pergolado ou estrutura.",
} as const;
