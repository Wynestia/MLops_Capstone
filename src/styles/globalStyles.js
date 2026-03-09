import { G } from "./theme";

export const css = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:${G.bg}}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:#e8d5b7;border-radius:99px}

.card{background:${G.card};border-radius:20px;padding:24px;box-shadow:0 2px 16px rgba(92,61,30,0.07);border:1px solid ${G.border}}
.card-sm{background:${G.card};border-radius:16px;padding:18px;box-shadow:0 1px 8px rgba(92,61,30,0.05);border:1px solid ${G.border}}

.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;font-family:${G.fs};font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all .2s}
.btn:hover{transform:translateY(-1px)}
.btn-primary{background:linear-gradient(135deg,${G.brown},${G.brownLight});color:white;box-shadow:0 4px 14px rgba(92,61,30,0.28)}
.btn-secondary{background:${G.brownPale};color:${G.brown}}
.btn-ghost{background:transparent;color:${G.muted};border:1.5px solid ${G.border}}
.btn-ghost:hover{background:${G.brownPale};color:${G.brown}}

.nav-item{font-family:${G.fs};font-size:13px;color:${G.muted};padding:7px 14px;border-radius:20px;cursor:pointer;transition:all .18s;border:none;background:none}
.nav-item:hover{background:${G.brownPale};color:${G.brown}}
.nav-item.active{background:${G.brown};color:white}

.dog-card{background:white;border-radius:20px;padding:20px;border:2px solid ${G.border};cursor:pointer;transition:all .22s}
.dog-card:hover{border-color:#d4a96a;box-shadow:0 6px 28px rgba(92,61,30,0.12);transform:translateY(-3px)}
.dog-card.selected{border-color:${G.brown};box-shadow:0 6px 28px rgba(92,61,30,0.18)}

.tag{font-family:${G.fs};font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:.5px}

.mood-dot{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.1)}

.drop-zone{border:2.5px dashed #d4b896;border-radius:20px;padding:48px 24px;text-align:center;cursor:pointer;transition:all .2s}
.drop-zone:hover,.drop-zone.over{border-color:${G.brown};background:#fdf6ee}

.chat-bubble-user{background:linear-gradient(135deg,${G.brown},${G.brownLight});color:white;border-radius:18px 18px 4px 18px;padding:12px 16px;font-size:13.5px;line-height:1.65;max-width:80%;align-self:flex-end;font-family:${G.fs}}
.chat-bubble-ai{background:white;border:1.5px solid ${G.border};color:${G.text};border-radius:18px 18px 18px 4px;padding:12px 16px;font-size:13.5px;line-height:1.65;max-width:85%;align-self:flex-start;font-family:${G.fs};box-shadow:0 2px 10px rgba(92,61,30,.06)}
.chat-markdown{font-family:${G.fs};font-size:13.5px;line-height:1.65;color:${G.text}}
.chat-markdown h1,.chat-markdown h2,.chat-markdown h3,.chat-markdown h4{font-family:${G.ff};line-height:1.3;color:${G.text};margin:8px 0 6px}
.chat-markdown h2{font-size:16px}
.chat-markdown h3{font-size:14px}
.chat-markdown p{margin:0 0 8px}
.chat-markdown ul,.chat-markdown ol{padding-left:18px;margin:0 0 8px}
.chat-markdown li{margin:2px 0}
.chat-markdown code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:${G.brownPale};padding:1px 5px;border-radius:6px;font-size:12px}
.chat-markdown pre{background:${G.bg};border:1px solid ${G.border};border-radius:10px;padding:10px;overflow:auto;margin:0 0 8px}
.chat-markdown pre code{background:transparent;padding:0;border-radius:0}
.chat-markdown strong{font-weight:700}

.chat-input{width:100%;background:white;border:2px solid ${G.border};border-radius:14px;padding:12px 16px;font-family:${G.fs};font-size:14px;color:${G.text};outline:none;resize:none;transition:border-color .2s}
.chat-input:focus{border-color:${G.brown}}

.sugg-chip{font-family:${G.fs};font-size:12px;padding:7px 13px;border-radius:20px;border:1.5px solid ${G.border};background:white;color:${G.muted};cursor:pointer;transition:all .18s;white-space:nowrap}
.sugg-chip:hover{background:${G.brownPale};color:${G.brown};border-color:#d4a96a}

.pulse{width:10px;height:10px;border-radius:50%;background:#f59e0b;box-shadow:0 0 0 0 rgba(245,158,11,.4);animation:pulse 2s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(245,158,11,.4)}70%{box-shadow:0 0 0 8px rgba(245,158,11,0)}100%{box-shadow:0 0 0 0 rgba(245,158,11,0)}}

.fade-in{animation:fadeIn .35s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.result-ring{width:120px;height:120px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;position:relative;flex-shrink:0}

.journal-input{width:100%;background:${G.bg};border:2px solid ${G.border};border-radius:12px;padding:10px 14px;font-family:${G.fs};font-size:13px;color:${G.text};outline:none;transition:border-color .2s}
.journal-input:focus{border-color:${G.brown};background:white}

.analyze-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);min-height:calc(100vh - 60px)}
.analyze-left{min-width:0}
.analyze-right{min-width:0}

@media (max-width:1100px){
  .analyze-layout{grid-template-columns:1fr}
  .analyze-left{border-right:none !important;border-bottom:1px solid ${G.border}}
  .analyze-right{height:auto !important;min-height:60vh}
}
`;

export const appAnimations = `@keyframes spin{to{transform:rotate(360deg)}}
@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`;
