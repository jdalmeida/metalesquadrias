import { usePostHog } from "@posthog/react";
import { MessageCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type Chapa,
	CORES,
	type Cor,
	type CortinaConfig,
	mensagemCortina,
	NUM_FAIXAS,
	outraCor,
	PADROES,
} from "#/lib/cortina";
import { whatsappHref } from "#/lib/site";

const CHAPA_LABEL: Record<Chapa, string> = {
	lisa: "Lisa",
	transvision: "Transvision",
};

const CHAPA_STYLE: Record<Chapa, React.CSSProperties> = {
	lisa: {
		background:
			"repeating-linear-gradient(180deg, var(--iron-200) 0 7px, var(--iron-300) 7px 9px)",
	},
	transvision: {
		background:
			"repeating-linear-gradient(180deg, var(--iron-300) 0 3px, transparent 3px 9px), var(--paper)",
	},
};

/** Prévia 3D: só baixa o three.js quando a seção chega perto da tela. */
function CortinaPreview({ config }: { config: CortinaConfig }) {
	const host = useRef<HTMLDivElement>(null);
	const scene = useRef<{ update(c: CortinaConfig): void } | null>(null);
	const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");

	useEffect(() => {
		const el = host.current;
		if (!el) return;
		let dispose: (() => void) | undefined;
		let cancelled = false;
		const io = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				io.disconnect();
				import("#/lib/cortina-3d")
					.then(({ createCortinaScene }) => {
						if (cancelled) return;
						const s = createCortinaScene(el);
						scene.current = s;
						dispose = s.dispose;
						setStatus("ready");
					})
					.catch(() => !cancelled && setStatus("error"));
			},
			{ rootMargin: "300px" },
		);
		io.observe(el);
		return () => {
			cancelled = true;
			io.disconnect();
			dispose?.();
			scene.current = null;
		};
	}, []);

	useEffect(() => {
		if (status === "ready") scene.current?.update(config);
	}, [status, config]);

	return (
		<div
			ref={host}
			className="relative h-full w-full overflow-hidden rounded-lg border border-border-default bg-gradient-to-b from-[var(--iron-050)] to-[var(--paper-dim)]"
		>
			{status !== "ready" && (
				<p className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted-foreground">
					{status === "error"
						? "Prévia 3D indisponível neste aparelho. A configuração continua valendo."
						: "Carregando prévia 3D…"}
				</p>
			)}
		</div>
	);
}

function parseMetros(s: string) {
	const n = Number(s.replace(",", "."));
	return Number.isFinite(n) && n > 0 && n <= 20 ? n : null;
}

function Toggle({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-md border border-border-default bg-card px-4 text-sm font-medium text-strong has-[:checked]:border-primary">
			{label}
			<input
				type="checkbox"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				className="size-5 accent-primary"
			/>
		</label>
	);
}

export function CortinaSimulator() {
	const posthog = usePostHog();
	const [medidas, setMedidas] = useState({ largura: "3", altura: "3" });
	const [faixas, setFaixas] = useState<Chapa[]>(PADROES[2].faixas);
	const [nobreak, setNobreak] = useState(false);
	const [caixa, setCaixa] = useState(true);
	const [cor, setCor] = useState<Cor>(CORES[1]);
	const outra = !CORES.includes(cor);

	const largura = parseMetros(medidas.largura);
	const altura = parseMetros(medidas.altura);
	const valido = largura !== null && altura !== null;

	// Mantém a última medida válida na prévia enquanto a pessoa digita
	const ultima = useRef({ largura: 3, altura: 3 });
	if (valido) ultima.current = { largura, altura };
	const { largura: l3d, altura: a3d } = ultima.current;
	const config = useMemo<CortinaConfig>(
		() => ({ largura: l3d, altura: a3d, faixas, nobreak, caixa, cor }),
		[l3d, a3d, faixas, nobreak, caixa, cor],
	);

	const alternar = (i: number) =>
		setFaixas((f) =>
			f.map((c, j) => (j === i ? (c === "lisa" ? "transvision" : "lisa") : c)),
		);

	return (
		<section
			id="simulador-cortina"
			className="border-b border-border-subtle bg-muted"
		>
			<div className="page-wrap py-12 md:py-20">
				<h2 className="font-heading text-2xl font-bold text-strong md:text-3xl">
					Monte sua cortina de ferro
				</h2>
				<p className="mt-2 max-w-xl text-foreground">
					Informe a medida aproximada e escolha as chapas. A configuração vai
					pronta no WhatsApp. O preço sai depois da medição no local.
				</p>

				<div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-[1.15fr_1fr] md:gap-8">
					{/* No celular a prévia fica presa no topo enquanto a pessoa mexe nas opções */}
					<div className="sticky top-[var(--header-h)] z-10 -mx-4 bg-muted px-4 pt-2 pb-3 md:top-[calc(var(--header-h)+1rem)] md:mx-0 md:self-start md:p-0">
						<div className="h-[38svh] min-h-56 md:h-[520px]">
							<CortinaPreview config={config} />
						</div>
						<p className="mt-2 text-xs text-muted-foreground">
							Arraste para os lados para girar. Ilustração da configuração, não
							é foto de obra.
						</p>
					</div>

					<div className="flex flex-col gap-6">
						<div className="grid grid-cols-2 gap-3">
							{(["largura", "altura"] as const).map((campo) => {
								const erro = parseMetros(medidas[campo]) === null;
								return (
									<label
										key={campo}
										className="flex flex-col gap-1 text-sm font-medium text-strong"
									>
										{campo === "largura" ? "Largura (m)" : "Altura (m)"}
										<input
											type="text"
											inputMode="decimal"
											autoComplete="off"
											value={medidas[campo]}
											onChange={(e) =>
												setMedidas((m) => ({ ...m, [campo]: e.target.value }))
											}
											aria-invalid={erro}
											className="h-12 rounded-md border border-input bg-card px-3 font-mono text-base aria-invalid:border-primary"
										/>
										{erro && (
											<span className="text-xs font-normal text-primary">
												Confira a medida
											</span>
										)}
									</label>
								);
							})}
						</div>

						<fieldset>
							<legend className="text-sm font-medium text-strong">
								Chapas da porta
							</legend>
							<div className="mt-2 grid grid-cols-2 gap-3">
								<div className="flex flex-col-reverse overflow-hidden rounded-md border-2 border-[var(--iron-600)]">
									{faixas.map((chapa, i) => (
										<button
											// biome-ignore lint/suspicious/noArrayIndexKey: faixas têm posição fixa
											key={i}
											type="button"
											onClick={() => alternar(i)}
											style={CHAPA_STYLE[chapa]}
											aria-label={`Faixa ${i + 1} de ${NUM_FAIXAS} (de baixo para cima): ${CHAPA_LABEL[chapa]}. Toque para trocar.`}
											className="h-10 border-t border-[var(--iron-400)] text-xs font-semibold text-strong first:border-t-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
										>
											<span className="rounded-sm bg-card/85 px-1.5 py-0.5">
												{CHAPA_LABEL[chapa]}
											</span>
										</button>
									))}
								</div>
								<div className="flex flex-col gap-2">
									<p className="text-xs text-muted-foreground">
										Toque numa faixa para trocar, ou use um padrão:
									</p>
									{PADROES.map((p) => (
										<button
											key={p.label}
											type="button"
											onClick={() => setFaixas(p.faixas)}
											aria-pressed={p.faixas.join() === faixas.join()}
											className="min-h-11 rounded-md border border-border-default bg-card px-3 py-2 text-left text-sm leading-tight text-strong hover:border-border-strong aria-pressed:border-primary aria-pressed:text-primary"
										>
											{p.label}
										</button>
									))}
								</div>
							</div>
						</fieldset>

						<fieldset>
							<legend className="text-sm font-medium text-strong">
								Cor: <span className="font-normal">{cor.nome}</span>
							</legend>
							<div className="mt-2 flex flex-wrap gap-2">
								{CORES.map((c) => (
									<button
										key={c.nome}
										type="button"
										onClick={() => setCor(c)}
										aria-pressed={cor.nome === c.nome}
										aria-label={c.nome}
										title={c.nome}
										style={{
											background: c.galvanizado
												? "linear-gradient(135deg, var(--iron-100), var(--iron-300) 50%, var(--iron-150))"
												: c.hex,
										}}
										className="size-11 rounded-full border border-border-strong ring-offset-2 ring-offset-muted aria-pressed:ring-2 aria-pressed:ring-primary"
									/>
								))}
								<label
									title="Outra cor"
									data-ativa={outra || undefined}
									className="relative grid size-11 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-border-strong bg-card text-lg text-muted-foreground ring-offset-2 ring-offset-muted has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring data-ativa:border-solid data-ativa:ring-2 data-ativa:ring-primary"
									style={outra ? { background: cor.hex } : undefined}
								>
									{!outra && "+"}
									<input
										type="color"
										aria-label="Outra cor: escolher o tom"
										value={cor.hex}
										onChange={(e) => setCor(outraCor(e.target.value))}
										className="absolute inset-0 cursor-pointer opacity-0"
									/>
								</label>
							</div>
							{outra && (
								<p className="mt-2 text-xs text-muted-foreground">
									Outros tons dependem de disponibilidade. A equipe confirma
									pelo WhatsApp.
								</p>
							)}
						</fieldset>

						<div className="flex flex-col gap-2">
							<Toggle
								label="Motor com nobreak"
								checked={nobreak}
								onChange={setNobreak}
							/>
							<Toggle
								label="Caixa de acabamento"
								checked={caixa}
								onChange={setCaixa}
							/>
						</div>

						<a
							href={
								valido
									? whatsappHref(
											mensagemCortina({ ...config, largura, altura }),
										)
									: undefined
							}
							aria-disabled={!valido}
							onClick={() =>
								posthog.capture("whatsapp_quote_requested", {
									placement: "simulador_cortina",
									...config,
									faixas: faixas.join(","),
									cor: cor.nome,
								})
							}
							target="_blank"
							rel="noreferrer"
							className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover hover:text-primary-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50 sm:w-auto sm:self-start"
						>
							<MessageCircle className="size-4" />
							Enviar configuração no WhatsApp
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}
