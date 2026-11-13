export type AiErrorKind =
  | "not_configured"
  | "auth"
  | "no_credit"
  | "rate_limited"
  | "unavailable"
  | "timeout"
  | "bad_response"
  | "bad_request";

/** Mensagens amigáveis (nunca expõem detalhes técnicos, chaves ou nomes de modelo). */
const FRIENDLY: Record<AiErrorKind, string> = {
  not_configured: "A interpretação por IA ainda não está disponível. Volte em breve.",
  auth: "A interpretação por IA está temporariamente indisponível. Tente de novo mais tarde.",
  no_credit: "O serviço de IA está sem crédito no momento. Tente de novo mais tarde.",
  rate_limited: "O serviço de IA está muito disputado agora. Tente de novo em alguns minutos.",
  unavailable: "O serviço de IA está fora do ar neste momento. Tente de novo em instantes.",
  timeout: "O serviço de IA demorou demais para responder. Tente de novo em instantes.",
  bad_response: "A IA não conseguiu gerar a interpretação desta vez. Tente de novo.",
  bad_request: "Não foi possível gerar a interpretação desta vez. Tente de novo.",
};

/** Erros em que vale tentar o modelo reserva. */
const RETRYABLE: Record<AiErrorKind, boolean> = {
  not_configured: false,
  auth: false,
  no_credit: true,
  rate_limited: true,
  unavailable: true,
  timeout: true,
  bad_response: true,
  bad_request: false,
};

export class AiError extends Error {
  readonly kind: AiErrorKind;
  /** Já saiu algum texto para o usuário antes do erro? Então não dá para trocar de modelo. */
  readonly producedText: boolean;

  constructor(kind: AiErrorKind, detail?: string, producedText = false) {
    super(detail ?? kind);
    this.name = "AiError";
    this.kind = kind;
    this.producedText = producedText;
  }

  get retryable() {
    return RETRYABLE[this.kind];
  }

  get userMessage() {
    return FRIENDLY[this.kind];
  }

  /** Status HTTP que devolvemos ao navegador. */
  get httpStatus() {
    return this.kind === "rate_limited" ? 429 : this.kind === "bad_request" ? 502 : 503;
  }
}

/** Traduz o status HTTP da OpenRouter em um tipo de erro nosso. */
export function classifyHttpStatus(status: number): AiErrorKind {
  if (status === 401) return "auth";
  if (status === 402) return "no_credit";
  if (status === 429) return "rate_limited";
  if (status === 408) return "timeout";
  if (status === 400) return "bad_request";
  if (status === 403) return "bad_response"; // moderação/guardrail: tenta outro modelo
  return "unavailable"; // 5xx e o resto
}
