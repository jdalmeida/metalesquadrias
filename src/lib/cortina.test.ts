// Rodar: bun src/lib/cortina.test.ts
import assert from "node:assert/strict";
import { CORES, descreverFaixas, mensagemCortina, outraCor } from "./cortina";

assert.equal(
	descreverFaixas(["lisa", "lisa", "transvision"]),
	"1–2 lisa, 3 transvision",
);
assert.equal(
	descreverFaixas(["lisa", "transvision", "lisa"]),
	"1 lisa, 2 transvision, 3 lisa",
);

const msg = mensagemCortina({
	largura: 3,
	altura: 2.5,
	faixas: ["lisa", "lisa"],
	nobreak: true,
	caixa: false,
	cor: { nome: "Preto", hex: "#222326" },
});
assert.match(msg, /3,00 m de largura × 2,50 m de altura/);
assert.match(msg, /nobreak: sim/);
assert.match(msg, /acabamento: não/);
assert.match(msg, /Cor: Preto/);
assert.match(
	mensagemCortina({
		largura: 1,
		altura: 1,
		faixas: ["lisa"],
		nobreak: false,
		caixa: false,
		cor: outraCor("#a1b2c3"),
	}),
	/Cor: Outra \(tom #a1b2c3, ver disponibilidade\)/,
);
assert.match(
	mensagemCortina({
		largura: 1,
		altura: 1,
		faixas: ["lisa"],
		nobreak: false,
		caixa: false,
		cor: CORES[0],
	}),
	/Cor: Galvanizado \(sem pintura\)/,
);
console.log("cortina ok");
