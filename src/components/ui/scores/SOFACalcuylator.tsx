import { useMemo, useState } from "react";

type Unit = "mg/dL" | "µmol/L";
type BilUnit = "mg/dL" | "µmol/L";
type YesNo = "yes" | "no";
type Pressor = "none" | "dobutamine" | "dopamine" | "epi" | "norepi";

function umolToMgdlCreat(v: number) { return v / 88.4; }
function umolToMgdlBili(v: number)  { return v / 17.1; }

function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }

export default function SOFACalculator() {
  // Respiración
  const [pao2, setPao2] = useState<number | "">("");
  const [fio2, setFio2] = useState<number | "">("");
  const [respSupport, setRespSupport] = useState<YesNo>("no");

  // Coagulación
  const [platelets, setPlatelets] = useState<number | "">(""); // x10^3/µL

  // Hígado
  const [bili, setBili] = useState<number | "">("");
  const [biliUnit, setBiliUnit] = useState<BilUnit>("mg/dL");

  // Cardiovascular
  const [map, setMAP] = useState<number | "">(""); // mmHg
  const [pressor, setPressor] = useState<Pressor>("none");
  const [dose, setDose] = useState<number | "">(""); // mcg/kg/min (dopamina/epi/norepi)

  // SNC
  const [gcs, setGCS] = useState<number | "">("");

  // Riñón
  const [creat, setCreat] = useState<number | "">("");
  const [creatUnit, setCreatUnit] = useState<Unit>("mg/dL");
  const [urine, setUrine] = useState<number | "">(""); // mL/día (24h)

  // ---- PUNTUACIONES ----
  function scoreResp(): number {
    if (pao2 === "" || fio2 === "") return 0;
    const ratio = Number(pao2) / (Number(fio2) / 100);
    // SOFA respiratorio (PaO2/FiO2)
    // ≥400 => 0; <400 =>1; <300 =>2; <200 + soporte =>3; <100 + soporte =>4
    if (ratio >= 400) return 0;
    if (ratio < 100 && respSupport === "yes") return 4;
    if (ratio < 200 && respSupport === "yes") return 3;
    if (ratio < 300) return 2;
    return 1;
  }

  function scoreCoag(): number {
    if (platelets === "") return 0;
    const pl = Number(platelets);
    if (pl < 20) return 4;
    if (pl < 50) return 3;
    if (pl < 100) return 2;
    if (pl < 150) return 1;
    return 0;
  }

  function scoreLiver(): number {
    if (bili === "") return 0;
    const mgdl = biliUnit === "mg/dL" ? Number(bili) : umolToMgdlBili(Number(bili));
    if (mgdl >= 12.0) return 4;
    if (mgdl >= 6.0)  return 3;
    if (mgdl >= 2.0)  return 2;
    if (mgdl >= 1.2)  return 1;
    return 0;
  }

  function scoreCV(): number {
    // Cardiovascular según SOFA:
    // 0: MAP ≥70 sin vasopresores
    // 1: MAP <70
    // 2: Dopamina ≤5 o dobutamina (cualquier dosis)
    // 3: Dopamina >5 y ≤15 o epinefrina ≤0.1 o norepinefrina ≤0.1 (mcg/kg/min)
    // 4: Dopamina >15 o epinefrina >0.1 o norepinefrina >0.1
    const m = map === "" ? undefined : Number(map);
    if (pressor === "none") {
      if (m !== undefined) return m < 70 ? 1 : 0;
      return 0;
    }
    if (pressor === "dobutamine") return 2;
    const d = dose === "" ? 0 : Number(dose);
    if (pressor === "dopamine") {
      if (d <= 5) return 2;
      if (d > 5 && d <= 15) return 3;
      if (d > 15) return 4;
      return 2;
    }
    if (pressor === "epi" || pressor === "norepi") {
      if (d <= 0.1) return 3;
      return 4;
    }
    return 0;
  }

  function scoreCNS(): number {
    if (gcs === "") return 0;
    const v = clamp(Number(gcs), 3, 15);
    if (v < 6)  return 4;    // <6
    if (v < 9)  return 3;    // 6–8
    if (v < 12) return 2;    // 9–11
    if (v < 15) return 1;    // 13–14
    return 0;                // 15
  }

  function scoreRenal(): number {
    const cr = creat === "" ? undefined :
      (creatUnit === "mg/dL" ? Number(creat) : umolToMgdlCreat(Number(creat)));
    const uo = urine === "" ? undefined : Number(urine);

    // SOFA renal usa creatinina o diuresis (escoge el peor)
    const byCreat =
      cr === undefined ? 0 :
      cr >= 5.0 ? 4 :
      cr >= 3.5 ? 3 :
      cr >= 2.0 ? 2 :
      cr >= 1.2 ? 1 : 0;

    const byUrine =
      uo === undefined ? 0 :
      uo < 200 ? 4 :
      uo < 500 ? 3 : 0;

    return Math.max(byCreat, byUrine);
  }

  const sub = useMemo(() => {
    const sResp = scoreResp();
    const sCoag = scoreCoag();
    const sLiver = scoreLiver();
    const sCV = scoreCV();
    const sCNS = scoreCNS();
    const sRenal = scoreRenal();
    const total = sResp + sCoag + sLiver + sCV + sCNS + sRenal;
    return { sResp, sCoag, sLiver, sCV, sCNS, sRenal, total };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pao2, fio2, respSupport, platelets, bili, biliUnit, map, pressor, dose, gcs, creat, creatUnit, urine]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RESPIRACIÓN */}
        <section className="border rounded-xl p-3 bg-white">
          <h4 className="font-semibold mb-2">Respiración (PaO₂/FiO₂)</h4>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">PaO₂ (mmHg)
              <input className="border rounded-md w-full h-9 px-2"
                type="number" value={pao2} onChange={e=>setPao2(e.target.value===""?"":Number(e.target.value))}/>
            </label>
            <label className="text-sm">FiO₂ (%)
              <input className="border rounded-md w-full h-9 px-2"
                type="number" value={fio2} onChange={e=>setFio2(e.target.value===""?"":Number(e.target.value))}/>
            </label>
            <label className="text-sm col-span-2">Soporte respiratorio (VM/CPAP/HFO)
              <select className="border rounded-md w-full h-9 px-2"
                value={respSupport} onChange={e=>setRespSupport(e.target.value as YesNo)}>
                <option value="no">No</option>
                <option value="yes">Sí</option>
              </select>
            </label>
          </div>
          <div className="text-sm text-slate-600 mt-2">
            Subscore: <b>{sub.sResp}</b>
          </div>
        </section>

        {/* COAGULACIÓN */}
        <section className="border rounded-xl p-3 bg-white">
          <h4 className="font-semibold mb-2">Coagulación (Plaquetas)</h4>
          <label className="text-sm">Plaquetas (×10³/µL)
            <input className="border rounded-md w-full h-9 px-2"
              type="number" value={platelets} onChange={e=>setPlatelets(e.target.value===""?"":Number(e.target.value))}/>
          </label>
          <div className="text-sm text-slate-600 mt-2">Subscore: <b>{sub.sCoag}</b></div>
        </section>

        {/* HÍGADO */}
        <section className="border rounded-xl p-3 bg-white">
          <h4 className="font-semibold mb-2">Hígado (Bilirrubina)</h4>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">Bilirrubina
              <input className="border rounded-md w-full h-9 px-2"
                type="number" step="0.1" value={bili} onChange={e=>setBili(e.target.value===""?"":Number(e.target.value))}/>
            </label>
            <label className="text-sm">Unidad
              <select className="border rounded-md w-full h-9 px-2"
                value={biliUnit} onChange={e=>setBiliUnit(e.target.value as BilUnit)}>
                <option>mg/dL</option>
                <option>µmol/L</option>
              </select>
            </label>
          </div>
          <div className="text-sm text-slate-600 mt-2">Subscore: <b>{sub.sLiver}</b></div>
        </section>

        {/* CARDIOVASCULAR */}
        <section className="border rounded-xl p-3 bg-white">
          <h4 className="font-semibold mb-2">Cardiovascular</h4>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">TAM (mmHg)
              <input className="border rounded-md w-full h-9 px-2"
                type="number" value={map} onChange={e=>setMAP(e.target.value===""?"":Number(e.target.value))}/>
            </label>
            <label className="text-sm">Vasopresor
              <select className="border rounded-md w-full h-9 px-2"
                value={pressor} onChange={e=>setPressor(e.target.value as Pressor)}>
                <option value="none">Ninguno</option>
                <option value="dobutamine">Dobutamina (cualquier dosis)</option>
                <option value="dopamine">Dopamina</option>
                <option value="epi">Epinefrina</option>
                <option value="norepi">Noradrenalina</option>
              </select>
            </label>
            {(pressor==="dopamine" || pressor==="epi" || pressor==="norepi") && (
              <label className="text-sm col-span-2">Dosis (mcg/kg/min)
                <input className="border rounded-md w-full h-9 px-2"
                  type="number" step="0.01" value={dose} onChange={e=>setDose(e.target.value===""?"":Number(e.target.value))}/>
              </label>
            )}
          </div>
          <div className="text-sm text-slate-600 mt-2">Subscore: <b>{sub.sCV}</b></div>
        </section>

        {/* SNC */}
        <section className="border rounded-xl p-3 bg-white">
          <h4 className="font-semibold mb-2">Sistema nervioso central (GCS)</h4>
          <label className="text-sm">Glasgow (3–15)
            <input className="border rounded-md w-full h-9 px-2"
              type="number" value={gcs} onChange={e=>setGCS(e.target.value===""?"":Number(e.target.value))}/>
          </label>
          <div className="text-sm text-slate-600 mt-2">Subscore: <b>{sub.sCNS}</b></div>
        </section>

        {/* RIÑÓN */}
        <section className="border rounded-xl p-3 bg-white">
          <h4 className="font-semibold mb-2">Riñón</h4>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">Creatinina
              <input className="border rounded-md w-full h-9 px-2"
                type="number" step="0.01" value={creat} onChange={e=>setCreat(e.target.value===""?"":Number(e.target.value))}/>
            </label>
            <label className="text-sm">Unidad
              <select className="border rounded-md w-full h-9 px-2"
                value={creatUnit} onChange={e=>setCreatUnit(e.target.value as Unit)}>
                <option>mg/dL</option>
                <option>µmol/L</option>
              </select>
            </label>
            <label className="text-sm col-span-2">Diuresis (mL/24h)
              <input className="border rounded-md w-full h-9 px-2"
                type="number" value={urine} onChange={e=>setUrine(e.target.value===""?"":Number(e.target.value))}/>
            </label>
          </div>
          <div className="text-sm text-slate-600 mt-2">Subscore: <b>{sub.sRenal}</b></div>
        </section>
      </div>

      <div className="mt-4 p-4 border rounded-xl bg-slate-50">
        <div className="text-lg font-bold">SOFA total: {sub.total}</div>
        <div className="text-xs text-slate-600 mt-1">
          CV: MAP & vasopresores; Resp: PaO₂/FiO₂ con soporte; Coag: plaquetas; Hígado: bilirrubina; SNC: GCS; Riñón: creatinina o diuresis (peor valor).
        </div>
      </div>
    </div>
  );
}

