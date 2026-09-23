import { useMemo, useState } from "react";

type BoolKey =
  | "destinationTherapy"
  | "nonIschemic"
  | "vasopressor"
  | "intubated"
  | "iabp"
  | "impellaOrVaEcmo"
  | "centrifugalLvad"
  | "acei"
  | "severeRvDysfunction"
  | "severeTr"
  | "dialysis"
  | "comparePost";

type NumKey =
  | "intermacs"
  | "numInotropes"
  | "hr"
  | "rap"
  | "pcwp"
  | "pasp"
  | "padp"
  | "mpap"
  | "ci"
  | "rvDiameter"
  | "lvDiameter"
  | "tapse"
  | "sPrime"
  | "fac"
  | "rvFws"
  | "hemoglobin"
  | "ast"
  | "bilirubin"
  | "creatinine"
  | "sodium"
  | "albumin"
  | "platelets"
  | "postHr"
  | "postRap"
  | "postPcwp"
  | "postPasp"
  | "postPadp"
  | "postMpap"
  | "postCi";

type FormState = Record<NumKey, string> & Record<BoolKey, boolean>;

const initialState: FormState = {
  intermacs: "",
  numInotropes: "",
  hr: "",
  rap: "",
  pcwp: "",
  pasp: "",
  padp: "",
  mpap: "",
  ci: "",

  rvDiameter: "",
  lvDiameter: "",
  tapse: "",
  sPrime: "",
  fac: "",
  rvFws: "",

  hemoglobin: "",
  ast: "",
  bilirubin: "",
  creatinine: "",
  sodium: "",
  albumin: "",
  platelets: "",

  postHr: "",
  postRap: "",
  postPcwp: "",
  postPasp: "",
  postPadp: "",
  postMpap: "",
  postCi: "",

  destinationTherapy: false,
  nonIschemic: false,
  vasopressor: false,
  intubated: false,
  iabp: false,
  impellaOrVaEcmo: false,

  // HeartMate 3 es una bomba centrífuga.
  centrifugalLvad: true,

  acei: false,
  severeRvDysfunction: false,
  severeTr: false,
  dialysis: false,
  comparePost: false,
};

const toNumber = (value: string): number | null => {
  if (value.trim() === "") return null;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const ratio = (
  a: number | null,
  b: number | null,
): number | null => {
  if (a === null || b === null || b <= 0) return null;

  return a / b;
};

const fmt = (
  value: number | null,
  digits = 2,
): string =>
  value === null || !Number.isFinite(value)
    ? "—"
    : value.toFixed(digits);

const pct = (
  value: number | null,
): string =>
  value === null || !Number.isFinite(value)
    ? "—"
    : `${(value * 100).toFixed(1)}%`;

function calculateMeldXi(
  bilirubin: number | null,
  creatinine: number | null,
  dialysis: boolean,
): number | null {
  if (
    bilirubin === null ||
    creatinine === null
  ) {
    return null;
  }

  /*
   * MELD-XI =
   * 5.11 × ln(bilirrubina)
   * + 11.76 × ln(creatinina)
   * + 9.44
   *
   * Valores <1 se fijan en 1.
   * Creatinina máxima = 4 mg/dL.
   */
  const bili = Math.max(1, bilirubin);

  const cr = dialysis
    ? 4
    : Math.min(
        4,
        Math.max(1, creatinine),
      );

  return (
    5.11 * Math.log(bili) +
    11.76 * Math.log(cr) +
    9.44
  );
}

function calculatePapi(
  pasp: number | null,
  padp: number | null,
  rap: number | null,
): number | null {
  if (
    pasp === null ||
    padp === null ||
    rap === null ||
    rap <= 0
  ) {
    return null;
  }

  return (pasp - padp) / rap;
}

function calculateRvswi(
  mpap: number | null,
  rap: number | null,
  ci: number | null,
  hr: number | null,
): number | null {
  if (
    mpap === null ||
    rap === null ||
    ci === null ||
    hr === null ||
    hr <= 0
  ) {
    return null;
  }

  /*
   * SVI = CI × 1000 / FC
   *
   * RVSWI =
   * (mPAP − RAP) × SVI
   *
   * Unidad:
   * mmHg · mL / m²
   */
  const svi = (ci * 1000) / hr;

  return (mpap - rap) * svi;
}

function stopRvfCategory(
  probability: number | null,
): string {
  if (probability === null) {
    return "Datos incompletos";
  }

  if (probability < 0.2) {
    return "Bajo (<20%)";
  }

  if (
    probability >= 0.25 &&
    probability < 0.5
  ) {
    return "Moderado (25–49%)";
  }

  if (probability >= 0.5) {
    return "Alto (≥50%)";
  }

  /*
   * El artículo original define:
   * bajo <20%
   * moderado 25–49%
   * alto ≥50%.
   *
   * Evitamos inventar una categoría
   * para 20–24,9%.
   */
  return "20–24,9%: entre los cortes publicados";
}

function toneClass(
  tone:
    | "neutral"
    | "good"
    | "warn"
    | "bad",
) {
  if (tone === "good") {
    return (
      "border-emerald-200 " +
      "bg-emerald-50 " +
      "text-emerald-900"
    );
  }

  if (tone === "warn") {
    return (
      "border-amber-200 " +
      "bg-amber-50 " +
      "text-amber-900"
    );
  }

  if (tone === "bad") {
    return (
      "border-red-200 " +
      "bg-red-50 " +
      "text-red-900"
    );
  }

  return (
    "border-slate-200 " +
    "bg-slate-50 " +
    "text-slate-900"
  );
}

function NumberField({
  label,
  value,
  onChange,
  unit,
  step = "any",
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  unit?: string;
  step?: string | number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span
        className="
          mb-1 block
          text-sm font-medium
          text-slate-700
        "
      >
        {label}
      </span>

      <div
        className="
          flex overflow-hidden
          rounded-lg
          border border-slate-300
          bg-white
          focus-within:border-sky-500
          focus-within:ring-2
          focus-within:ring-sky-100
        "
      >
        <input
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="
            min-w-0 flex-1
            bg-transparent
            px-3 py-2
            text-base text-slate-900
            outline-none
          "
        />

        {unit && (
          <span
            className="
              flex items-center
              whitespace-nowrap
              pr-3
              text-xs text-slate-500
            "
          >
            {unit}
          </span>
        )}
      </div>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  note,
}: {
  label: string;
  checked: boolean;
  onChange: (
    checked: boolean,
  ) => void;
  note?: string;
}) {
  return (
    <label
      className="
        flex cursor-pointer
        items-start gap-3
        rounded-lg
        border border-slate-200
        bg-white
        px-3 py-2
      "
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(
            e.target.checked,
          )
        }
        className="
          mt-1 h-4 w-4
          accent-sky-700
        "
      />

      <span className="min-w-0">
        <span
          className="
            block text-sm
            font-medium
            text-slate-800
          "
        >
          {label}
        </span>

        {note && (
          <span
            className="
              block text-xs
              text-slate-500
            "
          >
            {note}
          </span>
        )}
      </span>
    </label>
  );
}

function Metric({
  label,
  value,
  suffix,
  tone = "neutral",
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?:
    | "neutral"
    | "good"
    | "warn"
    | "bad";
}) {
  return (
    <div
      className={
        `rounded-xl border p-3 ` +
        toneClass(tone)
      }
    >
      <div
        className="
          text-xs font-semibold
          uppercase tracking-wide
          opacity-70
        "
      >
        {label}
      </div>

      <div
        className="
          mt-1
          text-xl font-bold
        "
      >
        {value}

        {suffix && (
          <span
            className="
              ml-1 text-sm
              font-medium
            "
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ScoreCard({
  title,
  score,
  interpretation,
  evidence,
  tone = "neutral",
}: {
  title: string;
  score: string;
  interpretation: string;
  evidence: string;
  tone?:
    | "neutral"
    | "good"
    | "warn"
    | "bad";
}) {
  return (
    <article
      className={
        `rounded-xl border p-4 ` +
        toneClass(tone)
      }
    >
      <div
        className="
          flex items-start
          justify-between
          gap-3
        "
      >
        <h4 className="font-bold">
          {title}
        </h4>

        <div
          className="
            text-right
            text-xl font-extrabold
          "
        >
          {score}
        </div>
      </div>

      <p
        className="
          mt-2 text-sm
          font-medium
        "
      >
        {interpretation}
      </p>

      <p
        className="
          mt-2 text-xs
          opacity-75
        "
      >
        {evidence}
      </p>
    </article>
  );
}

export default function LVADRiskForm() {
  const [
    form,
    setForm,
  ] = useState<FormState>(
    initialState,
  );

  const setNumber = (
    key: NumKey,
    value: string,
  ) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const setBool = (
    key: BoolKey,
    value: boolean,
  ) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const result = useMemo(() => {
    const intermacs =
      toNumber(
        form.intermacs,
      );

    const numInotropes =
      toNumber(
        form.numInotropes,
      );

    const hr =
      toNumber(form.hr);

    const rap =
      toNumber(form.rap);

    const pcwp =
      toNumber(form.pcwp);

    const pasp =
      toNumber(form.pasp);

    const padp =
      toNumber(form.padp);

    const mpap =
      toNumber(form.mpap);

    const ci =
      toNumber(form.ci);

    const rvDiameter =
      toNumber(
        form.rvDiameter,
      );

    const lvDiameter =
      toNumber(
        form.lvDiameter,
      );

    const hemoglobin =
      toNumber(
        form.hemoglobin,
      );

    const ast =
      toNumber(form.ast);

    const bilirubin =
      toNumber(
        form.bilirubin,
      );

    const creatinine =
      toNumber(
        form.creatinine,
      );

    const sodium =
      toNumber(
        form.sodium,
      );

    const albumin =
      toNumber(
        form.albumin,
      );

    const platelets =
      toNumber(
        form.platelets,
      );

    /*
     * Parámetros derivados
     */

    const rapPcwp =
      ratio(
        rap,
        pcwp,
      );

    const papi =
      calculatePapi(
        pasp,
        padp,
        rap,
      );

    const rvswi =
      calculateRvswi(
        mpap,
        rap,
        ci,
        hr,
      );

    const rvLv =
      ratio(
        rvDiameter,
        lvDiameter,
      );

    const meldXi =
      calculateMeldXi(
        bilirubin,
        creatinine,
        form.dialysis,
      );

    /*
     * EUROMACS-RHF
     *
     * INTERMACS 1–3: +2
     * ≥3 inotrópicos: +2.5
     * Disfunción VD grave: +2
     * RAP/PCWP >0.54: +2
     * Hb ≤10: +1
     */

    let euromacs:
      number | null = null;

    if (
      intermacs !== null &&
      numInotropes !== null &&
      rapPcwp !== null &&
      hemoglobin !== null
    ) {
      euromacs = 0;

      if (
        intermacs >= 1 &&
        intermacs <= 3
      ) {
        euromacs += 2;
      }

      if (
        numInotropes >= 3
      ) {
        euromacs += 2.5;
      }

      if (
        form.severeRvDysfunction
      ) {
        euromacs += 2;
      }

      if (
        rapPcwp > 0.54
      ) {
        euromacs += 2;
      }

      if (
        hemoglobin <= 10
      ) {
        euromacs += 1;
      }
    }

    /*
     * ALMA
     *
     * Destination therapy: +1
     * PAPi <2: +1
     * RVSWI <300: +1
     * RV/LV >0.75: +1
     * MELD-XI >17: +1
     */

    let alma:
      number | null = null;

    if (
      papi !== null &&
      rvswi !== null &&
      rvLv !== null &&
      meldXi !== null
    ) {
      alma = 0;

      if (
        form.destinationTherapy
      ) {
        alma += 1;
      }

      if (papi < 2) {
        alma += 1;
      }

      if (rvswi < 300) {
        alma += 1;
      }

      if (rvLv > 0.75) {
        alma += 1;
      }

      if (meldXi > 17) {
        alma += 1;
      }
    }

    /*
     * CRITT
     *
     * CVP >15: +1
     * RVD grave: +1
     * Intubación: +1
     * IT grave: +1
     * FC >100: +1
     */

    let critt:
      number | null = null;

    if (
      rap !== null &&
      hr !== null
    ) {
      critt = 0;

      if (rap > 15) {
        critt += 1;
      }

      if (
        form.severeRvDysfunction
      ) {
        critt += 1;
      }

      if (
        form.intubated
      ) {
        critt += 1;
      }

      if (
        form.severeTr
      ) {
        critt += 1;
      }

      if (hr > 100) {
        critt += 1;
      }
    }

    /*
     * Michigan RVFRS
     *
     * Vasopresor: +4
     * AST ≥80: +2
     * Bilirrubina ≥2: +2.5
     * Creatinina ≥2.3: +3
     */

    let michigan:
      number | null = null;

    if (
      ast !== null &&
      bilirubin !== null &&
      creatinine !== null
    ) {
      michigan = 0;

      if (
        form.vasopressor
      ) {
        michigan += 4;
      }

      if (ast >= 80) {
        michigan += 2;
      }

      if (
        bilirubin >= 2
      ) {
        michigan += 2.5;
      }

      if (
        creatinine >= 2.3
      ) {
        michigan += 3;
      }
    }

    /*
     * STOP-RVF
     *
     * Taleb et al.
     * JAMA Cardiology 2024.
     *
     * Ecuación logística publicada.
     */

    let stopRvfProbability:
      number | null = null;

    if (
      intermacs !== null &&
      rapPcwp !== null &&
      albumin !== null &&
      creatinine !== null &&
      platelets !== null &&
      sodium !== null
    ) {
      const eta =
        3.67 +

        0.31 *
          (
            form.nonIschemic
              ? 1
              : 0
          ) +

        0.52 *
          (
            form.iabp
              ? 1
              : 0
          ) +

        0.67 *
          (
            form.impellaOrVaEcmo
              ? 1
              : 0
          ) +

        0.71 *
          (
            form.centrifugalLvad
              ? 1
              : 0
          ) +

        0.28 *
          (
            intermacs <= 2
              ? 1
              : 0
          ) +

        1.0 *
          rapPcwp -

        0.23 *
          albumin +

        0.28 *
          creatinine -

        0.002 *
          platelets -

        0.04 *
          sodium -

        0.45 *
          (
            form.acei
              ? 1
              : 0
          );

      stopRvfProbability =
        1 /
        (
          1 +
          Math.exp(-eta)
        );
    }

    /*
     * Hemodinámica post-optimización
     */

    const postHr =
      toNumber(
        form.postHr,
      );

    const postRap =
      toNumber(
        form.postRap,
      );

    const postPcwp =
      toNumber(
        form.postPcwp,
      );

    const postPasp =
      toNumber(
        form.postPasp,
      );

    const postPadp =
      toNumber(
        form.postPadp,
      );

    const postMpap =
      toNumber(
        form.postMpap,
      );

    const postCi =
      toNumber(
        form.postCi,
      );

    const post =
      form.comparePost
        ? {
            rapPcwp:
              ratio(
                postRap,
                postPcwp,
              ),

            papi:
              calculatePapi(
                postPasp,
                postPadp,
                postRap,
              ),

            rvswi:
              calculateRvswi(
                postMpap,
                postRap,
                postCi,
                postHr,
              ),
          }
        : null;

    /*
     * Señales fisiológicas desfavorables.
     *
     * NO se suman en un score
     * inventado.
     */

    const adverse:
      string[] = [];

    if (
      papi !== null &&
      papi < 2
    ) {
      adverse.push(
        `PAPi ${fmt(
          papi,
        )} (<2)`,
      );
    }

    if (
      rapPcwp !== null &&
      rapPcwp > 0.54
    ) {
      adverse.push(
        `RAP/PCWP ${fmt(
          rapPcwp,
        )} (>0,54)`,
      );
    }

    if (
      rvswi !== null &&
      rvswi < 300
    ) {
      adverse.push(
        `RVSWI ${fmt(
          rvswi,
          0,
        )} (<300 mmHg·mL/m²)`,
      );
    }

    if (
      rvLv !== null &&
      rvLv > 0.75
    ) {
      adverse.push(
        `RV/LV ${fmt(
          rvLv,
        )} (>0,75)`,
      );
    }

    if (
      meldXi !== null &&
      meldXi >= 14
    ) {
      adverse.push(
        `MELD-XI ${fmt(
          meldXi,
          1,
        )} (≥14)`,
      );
    }

    if (
      form.severeRvDysfunction
    ) {
      adverse.push(
        "Disfunción VD grave",
      );
    }

    if (
      form.severeTr
    ) {
      adverse.push(
        "IT grave",
      );
    }

    return {
      rapPcwp,
      papi,
      rvswi,
      rvLv,
      meldXi,

      euromacs,
      alma,
      critt,
      michigan,

      stopRvfProbability,

      post,
      adverse,
    };
  }, [form]);

  /*
   * Interpretación EUROMACS
   */

  const euromacsInterpretation =
    (() => {
      if (
        result.euromacs === null
      ) {
        return "Datos incompletos";
      }

      if (
        result.euromacs <= 2
      ) {
        return (
          "Bajo " +
          "(0–2 puntos)"
        );
      }

      if (
        result.euromacs <= 4
      ) {
        return (
          "Intermedio " +
          "(>2–4 puntos)"
        );
      }

      return (
        "Alto " +
        "(>4 puntos)"
      );
    })();

  const euromacsTone:
    | "neutral"
    | "good"
    | "warn"
    | "bad" =
    result.euromacs === null
      ? "neutral"
      : result.euromacs <= 2
        ? "good"
        : result.euromacs <= 4
          ? "warn"
          : "bad";

  /*
   * Interpretación ALMA
   */

  const almaInterpretation =
    (() => {
      if (
        result.alma === null
      ) {
        return "Datos incompletos";
      }

      if (
        result.alma <= 1
      ) {
        return (
          "Bajo: ≈9% de " +
          "RVF grave en la " +
          "cohorte original"
        );
      }

      if (
        result.alma <= 3
      ) {
        return (
          "Intermedio/alto: " +
          "≈57% en la " +
          "cohorte original"
        );
      }

      return (
        "Muy alto: 100% " +
        "en la cohorte " +
        "original " +
        "(cohorte pequeña)"
      );
    })();

  const almaTone:
    | "neutral"
    | "good"
    | "warn"
    | "bad" =
    result.alma === null
      ? "neutral"
      : result.alma <= 1
        ? "good"
        : result.alma <= 3
          ? "warn"
          : "bad";

  /*
   * Interpretación CRITT
   */

  const crittInterpretation =
    (() => {
      if (
        result.critt === null
      ) {
        return "Datos incompletos";
      }

      if (
        result.critt < 2
      ) {
        return (
          "Perfil favorable " +
          "en la cohorte original"
        );
      }

      if (
        result.critt >= 4
      ) {
        return (
          "Riesgo muy elevado " +
          "de necesidad de " +
          "soporte derecho"
        );
      }

      return (
        "Riesgo intermedio: " +
        "integrar con " +
        "hemodinámica y eco"
      );
    })();

  const crittTone:
    | "neutral"
    | "good"
    | "warn"
    | "bad" =
    result.critt === null
      ? "neutral"
      : result.critt < 2
        ? "good"
        : result.critt >= 4
          ? "bad"
          : "warn";

  /*
   * Interpretación Michigan
   */

  const michiganInterpretation =
    (() => {
      if (
        result.michigan === null
      ) {
        return "Datos incompletos";
      }

      if (
        result.michigan <= 3
      ) {
        return (
          "Bajo " +
          "(≤3 puntos)"
        );
      }

      if (
        result.michigan <= 5
      ) {
        return (
          "Intermedio " +
          "(4–5 puntos)"
        );
      }

      return (
        "Alto " +
        "(≥5,5 puntos)"
      );
    })();

  const michiganTone:
    | "neutral"
    | "good"
    | "warn"
    | "bad" =
    result.michigan === null
      ? "neutral"
      : result.michigan <= 3
        ? "good"
        : result.michigan <= 5
          ? "warn"
          : "bad";

  /*
   * MELD-XI
   */

  const meldTone:
    | "neutral"
    | "good"
    | "warn"
    | "bad" =
    result.meldXi === null
      ? "neutral"
      : result.meldXi < 14
        ? "good"
        : result.meldXi <= 17
          ? "warn"
          : "bad";

  /*
   * STOP-RVF
   */

  const stopTone:
    | "neutral"
    | "good"
    | "warn"
    | "bad" =
    result.stopRvfProbability ===
    null
      ? "neutral"
      : result.stopRvfProbability <
          0.2
        ? "good"
        : result.stopRvfProbability >=
            0.5
          ? "bad"
          : "warn";

  return (
    <div
      className="
        mx-auto w-full
        max-w-6xl
        space-y-5
        p-3 sm:p-5
      "
    >
      {/* CABECERA */}

      <section
        className="
          rounded-2xl
          border border-slate-200
          bg-white
          p-4 shadow-sm
          sm:p-5
        "
      >
        <div
          className="
            flex flex-wrap
            items-start
            justify-between
            gap-3
          "
        >
          <div>
            <h2
              className="
                text-xl font-bold
                text-slate-900
              "
            >
              LVAD · Riesgo de fallo
              ventricular derecho
            </h2>

            <p
              className="
                mt-1 max-w-3xl
                text-sm
                text-slate-600
              "
            >
              EUROMACS-RHF, ALMA,
              CRITT, Michigan RVFRS,
              MELD-XI, STOP-RVF y
              parámetros hemodinámicos.
              Los modelos no se fusionan
              en una probabilidad global
              no validada.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setForm(
                initialState,
              )
            }
            className="
              rounded-lg
              border border-slate-300
              bg-white
              px-3 py-2
              text-sm font-semibold
              text-slate-700
              hover:bg-slate-50
            "
          >
            Limpiar
          </button>
        </div>
      </section>

      {/* FORMULARIO */}

      <div
        className="
          grid gap-4
          lg:grid-cols-2
        "
      >
        {/* 1. CLÍNICA */}

        <fieldset
          className="
            rounded-2xl
            border border-slate-200
            bg-white
            p-4 shadow-sm
          "
        >
          <legend
            className="
              px-2 font-bold
              text-slate-900
            "
          >
            1. Situación clínica
          </legend>

          <div
            className="
              grid gap-3
              sm:grid-cols-2
            "
          >
            <label className="block">
              <span
                className="
                  mb-1 block
                  text-sm font-medium
                  text-slate-700
                "
              >
                INTERMACS
              </span>

              <select
                value={
                  form.intermacs
                }
                onChange={(e) =>
                  setNumber(
                    "intermacs",
                    e.target.value,
                  )
                }
                className="
                  w-full rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-3 py-2
                  text-base
                  text-slate-900
                  outline-none
                  focus:border-sky-500
                  focus:ring-2
                  focus:ring-sky-100
                "
              >
                <option value="">
                  Seleccionar
                </option>

                {[
                  1,
                  2,
                  3,
                  4,
                  5,
                  6,
                  7,
                ].map(
                  (x) => (
                    <option
                      key={x}
                      value={x}
                    >
                      {x}
                    </option>
                  ),
                )}
              </select>
            </label>

            <NumberField
              label={
                "N.º de " +
                "inotrópicos IV"
              }
              value={
                form.numInotropes
              }
              onChange={(v) =>
                setNumber(
                  "numInotropes",
                  v,
                )
              }
              min={0}
              max={10}
              step={1}
            />
          </div>

          <div
            className="
              mt-3 grid gap-2
              sm:grid-cols-2
            "
          >
            <Toggle
              label={
                "Destination therapy"
              }
              checked={
                form.destinationTherapy
              }
              onChange={(v) =>
                setBool(
                  "destinationTherapy",
                  v,
                )
              }
            />

            <Toggle
              label={
                "Miocardiopatía " +
                "no isquémica"
              }
              checked={
                form.nonIschemic
              }
              onChange={(v) =>
                setBool(
                  "nonIschemic",
                  v,
                )
              }
            />

            <Toggle
              label="Vasopresor"
              checked={
                form.vasopressor
              }
              onChange={(v) =>
                setBool(
                  "vasopressor",
                  v,
                )
              }
            />

            <Toggle
              label={
                "Intubación " +
                "preoperatoria"
              }
              checked={
                form.intubated
              }
              onChange={(v) =>
                setBool(
                  "intubated",
                  v,
                )
              }
            />

            <Toggle
              label="IABP"
              checked={
                form.iabp
              }
              onChange={(v) =>
                setBool(
                  "iabp",
                  v,
                )
              }
            />

            <Toggle
              label={
                "Impella o VA-ECMO"
              }
              checked={
                form.impellaOrVaEcmo
              }
              onChange={(v) =>
                setBool(
                  "impellaOrVaEcmo",
                  v,
                )
              }
            />

            <Toggle
              label="LVAD centrífugo"
              note={
                "HeartMate 3 = sí"
              }
              checked={
                form.centrifugalLvad
              }
              onChange={(v) =>
                setBool(
                  "centrifugalLvad",
                  v,
                )
              }
            />

            <Toggle
              label="IECA"
              note={
                "Variable exacta " +
                "del STOP-RVF original"
              }
              checked={
                form.acei
              }
              onChange={(v) =>
                setBool(
                  "acei",
                  v,
                )
              }
            />
          </div>
        </fieldset>

        {/* 2. HEMODINÁMICA */}

        <fieldset
          className="
            rounded-2xl
            border border-slate-200
            bg-white
            p-4 shadow-sm
          "
        >
          <legend
            className="
              px-2 font-bold
              text-slate-900
            "
          >
            2. Hemodinámica
          </legend>

          <div
            className="
              grid gap-3
              sm:grid-cols-2
            "
          >
            <NumberField
              label="FC"
              value={form.hr}
              onChange={(v) =>
                setNumber(
                  "hr",
                  v,
                )
              }
              unit="lpm"
              min={20}
              max={220}
            />

            <NumberField
              label="RAP / CVP"
              value={form.rap}
              onChange={(v) =>
                setNumber(
                  "rap",
                  v,
                )
              }
              unit="mmHg"
              min={0}
              max={50}
            />

            <NumberField
              label="PCWP"
              value={form.pcwp}
              onChange={(v) =>
                setNumber(
                  "pcwp",
                  v,
                )
              }
              unit="mmHg"
              min={0}
              max={60}
            />

            <NumberField
              label="PASP"
              value={form.pasp}
              onChange={(v) =>
                setNumber(
                  "pasp",
                  v,
                )
              }
              unit="mmHg"
              min={0}
              max={120}
            />

            <NumberField
              label="PADP"
              value={form.padp}
              onChange={(v) =>
                setNumber(
                  "padp",
                  v,
                )
              }
              unit="mmHg"
              min={0}
              max={80}
            />

            <NumberField
              label="mPAP"
              value={form.mpap}
              onChange={(v) =>
                setNumber(
                  "mpap",
                  v,
                )
              }
              unit="mmHg"
              min={0}
              max={90}
            />

            <NumberField
              label={
                "Índice cardiaco"
              }
              value={form.ci}
              onChange={(v) =>
                setNumber(
                  "ci",
                  v,
                )
              }
              unit="L/min/m²"
              min={0.5}
              max={8}
              step={0.1}
            />
          </div>

          <div
            className="
              mt-4 grid gap-2
              sm:grid-cols-3
            "
          >
            <Metric
              label="PAPi"
              value={
                fmt(
                  result.papi,
                )
              }
              tone={
                result.papi !==
                  null &&
                result.papi < 2
                  ? "bad"
                  : "neutral"
              }
            />

            <Metric
              label="RAP/PCWP"
              value={
                fmt(
                  result.rapPcwp,
                )
              }
              tone={
                result.rapPcwp !==
                  null &&
                result.rapPcwp >
                  0.54
                  ? "bad"
                  : "neutral"
              }
            />

            <Metric
              label="RVSWI"
              value={
                fmt(
                  result.rvswi,
                  0,
                )
              }
              suffix={
                "mmHg·mL/m²"
              }
              tone={
                result.rvswi !==
                  null &&
                result.rvswi <
                  300
                  ? "bad"
                  : "neutral"
              }
            />
          </div>
        </fieldset>

        {/* 3. ECO */}

        <fieldset
          className="
            rounded-2xl
            border border-slate-200
            bg-white
            p-4 shadow-sm
          "
        >
          <legend
            className="
              px-2 font-bold
              text-slate-900
            "
          >
            3. Ecocardiografía
          </legend>

          <div
            className="
              grid gap-2
              sm:grid-cols-2
            "
          >
            <Toggle
              label={
                "Disfunción VD grave"
              }
              checked={
                form.severeRvDysfunction
              }
              onChange={(v) =>
                setBool(
                  "severeRvDysfunction",
                  v,
                )
              }
            />

            <Toggle
              label={
                "Insuficiencia " +
                "tricuspídea grave"
              }
              checked={
                form.severeTr
              }
              onChange={(v) =>
                setBool(
                  "severeTr",
                  v,
                )
              }
            />
          </div>

          <div
            className="
              mt-3 grid gap-3
              sm:grid-cols-2
            "
          >
            <NumberField
              label={
                "Diámetro " +
                "telediastólico VD"
              }
              value={
                form.rvDiameter
              }
              onChange={(v) =>
                setNumber(
                  "rvDiameter",
                  v,
                )
              }
              unit="mm"
              min={10}
              max={100}
            />

            <NumberField
              label={
                "Diámetro " +
                "telediastólico VI"
              }
              value={
                form.lvDiameter
              }
              onChange={(v) =>
                setNumber(
                  "lvDiameter",
                  v,
                )
              }
              unit="mm"
              min={10}
              max={120}
            />

            <NumberField
              label="TAPSE"
              value={
                form.tapse
              }
              onChange={(v) =>
                setNumber(
                  "tapse",
                  v,
                )
              }
              unit="mm"
              min={0}
              max={40}
            />

            <NumberField
              label="S′ tricuspídea"
              value={
                form.sPrime
              }
              onChange={(v) =>
                setNumber(
                  "sPrime",
                  v,
                )
              }
              unit="cm/s"
              min={0}
              max={30}
            />

            <NumberField
              label="FAC VD"
              value={
                form.fac
              }
              onChange={(v) =>
                setNumber(
                  "fac",
                  v,
                )
              }
              unit="%"
              min={0}
              max={100}
            />

            <NumberField
              label={
                "RV free-wall strain"
              }
              value={
                form.rvFws
              }
              onChange={(v) =>
                setNumber(
                  "rvFws",
                  v,
                )
              }
              unit="%"
              min={-50}
              max={10}
              step={0.1}
            />
          </div>

          <div
            className="
              mt-4 max-w-xs
            "
          >
            <Metric
              label="RV/LV"
              value={
                fmt(
                  result.rvLv,
                )
              }
              tone={
                result.rvLv !==
                  null &&
                result.rvLv >
                  0.75
                  ? "bad"
                  : "neutral"
              }
            />
          </div>
        </fieldset>

        {/* 4. ANALÍTICA */}

        <fieldset
          className="
            rounded-2xl
            border border-slate-200
            bg-white
            p-4 shadow-sm
          "
        >
          <legend
            className="
              px-2 font-bold
              text-slate-900
            "
          >
            4. Analítica
          </legend>

          <div
            className="
              grid gap-3
              sm:grid-cols-2
            "
          >
            <NumberField
              label="Hemoglobina"
              value={
                form.hemoglobin
              }
              onChange={(v) =>
                setNumber(
                  "hemoglobin",
                  v,
                )
              }
              unit="g/dL"
              min={3}
              max={25}
              step={0.1}
            />

            <NumberField
              label="AST"
              value={
                form.ast
              }
              onChange={(v) =>
                setNumber(
                  "ast",
                  v,
                )
              }
              unit="U/L"
              min={0}
              max={10000}
            />

            <NumberField
              label={
                "Bilirrubina total"
              }
              value={
                form.bilirubin
              }
              onChange={(v) =>
                setNumber(
                  "bilirubin",
                  v,
                )
              }
              unit="mg/dL"
              min={0}
              max={50}
              step={0.1}
            />

            <NumberField
              label="Creatinina"
              value={
                form.creatinine
              }
              onChange={(v) =>
                setNumber(
                  "creatinine",
                  v,
                )
              }
              unit="mg/dL"
              min={0}
              max={15}
              step={0.01}
            />

            <NumberField
              label="Sodio"
              value={
                form.sodium
              }
              onChange={(v) =>
                setNumber(
                  "sodium",
                  v,
                )
              }
              unit="mmol/L"
              min={100}
              max={180}
            />

            <NumberField
              label="Albúmina"
              value={
                form.albumin
              }
              onChange={(v) =>
                setNumber(
                  "albumin",
                  v,
                )
              }
              unit="g/dL"
              min={0.5}
              max={6}
              step={0.1}
            />

            <NumberField
              label="Plaquetas"
              value={
                form.platelets
              }
              onChange={(v) =>
                setNumber(
                  "platelets",
                  v,
                )
              }
              unit="×10³/µL"
              min={1}
              max={1000}
            />
          </div>

          <div className="mt-3">
            <Toggle
              label="Diálisis"
              checked={
                form.dialysis
              }
              onChange={(v) =>
                setBool(
                  "dialysis",
                  v,
                )
              }
            />
          </div>

          <div
            className="
              mt-4 max-w-xs
            "
          >
            <Metric
              label="MELD-XI"
              value={
                fmt(
                  result.meldXi,
                  1,
                )
              }
              tone={meldTone}
            />
          </div>
        </fieldset>
      </div>

      {/* SCORES */}

      <section
        className="
          rounded-2xl
          border border-slate-200
          bg-white
          p-4 shadow-sm
          sm:p-5
        "
      >
        <h3
          className="
            text-lg font-bold
            text-slate-900
          "
        >
          Scores de riesgo
        </h3>

        <div
          className="
            mt-3 grid gap-3
            md:grid-cols-2
            xl:grid-cols-3
          "
        >
          <ScoreCard
            title="EUROMACS-RHF"
            score={
              result.euromacs ===
              null
                ? "—"
                : fmt(
                    result.euromacs,
                    1,
                  )
            }
            interpretation={
              euromacsInterpretation
            }
            evidence={
              "AUC ≈0,70 en " +
              "desarrollo; " +
              "rendimiento " +
              "dependiente de " +
              "cohorte/dispositivo."
            }
            tone={
              euromacsTone
            }
          />

          <ScoreCard
            title="ALMA"
            score={
              result.alma ===
              null
                ? "—"
                : `${result.alma}/5`
            }
            interpretation={
              almaInterpretation
            }
            evidence={
              "AUC ≈0,77 en la " +
              "cohorte de " +
              "desarrollo; endpoint " +
              "centrado en RVAD/" +
              "RVF grave."
            }
            tone={almaTone}
          />

          <ScoreCard
            title="CRITT"
            score={
              result.critt ===
              null
                ? "—"
                : `${result.critt}/5`
            }
            interpretation={
              crittInterpretation
            }
            evidence={
              "c-statistic ≈0,80 " +
              "en la cohorte " +
              "original; " +
              "validaciones externas " +
              "más modestas."
            }
            tone={crittTone}
          />

          <ScoreCard
            title="Michigan RVFRS"
            score={
              result.michigan ===
              null
                ? "—"
                : fmt(
                    result.michigan,
                    1,
                  )
            }
            interpretation={
              michiganInterpretation
            }
            evidence={
              "AUC 0,73 " +
              "(IC 95% 0,65–0,81) " +
              "en la cohorte original."
            }
            tone={
              michiganTone
            }
          />

          <ScoreCard
            title="MELD-XI"
            score={
              fmt(
                result.meldXi,
                1,
              )
            }
            interpretation={
              result.meldXi ===
              null
                ? "Datos incompletos"
                : result.meldXi >
                    17
                  ? (
                    ">17: umbral " +
                    "usado por ALMA"
                  )
                  : result.meldXi >=
                      14
                    ? (
                      "≥14: señal de " +
                      "mayor riesgo en " +
                      "cohorte " +
                      "contemporánea HM3"
                    )
                    : "<14"
            }
            evidence={
              "En 246 HeartMate 3: " +
              "AUC 0,69 para RVF " +
              "grave; ≥14 se asoció " +
              "con peor mortalidad " +
              "intrahospitalaria."
            }
            tone={meldTone}
          />

          <ScoreCard
            title="STOP-RVF"
            score={
              pct(
                result
                  .stopRvfProbability,
              )
            }
            interpretation={
              stopRvfCategory(
                result
                  .stopRvfProbability,
              )
            }
            evidence={
              "C-statistic 0,75 " +
              "derivación y 0,73 " +
              "validación externa. " +
              "Probabilidad obtenida " +
              "de la ecuación " +
              "logística publicada."
            }
            tone={stopTone}
          />
        </div>
      </section>

      {/* SÍNTESIS */}

      <section
        className="
          rounded-2xl
          border border-slate-200
          bg-white
          p-4 shadow-sm
          sm:p-5
        "
      >
        <h3
          className="
            text-lg font-bold
            text-slate-900
          "
        >
          Síntesis fisiológica
        </h3>

        {result.adverse.length >
        0 ? (
          <div
            className="
              mt-3 flex
              flex-wrap gap-2
            "
          >
            {result.adverse.map(
              (item) => (
                <span
                  key={item}
                  className="
                    rounded-full
                    border
                    border-red-200
                    bg-red-50
                    px-3 py-1
                    text-sm
                    font-medium
                    text-red-800
                  "
                >
                  {item}
                </span>
              ),
            )}
          </div>
        ) : (
          <p
            className="
              mt-2 text-sm
              text-slate-600
            "
          >
            No hay suficientes
            datos o no se alcanzan
            los umbrales principales
            de alerta.
          </p>
        )}

        <p
          className="
            mt-3 rounded-xl
            bg-slate-50
            p-3
            text-sm
            text-slate-600
          "
        >
          Esta síntesis no
          constituye un score
          combinado validado.
          La decisión debe integrar
          ecocardiografía completa,
          hemodinámica, daño de
          órgano, trayectoria clínica
          y respuesta a optimización
          pre-LVAD.
        </p>
      </section>

      {/* PRE / POST OPTIMIZACIÓN */}

      <section
        className="
          rounded-2xl
          border border-slate-200
          bg-white
          p-4 shadow-sm
          sm:p-5
        "
      >
        <div
          className="
            flex flex-wrap
            items-start
            justify-between
            gap-3
          "
        >
          <div>
            <h3
              className="
                text-lg font-bold
                text-slate-900
              "
            >
              Respuesta a
              optimización
            </h3>

            <p
              className="
                mt-1 text-sm
                text-slate-600
              "
            >
              Comparación opcional
              antes/después de
              diuresis, inotrópicos,
              vasodilatación o
              soporte temporal.
            </p>
          </div>

          <Toggle
            label={
              "Activar comparación"
            }
            checked={
              form.comparePost
            }
            onChange={(v) =>
              setBool(
                "comparePost",
                v,
              )
            }
          />
        </div>

        {form.comparePost && (
          <>
            <div
              className="
                mt-4 grid gap-3
                sm:grid-cols-2
                lg:grid-cols-4
              "
            >
              <NumberField
                label="FC post"
                value={
                  form.postHr
                }
                onChange={(v) =>
                  setNumber(
                    "postHr",
                    v,
                  )
                }
                unit="lpm"
              />

              <NumberField
                label="RAP post"
                value={
                  form.postRap
                }
                onChange={(v) =>
                  setNumber(
                    "postRap",
                    v,
                  )
                }
                unit="mmHg"
              />

              <NumberField
                label="PCWP post"
                value={
                  form.postPcwp
                }
                onChange={(v) =>
                  setNumber(
                    "postPcwp",
                    v,
                  )
                }
                unit="mmHg"
              />

              <NumberField
                label="PASP post"
                value={
                  form.postPasp
                }
                onChange={(v) =>
                  setNumber(
                    "postPasp",
                    v,
                  )
                }
                unit="mmHg"
              />

              <NumberField
                label="PADP post"
                value={
                  form.postPadp
                }
                onChange={(v) =>
                  setNumber(
                    "postPadp",
                    v,
                  )
                }
                unit="mmHg"
              />

              <NumberField
                label="mPAP post"
                value={
                  form.postMpap
                }
                onChange={(v) =>
                  setNumber(
                    "postMpap",
                    v,
                  )
                }
                unit="mmHg"
              />

              <NumberField
                label="IC post"
                value={
                  form.postCi
                }
                onChange={(v) =>
                  setNumber(
                    "postCi",
                    v,
                  )
                }
                unit="L/min/m²"
              />
            </div>

            <div
              className="
                mt-4 grid gap-3
                sm:grid-cols-3
              "
            >
              <Metric
                label={
                  "PAPi pre → post"
                }
                value={
                  `${fmt(
                    result.papi,
                  )} → ` +
                  `${fmt(
                    result.post
                      ?.papi ??
                      null,
                  )}`
                }
              />

              <Metric
                label={
                  "RAP/PCWP pre → post"
                }
                value={
                  `${fmt(
                    result.rapPcwp,
                  )} → ` +
                  `${fmt(
                    result.post
                      ?.rapPcwp ??
                      null,
                  )}`
                }
              />

              <Metric
                label={
                  "RVSWI pre → post"
                }
                value={
                  `${fmt(
                    result.rvswi,
                    0,
                  )} → ` +
                  `${fmt(
                    result.post
                      ?.rvswi ??
                      null,
                    0,
                  )}`
                }
              />
            </div>
          </>
        )}
      </section>

      {/* EVIDENCIA */}

      <details
        className="
          rounded-2xl
          border border-slate-200
          bg-white
          p-4 shadow-sm
          sm:p-5
        "
      >
        <summary
          className="
            cursor-pointer
            font-bold
            text-slate-900
          "
        >
          Puntos de corte, AUC
          y limitaciones
        </summary>

        <div
          className="
            mt-4 overflow-x-auto
          "
        >
          <table
            className="
              min-w-[850px]
              w-full
              border-collapse
              text-left
              text-sm
            "
          >
            <thead>
              <tr
                className="
                  border-b
                  border-slate-200
                  bg-slate-50
                "
              >
                <th className="p-3">
                  Modelo
                </th>

                <th className="p-3">
                  Puntos de corte
                </th>

                <th className="p-3">
                  AUC / C-statistic
                </th>

                <th className="p-3">
                  Comentario
                </th>
              </tr>
            </thead>

            <tbody
              className="
                text-slate-700
              "
            >
              <tr
                className="
                  border-b
                  border-slate-100
                "
              >
                <td
                  className="
                    p-3 font-semibold
                  "
                >
                  EUROMACS-RHF
                </td>

                <td className="p-3">
                  0–2 bajo;
                  &gt;2–4
                  intermedio;
                  &gt;4 alto
                </td>

                <td className="p-3">
                  ≈0,70 desarrollo
                </td>

                <td className="p-3">
                  Rendimiento
                  externo y por
                  generación de
                  LVAD variable.
                </td>
              </tr>

              <tr
                className="
                  border-b
                  border-slate-100
                "
              >
                <td
                  className="
                    p-3 font-semibold
                  "
                >
                  ALMA
                </td>

                <td className="p-3">
                  0–1 bajo;
                  2–3
                  intermedio/alto;
                  4–5 muy alto
                </td>

                <td className="p-3">
                  ≈0,77 desarrollo
                </td>

                <td className="p-3">
                  Endpoint grave,
                  principalmente
                  RVAD no planificado.
                </td>
              </tr>

              <tr
                className="
                  border-b
                  border-slate-100
                "
              >
                <td
                  className="
                    p-3 font-semibold
                  "
                >
                  CRITT
                </td>

                <td className="p-3">
                  &lt;2 favorable;
                  ≥4 riesgo muy
                  elevado en la
                  cohorte original
                </td>

                <td className="p-3">
                  ≈0,80 original
                </td>

                <td className="p-3">
                  Muy práctico;
                  discriminación
                  menor en algunas
                  validaciones
                  externas.
                </td>
              </tr>

              <tr
                className="
                  border-b
                  border-slate-100
                "
              >
                <td
                  className="
                    p-3 font-semibold
                  "
                >
                  Michigan RVFRS
                </td>

                <td className="p-3">
                  ≤3 bajo;
                  4–5 intermedio;
                  ≥5,5 alto
                </td>

                <td className="p-3">
                  0,73
                  (0,65–0,81)
                </td>

                <td className="p-3">
                  Modelo antiguo;
                  expresa
                  inestabilidad y
                  disfunción
                  orgánica.
                </td>
              </tr>

              <tr
                className="
                  border-b
                  border-slate-100
                "
              >
                <td
                  className="
                    p-3 font-semibold
                  "
                >
                  MELD-XI
                </td>

                <td className="p-3">
                  ≥14 en cohorte
                  HM3;
                  &gt;17 en ALMA
                </td>

                <td className="p-3">
                  0,69 en cohorte
                  HM3
                </td>

                <td className="p-3">
                  No es un score
                  específico del VD;
                  refleja
                  repercusión
                  hepatorrenal.
                </td>
              </tr>

              <tr>
                <td
                  className="
                    p-3 font-semibold
                  "
                >
                  STOP-RVF
                </td>

                <td className="p-3">
                  &lt;20% bajo;
                  25–49% moderado;
                  ≥50% alto
                </td>

                <td className="p-3">
                  0,75 derivación;
                  0,73 validación
                </td>

                <td className="p-3">
                  Modelo
                  multicéntrico
                  contemporáneo con
                  probabilidad
                  individual.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          className="
            mt-4 space-y-1
            text-xs
            text-slate-500
          "
        >
          <p>
            Referencias:
            Matthews et al.,
            JACC 2008;
            Atluri et al.,
            Ann Thorac Surg 2013;
            Loforte et al.,
            ASAIO J 2018;
            Soliman et al.,
            Circulation 2018;
            Taleb et al.,
            JAMA Cardiol 2024;
            Lambert et al.,
            JAHA 2025.
          </p>

          <p>
            Los endpoints y las
            definiciones de fallo
            derecho no son idénticos
            entre modelos; comparar
            AUC entre estudios
            requiere cautela.
          </p>
        </div>
      </details>
    </div>
  );
}
