import { useState } from "react";

type Item = {
  value: 1|2|3|4|5|6|7|8|9;
  title: string;
  emoji: string;
  desc: string;
};

const CFS_ITEMS: Item[] = [
  { value:1, title:"Muy en forma",        emoji:"🏃‍♂️", desc:"Activos, enérgicos, muy en forma para su edad." },
  { value:2, title:"En forma",            emoji:"🚶‍♀️", desc:"Sin enfermedad activa, ejercicio regular." },
  { value:3, title:"Bien",                emoji:"🙂",   desc:"Enfermedades controladas, no limitan la actividad." },
  { value:4, title:"Vulnerable",          emoji:"🪑",   desc:"No dependientes, pero síntomas limitan actividades." },
  { value:5, title:"Fragilidad leve",     emoji:"🧓",   desc:"Necesita ayuda con tareas complejas (compras, meds)." },
  { value:6, title:"Fragilidad moderada", emoji:"🦯",   desc:"Ayuda con tareas domésticas y baños; dificultad sube/baja." },
  { value:7, title:"Fragilidad grave",    emoji:"🛏️",   desc:"Dependiente para ADL; estable (no terminal)." },
  { value:8, title:"Muy frágil",          emoji:"🤒",   desc:"Completa dependencia, gran vulnerabilidad." },
  { value:9, title:"Terminal",            emoji:"⏳",   desc:"Esperanza de vida <6 meses; fragilidad variable." },
];

function advise(score: number) {
  if (score <= 3) return { tag: "No frágil", color: "bg-green-100 text-green-700", note: "Candidato a intervenciones agresivas si hay indicación." };
  if (score <= 5) return { tag: "Fragilidad leve", color: "bg-amber-100 text-amber-700", note: "Valorar riesgos/proveedores, escalado selectivo." };
  if (score <= 6) return { tag: "Fragilidad moderada", color: "bg-orange-100 text-orange-700", note: "Priorizar soporte, objetivos de cuidado, decisiones compartidas." };
  if (score <= 8) return { tag: "Fragilidad grave", color: "bg-red-100 text-red-700", note: "Enfoque conservador/limitación de invasividad; plan paliativo." };
  return { tag: "Terminal", color: "bg-slate-200 text-slate-700", note: "Enfoque paliativo; adecuación de esfuerzo terapéutico." };
}

export default function ClinicalFrailtyForm() {
  const [selected, setSelected] = useState<1|2|3|4|5|6|7|8|9|null>(null);
  const a = selected ? advise(selected) : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Selecciona la descripción que mejor encaja con el estado basal del paciente (2 semanas previas).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CFS_ITEMS.map(it => {
          const active = selected === it.value;
          return (
            <button
              key={it.value}
              type="button"
              onClick={() => setSelected(it.value)}
              className={
                "text-left border rounded-xl p-3 hover:shadow transition " +
                (active ? "border-blue-600 ring-2 ring-blue-200" : "border-slate-200 bg-white")
              }
            >
              <div className="flex items-center gap-2">
                <div className="text-2xl">{it.emoji}</div>
                <div>
                  <div className="font-semibold">CFS {it.value} — {it.title}</div>
                  <div className="text-xs text-slate-600">{it.desc}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 border rounded-xl bg-slate-50">
        <div className="text-sm">Resultado:</div>
        {selected ? (
          <div className="mt-1 flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded ${a!.color}`}>
              CFS {selected} — {a!.tag}
            </span>
            <span className="text-sm text-slate-700">{a!.note}</span>
          </div>
        ) : (
          <div className="text-slate-500 text-sm">Selecciona una categoría.</div>
        )}
      </div>
    </div>
  );
}

