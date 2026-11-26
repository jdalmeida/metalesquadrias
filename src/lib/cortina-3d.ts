// Carregado sob demanda pelo CortinaSimulator (import dinâmico) para não pesar a home.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { CortinaConfig } from "./cortina";

const LAMINA_ALTURA = 0.07; // altura visível de uma lâmina meia-cana (7 cm)
const TILE_LARGURA = 0.24; // largura coberta por um tile horizontal da textura
const LOJA_PROFUNDIDADE = 4.4;
const PAREDE_ESP = 0.32; // profundidade do requadro arquitetônico da fachada
const PAREDE_FRENTE = PAREDE_ESP / 2; // z = +0.16
const PAREDE_FUNDO = -PAREDE_ESP / 2; // z = -0.16
const CORTINA_Z = 0.02; // posição da chapa dentro do requadro/trilhos
const SOLEIRA_BASE_Y = 0.014; // topo da soleira de granito
const SOLEIRA_ALTURA = 0.072; // altura útil da soleira + borracha de vedação
const MAX_ABERTURA = 0.78; // fração de abertura ao acionar "Abrir porta"

// PRNG determinístico (Mulberry32) para texturas e interior consistentes
function rng(seed: number) {
	let s = seed | 0;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function makeCanvas(w: number, h: number) {
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	return { c, ctx: c.getContext("2d") as CanvasRenderingContext2D };
}

function configureTex(
	tex: THREE.CanvasTexture,
	anisotropy: number,
	srgb: boolean,
	repeat = true,
) {
	if (repeat) {
		tex.wrapS = THREE.RepeatWrapping;
		tex.wrapT = THREE.RepeatWrapping;
	}
	tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
	tex.anisotropy = anisotropy;
	tex.needsUpdate = true;
	return tex;
}

// Perfil real de altura z(v) de uma lâmina meia-cana de aço (v ∈ [0, 1], de cima para baixo)
function laminaHeight(v: number): number {
	if (v < 0.11) {
		// ressalto superior de engate
		const t = v / 0.11;
		return 0.42 + 0.36 * Math.sin(t * Math.PI * 0.5);
	}
	if (v < 0.77) {
		// barriga convexa principal com leve nervura central de rigidez
		const t = (v - 0.11) / 0.66;
		const arco = Math.sin(t * Math.PI);
		const nervura = 0.06 * Math.exp(-(((t - 0.5) / 0.11) ** 2));
		return 0.68 + 0.32 * arco + nervura;
	}
	if (v < 0.89) {
		// canal fundo de articulação entre lâminas
		const t = (v - 0.77) / 0.12;
		return 0.68 - 0.62 * Math.sin(t * Math.PI);
	}
	// lábio inferior de encaixe
	const t = (v - 0.89) / 0.11;
	return 0.2 + 0.22 * t;
}

// Microperfuração transvision em malha hexagonal escalonada na barriga da lâmina
function perfHoleFactor(
	uPx: number,
	vPx: number,
	w: number,
	slatH: number,
): { hole: number; rimX: number; rimY: number } {
	const yMin = slatH * 0.21;
	const yMax = slatH * 0.74;
	if (vPx < yMin || vPx > yMax) return { hole: 0, rimX: 0, rimY: 0 };

	const cols = 22;
	const rows = 5;
	const cellW = w / cols;
	const cellH = (yMax - yMin) / rows;

	const row = Math.floor((vPx - yMin) / cellH);
	const rowY = yMin + (row + 0.5) * cellH;
	const xShift = (row % 2) * (cellW * 0.5);
	const shiftedX = (uPx - xShift + w) % w;
	const col = Math.floor(shiftedX / cellW);
	const colX = (col + 0.5) * cellW;

	const dx = (shiftedX - colX) / (cellW * 0.36);
	const dy = (vPx - rowY) / (cellH * 0.36);
	const dist = Math.hypot(dx, dy);

	// 1 dentro do furo, transição suave de 1px na borda para evitar serrilhado/moiré
	const hole = THREE.MathUtils.clamp((1.05 - dist) / 0.28, 0, 1);
	// leve chanfro metálico na borda perfurada para normalMap
	const rimStrength =
		dist > 0.85 && dist < 1.38 ? Math.sin(((dist - 0.85) / 0.53) * Math.PI) : 0;
	const inv = dist > 0.001 ? 1 / dist : 0;
	return {
		hole,
		rimX: dx * inv * rimStrength,
		rimY: dy * inv * rimStrength,
	};
}

type LaminaMaps = {
	map: THREE.CanvasTexture;
	normalMap: THREE.CanvasTexture;
	alphaMap?: THREE.CanvasTexture;
	roughPaint: THREE.CanvasTexture;
	roughGalv: THREE.CanvasTexture;
};

// Gera mapa de albedo neutro, normalMap tangencial real, alphaMap microperfurado e dois roughnessMaps (pintura vs galvanizado)
function createLaminaMaps(furos: boolean[], anisotropy: number): LaminaMaps {
	const w = 256;
	const L = 128;
	const h = L * furos.length;
	const hasHoles = furos.some(Boolean);
	const r = rng(101 + furos.length * 17 + (hasHoles ? 7 : 0));

	const alb = makeCanvas(w, h);
	const nrm = makeCanvas(w, h);
	const rP = makeCanvas(w, h);
	const rG = makeCanvas(w, h);
	const alp = hasHoles ? makeCanvas(w, h) : null;

	const albImg = alb.ctx.createImageData(w, h);
	const nrmImg = nrm.ctx.createImageData(w, h);
	const rPImg = rP.ctx.createImageData(w, h);
	const rGImg = rG.ctx.createImageData(w, h);
	const alpImg = alp ? alp.ctx.createImageData(w, h) : null;

	// Flor-de-zinco (spangle) gerada via Canvas 2D nativo em polígonos cristalinos (O(1) por pixel no celular!)
	const spCanvas = makeCanvas(w, h);
	spCanvas.ctx.fillStyle = "rgb(128,88,0)";
	spCanvas.ctx.fillRect(0, 0, w, h);
	const spangleCount = 44 * furos.length;
	for (let s = 0; s < spangleCount; s++) {
		const cx = r() * w;
		const cy = r() * h;
		const rad = 10 + r() * 20;
		const sides = 4 + Math.floor(r() * 3);
		const ang0 = r() * Math.PI * 2;
		const shadeByte = Math.round(128 + (r() - 0.5) * 48);
		const roughByte = Math.round((0.23 + r() * 0.23) * 255);
		spCanvas.ctx.fillStyle = `rgb(${shadeByte},${roughByte},0)`;
		for (const ox of [-w, 0, w]) {
			for (const oy of [-h, 0, h]) {
				const px = cx + ox;
				const py = cy + oy;
				if (px + rad < 0 || px - rad > w || py + rad < 0 || py - rad > h)
					continue;
				spCanvas.ctx.beginPath();
				for (let k = 0; k < sides; k++) {
					const a = ang0 + (k / sides) * Math.PI * 2;
					const rr = rad * (0.75 + 0.35 * ((k * 37 + s) % 5) * 0.25);
					const vx = px + Math.cos(a) * rr;
					const vy = py + Math.sin(a) * rr;
					if (k === 0) spCanvas.ctx.moveTo(vx, vy);
					else spCanvas.ctx.lineTo(vx, vy);
				}
				spCanvas.ctx.closePath();
				spCanvas.ctx.fill();
			}
		}
	}
	const spData = spCanvas.ctx.getImageData(0, 0, w, h).data;

	const rowStreaks = new Float32Array(h);
	for (let y = 0; y < h; y++) rowStreaks[y] = (r() - 0.5) * 10;

	const eps = 1 / L;
	for (let y = 0; y < h; y++) {
		const slatIdx = Math.floor(y / L);
		const localY = y - slatIdx * L;
		const v = localY / L;
		const perforated = furos[slatIdx];

		const hVal = laminaHeight(v);
		const hPrev = laminaHeight((v - eps + 1) % 1);
		const hNext = laminaHeight((v + eps) % 1);
		// Derivada vertical da curvatura meia-cana
		const dzDv = (hNext - hPrev) / (2 * eps);

		// Oclusão ambiental suave apenas na dobra funda entre lâminas
		const grooveAO =
			v > 0.77 && v < 0.91
				? 1 - 0.62 * Math.sin(((v - 0.77) / 0.14) * Math.PI)
				: 1;
		// Leve gradiente de curvatura para reforçar leitura mesmo sob luz difusa
		const baseLum = (206 + hVal * 34) * grooveAO;
		const grooveRoughBoost =
			v > 0.77 && v < 0.91 ? 0.36 * Math.sin(((v - 0.77) / 0.14) * Math.PI) : 0;

		for (let x = 0; x < w; x++) {
			const idx = (y * w + x) * 4;
			const grain = (r() - 0.5) * 9;
			const streak = rowStreaks[y];

			const spShade = (spData[idx] - 128) / 255;
			const spRough = spData[idx + 1] / 255;

			let hole = 0;
			let rimX = 0;
			let rimY = 0;
			if (perforated) {
				const pf = perfHoleFactor(x, localY, w, L);
				hole = pf.hole;
				rimX = pf.rimX;
				rimY = pf.rimY;
			}

			// Albedo neutro (multiplica pela cor escolhida pelo cliente)
			const lum = THREE.MathUtils.clamp(
				baseLum + streak * 0.55 + grain * 0.5 + spShade * 24 - hole * 35,
				28,
				248,
			);
			albImg.data[idx] = lum;
			albImg.data[idx + 1] = lum;
			albImg.data[idx + 2] = Math.min(252, lum + 2);
			albImg.data[idx + 3] = 255;

			// Normal tangencial (curvatura da lâmina + micro-textura + chanfro dos furos)
			let nx = (r() - 0.5) * 0.045 - rimX * 0.35;
			// Em Three.js o V da textura cresce para cima; canvas cresce para baixo
			let ny = THREE.MathUtils.clamp(dzDv * 0.24, -0.82, 0.82) + rimY * 0.35;
			const nz = Math.sqrt(Math.max(0.12, 1 - nx * nx - ny * ny));
			const invLen = 1 / Math.hypot(nx, ny, nz);
			nx *= invLen;
			ny *= invLen;
			const nzn = nz * invLen;

			nrmImg.data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
			nrmImg.data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
			nrmImg.data[idx + 2] = Math.round((nzn * 0.5 + 0.5) * 255);
			nrmImg.data[idx + 3] = 255;

			// Roughness pintura eletrostática (micro casca de laranja acetinada)
			const rp = THREE.MathUtils.clamp(
				0.39 + grooveRoughBoost + (r() - 0.5) * 0.06,
				0.26,
				0.88,
			);
			const rpByte = Math.round(rp * 255);
			rPImg.data[idx] = rpByte;
			rPImg.data[idx + 1] = rpByte;
			rPImg.data[idx + 2] = rpByte;
			rPImg.data[idx + 3] = 255;

			// Roughness aço galvanizado (cristais de zinco + escovado de perfiladeira)
			const rg = THREE.MathUtils.clamp(
				spRough + grooveRoughBoost + streak * 0.004 + (r() - 0.5) * 0.04,
				0.2,
				0.86,
			);
			const rgByte = Math.round(rg * 255);
			rGImg.data[idx] = rgByte;
			rGImg.data[idx + 1] = rgByte;
			rGImg.data[idx + 2] = rgByte;
			rGImg.data[idx + 3] = 255;

			if (alpImg) {
				const a = Math.round((1 - hole) * 255);
				alpImg.data[idx] = a;
				alpImg.data[idx + 1] = a;
				alpImg.data[idx + 2] = a;
				alpImg.data[idx + 3] = 255;
			}
		}
	}

	alb.ctx.putImageData(albImg, 0, 0);
	nrm.ctx.putImageData(nrmImg, 0, 0);
	rP.ctx.putImageData(rPImg, 0, 0);
	rG.ctx.putImageData(rGImg, 0, 0);
	if (alp && alpImg) alp.ctx.putImageData(alpImg, 0, 0);

	return {
		map: configureTex(new THREE.CanvasTexture(alb.c), anisotropy, true),
		normalMap: configureTex(new THREE.CanvasTexture(nrm.c), anisotropy, false),
		alphaMap: alp
			? configureTex(new THREE.CanvasTexture(alp.c), anisotropy, false)
			: undefined,
		roughPaint: configureTex(new THREE.CanvasTexture(rP.c), anisotropy, false),
		roughGalv: configureTex(new THREE.CanvasTexture(rG.c), anisotropy, false),
	};
}

// Textura mineral de fachada (reboco fino / textura arquitetônica)
function createPlasterMaps(anisotropy: number) {
	const size = 256;
	const r = rng(307);
	const alb = makeCanvas(size, size);
	const nrm = makeCanvas(size, size);

	// Base quente + manchas sutis de argamassa pintadas via Canvas 2D nativo (muito mais rápido no celular)
	alb.ctx.fillStyle = "rgb(218,211,200)";
	alb.ctx.fillRect(0, 0, size, size);
	for (let p = 0; p < 20; p++) {
		const px = r() * size;
		const py = r() * size;
		const rad = 28 + r() * 44;
		const bright = r() > 0.5;
		const col = bright ? "rgba(240,234,224,0.16)" : "rgba(176,168,156,0.16)";
		for (const ox of [-size, 0, size]) {
			for (const oy of [-size, 0, size]) {
				const cx = px + ox;
				const cy = py + oy;
				if (cx + rad < 0 || cx - rad > size || cy + rad < 0 || cy - rad > size)
					continue;
				const g = alb.ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
				g.addColorStop(0, col);
				g.addColorStop(1, "rgba(218,211,200,0)");
				alb.ctx.fillStyle = g;
				alb.ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
			}
		}
	}

	const albImg = alb.ctx.getImageData(0, 0, size, size);
	const nrmImg = nrm.ctx.createImageData(size, size);
	const height = new Float32Array(size * size);

	for (let i = 0; i < size * size; i++) {
		const fine = (r() - 0.5) * 10;
		const idx = i * 4;
		height[i] = fine * 0.1 + (albImg.data[idx] - 218) * 0.04;
		albImg.data[idx] = THREE.MathUtils.clamp(albImg.data[idx] + fine, 182, 242);
		albImg.data[idx + 1] = THREE.MathUtils.clamp(
			albImg.data[idx + 1] + fine,
			175,
			236,
		);
		albImg.data[idx + 2] = THREE.MathUtils.clamp(
			albImg.data[idx + 2] + fine,
			165,
			226,
		);
	}

	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const hL = height[y * size + ((x - 1 + size) % size)];
			const hR = height[y * size + ((x + 1) % size)];
			const hU = height[((y - 1 + size) % size) * size + x];
			const hD = height[((y + 1) % size) * size + x];
			const nx = (hL - hR) * 0.45;
			const ny = (hD - hU) * 0.45;
			const nz = 1;
			const inv = 1 / Math.hypot(nx, ny, nz);
			const idx = (y * size + x) * 4;
			nrmImg.data[idx] = Math.round((nx * inv * 0.5 + 0.5) * 255);
			nrmImg.data[idx + 1] = Math.round((ny * inv * 0.5 + 0.5) * 255);
			nrmImg.data[idx + 2] = Math.round((nz * inv * 0.5 + 0.5) * 255);
			nrmImg.data[idx + 3] = 255;
		}
	}

	alb.ctx.putImageData(albImg, 0, 0);
	nrm.ctx.putImageData(nrmImg, 0, 0);
	return {
		map: configureTex(new THREE.CanvasTexture(alb.c), anisotropy, true),
		normalMap: configureTex(new THREE.CanvasTexture(nrm.c), anisotropy, false),
	};
}

// Calçada de placas de concreto/basalto com rejuntes sutis (como nas ruas de Santa Cruz do Sul)
function createSidewalkMaps(anisotropy: number, size: number) {
	const tiles = 2; // 2×2 placas por tile de 1.3m × 1.3m
	const tilePx = size / tiles;
	const r = rng(521);

	const alb = makeCanvas(size, size);
	const nrm = makeCanvas(size, size);
	const rgh = makeCanvas(size, size);

	// Base por placa com variação tonal natural
	for (let ty = 0; ty < tiles; ty++) {
		for (let tx = 0; tx < tiles; tx++) {
			const v = 122 + Math.floor((r() - 0.5) * 18);
			alb.ctx.fillStyle = `rgb(${v + 2}, ${v}, ${v - 3})`;
			alb.ctx.fillRect(tx * tilePx, ty * tilePx, tilePx, tilePx);

			const rv = 185 + Math.floor((r() - 0.5) * 26);
			rgh.ctx.fillStyle = `rgb(${rv}, ${rv}, ${rv})`;
			rgh.ctx.fillRect(tx * tilePx, ty * tilePx, tilePx, tilePx);
		}
	}

	// Granulação de pedra/concreto + rejuntes
	const albImg = alb.ctx.getImageData(0, 0, size, size);
	const rghImg = rgh.ctx.getImageData(0, 0, size, size);
	const nrmImg = nrm.ctx.createImageData(size, size);

	for (let y = 0; y < size; y++) {
		const gy = y % tilePx;
		const nearY = gy < 3 || gy >= tilePx - 2;
		for (let x = 0; x < size; x++) {
			const gx = x % tilePx;
			const nearX = gx < 3 || gx >= tilePx - 2;
			const grout = nearX || nearY;
			const n = (r() - 0.5) * 16;
			const idx = (y * size + x) * 4;

			if (grout) {
				albImg.data[idx] = Math.max(40, albImg.data[idx] - 46 + n * 0.4);
				albImg.data[idx + 1] = Math.max(
					38,
					albImg.data[idx + 1] - 46 + n * 0.4,
				);
				albImg.data[idx + 2] = Math.max(
					36,
					albImg.data[idx + 2] - 44 + n * 0.4,
				);
				rghImg.data[idx] = 240;
				rghImg.data[idx + 1] = 240;
				rghImg.data[idx + 2] = 240;
			} else {
				albImg.data[idx] = THREE.MathUtils.clamp(albImg.data[idx] + n, 50, 210);
				albImg.data[idx + 1] = THREE.MathUtils.clamp(
					albImg.data[idx + 1] + n,
					48,
					206,
				);
				albImg.data[idx + 2] = THREE.MathUtils.clamp(
					albImg.data[idx + 2] + n,
					46,
					200,
				);
				const rv = THREE.MathUtils.clamp(rghImg.data[idx] + n * 0.8, 145, 240);
				rghImg.data[idx] = rv;
				rghImg.data[idx + 1] = rv;
				rghImg.data[idx + 2] = rv;
			}

			// Normal: leve chanfro nas bordas de rejunte + micro aspereza
			let nx = (r() - 0.5) * 0.14;
			let ny = (r() - 0.5) * 0.14;
			if (gx === 3) nx += 0.55;
			else if (gx === tilePx - 3) nx -= 0.55;
			if (gy === 3) ny -= 0.55;
			else if (gy === tilePx - 3) ny += 0.55;
			const nz = 1;
			const inv = 1 / Math.hypot(nx, ny, nz);
			nrmImg.data[idx] = Math.round((nx * inv * 0.5 + 0.5) * 255);
			nrmImg.data[idx + 1] = Math.round((ny * inv * 0.5 + 0.5) * 255);
			nrmImg.data[idx + 2] = Math.round((nz * inv * 0.5 + 0.5) * 255);
			nrmImg.data[idx + 3] = 255;
		}
	}

	alb.ctx.putImageData(albImg, 0, 0);
	rgh.ctx.putImageData(rghImg, 0, 0);
	nrm.ctx.putImageData(nrmImg, 0, 0);

	return {
		map: configureTex(new THREE.CanvasTexture(alb.c), anisotropy, true),
		normalMap: configureTex(new THREE.CanvasTexture(nrm.c), anisotropy, false),
		roughnessMap: configureTex(
			new THREE.CanvasTexture(rgh.c),
			anisotropy,
			false,
		),
	};
}

// Granito/basalto escuro escovado para rodapé da fachada e soleira
function createGraniteMap(anisotropy: number) {
	const size = 128;
	const r = rng(709);
	const { c, ctx } = makeCanvas(size, size);
	const img = ctx.createImageData(size, size);
	for (let i = 0; i < size * size; i++) {
		const base = 54 + (r() - 0.5) * 16;
		const fleck = r() > 0.9 ? 28 : r() < 0.08 ? -16 : 0;
		const v = THREE.MathUtils.clamp(base + fleck, 24, 115);
		const k = i * 4;
		img.data[k] = v;
		img.data[k + 1] = v + 1;
		img.data[k + 2] = v + 4;
		img.data[k + 3] = 255;
	}
	ctx.putImageData(img, 0, 0);
	return configureTex(new THREE.CanvasTexture(c), anisotropy, true);
}

// Piso de réguas de carvalho quente para o interior da loja
function createWoodFloorMaps(anisotropy: number) {
	const size = 256;
	const r = rng(823);
	const alb = makeCanvas(size, size);
	const rgh = makeCanvas(size, size);
	const planks = 6;
	const plankH = size / planks;

	for (let p = 0; p < planks; p++) {
		const y0 = p * plankH;
		const tone = (r() - 0.5) * 24;
		const rCol = Math.round(166 + tone);
		const gCol = Math.round(122 + tone * 0.75);
		const bCol = Math.round(80 + tone * 0.55);
		alb.ctx.fillStyle = `rgb(${rCol},${gCol},${bCol})`;
		alb.ctx.fillRect(0, y0, size, plankH);

		// Veios longitudinais da madeira
		for (let s = 0; s < 14; s++) {
			const sy = y0 + r() * plankH;
			alb.ctx.fillStyle =
				r() > 0.5 ? "rgba(92,58,30,0.16)" : "rgba(220,185,140,0.12)";
			alb.ctx.fillRect(0, sy, size, 1 + r() * 2);
		}
		// Junta horizontal e emenda vertical alternada
		alb.ctx.fillStyle = "rgba(48,30,18,0.55)";
		alb.ctx.fillRect(0, y0, size, 1.5);
		const jointX = ((p * 97 + 40) % size) | 0;
		alb.ctx.fillRect(jointX, y0, 1.5, plankH);

		const rv = Math.round(92 + (r() - 0.5) * 24);
		rgh.ctx.fillStyle = `rgb(${rv},${rv},${rv})`;
		rgh.ctx.fillRect(0, y0, size, plankH);
		rgh.ctx.fillStyle = "rgb(200,200,200)";
		rgh.ctx.fillRect(0, y0, size, 1.5);
	}

	return {
		map: configureTex(new THREE.CanvasTexture(alb.c), anisotropy, true),
		roughnessMap: configureTex(
			new THREE.CanvasTexture(rgh.c),
			anisotropy,
			false,
		),
	};
}

// Painel ripado de madeira na parede de fundo da loja (zero triângulos extras)
function createSlattedWallMap(anisotropy: number) {
	const w = 128;
	const h = 128;
	const r = rng(941);
	const { c, ctx } = makeCanvas(w, h);
	ctx.fillStyle = "#26211d"; // feltro acústico escuro atrás das ripas
	ctx.fillRect(0, 0, w, h);

	const slats = 8;
	const step = w / slats;
	for (let i = 0; i < slats; i++) {
		const x = i * step;
		const tone = (r() - 0.5) * 16;
		const grad = ctx.createLinearGradient(x, 0, x + step * 0.72, 0);
		grad.addColorStop(
			0,
			`rgb(${150 + tone},${108 + tone * 0.7},${72 + tone * 0.5})`,
		);
		grad.addColorStop(
			0.25,
			`rgb(${182 + tone},${138 + tone * 0.7},${96 + tone * 0.5})`,
		);
		grad.addColorStop(
			0.85,
			`rgb(${164 + tone},${120 + tone * 0.7},${82 + tone * 0.5})`,
		);
		grad.addColorStop(
			1,
			`rgb(${112 + tone},${78 + tone * 0.7},${50 + tone * 0.5})`,
		);
		ctx.fillStyle = grad;
		ctx.fillRect(x + 1, 0, step * 0.72, h);
	}
	return configureTex(new THREE.CanvasTexture(c), anisotropy, true);
}

// Sombra de contato linear suave (para aterrar soleira, caixa e base da fachada sem custo de SSAO)
function createContactShadowMap() {
	const { c, ctx } = makeCanvas(32, 64);
	const g = ctx.createLinearGradient(0, 0, 0, 64);
	g.addColorStop(0, "rgba(10,12,16,0.52)");
	g.addColorStop(0.35, "rgba(10,12,16,0.22)");
	g.addColorStop(1, "rgba(10,12,16,0)");
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 32, 64);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

// Fundo de céu arquitetônico de fim de tarde (combina perfeitamente com neblina e loja acesa)
function createBackdropTexture() {
	const { c, ctx } = makeCanvas(8, 256);
	const g = ctx.createLinearGradient(0, 0, 0, 256);
	g.addColorStop(0, "#1c2533");
	g.addColorStop(0.45, "#2f3d4f");
	g.addColorStop(0.72, "#4b5563");
	g.addColorStop(0.86, "#5a5c62");
	g.addColorStop(1, "#373a3f");
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 8, 256);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

// Ambiente PMREM sob medida (rua no fim de tarde com faixa de pôr do sol + céu frio + rebote quente do chão)
function createArchitecturalEnvironment(renderer: THREE.WebGLRenderer) {
	const envScene = new THREE.Scene();

	// Domo gradiente esférico
	const domeCanvas = makeCanvas(64, 64);
	const g = domeCanvas.ctx.createLinearGradient(0, 0, 0, 64);
	g.addColorStop(0, "#2b4263");
	g.addColorStop(0.38, "#6f88a8");
	g.addColorStop(0.5, "#d8b48e");
	g.addColorStop(0.58, "#58524c");
	g.addColorStop(1, "#232120");
	domeCanvas.ctx.fillStyle = g;
	domeCanvas.ctx.fillRect(0, 0, 64, 64);
	const domeTex = new THREE.CanvasTexture(domeCanvas.c);
	domeTex.colorSpace = THREE.SRGBColorSpace;

	const domeGeo = new THREE.SphereGeometry(20, 24, 16);
	const domeMat = new THREE.MeshBasicMaterial({
		map: domeTex,
		side: THREE.BackSide,
	});
	envScene.add(new THREE.Mesh(domeGeo, domeMat));

	// Painel de sol baixo na direção da luz direcional (cria reflexo especular limpo nas lâminas)
	const sunGeo = new THREE.PlaneGeometry(8, 5);
	const sunMat = new THREE.MeshBasicMaterial({
		color: new THREE.Color(3.4, 2.9, 2.3),
	});
	const sunPanel = new THREE.Mesh(sunGeo, sunMat);
	sunPanel.position.set(8, 9, 10);
	sunPanel.lookAt(0, 0, 0);
	envScene.add(sunPanel);

	// Faixa de céu difuso do lado oposto (define os contornos metálicos na sombra)
	const fillGeo = new THREE.PlaneGeometry(14, 7);
	const fillMat = new THREE.MeshBasicMaterial({
		color: new THREE.Color(1.0, 1.25, 1.65),
	});
	const fillPanel = new THREE.Mesh(fillGeo, fillMat);
	fillPanel.position.set(-10, 6, 8);
	fillPanel.lookAt(0, 0, 0);
	envScene.add(fillPanel);

	// Brilho quente frontal (simula luz da calçada/vitrine refletindo na base das lâminas)
	const warmGeo = new THREE.PlaneGeometry(10, 3);
	const warmMat = new THREE.MeshBasicMaterial({
		color: new THREE.Color(1.2, 0.92, 0.65),
	});
	const warmPanel = new THREE.Mesh(warmGeo, warmMat);
	warmPanel.position.set(0, -4, 10);
	warmPanel.lookAt(0, 0, 0);
	envScene.add(warmPanel);

	const pmrem = new THREE.PMREMGenerator(renderer);
	pmrem.compileEquirectangularShader();
	const envRT = pmrem.fromScene(envScene, 0.035);

	// Libera imediatamente os recursos temporários
	domeGeo.dispose();
	domeMat.dispose();
	domeTex.dispose();
	sunGeo.dispose();
	sunMat.dispose();
	fillGeo.dispose();
	fillMat.dispose();
	warmGeo.dispose();
	warmMat.dispose();
	pmrem.dispose();

	return envRT;
}

// Geometria de manequim esculpida compartilhada (LatheGeometry enxuta: ~240 triângulos)
function createMannequinTorsoGeometry() {
	const pts = [
		new THREE.Vector2(0.0, 0.0),
		new THREE.Vector2(0.145, 0.02),
		new THREE.Vector2(0.155, 0.12),
		new THREE.Vector2(0.115, 0.28), // cintura
		new THREE.Vector2(0.148, 0.44), // busto
		new THREE.Vector2(0.152, 0.56), // ombros
		new THREE.Vector2(0.055, 0.63), // pescoço base
		new THREE.Vector2(0.048, 0.71),
		new THREE.Vector2(0.0, 0.72),
	];
	return new THREE.LatheGeometry(pts, 16);
}

function createMannequinSkirtGeometry() {
	const pts = [
		new THREE.Vector2(0.24, 0.0),
		new THREE.Vector2(0.21, 0.24),
		new THREE.Vector2(0.16, 0.52),
		new THREE.Vector2(0.118, 0.68),
	];
	return new THREE.LatheGeometry(pts, 16);
}

// Paleta curada de boutique (tons terrosos, neutros e profundos que brilham bonito atrás da transvision)
const ROUPAS_CORES = [
	0x8c353d, 0xded0b6, 0x2b4559, 0xc96c4a, 0xf3efe6, 0x4f684c, 0x24262b,
	0x95adc4, 0xd8a397, 0xb58d58, 0x5c3c48, 0xc5b8a5,
];

// Atualiza um PlaneGeometry(1, 1) de 4 vértices para um trecho [yBot, yTop] com UV scroll fiel a 7cm por lâmina
function updateCurtainBandGeo(
	geo: THREE.PlaneGeometry,
	width: number,
	yBot: number,
	yTop: number,
	lift: number,
	laminasPorTile: number,
) {
	const pos = geo.attributes.position as THREE.BufferAttribute;
	const uv = geo.attributes.uv as THREE.BufferAttribute;
	const hw = width / 2;
	const uMax = width / TILE_LARGURA;
	const unitH = LAMINA_ALTURA * laminasPorTile;
	const vTop = (yTop - lift) / unitH;
	const vBot = (yBot - lift) / unitH;

	// Ordem dos 4 vértices de PlaneGeometry(1, 1, 1, 1): TL, TR, BL, BR
	pos.setXYZ(0, -hw, yTop, 0);
	pos.setXYZ(1, hw, yTop, 0);
	pos.setXYZ(2, -hw, yBot, 0);
	pos.setXYZ(3, hw, yBot, 0);
	pos.needsUpdate = true;

	uv.setXY(0, 0, vTop);
	uv.setXY(1, uMax, vTop);
	uv.setXY(2, 0, vBot);
	uv.setXY(3, uMax, vBot);
	uv.needsUpdate = true;

	geo.computeBoundingSphere();
}

export type CortinaSceneHandle = {
	update(c: CortinaConfig): void;
	setOpen(open: boolean): void;
	dispose(): void;
};

export function createCortinaScene(host: HTMLElement): CortinaSceneHandle {
	const isMobile =
		window.matchMedia("(pointer: coarse)").matches ||
		(navigator.hardwareConcurrency ?? 8) <= 4;

	const renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: false,
		powerPreference: "default",
	});
	renderer.setPixelRatio(
		Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5),
	);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.08;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;
	renderer.shadowMap.autoUpdate = false; // só recalcula sombra quando a geometria muda (0ms ao girar a câmera!)
	renderer.domElement.style.cssText =
		"width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab";
	host.appendChild(renderer.domElement);

	const maxAniso = Math.min(
		renderer.capabilities.getMaxAnisotropy(),
		isMobile ? 4 : 8,
	);

	const scene = new THREE.Scene();
	const backdropTex = createBackdropTexture();
	scene.background = backdropTex;
	scene.fog = new THREE.Fog(0x464d58, 12, 27);

	const envRT = createArchitecturalEnvironment(renderer);
	scene.environment = envRT.texture;
	scene.environmentIntensity = 0.72;

	// Iluminação externa: fim de tarde com sol em 3/4 + céu frio + rebote do piso
	scene.add(new THREE.HemisphereLight(0x9ab6d8, 0x4f463e, 0.56));

	const sol = new THREE.DirectionalLight(0xffe6c7, 1.95);
	sol.position.set(4.5, 6.8, 5.8);
	sol.castShadow = true;
	const shadowRes = isMobile ? 512 : 768;
	sol.shadow.mapSize.set(shadowRes, shadowRes);
	sol.shadow.bias = -0.0004;
	sol.shadow.normalBias = 0.025;
	sol.shadow.radius = isMobile ? 1.5 : 2.2;
	scene.add(sol);
	scene.add(sol.target);

	// Luz quente única da boutique atrás da cortina (mostra a visibilidade real da Transvision com custo mínimo de GPU)
	const luzLoja = new THREE.PointLight(0xffd299, 34, 11, 1.45);
	scene.add(luzLoja);

	const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableZoom = false; // preserva scroll/pinch natural da página
	controls.enablePan = false;
	controls.enableDamping = true;
	controls.dampingFactor = 0.08;
	controls.rotateSpeed = 0.72;
	controls.minAzimuthAngle = -0.88;
	controls.maxAzimuthAngle = 0.88;
	controls.minPolarAngle = controls.maxPolarAngle = Math.PI / 2 - 0.08;

	// Texturas procedurais geradas uma única vez por cena
	const mapsLisa = createLaminaMaps([false], maxAniso);
	const mapsTransv = createLaminaMaps([true], maxAniso);
	const mapsInter = createLaminaMaps([false, true], maxAniso);
	const texRoloMap = mapsLisa.map.clone();
	texRoloMap.needsUpdate = true;
	const texRoloNorm = mapsLisa.normalMap.clone();
	texRoloNorm.needsUpdate = true;
	const texRoloRoughP = mapsLisa.roughPaint.clone();
	texRoloRoughP.needsUpdate = true;
	const texRoloRoughG = mapsLisa.roughGalv.clone();
	texRoloRoughG.needsUpdate = true;

	const plasterMaps = createPlasterMaps(maxAniso);
	const sidewalkMaps = createSidewalkMaps(maxAniso, isMobile ? 256 : 512);
	const graniteMap = createGraniteMap(maxAniso);
	const woodMaps = createWoodFloorMaps(maxAniso);
	const slattedWallMap = createSlattedWallMap(maxAniso);
	const contactShadowMap = createContactShadowMap();

	const normalScale = new THREE.Vector2(1.0, 1.0);

	// Materiais reutilizáveis (troca de cor atualiza em 0ms sem reconstruir geometria)
	const mats = {
		lisa: new THREE.MeshStandardMaterial({
			map: mapsLisa.map,
			normalMap: mapsLisa.normalMap,
			normalScale,
			roughnessMap: mapsLisa.roughPaint,
			roughness: 1,
			metalness: 0.22,
		}),
		transvision: new THREE.MeshStandardMaterial({
			map: mapsTransv.map,
			normalMap: mapsTransv.normalMap,
			normalScale,
			roughnessMap: mapsTransv.roughPaint,
			alphaMap: mapsTransv.alphaMap,
			roughness: 1,
			metalness: 0.22,
			transparent: true,
			alphaTest: 0.02,
			depthWrite: false,
		}),
		intercalada: new THREE.MeshStandardMaterial({
			map: mapsInter.map,
			normalMap: mapsInter.normalMap,
			normalScale,
			roughnessMap: mapsInter.roughPaint,
			alphaMap: mapsInter.alphaMap,
			roughness: 1,
			metalness: 0.22,
			transparent: true,
			alphaTest: 0.02,
			depthWrite: false,
		}),
		rolo: new THREE.MeshStandardMaterial({
			map: texRoloMap,
			normalMap: texRoloNorm,
			normalScale: new THREE.Vector2(0.85, 0.85),
			roughnessMap: texRoloRoughP,
			roughness: 1,
			metalness: 0.22,
		}),
		perfil: new THREE.MeshStandardMaterial({
			color: 0x7d838a,
			roughness: 0.38,
			metalness: 0.24,
		}),
		caixa: new THREE.MeshStandardMaterial({
			color: 0x7d838a,
			roughness: 0.36,
			metalness: 0.25,
		}),
		// Peças mecânicas / borracha / aço bruto
		borracha: new THREE.MeshStandardMaterial({
			color: 0x17181b,
			roughness: 0.92,
			metalness: 0.02,
		}),
		acoEscuro: new THREE.MeshStandardMaterial({
			color: 0x2c3037,
			roughness: 0.42,
			metalness: 0.72,
		}),
		acoGalvPeca: new THREE.MeshStandardMaterial({
			color: 0xbac2ca,
			roughness: 0.34,
			metalness: 0.85,
		}),
		inox: new THREE.MeshStandardMaterial({
			color: 0xe2e6ea,
			roughness: 0.2,
			metalness: 0.95,
		}),
		frisoCaixa: new THREE.MeshStandardMaterial({
			color: 0x16181c,
			roughness: 0.85,
			metalness: 0.1,
		}),
		marcaPlaca: new THREE.MeshStandardMaterial({
			color: 0xb60000, // acento da Metal Esquadrias no detalhe discreto da soleira
			roughness: 0.4,
			metalness: 0.3,
		}),
		// Arquitetura externa
		parede: new THREE.MeshStandardMaterial({
			map: plasterMaps.map,
			normalMap: plasterMaps.normalMap,
			normalScale: new THREE.Vector2(0.35, 0.35),
			roughness: 0.92,
			metalness: 0.0,
		}),
		granito: new THREE.MeshStandardMaterial({
			map: graniteMap,
			roughness: 0.42,
			metalness: 0.08,
		}),
		calcada: new THREE.MeshStandardMaterial({
			map: sidewalkMaps.map,
			normalMap: sidewalkMaps.normalMap,
			normalScale: new THREE.Vector2(0.55, 0.55),
			roughnessMap: sidewalkMaps.roughnessMap,
			roughness: 1,
			metalness: 0.0,
		}),
		asfalto: new THREE.MeshStandardMaterial({
			color: 0x2b2d31,
			roughness: 0.95,
			metalness: 0.0,
		}),
		marquise: new THREE.MeshStandardMaterial({
			color: 0x252a31,
			roughness: 0.38,
			metalness: 0.35,
		}),
		marquiseForro: new THREE.MeshStandardMaterial({
			color: 0xbca990,
			roughness: 0.72,
			metalness: 0.05,
		}),
		sombraContato: new THREE.MeshBasicMaterial({
			map: contactShadowMap,
			transparent: true,
			depthWrite: false,
			opacity: 0.85,
		}),
		// Botoeira e Nobreak
		nobreak: new THREE.MeshStandardMaterial({
			color: 0x1d2025,
			roughness: 0.48,
			metalness: 0.32,
		}),
		nobreakPainel: new THREE.MeshStandardMaterial({
			color: 0x101215,
			roughness: 0.25,
			metalness: 0.2,
		}),
		eletroduto: new THREE.MeshStandardMaterial({
			color: 0x3b4048,
			roughness: 0.45,
			metalness: 0.45,
		}),
		ledVerde: new THREE.MeshBasicMaterial({ color: 0x2ecc71 }),
		ledAmbar: new THREE.MeshBasicMaterial({ color: 0xf59e0b }),
		// Vitrine e interior da boutique (Lambert nas superfícies foscas internas = shader muito mais leve no celular)
		vidroMoldura: new THREE.MeshLambertMaterial({ color: 0x3b3835 }),
		vidroPuxador: new THREE.MeshStandardMaterial({
			color: 0xaeb4bc,
			roughness: 0.3,
			metalness: 0.85,
		}),
		vidro: new THREE.MeshBasicMaterial({
			color: 0xdbe8f5,
			transparent: true,
			opacity: 0.045,
			depthWrite: false,
		}),
		lojaParede: new THREE.MeshLambertMaterial({ color: 0xf0e7da }),
		lojaRipado: new THREE.MeshLambertMaterial({ map: slattedWallMap }),
		lojaTeto: new THREE.MeshLambertMaterial({ color: 0xf5f0e8 }),
		pisoMadeira: new THREE.MeshStandardMaterial({
			map: woodMaps.map,
			roughnessMap: woodMaps.roughnessMap,
			roughness: 1,
			metalness: 0.04,
		}),
		prateleira: new THREE.MeshLambertMaterial({ color: 0xa67c52 }),
		araraMetal: new THREE.MeshLambertMaterial({ color: 0x2b2826 }),
		manequim: new THREE.MeshLambertMaterial({ color: 0xe3dcd1 }),
		manequimVestidoA: new THREE.MeshLambertMaterial({ color: 0x8c353d }),
		manequimVestidoB: new THREE.MeshLambertMaterial({ color: 0x2b4559 }),
		luzQuente: new THREE.MeshBasicMaterial({ color: 0xfff1d4 }),
		luzSpot: new THREE.MeshBasicMaterial({ color: 0xfff6e5 }),
		// Material único para InstancedMesh de roupas (cor por instância via setColorAt)
		roupaInstanced: new THREE.MeshLambertMaterial({ color: 0xffffff }),
	};

	// Geometrias compartilhadas (não recriadas a cada rebuild)
	const sharedGeos = {
		mannequinTorso: createMannequinTorsoGeometry(),
		mannequinSkirt: createMannequinSkirtGeometry(),
		mannequinHead: new THREE.SphereGeometry(0.088, 14, 12),
		boxUnit: new THREE.BoxGeometry(1, 1, 1),
	};

	let root = new THREE.Group();
	scene.add(root);

	let W = 3;
	let H = 3;
	let lastStructKey = "";

	// Referências animáveis para abrir/fechar a porta sem reconstruir a cena
	let animRefs: {
		soleiraGroup: THREE.Group;
		bandA: {
			mesh: THREE.Mesh;
			geo: THREE.PlaneGeometry;
			laminasPorTile: number;
		};
		bandB?: {
			mesh: THREE.Mesh;
			geo: THREE.PlaneGeometry;
			laminasPorTile: number;
			splitH: number;
		};
		roloMesh?: THREE.Mesh;
	} | null = null;

	let openness = 0;
	let targetOpenness = 0;

	// Loop sob demanda estritamente 1 rAF por frame (0% uso de CPU/GPU quando parado no celular)
	let rafId = 0;
	let inTick = false;
	let needsNextFrame = false;
	let introActive = false;
	let introDone = false;
	let introStart = 0;
	let introBaseTheta = 0.34;
	const prevCamPos = new THREE.Vector3();
	const tempSph = new THREE.Spherical();
	const tempVec = new THREE.Vector3();

	function applyOpenness(o: number) {
		if (!animRefs) return;
		const maxLift = Math.max(0.1, H - SOLEIRA_ALTURA - 0.08);
		const lift = o * maxLift * MAX_ABERTURA;
		animRefs.soleiraGroup.position.y = lift;

		const curtainBottom = SOLEIRA_BASE_Y + SOLEIRA_ALTURA - 0.01 + lift;
		const curtainTop = H + 0.02;

		if (animRefs.bandB) {
			const splitY = animRefs.bandB.splitH + lift;
			const lisaTop = Math.min(curtainTop, splitY);
			const lisaVis = lisaTop > curtainBottom + 0.005;
			animRefs.bandA.mesh.visible = lisaVis;
			if (lisaVis) {
				updateCurtainBandGeo(
					animRefs.bandA.geo,
					W - 0.02,
					curtainBottom,
					lisaTop,
					lift,
					animRefs.bandA.laminasPorTile,
				);
			}
			const transvBot = Math.min(curtainTop, splitY);
			const transvVis = curtainTop > transvBot + 0.005;
			animRefs.bandB.mesh.visible = transvVis;
			if (transvVis) {
				updateCurtainBandGeo(
					animRefs.bandB.geo,
					W - 0.02,
					transvBot,
					curtainTop,
					lift,
					animRefs.bandB.laminasPorTile,
				);
			}
		} else {
			const vis = curtainTop > curtainBottom + 0.005;
			animRefs.bandA.mesh.visible = vis;
			if (vis) {
				updateCurtainBandGeo(
					animRefs.bandA.geo,
					W - 0.02,
					curtainBottom,
					curtainTop,
					lift,
					animRefs.bandA.laminasPorTile,
				);
			}
		}

		// Se o rolo estiver exposto, gira no sentido de enrolamento e cresce sutilmente conforme sobe
		if (animRefs.roloMesh) {
			animRefs.roloMesh.rotation.x = lift / 0.18;
			const grow = 1 + o * 0.14;
			animRefs.roloMesh.scale.set(1, grow, grow);
		}
	}

	function tick(now: number) {
		rafId = 0;
		inTick = true;
		needsNextFrame = false;
		let keepGoing = false;

		if (introActive) {
			const p = (now - introStart) / 3400;
			if (p >= 1) {
				introActive = false;
			} else {
				// Balanço suave com curva senoidal para revelar o relevo metálico e paralaxe
				const ease = Math.sin(p * Math.PI * 2) * Math.sin(p * Math.PI);
				tempVec.copy(camera.position).sub(controls.target);
				tempSph.setFromVector3(tempVec);
				tempSph.theta = introBaseTheta + ease * 0.28;
				camera.position.setFromSpherical(tempSph).add(controls.target);
				keepGoing = true;
			}
		}

		if (Math.abs(openness - targetOpenness) > 0.0008) {
			openness += (targetOpenness - openness) * 0.12;
			applyOpenness(openness);
			renderer.shadowMap.needsUpdate = true;
			keepGoing = true;
		} else if (openness !== targetOpenness) {
			openness = targetOpenness;
			applyOpenness(openness);
			renderer.shadowMap.needsUpdate = true;
		}

		prevCamPos.copy(camera.position);
		controls.update();
		if (camera.position.distanceToSquared(prevCamPos) > 1e-7) {
			keepGoing = true;
		}

		renderer.render(scene, camera);
		inTick = false;

		if ((keepGoing || needsNextFrame) && !rafId) {
			rafId = requestAnimationFrame(tick);
		}
	}

	function scheduleRender() {
		if (inTick) {
			needsNextFrame = true;
			return;
		}
		if (!rafId) rafId = requestAnimationFrame(tick);
	}

	controls.addEventListener("start", () => {
		introActive = false;
		renderer.domElement.style.cursor = "grabbing";
		scheduleRender();
	});
	controls.addEventListener("end", () => {
		renderer.domElement.style.cursor = "grab";
		scheduleRender();
	});
	controls.addEventListener("change", () => {
		// Ignora eventos síncronos disparados pelo próprio controls.update() dentro de tick()
		if (!inTick) scheduleRender();
	});

	function startIntro() {
		introDone = true;
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		introActive = true;
		introStart = performance.now();
		introBaseTheta = controls.getAzimuthalAngle();
		scheduleRender();
	}

	// Helpers de construção dentro de `root`
	const ownedGeos: THREE.BufferGeometry[] = [];
	function trackGeo<T extends THREE.BufferGeometry>(g: T): T {
		ownedGeos.push(g);
		return g;
	}

	function addMesh(
		geo: THREE.BufferGeometry,
		mat: THREE.Material,
		x: number,
		y: number,
		z: number,
		opts?: {
			castShadow?: boolean;
			receiveShadow?: boolean;
			renderOrder?: number;
			parent?: THREE.Object3D;
		},
	) {
		const m = new THREE.Mesh(geo, mat);
		m.position.set(x, y, z);
		if (opts?.castShadow) m.castShadow = true;
		if (opts?.receiveShadow) m.receiveShadow = true;
		if (opts?.renderOrder !== undefined) m.renderOrder = opts.renderOrder;
		(opts?.parent ?? root).add(m);
		return m;
	}

	function addBox(
		w: number,
		h: number,
		d: number,
		mat: THREE.Material,
		x: number,
		y: number,
		z: number,
		opts?: {
			castShadow?: boolean;
			receiveShadow?: boolean;
			parent?: THREE.Object3D;
			uvScale?: number;
		},
	) {
		const geo = trackGeo(new THREE.BoxGeometry(w, h, d));
		if (opts?.uvScale) {
			// Mapeamento triplanar simples para texturas arquitetônicas sem esticar
			const pos = geo.attributes.position as THREE.BufferAttribute;
			const nrm = geo.attributes.normal as THREE.BufferAttribute;
			const uv = geo.attributes.uv as THREE.BufferAttribute;
			const sc = opts.uvScale;
			for (let i = 0; i < pos.count; i++) {
				const nx = Math.abs(nrm.getX(i));
				const ny = Math.abs(nrm.getY(i));
				const px = pos.getX(i) + x;
				const py = pos.getY(i) + y;
				const pz = pos.getZ(i) + z;
				if (ny > 0.5) uv.setXY(i, px * sc, pz * sc);
				else if (nx > 0.5) uv.setXY(i, pz * sc, py * sc);
				else uv.setXY(i, px * sc, py * sc);
			}
			uv.needsUpdate = true;
		}
		return addMesh(geo, mat, x, y, z, opts);
	}

	function addCyl(
		rt: number,
		rb: number,
		h: number,
		mat: THREE.Material,
		x: number,
		y: number,
		z: number,
		segs = 18,
		opts?: {
			castShadow?: boolean;
			receiveShadow?: boolean;
			parent?: THREE.Object3D;
		},
	) {
		return addMesh(
			trackGeo(new THREE.CylinderGeometry(rt, rb, h, segs)),
			mat,
			x,
			y,
			z,
			opts,
		);
	}

	// Atualiza apenas cor/acabamento (galvanizado vs pintura eletrostática) sem tocar na geometria
	function applyFinish(cor: CortinaConfig["cor"]) {
		const galv = cor.galvanizado === true;
		const baseColor = new THREE.Color(galv ? 0xdbe0e6 : cor.hex);

		// Para pintura eletrostática, cores muito claras (ex: branco) usam metalness menor para não acinzentar
		const lum =
			0.2126 * baseColor.r + 0.7152 * baseColor.g + 0.0722 * baseColor.b;
		const paintMetal = THREE.MathUtils.lerp(0.28, 0.1, lum);

		const curtainMats = [
			{ m: mats.lisa, rp: mapsLisa.roughPaint, rg: mapsLisa.roughGalv },
			{
				m: mats.transvision,
				rp: mapsTransv.roughPaint,
				rg: mapsTransv.roughGalv,
			},
			{
				m: mats.intercalada,
				rp: mapsInter.roughPaint,
				rg: mapsInter.roughGalv,
			},
			{ m: mats.rolo, rp: texRoloRoughP, rg: texRoloRoughG },
		];

		for (const { m, rp, rg } of curtainMats) {
			m.color.copy(baseColor);
			m.metalness = galv ? 0.86 : paintMetal;
			m.roughness = 1;
			m.roughnessMap = galv ? rg : rp;
			m.needsUpdate = true;
		}

		// Perfis (trilhos e soleira) e caixa de acabamento seguem a cor ou ficam em aço galvanizado
		mats.perfil.color.set(galv ? 0xbec5cc : cor.hex);
		mats.perfil.metalness = galv ? 0.84 : paintMetal + 0.04;
		mats.perfil.roughness = galv ? 0.36 : 0.4;

		mats.caixa.color.set(galv ? 0xc7cdd4 : cor.hex);
		mats.caixa.metalness = galv ? 0.84 : paintMetal + 0.04;
		mats.caixa.roughness = galv ? 0.34 : 0.38;
	}

	// Constrói a fachada arquitetônica, calçada, rua e marquise comercial
	function buildFacade() {
		const wingW = Math.max(8, W * 1.4 + 6);
		const wallTop = H + 3.8;
		const plinthH = 0.24;

		// Pilares laterais da fachada com profundidade real (requadro de 32 cm)
		for (const s of [-1, 1]) {
			const cx = s * (W / 2 + wingW / 2);
			addBox(
				wingW,
				wallTop - plinthH,
				PAREDE_ESP,
				mats.parede,
				cx,
				plinthH + (wallTop - plinthH) / 2,
				0,
				{ castShadow: true, receiveShadow: true, uvScale: 0.7 },
			);
			// Rodapé de granito escuro protegendo a base da parede
			addBox(
				wingW,
				plinthH,
				PAREDE_ESP + 0.025,
				mats.granito,
				cx,
				plinthH / 2,
				0.008,
				{ castShadow: true, receiveShadow: true, uvScale: 1.4 },
			);
		}

		// Verga superior (parede acima do vão)
		const headerH = wallTop - H;
		addBox(W, headerH, PAREDE_ESP, mats.parede, 0, H + headerH / 2, 0, {
			castShadow: true,
			receiveShadow: true,
			uvScale: 0.7,
		});

		// Frisos verticais discretos de dilatação arquitetônica nas laterais da fachada
		for (const s of [-1, 1]) {
			addBox(
				0.014,
				wallTop - plinthH,
				0.01,
				mats.frisoCaixa,
				s * (W / 2 + 1.45),
				plinthH + (wallTop - plinthH) / 2,
				PAREDE_FRENTE + 0.002,
			);
		}

		// Soleira de granito escuro no vão da porta
		addBox(
			W + 0.16,
			SOLEIRA_BASE_Y,
			PAREDE_ESP + 0.06,
			mats.granito,
			0,
			SOLEIRA_BASE_Y / 2,
			0.02,
			{ receiveShadow: true, uvScale: 1.6 },
		);

		// Marquise arquitetônica em ACM grafite acima da caixa/rolo com spots embutidos
		const marqY = H + 0.62;
		const marqW = W + 2.2;
		const marqD = 0.78;
		const marqH = 0.24;
		addBox(
			marqW,
			marqH,
			marqD,
			mats.marquise,
			0,
			marqY + marqH / 2,
			PAREDE_FRENTE + marqD / 2 - 0.02,
			{ castShadow: true, receiveShadow: true },
		);
		// Forro inferior quente da marquise
		addBox(
			marqW - 0.08,
			0.014,
			marqD - 0.06,
			mats.marquiseForro,
			0,
			marqY + 0.002,
			PAREDE_FRENTE + marqD / 2 - 0.02,
		);
		// Rufo superior metálico fino
		addBox(
			marqW + 0.04,
			0.022,
			marqD + 0.04,
			mats.acoEscuro,
			0,
			marqY + marqH + 0.011,
			PAREDE_FRENTE + marqD / 2 - 0.02,
		);
		// Spots LED embutidos na marquise
		const spotCount = Math.max(2, Math.min(6, Math.round(W / 1.15) + 1));
		const spotSpan = Math.max(0.8, W - 0.3);
		for (let i = 0; i < spotCount; i++) {
			const t = spotCount === 1 ? 0.5 : i / (spotCount - 1);
			const sx = -spotSpan / 2 + t * spotSpan;
			const sz = PAREDE_FRENTE + marqD * 0.58;
			addCyl(0.044, 0.044, 0.012, mats.acoEscuro, sx, marqY - 0.002, sz, 14);
			addCyl(0.03, 0.03, 0.008, mats.luzSpot, sx, marqY - 0.006, sz, 14);
		}

		// Calçada de basalto/concreto + meio-fio + faixa de asfalto na frente
		const sideW = W + wingW * 2;
		const sideD = 2.9;
		const sideGeo = trackGeo(new THREE.PlaneGeometry(sideW, sideD));
		const suv = sideGeo.attributes.uv as THREE.BufferAttribute;
		for (let i = 0; i < suv.count; i++) {
			suv.setXY(i, (suv.getX(i) * sideW) / 1.35, (suv.getY(i) * sideD) / 1.35);
		}
		const calcada = addMesh(
			sideGeo,
			mats.calcada,
			0,
			0,
			PAREDE_FRENTE + sideD / 2 - 0.14,
			{ receiveShadow: true },
		);
		calcada.rotation.x = -Math.PI / 2;

		// Meio-fio de concreto/granito
		addBox(
			sideW,
			0.11,
			0.14,
			mats.granito,
			0,
			-0.045,
			PAREDE_FRENTE + sideD - 0.07,
			{ receiveShadow: true, uvScale: 1.5 },
		);

		// Asfalto da rua se dissolvendo na neblina
		const rua = addMesh(
			trackGeo(new THREE.PlaneGeometry(sideW + 10, 18)),
			mats.asfalto,
			0,
			-0.095,
			PAREDE_FRENTE + sideD + 9,
			{ receiveShadow: true },
		);
		rua.rotation.x = -Math.PI / 2;

		// Sombra de contato sutil na base da fachada e da soleira
		const csWall = addMesh(
			trackGeo(new THREE.PlaneGeometry(sideW, 0.45)),
			mats.sombraContato,
			0,
			0.004,
			PAREDE_FRENTE + 0.22,
			{ renderOrder: 1 },
		);
		csWall.rotation.x = -Math.PI / 2;
	}

	// Constrói a vitrine de vidro temperado e a loja de roupas iluminada atrás do vão
	function buildShopInterior() {
		const r = rng(19);
		const L = Math.max(W + 4.4, 7.6);
		const D = LOJA_PROFUNDIDADE;
		const teto = Math.max(H + 0.38, 3.05);
		const floorY = SOLEIRA_BASE_Y + 0.001;
		const frontZ = PAREDE_FUNDO - 0.02;

		// Piso de réguas de carvalho
		const floorGeo = trackGeo(new THREE.PlaneGeometry(L, D));
		const fuv = floorGeo.attributes.uv as THREE.BufferAttribute;
		for (let i = 0; i < fuv.count; i++) {
			fuv.setXY(i, (fuv.getX(i) * L) / 1.8, (fuv.getY(i) * D) / 1.8);
		}
		const chao = addMesh(floorGeo, mats.pisoMadeira, 0, floorY, frontZ - D / 2);
		chao.rotation.x = -Math.PI / 2;

		// Forro
		const forro = addMesh(
			trackGeo(new THREE.PlaneGeometry(L, D)),
			mats.lojaTeto,
			0,
			teto,
			frontZ - D / 2,
		);
		forro.rotation.x = Math.PI / 2;

		// Paredes laterais da loja
		for (const s of [-1, 1]) {
			const side = addMesh(
				trackGeo(new THREE.PlaneGeometry(D, teto)),
				mats.lojaParede,
				s * (L / 2),
				teto / 2,
				frontZ - D / 2,
			);
			side.rotation.y = -s * (Math.PI / 2);
		}

		// Parede de fundo com painel ripado central de madeira
		const backZ = frontZ - D;
		addMesh(
			trackGeo(new THREE.PlaneGeometry(L, teto)),
			mats.lojaParede,
			0,
			teto / 2,
			backZ,
		);
		const ripW = Math.min(L - 0.6, Math.max(W + 1.2, 4.4));
		const ripGeo = trackGeo(new THREE.PlaneGeometry(ripW, teto - 0.25));
		const ruv = ripGeo.attributes.uv as THREE.BufferAttribute;
		for (let i = 0; i < ruv.count; i++) {
			ruv.setXY(i, (ruv.getX(i) * ripW) / 0.48, ruv.getY(i));
		}
		addMesh(ripGeo, mats.lojaRipado, 0, teto / 2 - 0.04, backZ + 0.012);

		// Sanca iluminada quente no topo da parede de fundo
		addBox(
			ripW * 0.94,
			0.035,
			0.04,
			mats.luzQuente,
			0,
			teto - 0.16,
			backZ + 0.05,
		);

		// Luminárias lineares quentes no teto (limpas e com poucos draw calls)
		for (const zOff of [1.15, 2.6]) {
			const tz = frontZ - zOff;
			const railW = Math.min(L - 1, Math.max(W * 0.78, 2.2));
			addBox(railW, 0.022, 0.08, mats.araraMetal, 0, teto - 0.015, tz);
			addBox(railW - 0.08, 0.012, 0.052, mats.luzQuente, 0, teto - 0.028, tz);
		}

		// Luz quente central da loja (brilho convidativo visível pela Transvision)
		luzLoja.position.set(0, teto - 0.4, frontZ - 1.75);

		// Prateleiras de madeira na parede de fundo com fita LED e pilhas de roupas (InstancedMesh = 1 draw call)
		const shelfW = Math.min(L - 1.2, W + 0.8);
		const foldedPositions: {
			x: number;
			y: number;
			z: number;
			sx: number;
			sy: number;
			sz: number;
			ry: number;
			color: number;
		}[] = [];

		for (const y of [0.76, 1.28, 1.8]) {
			addBox(shelfW, 0.036, 0.34, mats.prateleira, 0, y, backZ + 0.19);
			addBox(
				shelfW - 0.08,
				0.01,
				0.015,
				mats.luzQuente,
				0,
				y - 0.022,
				backZ + 0.06,
			);
			for (let x = -shelfW / 2 + 0.26; x <= shelfW / 2 - 0.24; x += 0.4) {
				const pilha = 2 + Math.floor(r() * 3);
				const col = ROUPAS_CORES[Math.floor(r() * ROUPAS_CORES.length)];
				for (let k = 0; k < pilha; k++) {
					foldedPositions.push({
						x: x + (r() - 0.5) * 0.02,
						y: y + 0.048 + k * 0.064,
						z: backZ + 0.19,
						sx: 0.28 + (r() - 0.5) * 0.04,
						sy: 0.056,
						sz: 0.26,
						ry: (r() - 0.5) * 0.08,
						color: col,
					});
				}
			}
		}

		// Araras minimalistas (aço escuro + tampo superior de madeira) com cabides instanciados
		const hangingPositions: typeof foldedPositions = [];
		const rackOffsets: [number, number][] = [
			[-Math.min(W * 0.26, 1.45), frontZ - 1.75],
			[Math.min(W * 0.27, 1.55), frontZ - 2.75],
		];
		for (const [rx, rz] of rackOffsets) {
			const rw = 1.28;
			const rh = 1.54;
			// Estrutura retangular da arara
			addBox(rw, 0.024, 0.024, mats.araraMetal, rx, rh, rz);
			addBox(rw + 0.04, 0.024, 0.32, mats.prateleira, rx, rh + 0.06, rz);
			for (const s of [-1, 1]) {
				addBox(
					0.024,
					rh + 0.06,
					0.024,
					mats.araraMetal,
					rx + s * (rw / 2),
					(rh + 0.06) / 2,
					rz,
				);
				addBox(
					0.024,
					0.02,
					0.46,
					mats.araraMetal,
					rx + s * (rw / 2),
					floorY + 0.01,
					rz,
				);
			}
			for (let k = 0; k < 11; k++) {
				const gh = 0.58 + r() * 0.34;
				hangingPositions.push({
					x: rx - 0.52 + k * 0.104,
					y: rh - 0.05 - gh / 2,
					z: rz,
					sx: 0.042,
					sy: gh,
					sz: 0.44,
					ry: (r() - 0.5) * 0.18,
					color: ROUPAS_CORES[Math.floor(r() * ROUPAS_CORES.length)],
				});
			}
		}

		// Um único InstancedMesh para todas as peças dobradas e penduradas (reduz ~75 draw calls para 1!)
		const allGarments = [...foldedPositions, ...hangingPositions];
		if (allGarments.length > 0) {
			const inst = new THREE.InstancedMesh(
				sharedGeos.boxUnit,
				mats.roupaInstanced,
				allGarments.length,
			);
			const dummy = new THREE.Object3D();
			const cTmp = new THREE.Color();
			for (let i = 0; i < allGarments.length; i++) {
				const g = allGarments[i];
				dummy.position.set(g.x, g.y, g.z);
				dummy.rotation.set(0, g.ry, 0);
				dummy.scale.set(g.sx, g.sy, g.sz);
				dummy.updateMatrix();
				inst.setMatrixAt(i, dummy.matrix);
				cTmp.setHex(g.color);
				inst.setColorAt(i, cTmp);
			}
			inst.instanceMatrix.needsUpdate = true;
			if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
			root.add(inst);
		}

		// 2 Manequins esculpidos (um próximo à vitrine, outro ao fundo para paralaxe)
		const mannequins: { x: number; z: number; dress: THREE.Material }[] = [
			{
				x: Math.min(W * 0.22, 1.15),
				z: frontZ - 0.85,
				dress: mats.manequimVestidoA,
			},
			{
				x: -Math.min(W * 0.28, 1.4),
				z: frontZ - 3.1,
				dress: mats.manequimVestidoB,
			},
		];
		for (const mq of mannequins) {
			// Base disco + haste metálica
			addCyl(0.2, 0.21, 0.024, mats.araraMetal, mq.x, floorY + 0.012, mq.z, 18);
			addCyl(0.014, 0.014, 0.86, mats.inox, mq.x, floorY + 0.44, mq.z, 12);
			// Saia/vestido esculpido + torso + cabeça
			addMesh(sharedGeos.mannequinSkirt, mq.dress, mq.x, floorY + 0.36, mq.z);
			addMesh(
				sharedGeos.mannequinTorso,
				mats.manequim,
				mq.x,
				floorY + 0.88,
				mq.z,
			);
			addMesh(
				sharedGeos.mannequinHead,
				mats.manequim,
				mq.x,
				floorY + 1.66,
				mq.z,
			);
		}

		// Vitrine de vidro temperado sem montantes verticais escuros (junta seca, recuada no interior)
		const glassZ = frontZ - 0.24;
		const frameT = 0.036;
		// Apenas trilho superior e inferior discretos no perímetro, sem barras verticais cruzando a porta
		addBox(W, frameT, 0.038, mats.vidroMoldura, 0, H - frameT / 2, glassZ);
		addBox(W, frameT, 0.038, mats.vidroMoldura, 0, floorY + frameT / 2, glassZ);
		// Puxadores tubulares finos e discretos na porta de vidro recuada
		const handleY = Math.min(H * 0.43, 1.12);
		for (const s of [-1, 1]) {
			const hx = s * 0.075;
			addCyl(
				0.009,
				0.009,
				0.42,
				mats.vidroPuxador,
				hx,
				handleY,
				glassZ + 0.032,
				8,
			);
		}
		// Folha de vidro sutil (renderOrder 1, sempre atrás da cortina em renderOrder 2)
		addMesh(
			trackGeo(new THREE.PlaneGeometry(W, H - frameT * 2)),
			mats.vidro,
			0,
			H / 2,
			glassZ,
			{ renderOrder: 1 },
		);
	}

	// Constrói a cortina de ferro completa: lâminas, soleira, trilhos em perfil U, caixa ou rolo+motor, botoeira e nobreak
	function buildRollingDoor(c: CortinaConfig) {
		const curtainW = W - 0.02;

		// 1. Guias laterais em Perfil U com canal interno, fita anti-atrito PVC e abas de fixação
		for (const s of [-1, 1]) {
			const gx = s * (W / 2 + 0.005);
			// Corpo principal do perfil U
			addBox(
				0.056,
				H + 0.04,
				0.072,
				mats.perfil,
				gx + s * 0.012,
				H / 2,
				CORTINA_Z,
				{
					castShadow: true,
					receiveShadow: true,
				},
			);
			// Canal interno escuro + fita PVC preta onde a lâmina desliza
			addBox(0.014, H, 0.032, mats.borracha, gx - s * 0.014, H / 2, CORTINA_Z);
			// Abas de fixação laterais (detalhe real das obras da Metal Esquadrias)
			const tabCount = Math.max(3, Math.round(H / 0.9));
			for (let t = 0; t < tabCount; t++) {
				const ty = 0.35 + (t / Math.max(1, tabCount - 1)) * (H - 0.7);
				addBox(
					0.04,
					0.045,
					0.012,
					mats.perfil,
					gx + s * 0.048,
					ty,
					PAREDE_FRENTE + 0.006,
				);
			}
		}

		// 2. Soleira reforçada (perfil T + borracha EPDM de vedação + trava central + plaquinha discreta)
		const soleiraGroup = new THREE.Group();
		root.add(soleiraGroup);
		// Borracha de vedação inferior preta
		addBox(
			curtainW,
			0.02,
			0.038,
			mats.borracha,
			0,
			SOLEIRA_BASE_Y + 0.01,
			CORTINA_Z,
			{ castShadow: true, parent: soleiraGroup },
		);
		// Perfil reforçado da soleira
		addBox(
			curtainW,
			0.056,
			0.052,
			mats.perfil,
			0,
			SOLEIRA_BASE_Y + 0.048,
			CORTINA_Z + 0.004,
			{ castShadow: true, receiveShadow: true, parent: soleiraGroup },
		);
		// Friso de reforço horizontal da soleira
		addBox(
			curtainW,
			0.012,
			0.064,
			mats.perfil,
			0,
			SOLEIRA_BASE_Y + 0.026,
			CORTINA_Z + 0.004,
			{ parent: soleiraGroup },
		);
		// Fechadura / trava inferior em inox + detalhe discreto no canto esquerdo
		addBox(
			0.07,
			0.028,
			0.012,
			mats.inox,
			0,
			SOLEIRA_BASE_Y + 0.048,
			CORTINA_Z + 0.032,
			{ parent: soleiraGroup },
		);
		addBox(
			0.048,
			0.018,
			0.006,
			mats.marcaPlaca,
			-curtainW / 2 + 0.14,
			SOLEIRA_BASE_Y + 0.048,
			CORTINA_Z + 0.031,
			{ parent: soleiraGroup },
		);

		// 3. Chapa da cortina (1 banda ou 2 bandas no modo personalizado)
		const makeBand = (
			mat: THREE.Material,
			laminasPorTile: number,
			isTransparent: boolean,
		) => {
			const geo = trackGeo(new THREE.PlaneGeometry(1, 1, 1, 1));
			const mesh = addMesh(geo, mat, 0, 0, CORTINA_Z, {
				castShadow: !isTransparent,
				receiveShadow: true,
				renderOrder: isTransparent ? 2 : 0,
			});
			return { mesh, geo, laminasPorTile };
		};

		let bandA: NonNullable<typeof animRefs>["bandA"];
		let bandB: NonNullable<typeof animRefs>["bandB"];

		if (c.chapa === "intercalada") {
			bandA = makeBand(mats.intercalada, 2, true);
		} else if (c.chapa === "transvision") {
			bandA = makeBand(mats.transvision, 1, true);
		} else if (c.chapa === "personalizado") {
			const splitH = Math.round((H * 0.42) / LAMINA_ALTURA) * LAMINA_ALTURA;
			bandA = makeBand(mats.lisa, 1, false);
			bandB = { ...makeBand(mats.transvision, 1, true), splitH };
		} else {
			bandA = makeBand(mats.lisa, 1, false);
		}

		// 4. Caixa de acabamento (estilo chapa dobrada + caixa lateral do motor) OU rolo + motor exposto
		let roloMesh: THREE.Mesh | undefined;
		if (c.caixa) {
			const boxW = W + 0.24;
			const boxH = 0.39;
			const boxD = 0.34;
			const boxY = H + boxH / 2 - 0.02;
			const boxZ = PAREDE_FRENTE + boxD / 2 - 0.02;

			// Corpo principal da testeira dobrada
			addBox(boxW, boxH, boxD, mats.caixa, 0, boxY, boxZ, {
				castShadow: true,
				receiveShadow: true,
			});
			// Fenda escura inferior por onde a chapa entra na caixa
			addBox(
				curtainW + 0.02,
				0.012,
				0.055,
				mats.frisoCaixa,
				0,
				H - 0.022,
				CORTINA_Z + 0.02,
			);
			// Aba inferior dobrada da testeira
			addBox(boxW + 0.012, 0.018, boxD + 0.01, mats.caixa, 0, H - 0.012, boxZ);

			// Emendas sutis de chapa dobrada quando a porta é larga (realismo construtivo)
			const seams = Math.max(1, Math.floor(boxW / 1.9));
			for (let s = 1; s <= seams; s++) {
				const sx = -boxW / 2 + (s / (seams + 1)) * boxW;
				addBox(
					0.005,
					boxH - 0.02,
					0.008,
					mats.frisoCaixa,
					sx,
					boxY,
					boxZ + boxD / 2 + 0.002,
				);
			}

			// Caixa do motor automatizador à direita (exatamente como nas obras da Metal Esquadrias)
			const mBoxW = 0.48;
			const mBoxH = 0.42;
			const mBoxD = 0.43;
			addBox(
				mBoxW,
				mBoxH,
				mBoxD,
				mats.caixa,
				W / 2 - 0.04,
				H + mBoxH / 2 - 0.03,
				PAREDE_FRENTE + mBoxD / 2 - 0.02,
				{ castShadow: true, receiveShadow: true },
			);
			// Linha de encontro entre a caixa do rolo e a caixa do motor
			addBox(
				0.006,
				mBoxH - 0.01,
				mBoxD + 0.006,
				mats.frisoCaixa,
				W / 2 - 0.04 - mBoxW / 2,
				H + mBoxH / 2 - 0.03,
				PAREDE_FRENTE + mBoxD / 2 - 0.02,
			);
		} else {
			// Mecanismo exposto: chapas testeiras + eixo tubular + rolo de lâminas + motor lateral
			const rollY = H + 0.22;
			const rollR = 0.175;
			const rollZ = PAREDE_FRENTE + 0.21; // folga limpa da fachada mesmo ao expandir aberto

			// Chapas testeiras laterais de aço ancoradas na fachada
			for (const s of [-1, 1]) {
				const px = s * (W / 2 + 0.055);
				addBox(
					0.014,
					0.44,
					0.42,
					mats.acoEscuro,
					px,
					rollY,
					PAREDE_FRENTE + 0.21,
					{
						castShadow: true,
						receiveShadow: true,
					},
				);
				// Aba de fixação na parede + 2 parafusos
				addBox(
					0.06,
					0.42,
					0.014,
					mats.acoEscuro,
					px + s * 0.025,
					rollY,
					PAREDE_FRENTE + 0.008,
				);
				for (const dy of [-0.14, 0.14]) {
					const bolt = addCyl(
						0.009,
						0.009,
						0.018,
						mats.acoGalvPeca,
						px + s * 0.032,
						rollY + dy,
						PAREDE_FRENTE + 0.016,
						6,
					);
					bolt.rotation.x = Math.PI / 2;
				}
				// Mancal / rolamento no eixo
				const bearing = addCyl(
					0.065,
					0.065,
					0.026,
					mats.acoGalvPeca,
					px + s * 0.012,
					rollY,
					rollZ,
					16,
				);
				bearing.rotation.z = Math.PI / 2;
			}

			// Eixo tubular central de aço galvanizado
			const eixo = addCyl(
				0.044,
				0.044,
				W + 0.26,
				mats.acoGalvPeca,
				0,
				rollY,
				rollZ,
				18,
				{
					castShadow: true,
				},
			);
			eixo.rotation.z = Math.PI / 2;

			// Rolo de lâminas enroladas (UV rotacionada para as lâminas correrem paralelas ao eixo)
			const rollRepeatU = W / TILE_LARGURA;
			const rollRepeatV = Math.round((2 * Math.PI * rollR) / LAMINA_ALTURA);
			for (const t of [texRoloMap, texRoloNorm, texRoloRoughP, texRoloRoughG]) {
				t.repeat.set(rollRepeatU, rollRepeatV);
			}
			const roloGeo = trackGeo(
				new THREE.CylinderGeometry(rollR, rollR, curtainW, 28, 1, true),
			);
			const ruv = roloGeo.attributes.uv as THREE.BufferAttribute;
			for (let i = 0; i < ruv.count; i++) {
				ruv.setXY(i, ruv.getY(i), ruv.getX(i));
			}
			// Rotaciona a geometria para que o eixo longitudinal fique em X (permite girar em rotation.x)
			roloGeo.rotateZ(Math.PI / 2);
			roloMesh = addMesh(roloGeo, mats.rolo, 0, rollY, rollZ, {
				castShadow: true,
				receiveShadow: true,
			});

			// Tampas laterais do rolo (discos metálicos em anéis concêntricos)
			for (const s of [-1, 1]) {
				const cap = addCyl(
					rollR - 0.002,
					rollR - 0.002,
					0.01,
					mats.acoGalvPeca,
					s * (curtainW / 2),
					rollY,
					rollZ,
					24,
				);
				cap.rotation.z = Math.PI / 2;
			}

			// Motor automatizador lateral à direita + caixa de transmissão por corrente
			const mx = W / 2 + 0.14;
			// Carenagem da corrente/engrenagem ligando o eixo ao motor
			addBox(
				0.065,
				0.24,
				0.15,
				mats.acoEscuro,
				mx - 0.03,
				rollY - 0.05,
				rollZ + 0.03,
				{
					castShadow: true,
				},
			);
			// Corpo cilíndrico do motor elétrico
			const motorBody = addCyl(
				0.088,
				0.088,
				0.26,
				mats.acoEscuro,
				mx + 0.1,
				rollY - 0.1,
				rollZ + 0.05,
				16,
				{
					castShadow: true,
				},
			);
			motorBody.rotation.z = Math.PI / 2;
			// Aletas de refrigeração do motor
			for (let k = -2; k <= 2; k++) {
				const fin = addCyl(
					0.095,
					0.095,
					0.008,
					mats.nobreak,
					mx + 0.1 + k * 0.036,
					rollY - 0.1,
					rollZ + 0.05,
					16,
				);
				fin.rotation.z = Math.PI / 2;
			}
			// Tampa traseira do motor
			const motorCap = addCyl(
				0.072,
				0.086,
				0.04,
				mats.nobreak,
				mx + 0.24,
				rollY - 0.1,
				rollZ + 0.05,
				16,
			);
			motorCap.rotation.z = Math.PI / 2;
		}

		// 5. Botoeira / chave de comando discreta na parede direita
		const botX = W / 2 + 0.22;
		const botY = Math.min(H - 0.45, 1.38);
		addBox(
			0.068,
			0.125,
			0.044,
			mats.nobreak,
			botX,
			botY,
			PAREDE_FRENTE + 0.022,
			{
				castShadow: true,
			},
		);
		addBox(
			0.048,
			0.096,
			0.006,
			mats.nobreakPainel,
			botX,
			botY,
			PAREDE_FRENTE + 0.045,
		);
		for (const dy of [0.026, 0, -0.026]) {
			const btn = addCyl(
				0.009,
				0.009,
				0.008,
				dy === 0 ? mats.marcaPlaca : mats.acoGalvPeca,
				botX,
				botY + dy,
				PAREDE_FRENTE + 0.05,
				10,
			);
			btn.rotation.x = Math.PI / 2;
		}
		// Eletroduto fino saindo da botoeira até o motor/caixa
		const botCondH = H + 0.06 - (botY + 0.06);
		if (botCondH > 0.05) {
			addCyl(
				0.008,
				0.008,
				botCondH,
				mats.eletroduto,
				botX,
				botY + 0.06 + botCondH / 2,
				PAREDE_FRENTE + 0.012,
				8,
			);
		}

		// 6. Nobreak industrial de parede (quando selecionado)
		if (c.nobreak) {
			const nx = W / 2 + 0.54;
			const ny = Math.min(H - 0.35, 1.65);
			const nz = PAREDE_FRENTE + 0.078;
			// Gabinete principal em aço preto acetinado
			addBox(0.3, 0.38, 0.15, mats.nobreak, nx, ny, nz, {
				castShadow: true,
				receiveShadow: true,
			});
			// Moldura frontal levemente recuada + painel acrílico escuro
			addBox(0.26, 0.34, 0.012, mats.acoEscuro, nx, ny, nz + 0.074);
			addBox(0.21, 0.075, 0.008, mats.nobreakPainel, nx, ny + 0.1, nz + 0.08);
			// LEDs de status (rede verde + carga âmbar)
			addBox(
				0.018,
				0.01,
				0.006,
				mats.ledVerde,
				nx - 0.06,
				ny + 0.1,
				nz + 0.085,
			);
			addBox(
				0.018,
				0.01,
				0.006,
				mats.ledAmbar,
				nx - 0.028,
				ny + 0.1,
				nz + 0.085,
			);
			// Aletas de ventilação inferiores
			for (let v = 0; v < 4; v++) {
				addBox(
					0.18,
					0.008,
					0.006,
					mats.frisoCaixa,
					nx,
					ny - 0.06 - v * 0.022,
					nz + 0.081,
				);
			}
			// Eletroduto conectando o nobreak ao motor/caixa
			const condTop = H + 0.12;
			const condH = condTop - (ny + 0.19);
			if (condH > 0.05) {
				addCyl(
					0.011,
					0.011,
					condH,
					mats.eletroduto,
					nx - 0.06,
					ny + 0.19 + condH / 2,
					PAREDE_FRENTE + 0.02,
					8,
					{
						castShadow: true,
					},
				);
				// Trecho horizontal entrando na lateral do motor/caixa
				const horizW = Math.max(0.1, nx - 0.06 - (W / 2 + 0.16));
				if (horizW > 0.04) {
					const hTube = addCyl(
						0.011,
						0.011,
						horizW,
						mats.eletroduto,
						nx - 0.06 - horizW / 2,
						condTop,
						PAREDE_FRENTE + 0.02,
						8,
					);
					hTube.rotation.z = Math.PI / 2;
				}
			}
		}

		animRefs = { soleiraGroup, bandA, bandB, roloMesh };
		applyOpenness(openness);
	}

	// Ajusta frustum da sombra direcional ao tamanho exato da porta (texels sempre nítidos!)
	function updateShadowBounds() {
		const span = Math.max(W + 3.2, H + 3.0) * 0.65;
		sol.shadow.camera.left = -span;
		sol.shadow.camera.right = span;
		sol.shadow.camera.top = span + 1.2;
		sol.shadow.camera.bottom = -span * 0.65;
		sol.shadow.camera.near = 1;
		sol.shadow.camera.far = Math.max(22, span * 4);
		sol.shadow.camera.updateProjectionMatrix();
		sol.position.set(span * 0.95, H + span * 0.9, span * 1.15);
		sol.target.position.set(0, H * 0.45, 0);
		sol.target.updateMatrixWorld();
		renderer.shadowMap.needsUpdate = true;
	}

	// Enquadra a fachada completa mantendo o ângulo escolhido pelo usuário
	function fit() {
		const { clientWidth: cw, clientHeight: ch } = host;
		if (!cw || !ch) return;
		renderer.setSize(cw, ch, false);
		camera.aspect = cw / ch;
		camera.updateProjectionMatrix();

		const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
		const frameH = H + 1.25;
		const frameW = W + 1.7;
		const dist =
			1.08 * Math.max(frameH / (2 * tan), frameW / (2 * tan * camera.aspect));
		const target = new THREE.Vector3(0, (H + 0.45) / 2, 0.08);
		const dir = camera.position.clone().sub(controls.target);
		if (dir.lengthSq() < 1e-6) {
			dir.set(Math.sin(0.34), 0.08, Math.cos(0.34));
		}
		camera.position.copy(target).add(dir.normalize().multiplyScalar(dist));
		controls.target.copy(target);
		controls.update();
		scheduleRender();
	}

	function clearRoot() {
		for (const g of ownedGeos) g.dispose();
		ownedGeos.length = 0;
		scene.remove(root);
		root = new THREE.Group();
		scene.add(root);
		animRefs = null;
	}

	function update(c: CortinaConfig) {
		// Acabamento/cor sempre aplica de imediato (0ms, sem reconstruir nada)
		applyFinish(c.cor);

		const structKey = `${c.largura}|${c.altura}|${c.chapa}|${c.caixa}|${c.nobreak}`;
		if (structKey === lastStructKey) {
			scheduleRender();
			return;
		}
		lastStructKey = structKey;

		const dimsChanged = c.largura !== W || c.altura !== H || !introDone;
		W = c.largura;
		H = c.altura;

		clearRoot();
		buildFacade();
		buildShopInterior();
		buildRollingDoor(c);
		updateShadowBounds();

		if (dimsChanged) {
			fit();
		} else {
			scheduleRender();
		}
		if (!introDone) startIntro();
	}

	function setOpen(open: boolean) {
		targetOpenness = open ? 1 : 0;
		scheduleRender();
	}

	const onContextLost = (e: Event) => {
		e.preventDefault();
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		}
	};
	const onContextRestored = () => scheduleRender();
	renderer.domElement.addEventListener("webglcontextlost", onContextLost);
	renderer.domElement.addEventListener(
		"webglcontextrestored",
		onContextRestored,
	);

	const ro = new ResizeObserver(fit);
	ro.observe(host);

	return {
		update,
		setOpen,
		dispose() {
			if (rafId) cancelAnimationFrame(rafId);
			ro.disconnect();
			renderer.domElement.removeEventListener(
				"webglcontextlost",
				onContextLost,
			);
			renderer.domElement.removeEventListener(
				"webglcontextrestored",
				onContextRestored,
			);
			controls.dispose();
			clearRoot();
			for (const g of Object.values(sharedGeos)) g.dispose();
			for (const m of Object.values(mats)) m.dispose();
			for (const set of [mapsLisa, mapsTransv, mapsInter]) {
				set.map.dispose();
				set.normalMap.dispose();
				set.alphaMap?.dispose();
				set.roughPaint.dispose();
				set.roughGalv.dispose();
			}
			texRoloMap.dispose();
			texRoloNorm.dispose();
			texRoloRoughP.dispose();
			texRoloRoughG.dispose();
			plasterMaps.map.dispose();
			plasterMaps.normalMap.dispose();
			sidewalkMaps.map.dispose();
			sidewalkMaps.normalMap.dispose();
			sidewalkMaps.roughnessMap.dispose();
			graniteMap.dispose();
			woodMaps.map.dispose();
			woodMaps.roughnessMap.dispose();
			slattedWallMap.dispose();
			contactShadowMap.dispose();
			backdropTex.dispose();
			envRT.dispose();
			renderer.dispose();
			renderer.domElement.remove();
		},
	};
}
