import { useMemo, useState } from "react";

type Killip = "I" | "II" | "III" | "IV";
type YesNo = "yes" | "no";
type CreatUnit = "mg/dL" | "µmol/L";

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function umolToMgdl(v: number) {
  // 1 mg/dL ≈ 88.4 µmol/L
  return v / 88.4;
}

// ---- GRACE in-hospital points ----
function ptsAge(age: number) {
  if (age < 30) return 0;
  if (age < 40) return 8;
  if (age < 50) return 25;
  if (age < 60) return 41;
  if (age < 70) return 58;
  if (age < 80) return 75;
  if (age < 90) return 91;
  return 100;
}

function ptsHR(hr: number) {
  if (hr < 50) return 0;
  if (hr < 70) return 3;
  if (hr < 90) return 9;
  if (hr < 110) return 15;
  if (hr < 150) return 24;
  if (hr < 200) return 38;
  return 46;
}

function ptsSBP(sbp: number) {
  if (sbp < 80) return 58;
  if (sbp < 100) return 53;
  if (sbp < 120) return 43;
  if (sbp < 140) return 34;
  if (sbp < 160) return 24;
  if (sbp < 200) return 10;
  return 0;
}

// Creatinina en mg/dL
function ptsCreatinine(cr: number) {
  if (cr < 0.4) return 1;
  if (cr < 0.8) return 4;
  if (cr < 1.2) return 7;
  if (cr < 1.6) return 10;
  if (cr < 2.0) return 13;
  if (cr < 4.0) return 21;
  return 28;
}

function ptsKillip(k: Killip) {
  switch (k) {
    case "I": return 0;
    case "II": return 20;
    case "III": return 39;
    case "IV": return 59;
  }
}

function ptsYesNo(yn: YesNo, yesPoints: number) {
  return yn === "yes" ? yesPoints : 0;
}

// Nomograma de mortalidad intrahospitalaria (%)
const nomogram: Array<{ score: number; mort: number }> = [
  { score: 60, mort: 0.2 },
  { score: 70, mort: 0.3 },
  { score: 80, mort: 0.4 },
  { score: 90, mort: 0.6 },
  { score: 100, mort: 0.8 },
  { score: 110, mort: 1.1 },
  { score: 120, mort: 1.6 },
  { score: 130, mort: 2.1 },
  { score: 140, mort: 2.9 },
  { score: 150, mort: 3.9 },
  { score: 160, mort: 5.4 },
  { score: 170, mort: 7.3 },
  { score: 180, mort: 9.8 },
  { score: 190, mort: 13 },
  { score: 200, mort: 18 },
  { score: 210, mort: 23 },
  { score: 220, mort: 29 },
  { score: 230, mort: 36 },
  { score: 240, mort: 44 },
  { score: 250, mort: 52 },
];

function interpolateMortality(score: number) {
  if (score <= nomogram[0].score) return nomogram[0].mort;
  if (score >= nomogram[nomogram.length - 1].score)
    return nomogram[nomogram.length - 1].mort;

  for (let i = 0; i < nomogram.length - 1; i++) {
    const a = nomogram[i];
    const b = nomogram[i + 1];
    if (score >= a.score && score <= b.score) {
      const t = (score - a.score) / (b.score - a.score);
      return a.mort + t * (b.mort - a.mort);
    }
  }
  return NaN;
}

function labelRisk(score: number) {
  if (score <= 108) return { label: "Bajo", color: "#059669" };
  if (score <= 140) return { label: "Intermedio", color: "#d97706" };
  return { label: "Alto", color: "#dc2626" };
}

export default function GraceCalculator() {
  const [age, setAge] = useState<number | "">("");
  const [hr, setHr] = useState<number | "">("");
  const [sbp, setSbp] = useState<number | "">("");
  const [creat, setCreat] = useState<number | "">("");
  const [creatUnit, setCreatUnit] = useState<CreatUnit>("mg/dL");
  const [killip, setKillip] = useState<Killip>("I");
  const [arrest, setArrest] = useState<YesNo>("no");
  const [stDev, setStDev] = useState<YesNo>("no");
  const [enz, setEnz] = useState<YesNo>("yes");

  const allValid =
    age !== "" && hr !== "" && sbp !== "" && creat !== "" && age >= 0 && hr >= 0 && sbp >= 0 && creat >= 0;

  const result = useMemo(() => {
    if (!allValid) return null;

    const crMgdl = creatUnit === "mg/dL" ? (creat as number) : umolToMgdl(creat as number);

    const score =
      ptsAge(age as number) +
      ptsHR(hr as number) +
      ptsSBP(sbp as number) +
      ptsCreatinine(crMgdl) +
      ptsKillip(killip) +
      ptsYesNo(arrest, 39) +
      ptsYesNo(stDev, 28) +
      ptsYesNo(enz, 14);

    const scoreClamped = clamp(score, 0, 363);
    const mort = interpolateMortality(scoreClamped);
    const { label, color } = labelRisk(scoreClamped);

    return {
      score: Math.round(scoreClamped),
      mortality: mort,
      riskLabel: label,
      riskColor: color,
      crShown: crMgdl,
    };
  }, [age, hr, sbp, creat, creatUnit, killip, arrest, stDev, enz, allValid]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 16, maxWidth: 880, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>GRACE Score (In-hospital)</h1>
      <p style={{ marginTop: 0, color: "#4b5563" }}>
        Calcula el <strong>puntaje numérico</strong> GRACE a la admisión y estima la <strong>mortalidad intrahospitalaria</strong>.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 16 }}>
        <label>
          <div>Edad (años)</div>
          <input type="number" min={0} value={age} onChange={e => setAge(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} />
        </label>

        <label>
          <div>Frecuencia cardiaca (lpm)</div>
          <input type="number" min={0} value={hr} onChange={e => setHr(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} />
        </label>

        <label>
          <div>PAS (mmHg)</div>
          <input type="number" min={0} value={sbp} onChange={e => setSbp(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 8 }}>
          <label>
            <div>Creatinina</div>
            <input type="number" min={0} step="0.01" value={creat} onChange={e => setCreat(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} />
          </label>
          <label>
            <div>Unidad</div>
            <select value={creatUnit} onChange={e => setCreatUnit(e.target.value as CreatUnit)} style={inputStyle}>
              <option>mg/dL</option>
              <option>µmol/L</option>
            </select>
          </label>
        </div>

        <label>
          <div>Killip</div>
          <select value={killip} onChange={e => setKillip(e.target.value as Killip)} style={inputStyle}>
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>
        </label>

        <label>
          <div>Parada a la admisión</div>
          <select value={arrest} onChange={e => setArrest(e.target.value as YesNo)} style={inputStyle}>
            <option value="no">No</option>
            <option value="yes">Sí</option>
          </select>
        </label>

        <label>
          <div>Desviación del ST</div>
          <select value={stDev} onChange={e => setStDev(e.target.value as YesNo)} style={inputStyle}>
            <option value="no">No</option>
            <option value="yes">Sí</option>
          </select>
        </label>

        <label>
          <div>Enzimas elevadas</div>
          <select value={enz} onChange={e => setEnz(e.target.value as YesNo)} style={inputStyle}>
            <option value="yes">Sí</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>

      {!allValid && (
        <p style={{ marginTop: 12, color: "#6b7280" }}>
          Introduce todos los campos para calcular el puntaje.
        </p>
      )}

      {result && (
        <div style={{ marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafafa" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>GRACE (in-hospital)</div>
              <div style={{ fontSize: 36, fontWeight: 800 }}>{result.score}</div>
            </div>
            <div style={{ height: 44, width: 2, background: "#e5e7eb" }} />
            <div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>Riesgo</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: result.riskColor }}>{result.riskLabel}</div>
            </div>
            <div style={{ height: 44, width: 2, background: "#e5e7eb" }} />
            <div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>Mortalidad intrahosp. estimada</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {result.mortality.toFixed(1)}%
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
            * Creatinina usada en el cálculo: {result.crShown.toFixed(2)} mg/dL
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  fontSize: 16,
  outline: "none",
};

