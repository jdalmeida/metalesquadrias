export type Chapa = "lisa" | "transvision";

export type CortinaConfig = {
	largura: number;
	altura: number;
	faixas: Chapa[]; // de baixo para cima
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

// ponytail: altura dividida em faixas iguais; faixa de altura livre só se a fábrica pedir
export const NUM_FAIXAS = 8;

export const PADROES: { label: string; faixas: Chapa[] }[] = [
	{ label: "Toda lisa", faixas: Array(NUM_FAIXAS).fill("lisa") },
	{ label: "Toda transvision", faixas: Array(NUM_FAIXAS).fill("transvision") },
	{
		label: "Lisa embaixo, transvision em cima",
		faixas: [...Array(3).fill("lisa"), ...Array(5).fill("transvision")],
	},
	{
		label: "Alternada",
		faixas: Array.from({ length: NUM_FAIXAS }, (_, i) =>
			i % 2 ? "transvision" : "lisa",
		),
	},
];

/** "1–3 lisa, 4–8 transvision" (faixas numeradas de baixo para cima) */
export function descreverFaixas(faixas: Chapa[]) {
	const partes: string[] = [];
	let inicio = 0;
	for (let i = 1; i <= faixas.length; i++) {
		if (i === faixas.length || faixas[i] !== faixas[inicio]) {
			const faixa = inicio + 1 === i ? `${i}` : `${inicio + 1}–${i}`;
			partes.push(`${faixa} ${faixas[inicio]}`);
			inicio = i;
		}
	}
	return partes.join(", ");
}

const metros = (n: number) => `${n.toFixed(2).replace(".", ",")} m`;

export function mensagemCortina(c: CortinaConfig) {
	return [
		"Olá, vim pelo simulador de cortina de ferro do site e quero pedir um orçamento.",
		`Medida aproximada: ${metros(c.largura)} de largura × ${metros(c.altura)} de altura`,
		`Chapas (${NUM_FAIXAS} faixas, de baixo para cima): ${descreverFaixas(c.faixas)}`,
		`Motor com nobreak: ${c.nobreak ? "sim" : "não"}`,
		`Caixa de acabamento: ${c.caixa ? "sim" : "não"}`,
		`Cor: ${c.cor.nome}`,
		"Posso enviar uma foto do local?",
	].join("\n");
}
