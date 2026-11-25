// Carregado sob demanda pelo CortinaSimulator (import dinâmico) para não pesar a home.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { CortinaConfig } from "./cortina";

const LAMINA_ALTURA = 0.07; // altura visível de uma lâmina (confirmado pela fábrica)
// ponytail: medidas abaixo são ilustrativas; ajustar se a fábrica passar as reais
const TILE_LARGURA = 0.15; // largura coberta por um tile da textura
const TRANSV_OPACIDADE = 0.72; // a chapa transvision fica levemente translúcida
const LOJA_PROFUNDIDADE = 4.2;
// Iluminação: rua no fim da tarde, loja acesa por dentro (é o que mostra a visibilidade).
// Ajustado olhando a cena no celular; mexer aqui.
const LUZ = {
	ambiente: 0.3, // reflexo do "estúdio" em tudo (o que mais clareia a cena)
	ceu: 0.3,
	sol: 0.7,
	lojaPontos: 40, // lâmpadas da loja (candela); também aquecem a calçada, como luz saindo da vitrine
};

// Lâminas empilhadas (cada uma 256×128 px = 0,15 × 0,07 m), de cima para baixo:
// perfil com friso, grain de galvanizado e, nas transvision, furos oblongos finos.
function laminaTexture(furos: boolean[]) {
	const w = 256;
	const L = 128;
	const h = L * furos.length;
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	const ctx = c.getContext("2d") as CanvasRenderingContext2D;
	furos.forEach((_, k) => {
		const y0 = k * L;
		const g = ctx.createLinearGradient(0, y0, 0, y0 + L);
		g.addColorStop(0, "#c6ccd1");
		g.addColorStop(0.08, "#eef1f3");
		g.addColorStop(0.45, "#bfc5cb");
		g.addColorStop(0.8, "#8e959c");
		g.addColorStop(0.83, "#3a4047");
		g.addColorStop(0.92, "#4f565e");
		g.addColorStop(1, "#7d848b");
		ctx.fillStyle = g;
		ctx.fillRect(0, y0, w, L);
	});

	const img = ctx.getImageData(0, 0, w, h);
	const d = img.data;
	for (let y = 0; y < h; y++) {
		const risco = (Math.random() - 0.5) * 8; // escovado horizontal
		const alpha = furos[Math.floor(y / L)] ? 255 * TRANSV_OPACIDADE : 255;
		for (let x = 0; x < w; x++) {
			const i = (y * w + x) * 4;
			const n = risco + (Math.random() - 0.5) * 14;
			d[i] += n;
			d[i + 1] += n;
			d[i + 2] += n;
			d[i + 3] = alpha;
		}
	}
	ctx.putImageData(img, 0, 0);

	ctx.globalCompositeOperation = "destination-out";
	furos.forEach((f, k) => {
		if (!f) return;
		for (let n = 0; n < 3; n++) {
			ctx.beginPath();
			ctx.roundRect(8 + n * 85, k * L + 36, 70, 16, 8);
			ctx.fill();
		}
	});

	const t = new THREE.CanvasTexture(c);
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	return t;
}

// PRNG fixo para a loja não mudar a cada alteração da configuração
function rng(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const ROUPAS = [
	0x7a2e3a, 0xd9c7a7, 0x2f4858, 0xc76d4e, 0xf2efe9, 0x556b4e, 0x1f1f24,
	0x9bb1c8, 0xe2a9a1, 0xb08d57,
];

export function createCortinaScene(host: HTMLElement) {
	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
	host.appendChild(renderer.domElement);

	const scene = new THREE.Scene();
	const pmrem = new THREE.PMREMGenerator(renderer);
	scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
	scene.environmentIntensity = LUZ.ambiente;
	scene.add(new THREE.HemisphereLight(0xdfe8f2, 0x6f6a62, LUZ.ceu));
	const sol = new THREE.DirectionalLight(0xc9d6ea, LUZ.sol);
	sol.position.set(2, 5, 4);
	scene.add(sol);

	const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableZoom = false; // não sequestra o scroll/pinch da página
	controls.enablePan = false;
	controls.minAzimuthAngle = -1;
	controls.maxAzimuthAngle = 1;
	controls.minPolarAngle = controls.maxPolarAngle = Math.PI / 2 - 0.12;
	// Só arrasto horizontal gira; arrasto vertical continua rolando a página no celular
	renderer.domElement.style.touchAction = "pan-y";

	const texLisa = laminaTexture([false]);
	const texTransv = laminaTexture([true]);
	const texInter = laminaTexture([false, true]);
	const texRolo = texLisa.clone(); // mesma lâmina, repetição própria (enrolada no tubo)
	texRolo.needsUpdate = true;
	const metal = { metalness: 0.25, roughness: 0.5 }; // pintura eletrostática
	const std = (color: number, roughness = 0.85) =>
		new THREE.MeshStandardMaterial({ color, roughness });
	const mats = {
		lisa: new THREE.MeshStandardMaterial({
			...metal,
			map: texLisa,
		}),
		transvision: new THREE.MeshStandardMaterial({
			...metal,
			map: texTransv,
			transparent: true,
			alphaTest: 0.02,
			side: THREE.DoubleSide,
		}),
		intercalada: new THREE.MeshStandardMaterial({
			...metal,
			map: texInter,
			transparent: true,
			alphaTest: 0.02,
			side: THREE.DoubleSide,
		}),
		rolo: new THREE.MeshStandardMaterial({ ...metal, map: texRolo }),
		perfil: new THREE.MeshStandardMaterial({ color: 0x5d646c, ...metal }),
		caixa: new THREE.MeshStandardMaterial({
			color: 0x3a3f45,
			metalness: 0.5,
			roughness: 0.5,
		}),
		parede: std(0xd6cfc3, 1),
		piso: std(0x8f8a82, 1),
		nobreak: std(0x1b1d20, 0.6),
		led: new THREE.MeshBasicMaterial({ color: 0x2ecc71 }),
		// loja de roupa
		lojaParede: std(0xefe6da),
		lojaTeto: std(0xf7f4ef),
		madeira: std(0xa9825a, 0.7),
		cromado: new THREE.MeshStandardMaterial({
			color: 0xdddddd,
			metalness: 1,
			roughness: 0.2,
		}),
		manequim: std(0xd8d2c8, 0.5),
		luz: new THREE.MeshBasicMaterial({ color: 0xfff3dd }),
		roupas: ROUPAS.map((c) => std(c)),
	};

	// Luz quente da loja, atrás da cortina
	const luzesLoja = [
		new THREE.PointLight(0xffd9a8, LUZ.lojaPontos),
		new THREE.PointLight(0xffd9a8, LUZ.lojaPontos),
	];
	for (const l of luzesLoja) scene.add(l);

	let door = new THREE.Group();
	scene.add(door);
	let W = 3;
	let H = 3;

	const render = () => renderer.render(scene, camera);
	controls.addEventListener("change", render);

	function add(
		geo: THREE.BufferGeometry,
		mat: THREE.Material,
		x: number,
		y: number,
		z: number,
	) {
		const m = new THREE.Mesh(geo, mat);
		m.position.set(x, y, z);
		door.add(m);
		return m;
	}
	const box = (
		w: number,
		h: number,
		d: number,
		mat: THREE.Material,
		x: number,
		y: number,
		z: number,
	) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
	const cyl = (
		rt: number,
		rb: number,
		h: number,
		mat: THREE.Material,
		x: number,
		y: number,
		z: number,
	) => add(new THREE.CylinderGeometry(rt, rb, h, 20), mat, x, y, z);

	// Loja de roupa atrás do vão: camadas em profundidades diferentes dão o paralaxe ao girar
	function loja() {
		const r = rng(7);
		const roupa = () => mats.roupas[Math.floor(r() * mats.roupas.length)];
		const L = W + 6;
		const D = LOJA_PROFUNDIDADE;
		const teto = Math.max(H + 0.5, 2.8);

		const chao = add(
			new THREE.PlaneGeometry(L, D),
			mats.madeira,
			0,
			0.001,
			-D / 2,
		);
		chao.rotation.x = -Math.PI / 2;
		const forro = add(
			new THREE.PlaneGeometry(L, D),
			mats.lojaTeto,
			0,
			teto,
			-D / 2,
		);
		forro.rotation.x = Math.PI / 2;
		add(new THREE.PlaneGeometry(L, teto), mats.lojaParede, 0, teto / 2, -D);
		for (const z of [-1.2, -2.8])
			box(W * 0.6, 0.03, 0.12, mats.luz, 0, teto - 0.02, z);
		luzesLoja[0].position.set(-W / 4, teto - 0.3, -1.4);
		luzesLoja[1].position.set(W / 4, teto - 0.3, -3);

		// Prateleiras com roupa dobrada na parede do fundo
		for (const y of [0.7, 1.2, 1.7]) {
			box(W + 1, 0.03, 0.35, mats.madeira, 0, y, -D + 0.18);
			for (let x = -W / 2; x < W / 2 + 0.3; x += 0.38) {
				const pilha = 1 + Math.floor(r() * 3);
				for (let k = 0; k < pilha; k++)
					box(0.3, 0.07, 0.28, roupa(), x, y + 0.05 + k * 0.075, -D + 0.18);
			}
		}

		// Araras com cabides
		for (const [x, z] of [
			[-W * 0.25, -1.7],
			[W * 0.28, -2.7],
		]) {
			const bar = cyl(0.012, 0.012, 1.3, mats.cromado, x, 1.45, z);
			bar.rotation.z = Math.PI / 2;
			for (const s of [-1, 1])
				cyl(0.012, 0.012, 1.45, mats.cromado, x + s * 0.65, 0.725, z);
			for (let k = 0; k < 10; k++) {
				const peca = box(
					0.04,
					0.6 + r() * 0.35,
					0.48,
					roupa(),
					x - 0.55 + k * 0.12,
					0,
					z,
				);
				peca.position.y =
					1.42 - (peca.geometry as THREE.BoxGeometry).parameters.height / 2;
				peca.rotation.y = (r() - 0.5) * 0.25;
			}
		}

		// Manequins: um perto da porta (vitrine), outro no fundo
		for (const [x, z] of [
			[W * 0.2, -0.8],
			[-W * 0.32, -3.2],
		]) {
			cyl(0.22, 0.22, 0.03, mats.cromado, x, 0.015, z);
			cyl(0.015, 0.015, 0.5, mats.cromado, x, 0.25, z);
			cyl(0.16, 0.12, 0.45, mats.manequim, x, 1.3, z);
			cyl(0.12, 0.34, 0.8, roupa(), x, 0.9, z);
			add(new THREE.SphereGeometry(0.1, 16, 12), mats.manequim, x, 1.68, z);
		}
	}

	// Enquadra a porta inteira, mantendo o ângulo em que o usuário deixou a câmera
	function fit() {
		const { clientWidth: cw, clientHeight: ch } = host;
		if (!cw || !ch) return;
		renderer.setSize(cw, ch, false);
		camera.aspect = cw / ch;
		camera.updateProjectionMatrix();
		const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
		const dist =
			1.1 *
			Math.max((H + 0.9) / (2 * tan), (W + 1.4) / (2 * tan * camera.aspect));
		const target = new THREE.Vector3(0, (H + 0.4) / 2, 0);
		const dir = camera.position.clone().sub(controls.target);
		if (dir.lengthSq() === 0) dir.set(Math.sin(0.45), 0.12, Math.cos(0.45));
		camera.position.copy(target).add(dir.normalize().multiplyScalar(dist));
		controls.target.copy(target);
		controls.update();
		render();
	}

	// Na primeira exibição a câmera balança uma vez para mostrar o paralaxe da loja
	let introFeita = false;
	function intro() {
		introFeita = true;
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let parar = false;
		controls.addEventListener("start", () => (parar = true));
		const s = new THREE.Spherical();
		const base = controls.getAzimuthalAngle();
		const t0 = performance.now();
		const tick = (t: number) => {
			const p = (t - t0) / 4000;
			if (parar || p >= 1) return;
			s.setFromVector3(camera.position.clone().sub(controls.target));
			s.theta = base * Math.cos(p * Math.PI * 2);
			camera.position.setFromSpherical(s).add(controls.target);
			controls.update();
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	}

	function update(c: CortinaConfig) {
		W = c.largura;
		H = c.altura;
		door.traverse((o) => {
			if (o instanceof THREE.Mesh) o.geometry.dispose();
		});
		scene.remove(door);
		door = new THREE.Group();
		scene.add(door);

		texRolo.repeat.set(
			W / TILE_LARGURA,
			Math.round((2 * Math.PI * 0.2) / LAMINA_ALTURA),
		);

		// Cor: pintada multiplica a cor sobre o perfil da lâmina (friso e grain continuam);
		// galvanizado é o metal cru da textura, com brilho metálico
		const galv = c.cor.galvanizado === true;
		for (const m of [
			mats.lisa,
			mats.transvision,
			mats.intercalada,
			mats.rolo,
			mats.perfil,
			mats.caixa,
		]) {
			m.metalness = galv ? 0.7 : metal.metalness;
			m.roughness = galv ? 0.42 : metal.roughness;
			m.color.set(galv ? 0xffffff : c.cor.hex);
		}
		if (galv) {
			mats.perfil.color.set(0x8a9097);
			mats.caixa.color.set(0x6f757c);
		}

		// Parede com o vão recortado e calçada
		const parede = new THREE.Shape();
		parede.moveTo(-W / 2 - 3, 0);
		parede.lineTo(W / 2 + 3, 0);
		parede.lineTo(W / 2 + 3, H + 2);
		parede.lineTo(-W / 2 - 3, H + 2);
		const vao = new THREE.Path();
		vao.moveTo(-W / 2, 0);
		vao.lineTo(-W / 2, H);
		vao.lineTo(W / 2, H);
		vao.lineTo(W / 2, 0);
		parede.holes.push(vao);
		add(new THREE.ShapeGeometry(parede), mats.parede, 0, 0, 0.06);
		const calcada = add(new THREE.PlaneGeometry(W + 8, 6), mats.piso, 0, 0, 3);
		calcada.rotation.x = -Math.PI / 2;
		loja();

		// Chapa: a UV é escalada pelo tamanho real, então a lâmina fica com 7 cm em qualquer medida
		const chapa = (
			h: number,
			y: number,
			mat: THREE.Material,
			laminasPorTile = 1,
		) => {
			const geo = new THREE.PlaneGeometry(W, h);
			const uv = geo.attributes.uv;
			for (let i = 0; i < uv.count; i++)
				uv.setXY(
					i,
					(uv.getX(i) * W) / TILE_LARGURA,
					(uv.getY(i) * h) / (LAMINA_ALTURA * laminasPorTile),
				);
			add(geo, mat, 0, y, 0);
		};
		if (c.chapa === "intercalada") chapa(H, H / 2, mats.intercalada, 2);
		else if (c.chapa === "personalizado") {
			// Só ilustra uma combinação; o padrão real o cliente explica no WhatsApp
			const hl = Math.round((H * 0.4) / LAMINA_ALTURA) * LAMINA_ALTURA;
			chapa(hl, hl / 2, mats.lisa);
			chapa(H - hl, hl + (H - hl) / 2, mats.transvision);
		} else chapa(H, H / 2, mats[c.chapa]);
		box(W, 0.06, 0.06, mats.perfil, 0, 0.03, 0.01); // soleira
		for (const s of [-1, 1])
			box(0.07, H, 0.1, mats.perfil, s * (W / 2 + 0.02), H / 2, 0); // trilhos

		if (c.caixa) {
			box(W + 0.24, 0.42, 0.45, mats.caixa, 0, H + 0.21, 0.12);
		} else {
			const rolo = cyl(0.2, 0.2, W, mats.rolo, 0, H + 0.2, 0.08);
			rolo.rotation.z = Math.PI / 2;
			// UV do cilindro: u dá a volta, v corre no comprimento. Troca para as lâminas
			// ficarem paralelas ao eixo, como a cortina enrolada.
			const uv = rolo.geometry.attributes.uv;
			for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i));
		}

		if (c.nobreak) {
			const x = W / 2 + 0.55;
			const y = Math.min(H - 0.3, 1.8);
			box(0.32, 0.42, 0.16, mats.nobreak, x, y, 0.14);
			add(
				new THREE.SphereGeometry(0.018, 8, 8),
				mats.led,
				x + 0.09,
				y + 0.14,
				0.225,
			);
		}
		fit();
		if (!introFeita) intro();
	}

	const ro = new ResizeObserver(fit);
	ro.observe(host);

	return {
		update,
		dispose() {
			ro.disconnect();
			controls.dispose();
			door.traverse((o) => {
				if (o instanceof THREE.Mesh) o.geometry.dispose();
			});
			for (const m of Object.values(mats).flat()) m.dispose();
			texLisa.dispose();
			texTransv.dispose();
			texInter.dispose();
			texRolo.dispose();
			scene.environment?.dispose();
			pmrem.dispose();
			renderer.dispose();
			renderer.domElement.remove();
		},
	};
}
