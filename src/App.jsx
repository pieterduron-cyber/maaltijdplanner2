import { useState, useEffect, useCallback, useRef } from "react";

const DAGEN = ["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag","Zondag"];

async function notion(action, payload = {}) {
  const res = await fetch("/api/notion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  return res.json();
}

async function parseIngredients(gerechten) {
  const res = await fetch("/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gerechten }),
  });
  return res.json();
}

const T = {
  bg:"#0f1117", surface:"#1a1d27", card:"#222536", border:"#2e3148",
  accent:"#7c6af7", accent2:"#a78bfa", green:"#4ade80", red:"#f87171",
  text:"#e8e9f0", muted:"#7b7f9e"
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${T.bg};color:${T.text};font-family:'Inter',system-ui,sans-serif;}
  .app{max-width:440px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;}
  .header{background:${T.surface};border-bottom:1px solid ${T.border};padding:14px 20px;position:sticky;top:0;z-index:100;}
  .header-top{display:flex;align-items:center;justify-content:space-between;}
  .logo{font-size:20px;font-weight:700;letter-spacing:-0.5px;}
  .logo span{color:${T.accent2};}
  .nav{display:flex;background:${T.surface};border-bottom:1px solid ${T.border};}
  .nav-btn{flex:1;padding:11px 4px;border:none;background:none;color:${T.muted};font-size:11px;font-weight:500;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;text-transform:uppercase;letter-spacing:0.3px;border-bottom:2px solid transparent;transition:color 0.15s;}
  .nav-btn.active{color:${T.accent2};border-bottom-color:${T.accent2};}
  .nav-btn svg{width:18px;height:18px;}
  .content{flex:1;padding:16px;overflow-y:auto;}
  .search-wrap{position:relative;margin-bottom:12px;}
  .search-input{width:100%;background:${T.card};border:1px solid ${T.border};border-radius:10px;padding:10px 14px 10px 38px;color:${T.text};font-size:14px;outline:none;}
  .search-input:focus{border-color:${T.accent};}
  .search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:${T.muted};width:16px;height:16px;}
  .chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:12px;scrollbar-width:none;}
  .chips::-webkit-scrollbar{display:none;}
  .chip{flex-shrink:0;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${T.border};background:${T.card};color:${T.muted};transition:all 0.15s;}
  .chip.active{background:${T.accent};border-color:${T.accent};color:#fff;}
  .gcard{background:${T.card};border:1px solid ${T.border};border-radius:12px;padding:13px 14px;margin-bottom:9px;transition:border-color 0.15s;}
  .gcard:hover{border-color:${T.accent};}
  .gcard-name{font-size:15px;font-weight:600;margin-bottom:6px;}
  .gcard-meta{display:flex;gap:7px;align-items:center;flex-wrap:wrap;}
  .badge{font-size:11px;padding:3px 8px;border-radius:6px;font-weight:500;}
  .bc{background:#7c6af720;color:${T.accent2};}
  .bt{background:#4ade8020;color:${T.green};}
  .bs{background:#fbbf2420;color:#fbbf24;}
  .bv{background:#94a3b820;color:#94a3b8;}
  .gcard-actions{margin-left:auto;display:flex;gap:4px;}
  .icon-btn{background:none;border:none;color:${T.muted};cursor:pointer;padding:5px;border-radius:7px;display:flex;align-items:center;transition:color 0.15s;}
  .icon-btn:hover{color:${T.text};}
  .icon-btn.p{color:${T.accent};}
  .icon-btn svg{width:17px;height:17px;}
  .wday{background:${T.card};border:1px solid ${T.border};border-radius:12px;padding:13px 14px;margin-bottom:9px;}
  .wday-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
  .wday-name{font-size:12px;font-weight:600;color:${T.muted};text-transform:uppercase;letter-spacing:0.5px;}
  .wday-add{background:none;border:none;color:${T.accent};cursor:pointer;display:flex;align-items:center;gap:3px;font-size:12px;font-weight:600;padding:3px 6px;border-radius:6px;transition:background 0.15s;}
  .wday-add:hover{background:${T.border};}
  .wday-add svg{width:13px;height:13px;}
  .gerecht-rij{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid ${T.border};}
  .gerecht-rij-naam{font-size:14px;font-weight:500;flex:1;}
  .gerecht-rij-naam.vrij{color:${T.muted};font-style:italic;}
  .gerecht-rij-pers{font-size:11px;color:${T.muted};white-space:nowrap;}
  .rij-del{background:none;border:none;color:#f8717160;cursor:pointer;padding:6px;border-radius:7px;display:flex;align-items:center;flex-shrink:0;transition:all 0.15s;}
  .rij-del:hover{color:${T.red};background:#f8717115;}
  .rij-del svg{width:18px;height:18px;}
  .add-dag{display:flex;align-items:center;gap:6px;width:100%;background:none;border:1px dashed ${T.border};border-radius:8px;padding:8px 12px;color:${T.muted};font-size:13px;cursor:pointer;transition:all 0.15s;}
  .add-dag:hover{border-color:${T.accent};color:${T.accent2};}
  .add-dag svg{width:15px;height:15px;}
  .gen-btn{width:100%;margin-top:16px;background:${T.card};border:1px solid ${T.accent};border-radius:10px;padding:12px;color:${T.accent2};font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.15s;}
  .gen-btn:hover{background:${T.accent};color:#fff;}
  .gen-btn:disabled{opacity:0.4;cursor:not-allowed;}
  .shop-item{display:flex;align-items:center;gap:10px;padding:11px 14px;background:${T.card};border:1px solid ${T.border};border-radius:10px;margin-bottom:6px;transition:border-color 0.15s;}
  .shop-item.drag-over{border-color:${T.accent2};border-style:dashed;}
  .drag-handle{color:${T.border};cursor:grab;display:flex;align-items:center;flex-shrink:0;padding:2px;touch-action:none;}
  .drag-handle:active{cursor:grabbing;}
  .drag-handle svg{width:16px;height:16px;}
  .shop-prod{font-size:14px;font-weight:500;flex:1;}
  .shop-qty{font-size:12px;color:${T.muted};white-space:nowrap;}
  .shop-del{background:none;border:none;color:#f8717160;cursor:pointer;padding:6px;border-radius:7px;display:flex;align-items:center;flex-shrink:0;transition:all 0.15s;}
  .shop-del:hover{color:${T.red};background:#f8717115;}
  .shop-del svg{width:18px;height:18px;}
  .manual-row{display:flex;gap:8px;margin-bottom:6px;}
  .manual-in{flex:1;background:${T.card};border:1px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:14px;outline:none;}
  .manual-in:focus{border-color:${T.accent};}
  .pbtn{background:${T.accent};border:none;border-radius:10px;padding:10px 16px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;}
  .pbtn:hover{opacity:0.85;}
  .pbtn:disabled{opacity:0.4;cursor:not-allowed;}
  .overlay{position:fixed;inset:0;background:#00000088;z-index:200;display:flex;align-items:flex-end;}
  .modal{background:${T.surface};border-radius:20px 20px 0 0;width:100%;max-height:88vh;overflow-y:auto;padding:22px 20px 36px;}
  .mhandle{width:38px;height:4px;background:${T.border};border-radius:2px;margin:0 auto 18px;}
  .mtitle{font-size:18px;font-weight:700;margin-bottom:14px;}
  .mlabel{font-size:11px;font-weight:600;color:${T.muted};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;}
  .mtext{font-size:14px;line-height:1.65;white-space:pre-wrap;}
  .msec{margin-bottom:16px;}
  .dag-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:14px;}
  .dag-opt{background:${T.card};border:1px solid ${T.border};border-radius:8px;padding:9px 4px;text-align:center;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.15s;}
  .dag-opt.sel{background:${T.accent};border-color:${T.accent};color:#fff;}
  .pers-row{display:flex;gap:7px;margin-bottom:14px;}
  .pers-btn{flex:1;background:${T.card};border:1px solid ${T.border};border-radius:8px;padding:10px;text-align:center;font-size:16px;font-weight:600;cursor:pointer;transition:all 0.15s;}
  .pers-btn.sel{background:${T.accent};border-color:${T.accent};color:#fff;}
  .mclose{width:100%;background:${T.card};border:1px solid ${T.border};border-radius:10px;padding:12px;color:${T.text};font-size:15px;font-weight:600;cursor:pointer;margin-top:8px;}
  .loading{display:flex;align-items:center;justify-content:center;padding:50px;color:${T.muted};flex-direction:column;gap:12px;}
  .spin{width:26px;height:26px;border:3px solid ${T.border};border-top-color:${T.accent};border-radius:50%;animation:spin 0.8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .empty{text-align:center;padding:40px 20px;color:${T.muted};font-size:14px;line-height:1.6;}
  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${T.green};color:#000;padding:10px 22px;border-radius:20px;font-size:13px;font-weight:600;z-index:300;white-space:nowrap;animation:fadein 0.2s ease;}
  .toast.err{background:${T.red};color:#fff;}
  @keyframes fadein{from{opacity:0;transform:translateX(-50%) translateY(8px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
  .shop-hint{font-size:11px;color:${T.muted};margin-bottom:12px;}
`;

const Ico = {
  list: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  cal:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  cart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  del:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  eye:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  srch: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  grip: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/></svg>,
  spark:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>,
};

export default function App() {
  const [tab, setTab] = useState("gerechten");
  const [gerechten, setGerechten] = useState([]);
  const [dagmenu, setDagmenu] = useState({});
  const [shopping, setShopping] = useState([]);
  const [busy, setBusy] = useState({});
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Alle");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  const showToast = (msg, err=false) => { setToast({msg,err}); setTimeout(()=>setToast(null),2500); };
  const setB = (k,v) => setBusy(p=>({...p,[k]:v}));

  const loadGerechten = useCallback(async () => {
    setB("g",true);
    const d = await notion("getGerechten");
    if (Array.isArray(d)) setGerechten(d);
    setB("g",false);
  }, []);

  const loadDagmenu = useCallback(async () => {
    setB("d",true);
    const d = await notion("getDagmenu", {});
    if (d && typeof d === "object") setDagmenu(d);
    setB("d",false);
  }, []);

  const loadShopping = useCallback(async () => {
    setB("s",true);
    const d = await notion("getShopping", {});
    if (Array.isArray(d)) setShopping(d);
    setB("s",false);
  }, []);

  useEffect(()=>{ loadGerechten(); },[loadGerechten]);
  useEffect(()=>{ if(tab==="week") loadDagmenu(); },[tab,loadDagmenu]);
  useEffect(()=>{ if(tab==="shopping") loadShopping(); },[tab,loadShopping]);

  const voegToe = async (gerecht, dag, personen) => {
    setB("add",true);
    const r = await notion("addDagmenu", { dag, gerecht: gerecht.naam, personen, vrij: false });
    setB("add",false);
    if(r?.success){
      showToast(`${gerecht.naam} → ${dag}`);
      setModal(null);
      loadDagmenu();
    } else showToast("Fout bij toevoegen",true);
  };

  const voegVrijToe = async (naam, dag) => {
    setB("add",true);
    const r = await notion("addDagmenu", { dag, gerecht: naam, personen: 0, vrij: true });
    setB("add",false);
    if(r?.success){
      showToast(`${naam} → ${dag}`);
      setModal(null);
      loadDagmenu();
    } else showToast("Fout bij toevoegen",true);
  };

  const verwijderDagItem = async (dag, id) => {
    setDagmenu(p=>{
      const lijst=(p[dag]||[]).filter(i=>i.id!==id);
      if(!lijst.length){const n={...p};delete n[dag];return n;}
      return {...p,[dag]:lijst};
    });
    await notion("deleteDagmenu", { id });
  };

  const genereerShopping = async () => {
    setB("gen",true);
    showToast("Ingrediënten verwerken…");

    const weekGerechten = [];
    for (const dag of DAGEN) {
      for (const item of (dagmenu[dag]||[])) {
        if (item.vrij) continue;
        const g = gerechten.find(g=>g.naam===item.gerecht);
        if (g?.ingredienten) weekGerechten.push({ naam:g.naam, ingredienten:g.ingredienten, personen:item.personen||4 });
      }
    }

    if (!weekGerechten.length) { showToast("Geen gerechten met ingrediënten",true); setB("gen",false); return; }

    const parsed = await parseIngredients(weekGerechten);
    if (!Array.isArray(parsed)) { showToast("Fout bij verwerken",true); setB("gen",false); return; }

    const currentMax = shopping.length;
    for (let i=0; i<parsed.length; i++) {
      await notion("addShopping", {
        product: parsed[i].product,
        hoeveelheid: parsed[i].hoeveelheid || "",
        volgorde: currentMax + i,
      });
    }

    setB("gen",false);
    showToast(`${parsed.length} items toegevoegd`);
    loadShopping();
  };

  const voegShopToe = async (txt) => {
    if(!txt.trim()) return;
    setB("si",true);
    const r = await notion("addShopping", { product: txt.trim(), hoeveelheid:"", volgorde: shopping.length });
    setB("si",false);
    if(r?.success){ showToast(`"${txt}" toegevoegd`); loadShopping(); }
  };

  const verwijderShop = async (id) => {
    setShopping(p=>p.filter(i=>i.id!==id));
    await notion("deleteShopping", { id });
  };

  const herorden = async (nieuweLijst) => {
    setShopping(nieuweLijst);
    for (let i=0; i<nieuweLijst.length; i++) {
      notion("updateVolgorde", { id: nieuweLijst[i].id, volgorde: i });
    }
  };

  const cats = ["Alle",...new Set(gerechten.map(g=>g.categorie).filter(Boolean))].sort();
  const filtered = gerechten.filter(g=>{
    const ms=!search||g.naam?.toLowerCase().includes(search.toLowerCase());
    const mc=cat==="Alle"||g.categorie===cat;
    return ms&&mc;
  });

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="header-top">
            <div className="logo">maal<span>tijd</span></div>
            <span style={{fontSize:22}}>🍽️</span>
          </div>
        </div>

        <div className="nav">
          {[{id:"gerechten",l:"Gerechten",i:Ico.list},{id:"week",l:"Weekmenu",i:Ico.cal},{id:"shopping",l:"Winkellijst",i:Ico.cart}].map(t=>(
            <button key={t.id} className={`nav-btn ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>
              {t.i}{t.l}
            </button>
          ))}
        </div>

        <div className="content">
          {tab==="gerechten" && (
            busy.g
              ? <div className="loading"><div className="spin"/><span>Gerechten laden…</span></div>
              : <>
                <div className="search-wrap">
                  <span className="search-icon">{Ico.srch}</span>
                  <input className="search-input" placeholder="Zoek een gerecht…" value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                <div className="chips">
                  {cats.map(c=><button key={c} className={`chip ${cat===c?"active":""}`} onClick={()=>setCat(c)}>{c}</button>)}
                </div>
                {filtered.length===0&&<div className="empty">Geen gerechten gevonden</div>}
                {filtered.map(g=>(
                  <div key={g.id} className="gcard">
                    <div className="gcard-name">{g.naam}</div>
                    <div className="gcard-meta">
                      {g.categorie&&<span className="badge bc">{g.categorie}</span>}
                      {g.kooktijd&&<span className={`badge ${g.kooktijd.includes("20")?"bs":"bt"}`}>{g.kooktijd}</span>}
                      <div className="gcard-actions">
                        <button className="icon-btn" onClick={()=>setModal({type:"detail",gerecht:g})}>{Ico.eye}</button>
                        <button className="icon-btn p" onClick={()=>setModal({type:"toevoegen",gerecht:g})}>{Ico.plus}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
          )}

          {tab==="week" && (
            busy.d
              ? <div className="loading"><div className="spin"/><span>Weekmenu laden…</span></div>
              : <>
                {DAGEN.map(dag=>{
                  const items=dagmenu[dag]||[];
                  return (
                    <div key={dag} className="wday">
                      <div className="wday-head">
                        <span className="wday-name">{dag}</span>
                        <button className="wday-add" onClick={()=>setModal({type:"toevoegen_dag",dag})}>{Ico.plus} Toevoegen</button>
                      </div>
                      {items.length===0
                        ? <button className="add-dag" onClick={()=>setModal({type:"toevoegen_dag",dag})}>{Ico.plus} Gerecht toevoegen</button>
                        : items.map(item=>{
                          const g = gerechten.find(x=>x.naam===item.gerecht);
                          return (
                            <div key={item.id} className="gerecht-rij">
                              <span className={`gerecht-rij-naam ${item.vrij?"vrij":""}`}>{item.gerecht}</span>
                              {item.vrij
                                ? <span className="badge bv">vrij</span>
                                : <span className="gerecht-rij-pers">👥 {item.personen}</span>
                              }
                              {g && !item.vrij && <button className="icon-btn" onClick={()=>setModal({type:"detail",gerecht:g})}>{Ico.eye}</button>}
                              <button className="rij-del" onClick={()=>verwijderDagItem(dag,item.id)}>{Ico.del}</button>
                            </div>
                          );
                        })
                      }
                    </div>
                  );
                })}
                <button className="gen-btn" disabled={busy.gen} onClick={genereerShopping}>
                  {busy.gen
                    ? <><div className="spin" style={{width:16,height:16,borderWidth:2}}/> Bezig…</>
                    : <>{Ico.spark} Genereer winkellijst</>
                  }
                </button>
              </>
          )}

          {tab==="shopping" && (
            busy.s
              ? <div className="loading"><div className="spin"/><span>Winkellijst laden…</span></div>
              : <ShoppingTab shopping={shopping} onDelete={verwijderShop} onAdd={voegShopToe} onReorder={herorden} addBusy={busy.si}/>
          )}
        </div>

        {modal&&<ModalView modal={modal} gerechten={gerechten} onClose={()=>setModal(null)} onVoegToe={voegToe} onVoegVrijToe={voegVrijToe} busy={busy}/>}
        {toast&&<div className={`toast ${toast.err?"err":""}`}>{toast.msg}</div>}
      </div>
    </>
  );
}

function ShoppingTab({shopping, onDelete, onAdd, onReorder, addBusy}) {
  const [inp, setInp] = useState("");
  const dragIdx = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const touchRef = useRef(null);

  const handle = () => { if(inp.trim()){ onAdd(inp); setInp(""); } };

  const onDragStart=(e,i)=>{dragIdx.current=i;e.dataTransfer.effectAllowed="move";};
  const onDragOver=(e,i)=>{e.preventDefault();setDragOver(i);};
  const onDrop=(e,i)=>{
    e.preventDefault();
    if(dragIdx.current===null||dragIdx.current===i){setDragOver(null);return;}
    const arr=[...shopping];const[m]=arr.splice(dragIdx.current,1);arr.splice(i,0,m);
    onReorder(arr);dragIdx.current=null;setDragOver(null);
  };
  const onDragEnd=()=>{dragIdx.current=null;setDragOver(null);};
  const onTouchStart=(e,i)=>{touchRef.current={i,y:e.touches[0].clientY};};
  const onTouchEnd=(e,i)=>{
    if(!touchRef.current)return;
    const dy=e.changedTouches[0].clientY-touchRef.current.y;
    const steps=Math.round(dy/54);
    if(steps!==0){
      const to=Math.max(0,Math.min(shopping.length-1,i+steps));
      if(to!==i){const arr=[...shopping];const[m]=arr.splice(i,1);arr.splice(to,0,m);onReorder(arr);}
    }
    touchRef.current=null;
  };

  return <>
    <div className="manual-row">
      <input className="manual-in" placeholder="Item toevoegen…" value={inp}
        onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
      <button className="pbtn" onClick={handle} disabled={addBusy||!inp.trim()}>{addBusy?"…":"+ Voeg toe"}</button>
    </div>
    {shopping.length===0
      ? <div className="empty">Winkellijst is leeg.<br/>Genereer vanuit het weekmenu of voeg items toe.</div>
      : <div className="shop-hint">{shopping.length} {shopping.length===1?"item":"items"} · sleep ⠿ om te herordenen</div>
    }
    {shopping.map((item,i)=>(
      <div key={item.id} className={`shop-item ${dragOver===i?"drag-over":""}`}
        draggable onDragStart={e=>onDragStart(e,i)} onDragOver={e=>onDragOver(e,i)}
        onDrop={e=>onDrop(e,i)} onDragEnd={onDragEnd}
        onTouchStart={e=>onTouchStart(e,i)} onTouchEnd={e=>onTouchEnd(e,i)}>
        <span className="drag-handle">{Ico.grip}</span>
        <span className="shop-prod">{item.product}</span>
        {item.hoeveelheid&&<span className="shop-qty">{item.hoeveelheid}</span>}
        <button className="shop-del" onClick={()=>onDelete(item.id)}>{Ico.del}</button>
      </div>
    ))}
  </>;
}

function DetailModal({gerecht, onClose}) {
  const [stappen, setStappen] = useState(null);
  useEffect(()=>{
    notion("getBereidingsstappen",{id:gerecht.id}).then(d=>setStappen(d.tekst||"Niet beschikbaar."));
  },[gerecht.id]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="mhandle"/>
        <div className="mtitle">{gerecht.naam}</div>
        <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
          {gerecht.categorie&&<span className="badge bc">{gerecht.categorie}</span>}
          {gerecht.kooktijd&&<span className="badge bt">{gerecht.kooktijd}</span>}
        </div>
        <div className="msec"><div className="mlabel">Ingrediënten</div>
          <div className="mtext">{gerecht.ingredienten||"Niet beschikbaar."}</div></div>
        <div className="msec"><div className="mlabel">Bereidingsstappen</div>
          <div className="mtext">{stappen===null?"Laden…":stappen}</div></div>
        <button className="mclose" onClick={onClose}>Sluiten</button>
      </div>
    </div>
  );
}

function ModalView({modal, gerechten, onClose, onVoegToe, onVoegVrijToe, busy}) {
  const [zoek, setZoek] = useState("");
  const [gekozen, setGekozen] = useState(modal.gerecht||null);
  const [selDag, setSelDag] = useState(modal.dag||null);
  const [pers, setPers] = useState(4);

  if (modal.type==="detail") {
    return <DetailModal gerecht={modal.gerecht} onClose={onClose}/>;
  }

  if (modal.type==="toevoegen" || modal.type==="toevoegen_dag") {
    const zoekTerm = zoek.trim();
    const gef = gerechten.filter(g=>!zoekTerm||g.naam?.toLowerCase().includes(zoekTerm.toLowerCase()));
    const exactMatch = gerechten.some(g=>g.naam?.toLowerCase()===zoekTerm.toLowerCase());
    const toonVrijOptie = zoekTerm.length > 0 && !exactMatch;

    return (
      <div className="overlay" onClick={onClose}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <div className="mhandle"/>

          {!gekozen ? <>
            <div className="mtitle">Wat eten jullie?</div>
            <div className="search-wrap" style={{marginBottom:10}}>
              <span className="search-icon">{Ico.srch}</span>
              <input
                className="search-input"
                autoFocus
                placeholder="Zoek of typ zelf…"
                value={zoek}
                onChange={e=>setZoek(e.target.value)}
              />
            </div>

            <div style={{maxHeight:260,overflowY:"auto",marginBottom:8}}>
              {gef.slice(0,15).map(g=>(
                <div key={g.id} className="gcard" style={{marginBottom:6}} onClick={()=>setGekozen({...g, vrij:false})}>
                  <div className="gcard-name">{g.naam}</div>
                  <div className="gcard-meta">
                    {g.categorie&&<span className="badge bc">{g.categorie}</span>}
                    {g.kooktijd&&<span className={`badge ${g.kooktijd.includes("20")?"bs":"bt"}`}>{g.kooktijd}</span>}
                  </div>
                </div>
              ))}

              {toonVrijOptie && (
                <div
                  className="gcard"
                  style={{marginBottom:6, borderStyle:"dashed", borderColor:T.muted, cursor:"pointer"}}
                  onClick={()=>setGekozen({naam:zoekTerm, vrij:true})}
                >
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{color:T.muted}}>{Ico.plus}</span>
                    <div>
                      <div className="gcard-name" style={{color:T.text}}>"{zoekTerm}"</div>
                      <div style={{fontSize:11,color:T.muted,marginTop:2}}>toevoegen als vrij item — geen ingrediënten</div>
                    </div>
                  </div>
                </div>
              )}

              {gef.length===0 && !toonVrijOptie && (
                <div className="empty" style={{padding:"20px 0"}}>Typ om te zoeken of een vrij item toe te voegen</div>
              )}
            </div>
          </> : <>
            <div className="mtitle" style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{flex:1}}>{gekozen.naam}</span>
              <button style={{background:"none",border:"none",color:T.muted,fontSize:12,cursor:"pointer",flexShrink:0}} onClick={()=>setGekozen(null)}>
                ← wijzig
              </button>
            </div>

            {gekozen.vrij && (
              <div style={{fontSize:12,color:T.muted,marginBottom:14,background:T.card,padding:"7px 10px",borderRadius:7}}>
                Vrij item — verschijnt in weekmenu maar niet in winkellijst
              </div>
            )}

            <div className="msec"><div className="mlabel">Dag</div>
              <div className="dag-grid">
                {DAGEN.map(d=>(
                  <button key={d} className={`dag-opt ${selDag===d?"sel":""}`} onClick={()=>setSelDag(d)}>
                    {d.slice(0,2)}
                  </button>
                ))}
              </div>
            </div>

            {!gekozen.vrij && (
              <div className="msec"><div className="mlabel">Personen</div>
                <div className="pers-row">
                  {[1,2,3,4,5].map(n=>(
                    <button key={n} className={`pers-btn ${pers===n?"sel":""}`} onClick={()=>setPers(n)}>{n}</button>
                  ))}
                </div>
              </div>
            )}

            <button className="pbtn" style={{width:"100%",padding:"13px"}}
              disabled={!selDag||busy.add}
              onClick={()=>gekozen.vrij ? onVoegVrijToe(gekozen.naam,selDag) : onVoegToe(gekozen,selDag,pers)}>
              {busy.add?"Bezig…":"Toevoegen aan weekmenu"}
            </button>
          </>}

          <button className="mclose" onClick={onClose}>Annuleren</button>
        </div>
      </div>
    );
  }
  return null;
}
