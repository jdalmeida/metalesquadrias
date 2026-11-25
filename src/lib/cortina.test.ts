// Rodar: bun src/lib/cortina.test.ts
import assert from "node:assert/strict";
import {
	CORES,
	type CortinaConfig,
	mensagemCortina,
	outraCor,
} from "./cortina";

const base: CortinaConfig = {
	largura: 3,
	altura: 2.5,
	chapa: "intercalada",
	nobreak: true,
	caixa: false,
	cor: { nome: "Preto", hex: "#222326" },
};
const msg = mensagemCortina(base);
assert.match(msg, /3,00 m de largura × 2,50 m de altura/);
assert.match(msg, /Chapas: intercalada \(uma lâmina lisa, uma transvision\)/);
assert.match(msg, /nobreak: sim/);
assert.match(msg, /acabamento: não/);
assert.match(msg, /Cor: Preto/);
assert.match(
	mensagemCortina({ ...base, chapa: "personalizado" }),
	/Chapas: personalizado \(explico o padrão por aqui\)/,
);
assert.match(
	mensagemCortina({ ...base, cor: outraCor("#a1b2c3") }),
	/Cor: Outra \(tom #a1b2c3, ver disponibilidade\)/,
);
assert.match(
	mensagemCortina({ ...base, cor: CORES[0] }),
	/Cor: Galvanizado \(sem pintura\)/,
);
console.log("cortina ok");
