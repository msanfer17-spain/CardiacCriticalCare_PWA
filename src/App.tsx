import React, { useMemo, useState } from 'react'
import { Calculator, FileText, Stethoscope, HeartPulse, Search, Settings, BookOpen } from 'lucide-react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'

const CALCULATORS = [
  { id:'pac-hemo', title:'PAC (Swan‑Ganz): cálculos hemodinámicos', summary:'IMC/SC, CO/CI, SV/SVI, SVR/PVR (dyn/WU), CPO, PAPi, AD/PCP.', tags:['Hemodinámica','Swan‑Ganz','UCI'], href:'#/tool/pac-hemo' },
  { id:'drug-doser', title:'Bombas y dosis – UCI cardiológica', summary:'mL/h por peso y dilución; diluciones locales.', tags:['Fármacos','Bombas','UCI'], href:'#/tool/drug-doser' },
]
const FORMS = [{ id:'pericarditis-risk', title:'Pericarditis – estratificación de riesgo', summary:'Criterios y plan sugerido.', tags:['Pericardio'], href:'#/tool/pericarditis-risk' }]
const BASE = (import.meta as any).env.BASE_URL;

const DOCS = [
  {
    id: "protocol-shock",
    title: "Protocolo Shock Cardiogénico 2025",
    summary: "Documento interno actualizado",
    tags: ["Shock","UCI"],
    href: BASE + "docs/Protocolo_shock_cardiogenico.pdf",
  },
  {
    id: "protocol-parada",
    title: "Protocolo Parada",
    summary: "Algoritmo de parada cardiorrespiratoria",
    tags: ["Parada","UCI"],
    href: BASE + "docs/Protocolo_parada.pdf",
  },
  {
    id: "protocol-SCA",
    title: "Protocolo SCA",
    summary: "Manejo, SCA",
    tags: ["SCA","Unidad Críticos CV"],
    href: BASE + "docs/Protocolo_SCA.pdf",
  },
  {
    id: "protocol-Reclutamiento_Alveolar",
    title: "Protocolo reclutamiento alvelorar",
    summary: "Distrés, Reclutamiento, Alveolar",
    tags: ["Ventilación","Unidad Críticos CV"],
    href: BASE + "docs/Protocolo_Reclutamiento_Escalera.pdf",
  },
];


const TEACHING: any[] = [];


function SectionHeader({ icon: Icon, title, hint }: any){
  return (<div className='flex items-center justify-between mb-4'><div className='flex items-center gap-2'><Icon className='h-5 w-5'/><h3 className='text-lg font-semibold'>{title}</h3></div>{hint?<span className='text-sm text-slate-500'>{hint}</span>:null}</div>)
}
function ToolCard({ item }: any){
  return (<Card className='hover:shadow-md transition-shadow cursor-pointer'><CardHeader><CardTitle className='text-base'>{item.title}</CardTitle></CardHeader><CardContent className='space-y-3'><p className='text-sm text-slate-600'>{item.summary}</p><div className='flex flex-wrap gap-2'>{item.tags.map((t:string)=><Badge key={t}>{t}</Badge>)}</div><div className='pt-1'><Button asChild size='sm'><a href={item.href} target="_blank" rel="noopener noreferrer">Abrir</a></Button></div></CardContent></Card>)
}

export default function App(){
  const [q,setQ]=useState(''); const [tab,setTab]=useState('calculadoras')
  const [view,setView]=useState(()=> (typeof window!=='undefined' && window.location.hash? window.location.hash.slice(1):'home'))
  React.useEffect(()=>{ const onH=()=>setView(window.location.hash.slice(1)||'home'); window.addEventListener('hashchange',onH); return ()=>window.removeEventListener('hashchange',onH)},[])
  const all=useMemo(()=>({calculadoras:CALCULATORS, formularios:FORMS, documentos:DOCS, docencia:TEACHING}),[])
  const filtered=useMemo(()=>{ const needle=q.trim().toLowerCase(); if(!needle) return all; const f=(arr:any[])=>arr.filter(x=>(x.title+' '+x.summary+' '+x.tags.join(' ')).toLowerCase().includes(needle)); return {calculadoras:f(all.calculadoras), formularios:f(all.formularios), documentos:f(all.documentos), docencia:f(all.docencia)} },[q,all])
  if(view.startsWith('/tool/pericarditis-risk')) return <PericarditisRiskTool goHome={()=>{window.location.hash=''}}/>
  if(view.startsWith('/tool/pac-hemo')) return <PACalcTool goHome={()=>{window.location.hash=''}}/>
  if(view.startsWith('/tool/drug-doser')) return <DrugDoserTool goHome={()=>{window.location.hash=''}}/>
  return (<div className='min-h-screen w-full bg-gradient-to-b from-white to-slate-50'><header className='sticky top-0 z-30 backdrop-blur bg-white/70 border-b'><div className='max-w-6xl mx-auto flex items-center gap-3 p-3'><HeartPulse className='h-6 w-6'/><div className='flex-1'><h1 className='text-xl font-semibold'>CardiacCriticalCare</h1><p className='text-xs text-slate-500'>Portafolio UCI cardiológica • v0.3</p></div><div className='flex items-center gap-2 w-full max-w-md'><div className='relative w-full'><Search className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400'/><Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder='Buscar herramienta...' className='pl-8'/></div><Button variant='outline' size='icon' title='Ajustes'><Settings className='h-4 w-4'/></Button></div></div></header><main className='max-w-6xl mx-auto p-4 sm:p-6 space-y-8'>
    {/* --- Pestañas sin componente Tabs (fiable) --- */}
<div>
  {/* Barra de pestañas */}
  <div className="grid grid-cols-4 w-full rounded-2xl bg-slate-100 p-1">
    <button
      onClick={() => setTab('calculadoras')}
      className={
        'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm ' +
        (tab === 'calculadoras' ? 'bg-white shadow' : 'text-slate-600 hover:text-slate-900')
      }
    >
      <Calculator className="h-4 w-4" /> Calculadoras
    </button>
    <button
      onClick={() => setTab('formularios')}
      className={
        'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm ' +
        (tab === 'formularios' ? 'bg-white shadow' : 'text-slate-600 hover:text-slate-900')
      }
    >
      <Stethoscope className="h-4 w-4" /> Formularios
    </button>
    <button
      onClick={() => setTab('documentos')}
      className={
        'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm ' +
        (tab === 'documentos' ? 'bg-white shadow' : 'text-slate-600 hover:text-slate-900')
      }
    >
      <FileText className="h-4 w-4" /> Documentos
    </button>
    <button
      onClick={() => setTab('docencia')}
      className={
        'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm ' +
        (tab === 'docencia' ? 'bg-white shadow' : 'text-slate-600 hover:text-slate-900')
      }
    >
      <BookOpen className="h-4 w-4" /> Docencia
    </button>
  </div>

  {/* Contenidos */}
  {tab === 'calculadoras' && (
    <div className="mt-6">
      <SectionHeader icon={Calculator} title="Calculadoras" hint={`${filtered.calculadoras.length} elementos`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.calculadoras.map((item:any) => <ToolCard key={item.id} item={item} />)}
      </div>
    </div>
  )}

  {tab === 'formularios' && (
    <div className="mt-6">
      <SectionHeader icon={Stethoscope} title="Formularios" hint={`${filtered.formularios.length} elementos`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.formularios.map((item:any) => <ToolCard key={item.id} item={item} />)}
      </div>
    </div>
  )}

  {tab === 'documentos' && (
    <div className="mt-6">
      <SectionHeader icon={FileText} title="Documentos" hint={`${filtered.documentos.length} elementos`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.documentos.map((item:any) => <ToolCard key={item.id} item={item} />)}
      </div>
    </div>
  )}

  {tab === 'docencia' && (
    <div className="mt-6">
      <SectionHeader icon={BookOpen} title="Docencia" hint={`${filtered.docencia.length} elementos`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.docencia.map((item:any) => <ToolCard key={item.id} item={item} />)}
      </div>
    </div>
  )}
</div>
</main></div>)
}


function FieldRow({label, children}:{label:string; children:any}){return <div className='grid grid-cols-2 gap-2 items-center'><label className='text-sm'>{label}</label><div className='justify-self-end'>{children}</div></div>}
function Toggle({checked, onChange}:{checked:boolean; onChange:(v:boolean)=>void}){return <button type='button' onClick={()=>onChange(!checked)} className={`h-6 w-10 rounded-full border flex items-center ${checked? 'bg-green-500/80 justify-end':'bg-slate-200 justify-start'}`}><span className='h-5 w-5 bg-white rounded-full m-0.5 shadow'/></button>}

function PericarditisRiskTool({goHome}:{goHome:()=>void}){const [age,setAge]=useState(45),[fever,setFever]=useState(false),[tamponade,setTamponade]=useState(false);const [subacute,setSubacute]=useState(false),[largeEffusion,setLargeEffusion]=useState(false);const [troponin,setTroponin]=useState(false),[immunosupp,setImmunosupp]=useState(false),[anticoag,setAnticoag]=useState(false);const major=[tamponade,largeEffusion,subacute].filter(Boolean).length;const minor=[fever,age>65,troponin,immunosupp,anticoag].filter(Boolean).length;const high= major>0 || minor>=2;return (<div className='min-h-screen w-full bg-white'><header className='border-b sticky top-0 bg-white/70 backdrop-blur z-30'><div className='max-w-3xl mx-auto flex items-center justify-between p-3'><div className='flex items-center gap-2'><HeartPulse className='h-5 w-5'/><h2 className='font-semibold'>Pericarditis – Estratificación de riesgo</h2></div><Button variant='outline' size='sm' onClick={goHome}>← Volver</Button></div></header><main className='max-w-3xl mx-auto p-4 space-y-6'><Card><CardHeader><CardTitle className='text-base'>Datos del paciente</CardTitle></CardHeader><CardContent className='grid grid-cols-1 gap-4'><FieldRow label='Edad'><Input type='number' value={age} onChange={e=>setAge(parseInt(e.target.value||'0'))}/></FieldRow><FieldRow label='Fiebre >38ºC'><Toggle checked={fever} onChange={setFever}/></FieldRow><FieldRow label='Taponamiento / inestabilidad'><Toggle checked={tamponade} onChange={setTamponade}/></FieldRow><FieldRow label='Subaguda (>1 semana)'><Toggle checked={subacute} onChange={setSubacute}/></FieldRow><FieldRow label='Derrame grande (ECO)'><Toggle checked={largeEffusion} onChange={setLargeEffusion}/></FieldRow><FieldRow label='Troponina elevada'><Toggle checked={troponin} onChange={setTroponin}/></FieldRow><FieldRow label='Inmunosupresión'><Toggle checked={immunosupp} onChange={setImmunosupp}/></FieldRow><FieldRow label='Anticoagulación en curso'><Toggle checked={anticoag} onChange={setAnticoag}/></FieldRow></CardContent></Card><Card><CardHeader><CardTitle className='text-base'>Resultado</CardTitle></CardHeader><CardContent className='space-y-2'><div className='flex items-center gap-2'><Badge variant={high?'destructive':'secondary'}>{high?'ALTO RIESGO':'BAJO‑INTERMEDIO'}</Badge><span className='text-sm text-slate-500'>Mayores: {major} • Menores: {minor}</span></div><p className='text-sm'>{high? 'Ingresar, ECO seriada, AINEs ± colchicina; considerar corticoide sólo refractario/etiología específica.' : 'Alta con AINE + colchicina; reposo deportivo; control 1‑2 semanas.'}</p></CardContent></Card></main></div>) }

function PACalcTool({goHome}:{goHome:()=>void}){const [nhc,setNhc]=useState(''),[initials,setInitials]=useState(''),[weight,setWeight]=useState<any>(70),[height,setHeight]=useState<any>(170),[sbp,setSbp]=useState<any>(100),[dbp,setDbp]=useState<any>(60),[hr,setHr]=useState<any>(80),[rap,setRap]=useState<any>(8),[spap,setSpap]=useState<any>(35),[dpap,setDpap]=useState<any>(18),[mpap,setMpap]=useState<any>(24),[pcwp,setPcwp]=useState<any>(12),[sao2,setSao2]=useState<any>(98),[svo2,setSvo2]=useState<any>(65),[hb,setHb]=useState<any>(13),[co,setCo]=useState<any>(4.5);const n=(x:any)=> (typeof x==='number'&&!isNaN(x)?x:undefined);const W=n(weight)||0,H=n(height)||0,SBP=n(sbp),DBP=n(dbp),HR=n(hr),RAP=n(rap)||0,sPAP=n(spap),dPAP=n(dpap),mPAP=n(mpap),PCWP=n(pcwp);const SaO2=n(sao2),SvO2=n(svo2),HbV=n(hb),CO=n(co);const bmi=W&&H? W/Math.pow(H/100,2):undefined;const bsa=W&&H? 0.007184*Math.pow(W,0.425)*Math.pow(H,0.725):undefined;const MAP=SBP!==undefined&&DBP!==undefined?(SBP+2*DBP)/3:undefined;const TPG=(mPAP!==undefined&&PCWP!==undefined)?(mPAP-PCWP):undefined;const DPG=(dPAP!==undefined&&PCWP!==undefined)?(dPAP-PCWP):undefined;const CI=CO!==undefined&&bsa?CO/bsa:undefined;const SV=CO!==undefined&&HR?(1000*CO)/HR:undefined;const SVI=SV!==undefined&&bsa?SV/bsa:undefined;const SVR=(MAP!==undefined&&CO!==undefined)?80*((MAP-RAP)/CO):undefined;const SVR_WU=(MAP!==undefined&&CO!==undefined)?((MAP-RAP)/CO):undefined;const PVR=(mPAP!==undefined&&PCWP!==undefined&&CO!==undefined)?80*((mPAP-PCWP)/CO):undefined;const PVR_WU=(mPAP!==undefined&&PCWP!==undefined&&CO!==undefined)?((mPAP-PCWP)/CO):undefined;const PAPi=(sPAP!==undefined&&dPAP!==undefined)?(sPAP-dPAP)/(RAP||1):undefined;const AD_over_PCWP=(RAP&&PCWP!==undefined)?RAP/(PCWP||1):undefined;const CPO=(MAP!==undefined&&CO!==undefined)?(MAP*CO/451):undefined;let CO_fick: number|undefined=undefined;if(bsa&&HbV&&SaO2!==undefined&&SvO2!==undefined){const VO2=125*bsa;const CaO2=1.34*HbV*(SaO2/100);const CvO2=1.34*HbV*(SvO2/100);const d=CaO2-CvO2;if(d>0.1) CO_fick=VO2/d/1000;}const normals=[{k:'PAPi',v:'1,3–1,8'},{k:'AD (RAP)',v:'2–8 mmHg'},{k:'mPAP',v:'10–20 mmHg'},{k:'PCP/PAWP',v:'6–12 mmHg'},{k:'TPG',v:'5–8 mmHg'},{k:'SvO₂',v:'60–80 %'},{k:'IC',v:'2,5–4 L/min/m²'},{k:'CPO',v:'0,5–1 W'},{k:'PVR',v:'20–130 dyn·s·cm⁻⁵ (0,25–1,63 WU)'},{k:'SVR',v:'800–1400 dyn·s·cm⁻⁵ (10–17,5 WU)'},{k:'AD/PCP',v:'<0,6'}];const saveCase=()=>{if(!nhc) return alert('Introduce NHC');const p={nhc,initials,weight,height,sbp,dbp,hr,rap,spap,dpap,mpap,pcwp,sao2,svo2,hb,co};localStorage.setItem(`pac:${nhc}`,JSON.stringify(p));alert('Guardado')};const loadCase=()=>{if(!nhc) return alert('Introduce NHC');const raw=localStorage.getItem(`pac:${nhc}`);if(!raw) return alert('No hay datos');try{const p=JSON.parse(raw);setInitials(p.initials||'');setWeight(p.weight||0);setHeight(p.height||0);setSbp(p.sbp||0);setDbp(p.dbp||0);setHr(p.hr||0);setRap(p.rap||0);setSpap(p.spap||0);setDpap(p.dpap||0);setMpap(p.mpap||0);setPcwp(p.pcwp||0);setSao2(p.sao2||0);setSvo2(p.svo2||0);setHb(p.hb||0);setCo(p.co||0);}catch{alert('Error al cargar')}};const exportPDF=()=>window.print();return (<div className='min-h-screen w-full bg-white print:bg-white'><header className='border-b sticky top-0 bg-white/70 backdrop-blur z-30 print:hidden'><div className='max-w-5xl mx-auto flex items-center justify-between p-3'><div className='flex items-center gap-2'><HeartPulse className='h-5 w-5'/><h2 className='font-semibold'>PAC (Swan‑Ganz) – Cálculos hemodinámicos</h2></div><div className='flex gap-2'><Button variant='secondary' size='sm' onClick={saveCase}>Guardar</Button><Button variant='secondary' size='sm' onClick={loadCase}>Cargar</Button><Button variant='default' size='sm' onClick={exportPDF}>Exportar PDF</Button><Button variant='outline' size='sm' onClick={goHome}>← Volver</Button></div></div></header><main className='max-w-5xl mx-auto p-4 space-y-6'><Card><CardHeader><CardTitle className='text-base'>Identificación y antropometría</CardTitle></CardHeader><CardContent className='grid sm:grid-cols-2 gap-3'><FieldRow label='NHC'><Input value={nhc} onChange={e=>setNhc(e.target.value)} placeholder='Historia'/></FieldRow><FieldRow label='Iniciales'><Input value={initials} onChange={e=>setInitials(e.target.value)} placeholder='AA'/></FieldRow><FieldRow label='Peso (kg)'><Input type='number' value={weight} onChange={e=>setWeight(parseFloat(e.target.value||'0'))}/></FieldRow><FieldRow label='Talla (cm)'><Input type='number' value={height} onChange={e=>setHeight(parseFloat(e.target.value||'0'))}/></FieldRow></CardContent></Card><Card><CardHeader><CardTitle className='text-base'>Presiones y CO</CardTitle></CardHeader><CardContent className='grid sm:grid-cols-3 gap-3'><FieldRow label='FC (lpm)'><Input type='number' value={hr} onChange={e=>setHr(parseFloat(e.target.value||'0'))}/></FieldRow><FieldRow label='TAS (mmHg)'><Input type='number' value={sbp} onChange={e=>setSbp(parseFloat(e.target.value||'0'))}/></FieldRow><FieldRow label='TAD (mmHg)'><Input type='number' value={dbp} onChange={e=>setDbp(parseFloat(e.target.value||'0'))}/></FieldRow><FieldRow label='AD/RAP (mmHg)'><Input type='number' value={rap} onChange={e=>setRap(parseFloat(e.target.value||'0'))}/></FieldRow><FieldRow label='sPAP (mmHg)'><Input type='number' value={spap} onChange={e=>setSpap(parseFloat(e.target.value||'0'))}/></FieldRow><FieldRow label='dPAP (mmHg)'><Input type='number' value={dpap} onChange={e=>setDpap(parseFloat(e.target.value||'0'))}/></FieldRow><FieldRow label='mPAP (mmHg)'><Input type='number' value={mpap} onChange={e=>setMpap(parseFloat(e.target.value||'0'))}/></FieldRow><FieldRow label='PCP/PAWP (mmHg)'><Input type='number' value={pcwp} onChange={e=>setPcwp(parseFloat(e.target.value||'0'))}/></FieldRow><FieldRow label='CO (L/min)'><Input type='number' value={co} onChange={e=>setCo(parseFloat(e.target.value||'0'))}/></FieldRow></CardContent></Card><Card><CardHeader><CardTitle className='text-base'>Resultados</CardTitle></CardHeader><CardContent className='grid sm:grid-cols-3 gap-3 text-sm text-slate-600'><div>TAM: <b>{MAP?MAP.toFixed(1):'—'} mmHg</b></div><div>TPG: <b>{TPG!==undefined?TPG.toFixed(1):'—'} mmHg</b></div><div>DPG: <b>{DPG!==undefined?DPG.toFixed(1):'—'} mmHg</b></div><div>SV: <b>{SV?SV.toFixed(0):'—'} mL</b></div><div>SVI: <b>{SVI?SVI.toFixed(0):'—'} mL/m²</b></div><div>CI: <b>{CI?CI.toFixed(2):'—'} L/min/m²</b></div><div>SVR: <b>{SVR?SVR.toFixed(0):'—'} dyn·s·cm⁻⁵</b> (<span>{SVR_WU?SVR_WU.toFixed(1):'—'} WU</span>)</div><div>PVR: <b>{PVR?PVR.toFixed(0):'—'} dyn·s·cm⁻⁵</b> (<span>{PVR_WU?PVR_WU.toFixed(2):'—'} WU</span>)</div><div>PAPi: <b>{PAPi?PAPi.toFixed(2):'—'}</b></div><div>AD/PCP: <b>{AD_over_PCWP?AD_over_PCWP.toFixed(2):'—'}</b></div><div>CPO: <b>{CPO?CPO.toFixed(2):'—'} W</b></div></CardContent></Card></main></div>) }

function DrugDoserTool({goHome}:{goHome:()=>void}){const [weight,setWeight]=useState<any>(70);const [drug,setDrug]=useState<'norepi'|'epi'|'dobut'|'milri10'|'milri20'|'vaso'|'dopa'|'dopa200'|'ntg'|'cisat'|'isop'|'levo'|'morph'|'nipr'|'remi'>('norepi');const [dose,setDose]=useState<any>(0.1);const [amount,setAmount]=useState<any>(25);const [volume,setVolume]=useState<any>(250);const [units,setUnits]=useState<'mcg/kg/min'|'UI/kg/h'|'mcg/min'|'mg/h'|'mcg/kg/h'|'mcg/h'>('mcg/kg/min');const presets:any={norepi:{label:'Noradrenalina 25 mg/250 mL',amount:25,amount_unit:'mg',volume:250,unit:'mcg/kg/min',min:0.02,max:1.0},epi:{label:'Adrenalina 1.6 mg/100 mL',amount:1.6,amount_unit:'mg',volume:100,unit:'mcg/kg/min',min:0.02,max:1.0},dobut:{label:'Dobutamina 500 mg/250 mL',amount:500,amount_unit:'mg',volume:250,unit:'mcg/kg/min',min:2,max:20},milri10:{label:'Milrinona 10 mg/250 mL',amount:10,amount_unit:'mg',volume:250,unit:'mcg/kg/min',min:0.125,max:0.75},milri20:{label:'Milrinona 20 mg/250 mL',amount:20,amount_unit:'mg',volume:250,unit:'mcg/kg/min',min:0.125,max:0.75},vaso:{label:'Vasopresina 40 UI/100 mL',amount:40,amount_unit:'UI',volume:100,unit:'UI/kg/h',min:0.0001,max:0.003},dopa:{label:'Dopamina 400 mg/250 mL',amount:400,amount_unit:'mg',volume:250,unit:'mcg/kg/min',min:2,max:20},dopa200:{label:'Dopamina 200 mg/100 mL',amount:200,amount_unit:'mg',volume:100,unit:'mcg/kg/min',min:2,max:20},ntg:{label:'Nitroglicerina 50 mg/250 mL',amount:50,amount_unit:'mg',volume:250,unit:'mcg/min',min:5,max:200},cisat:{label:'Cisatracurio 200 mg/100 mL',amount:200,amount_unit:'mg',volume:100,unit:'mcg/kg/min',min:0.5,max:5},isop:{label:'Isoproterenol 200 mcg/100 mL',amount:200,amount_unit:'mcg',volume:100,unit:'mcg/min',min:1,max:10},levo:{label:'Levosimendan 22.5 mg/250 mL',amount:22.5,amount_unit:'mg',volume:250,unit:'mcg/kg/min',min:0.05,max:0.2},morph:{label:'Morfina 50 mg/50 mL',amount:50,amount_unit:'mg',volume:50,unit:'mg/h',min:1,max:10},nipr:{label:'Nitroprusiato 50 mg/250 mL',amount:50,amount_unit:'mg',volume:250,unit:'mcg/kg/min',min:0.3,max:10},remi:{label:'Remifentanilo 5 mg/100 mL',amount:5,amount_unit:'mg',volume:100,unit:'mcg/kg/min',min:0.025,max:0.3}};React.useEffect(()=>{const p=presets[drug];setAmount(p.amount);setVolume(p.volume);setUnits(p.unit as any);if(p.unit==='UI/kg/h') setDose(0.0005); else if(p.unit==='mcg/min'||p.unit==='mg/h') setDose(p.min); else setDose(0.1)},[drug]);const n=(x:any)=> (typeof x==='number'&&!isNaN(x)?x:undefined);const W=n(weight)||0,A=n(amount)||0,V=n(volume)||0,D=n(dose);const aunit=presets[drug].amount_unit;let conc_mcg_per_mL:any=undefined,conc_UI_per_mL:any=undefined;if(aunit==='mg') conc_mcg_per_mL=(A*1000)/V; else if(aunit==='mcg') conc_mcg_per_mL=(A)/V; else if(aunit==='UI') conc_UI_per_mL=(A)/V;let mL_per_h:any; if(D&&V&&((conc_mcg_per_mL)||(conc_UI_per_mL))){switch(units){case 'mcg/kg/min':{const mcg_per_min=D*W; mL_per_h=(mcg_per_min/(conc_mcg_per_mL!))*60; break;}case 'mcg/min':{const mcg_per_min=D; mL_per_h=(mcg_per_min/(conc_mcg_per_mL!))*60; break;}case 'UI/kg/h':{const ui_per_h=D*W; mL_per_h=ui_per_h/(conc_UI_per_mL!); break;}case 'mg/h':{const mcg_per_h=D*1000; mL_per_h=mcg_per_h/(conc_mcg_per_mL!); break;}case 'mcg/kg/h':{const mcg_per_h=D*W; mL_per_h=mcg_per_h/(conc_mcg_per_mL!); break;}case 'mcg/h':{const mcg_per_h=D; mL_per_h=mcg_per_h/(conc_mcg_per_mL!); break;}}}const p=presets[drug];const outOfRange=D!==undefined&&((D<p.min)||(D>p.max));const savePreset=()=>{const blob={amount,volume,units,dose};localStorage.setItem(`doser:${drug}`,JSON.stringify(blob));alert('Preset guardado.')};const loadPreset=()=>{const raw=localStorage.getItem(`doser:${drug}`);if(!raw) return alert('No hay preset.');try{const b=JSON.parse(raw);setAmount(b.amount??amount);setVolume(b.volume??volume);setUnits(b.units??units);setDose(b.dose??dose)}catch{alert('Error al cargar')}};return (<div className='min-h-screen w-full bg-white print:bg-white'><header className='border-b sticky top-0 bg-white/70 backdrop-blur z-30 print:hidden'><div className='max-w-3xl mx-auto flex items-center justify-between p-3'><div className='flex items-center gap-2'><HeartPulse className='h-5 w-5'/><h2 className='font-semibold'>Bombas y dosis – UCI cardiológica</h2></div><div className='flex gap-2'><Button variant='secondary' size='sm' onClick={savePreset}>Guardar preset</Button><Button variant='secondary' size='sm' onClick={loadPreset}>Cargar preset</Button><Button variant='outline' size='sm' onClick={goHome}>← Volver</Button></div></div></header><main className='max-w-3xl mx-auto p-4 space-y-6'><Card><CardHeader><CardTitle className='text-base'>Paciente y fármaco</CardTitle></CardHeader><CardContent className='grid sm:grid-cols-2 gap-3'><FieldRow label='Peso (kg)'><Input type='number' value={weight} onChange={(e:any)=>setWeight(parseFloat(e.target.value||'0'))}/></FieldRow><FieldRow label='Fármaco'><select className='border rounded-md h-9 px-2' value={drug} onChange={(e:any)=>setDrug(e.target.value)}><optgroup label='Vasoactivos'><option value='norepi'>Noradrenalina</option><option value='epi'>Adrenalina</option><option value='dopa'>Dopamina 400/250</option><option value='dopa200'>Dopamina 200/100</option><option value='isop'>Isoproterenol</option><option value='vaso'>Vasopresina</option><option value='ntg'>Nitroglicerina</option><option value='nipr'>Nitroprusiato</option></optgroup><optgroup label='Inotropos'><option value='dobut'>Dobutamina</option><option value='milri10'>Milrinona 10/250</option><option value='milri20'>Milrinona 20/250</option><option value='levo'>Levosimendan</option></optgroup><optgroup label='Analgo-sedación / NMB'><option value='remi'>Remifentanilo</option><option value='morph'>Morfina</option><option value='cisat'>Cisatracurio</option></optgroup></select></FieldRow><FieldRow label='Dosis'><Input type='number' value={dose} onChange={(e:any)=>setDose(parseFloat(e.target.value||'0'))}/></FieldRow><FieldRow label='Unidades'><select className='border rounded-md h-9 px-2' value={units} onChange={(e:any)=>setUnits(e.target.value)}><option value='mcg/kg/min'>mcg/kg/min</option><option value='mcg/min'>mcg/min</option><option value='UI/kg/h'>UI/kg/h</option><option value='mg/h'>mg/h</option><option value='mcg/kg/h'>mcg/kg/h</option><option value='mcg/h'>mcg/h</option></select></FieldRow></CardContent></Card><Card><CardHeader><CardTitle className='text-base'>Dilución</CardTitle></CardHeader><CardContent className='grid sm:grid-cols-3 gap-3'><FieldRow label={`Cantidad (${presets[drug].amount_unit==='UI'?'UI':presets[drug].amount_unit})`}><Input type='number' value={amount} onChange={(e:any)=>setAmount(parseFloat(e.target.value||'0'))}/></FieldRow><FieldRow label='Volumen (mL)'><Input type='number' value={volume} onChange={(e:any)=>setVolume(parseFloat(e.target.value||'0'))}/></FieldRow><div className='text-sm text-slate-600 self-center'>Concentración: <b>{presets[drug].amount_unit==='UI'?(conc_UI_per_mL? (conc_UI_per_mL.toFixed(3)+' UI/mL'):'—'):(conc_mcg_per_mL? (conc_mcg_per_mL.toFixed(0)+' mcg/mL'):'—')}</b></div></CardContent><CardContent className='text-xs text-slate-500'>Preset: {presets[drug].label}. Personaliza y guarda para otras diluciones locales.</CardContent></Card><Card><CardHeader><CardTitle className='text-base'>Resultado</CardTitle></CardHeader><CardContent><div className='text-lg'>Velocidad: <b>{mL_per_h? (mL_per_h.toFixed(2)+' mL/h'):'—'}</b></div>{D!==undefined && (<div className={`mt-2 text-sm ${outOfRange? 'text-red-600':'text-slate-600'}`}>Dosis: {D} {units} — Rango habitual {p.min}–{p.max} {units} {outOfRange? '(¡fuera de rango!)':''}</div>)}<div className='mt-2 text-xs text-slate-500'>Guía orientativa. Valida con vuestro protocolo.</div></CardContent></Card></main></div>) }
