import { usePostHog } from "@posthog/react";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	CHAPAS,
	type Chapa,
	CORES,
	type Cor,
	type CortinaConfig,
	mensagemCortina,
	outraCor,
} from "#/lib/cortina";
import type { CortinaSceneHandle } from "#/lib/cortina-3d";
import { whatsappHref } from "#/lib/site";

// Amostra de cada opção: listras finas como as lâminas
const LISA = "var(--iron-300) 0 6px, var(--iron-500) 6px 7px";
const VAZADA =
	"var(--iron-400) 0 2px, var(--paper) 2px 6px, var(--iron-500) 6px 7px";
const AMOSTRA: Record<Chapa, string> = {
	lisa: `repeating-linear-gradient(180deg, ${LISA})`,
	transvision: `repeating-linear-gradient(180deg, ${VAZADA})`,
	intercalada:
		"repeating-linear-gradient(180deg, var(--iron-300) 0 6px, var(--iron-500) 6px 7px, var(--iron-400) 7px 9px, var(--paper) 9px 13px, var(--iron-500) 13px 14px)",
	personalizado: `repeating-linear-gradient(180deg, ${VAZADA}) top / 100% 55% no-repeat, repeating-linear-gradient(180deg, ${LISA})`,
};

/** Prévia 3D: só baixa o three.js quando a seção chega perto da tela. */
function CortinaPreview({ config }: { config: CortinaConfig }) {
	const host = useRef<HTMLDivElement>(null);
	const scene = useRef<CortinaSceneHandle | null>(null);
	const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");
	const [aberta, setAberta] = useState(false);

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

	useEffect(() => {
		if (status === "ready") scene.current?.setOpen(aberta);
	}, [status, aberta]);

	const medidaLabel = `${config.largura.toFixed(2).replace(".", ",")} × ${config.altura.toFixed(2).replace(".", ",")} m`;

	return (
		<div className="relative h-full w-full overflow-hidden rounded-lg border border-border-default bg-gradient-to-b from-[#1f2835] to-[#343d49] shadow-sm">
			<div ref={host} className="h-full w-full" />

			{status === "ready" && (
				<>
					<span className="pointer-events-none absolute top-2.5 left-2.5 rounded-md border border-white/15 bg-[#121417]/70 px-2.5 py-1 font-mono text-xs text-white/90 backdrop-blur-sm">
						{medidaLabel}
					</span>
					<button
						type="button"
						onClick={() => setAberta((v) => !v)}
						aria-pressed={aberta}
						className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-[#121417]/75 px-3 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-[#121417]/90"
					>
						{aberta ? (
							<>
								<ChevronDown className="size-3.5" />
								Fechar porta
							</>
						) : (
							<>
								<ChevronUp className="size-3.5" />
								Abrir porta
							</>
						)}
					</button>
				</>
			)}

			{status !== "ready" && (
				<p className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-white/75">
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
	const [chapa, setChapa] = useState<Chapa>("intercalada");
	const [nobreak, setNobreak] = useState(false);
	const [caixa, setCaixa] = useState(true);
	const [cor, setCor] = useState<Cor>(CORES[2]); // Cinza
	const outra = !CORES.includes(cor);

	const largura = parseMetros(medidas.largura);
	const altura = parseMetros(medidas.altura);
	const valido = largura !== null && altura !== null;

	// Mantém a última medida válida na prévia enquanto a pessoa digita
	const ultima = useRef({ largura: 3, altura: 3 });
	if (valido) ultima.current = { largura, altura };
	const { largura: l3d, altura: a3d } = ultima.current;
	const config = useMemo<CortinaConfig>(
		() => ({ largura: l3d, altura: a3d, chapa, nobreak, caixa, cor }),
		[l3d, a3d, chapa, nobreak, caixa, cor],
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
							<div className="mt-2 grid grid-cols-2 gap-2">
								{CHAPAS.map((c) => (
									<button
										key={c.id}
										type="button"
										onClick={() => setChapa(c.id)}
										aria-pressed={chapa === c.id}
										className="flex min-h-16 items-center gap-3 rounded-md border border-border-default bg-card p-2 text-left hover:border-border-strong aria-pressed:border-primary aria-pressed:ring-1 aria-pressed:ring-primary"
									>
										<span
											aria-hidden
											className="h-12 w-9 shrink-0 rounded-sm border border-[var(--iron-500)]"
											style={{ background: AMOSTRA[c.id] }}
										/>
										<span className="flex flex-col">
											<span className="text-sm font-semibold text-strong">
												{c.nome}
											</span>
											<span className="text-xs leading-tight text-muted-foreground">
												{c.descricao}
											</span>
										</span>
									</button>
								))}
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
