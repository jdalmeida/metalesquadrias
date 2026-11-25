export type Chapa = "lisa" | "intercalada" | "transvision" | "personalizado";

export const CHAPAS: { id: Chapa; nome: string; descricao: string }[] = [
	{ id: "lisa", nome: "Lisa", descricao: "Fechada, sem visão para dentro" },
	{
		id: "intercalada",
		nome: "Intercalada",
		descricao: "Uma lâmina lisa, uma transvision",
	},
	{ id: "transvision", nome: "Transvision", descricao: "Toda vazada" },
	{
		id: "personalizado",
		nome: "Personalizado",
		descricao: "Você explica o padrão no WhatsApp",
	},
];

const MSG_CHAPA: Record<Chapa, string> = {
	lisa: "lisa",
	intercalada: "intercalada (uma lâmina lisa, uma transvision)",
	transvision: "transvision",
	personalizado: "personalizado (explico o padrão por aqui)",
};

export type CortinaConfig = {
	largura: number;
	altura: number;
	chapa: Chapa;
	nobreak: boolean;
	caixa: boolean;
	cor: Cor;
};

/** galvanizado: chapa sem pintura (metal cru); hex só pinta a amostra */
export type Cor = { nome: string; hex: string; galvanizado?: boolean };

// Galvanizado ou pintura. "Outra" é escolhida no seletor e depende de disponibilidade.
export const CORES: Cor[] = [
	{ nome: "Galvanizado (sem pintura)", hex: "#b9bfc5", galvanizado: true },
	{ nome: "Preto", hex: "#222326" },
	{ nome: "Cinza", hex: "#7d838a" },
	{ nome: "Branco", hex: "#eeeeea" },
	{ nome: "Marrom", hex: "#5b3e2c" },
	{ nome: "Verde", hex: "#2f5d3a" },
	{ nome: "Azul", hex: "#26466d" },
];

export const outraCor = (hex: string): Cor => ({
	nome: `Outra (tom ${hex}, ver disponibilidade)`,
	hex,
});

const metros = (n: number) => `${n.toFixed(2).replace(".", ",")} m`;

export function mensagemCortina(c: CortinaConfig) {
	return [
		"Olá, vim pelo simulador de cortina de ferro do site e quero pedir um orçamento.",
		`Medida aproximada: ${metros(c.largura)} de largura × ${metros(c.altura)} de altura`,
		`Chapas: ${MSG_CHAPA[c.chapa]}`,
		`Motor com nobreak: ${c.nobreak ? "sim" : "não"}`,
		`Caixa de acabamento: ${c.caixa ? "sim" : "não"}`,
		`Cor: ${c.cor.nome}`,
		"Posso enviar uma foto do local?",
	].join("\n");
}
