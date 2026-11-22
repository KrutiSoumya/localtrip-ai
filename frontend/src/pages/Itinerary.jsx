import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Sparkles, MapPin, Clock, DollarSign, Users,
  Heart, Loader, Wand2, Sun, Coffee,
  Moon, Edit3, Trash2, Plus, CheckCircle,
  Star, ChevronDown, ChevronUp, RotateCcw, Save,
  XCircle, RefreshCw, Check, X, Download
} from 'lucide-react'
import api, { getLeadById } from '../services/api'

// ── Constants ─────────────────────────────────────────────────────────────────

const buildFallbackVariation = (parsed) => ({
  id: 'A',
  title: `${parsed?.destination || 'Trip'} Itinerary`,
  score: 0,
  scoreLabel: 'AI Generated',
  scoreColor: '#0f766e',
  scoreBg: '#f0fdfa',
  explanation: `AI-generated itinerary for ${parsed?.destination || 'the selected destination'}.`,
  totalCost: parsed?.budget_total
    ? `₹${parsed.budget_total}`
    : 'Not specified',
  highlights: Array.isArray(parsed?.interests)
    ? parsed.interests
    : typeof parsed?.interests === 'string'
      ? parsed.interests.split(',').map(i => i.trim()).filter(Boolean)
      : [],
  days: [],
})

const timeIcons = [
  <Coffee size={12} color="#A9803A" />,
  <Sun size={12} color="#A9803A" />,
  <Moon size={12} color="#5C1020" />,
]

const fieldConfig = [
  {
    key: 'destination',
    label: 'Destination',
    icon: MapPin,
    type: 'text',
    placeholder: 'e.g. Goa, India',
  },
  {
    key: 'duration_days',
    label: 'Duration (days)',
    icon: Clock,
    type: 'number',
    placeholder: 'e.g. 5',
  },
  {
    key: 'budget_total',
    label: 'Budget (₹)',
    icon: DollarSign,
    type: 'number',
    placeholder: 'e.g. 50000',
  },
  {
    key: 'group_size',
    label: 'Group Size',
    icon: Users,
    type: 'number',
    placeholder: 'e.g. 2',
  },
  {
    key: 'group_type',
    label: 'Group Type',
    icon: Users,
    type: 'text',
    placeholder: 'e.g. couple',
  },
  {
    key: 'interests',
    label: 'Interests',
    icon: Heart,
    type: 'text',
    placeholder: 'e.g. beach, food',
  },
]

// ── UI-only constants ─────────────────────────────────────────────────────────

const COOKING_LINES = [
  'Picking the best beaches',
  'Haggling over hotel rates',
  'Saving a table at sunset',
  'Balancing the budget',
  'Adding a little spice',
]
const STAGE_LABELS = ['Paste the inquiry', 'Check the details', 'Pick a version', 'Ready to send']

// Major tourism cities of India: [city, icon that matches the place]
const CITIES = [
  ['Jaipur', '🏰'],
  ['Udaipur', '🛶'],
  ['Jaisalmer', '🐪'],
  ['Agra', '🕌'],
  ['Delhi', '🏛️'],
  ['Varanasi', '🪔'],
  ['Amritsar', '🛕'],
  ['Rishikesh', '🧘'],
  ['Shimla', '🚂'],
  ['Manali', '🏔️'],
  ['Leh', '⛰️'],
  ['Srinagar', '🌸'],
  ['Mumbai', '🌆'],
  ['Goa', '🏖️'],
  ['Ahmedabad', '🪁'],
  ['Khajuraho', '🗿'],
  ['Hyderabad', '🍛'],
  ['Hampi', '🏞️'],
  ['Mysuru', '👑'],
  ['Kochi', '⚓'],
  ['Munnar', '🍃'],
  ['Alleppey', '🚤'],
  ['Madurai', '🛕'],
  ['Pondicherry', '🥐'],
  ['Kolkata', '🌉'],
  ['Darjeeling', '🍵'],
  ['Puri', '🌊'],
  ['Gangtok', '🎏'],
]

// ── Styles ────────────────────────────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Jost:wght@400;500;600;700&display=swap');

.adn-root {
  --maroon: #5C1020;
  --maroon-soft: #8A2A3C;
  --burgundy: #581822;
  --taupe: #C8B9A6;
  --gold: #C9A765;
  --ivory: #F3E8D0;
  --espresso: #2B1810;
  --offwhite: #FBF8F2;
  --paper: #FFFDF8;
  --ink: #1E110B;
  --display: 'Cormorant Garamond', Georgia, serif;
  --body: 'Jost', system-ui, sans-serif;
  font-family: var(--body);
  font-size: 13px;
  font-variant-numeric: lining-nums;
  color: var(--espresso);
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
}
.adn-root *, .adn-root *::before, .adn-root *::after { box-sizing: border-box; }
.adn-display {
  font-family: var(--display);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.01em;
  line-height: 1.1;
}
.adn-root button { font-family: inherit; }
.adn-root :focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

/* Hero */
.adn-hero {
  position: relative; overflow: hidden;
  background: var(--maroon); color: var(--offwhite);
  border-radius: 14px; padding: 14px 20px 16px;
}
.adn-hero h1 { position: relative; z-index: 2; margin: 0; font-size: clamp(17px, 2vw, 21px); max-width: 28em; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 500; }
.adn-hero p { position: relative; z-index: 2; margin: 4px 0 0; font-size: 12.5px; font-weight: 500; opacity: 0.9; max-width: 44em; }
.adn-blob { position: absolute; background: var(--gold); opacity: 0.9; animation: adn-morph 11s ease-in-out infinite, adn-drift 17s ease-in-out infinite; }
.adn-blob.one { width: 110px; height: 96px; left: -40px; top: -46px; }
.adn-blob.two { width: 80px; height: 74px; right: 24%; bottom: -46px; animation-delay: -4s, -7s; background: var(--maroon-soft); }
.adn-blob.three { width: 74px; height: 66px; right: -24px; top: -22px; animation-delay: -2s, -3s; }
.adn-splat { position: absolute; right: 5%; top: 8px; z-index: 1; animation: adn-spin 26s linear infinite; }

/* Cities scroller: no box, no title, just a clean strip */
.adn-cities {
  overflow: hidden;
  padding: 2px 0;
}
.adn-cities-viewport {
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
}
.adn-cities-track {
  display: flex; width: max-content;
  animation: adn-cities-scroll 60s linear infinite;
}
.adn-cities-viewport:hover .adn-cities-track { animation-play-state: paused; }
.adn-city {
  display: inline-flex; align-items: center; gap: 6px;
  margin-right: 8px; padding: 3px 12px 3px 3px;
  border-radius: 999px; white-space: nowrap;
  background: var(--ivory);
  border: 1.5px solid var(--espresso);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.adn-city:hover { transform: translateY(-1px); box-shadow: 0 2px 0 var(--espresso); }
.adn-city-ico {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--offwhite); font-size: 12px; line-height: 1;
  font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
}
.adn-city b { font-family: var(--display); font-size: 15px; font-weight: 600; line-height: 1; }
/* every third pill gets the maroon treatment to match the hero */
.adn-city:nth-child(3n + 1) { background: var(--maroon); border-color: var(--maroon); color: var(--offwhite); }
.adn-city:nth-child(3n + 1) .adn-city-ico { background: var(--gold); }
@keyframes adn-cities-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* Buttons: flat, small */
.adn-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 6px 12px; border-radius: 999px;
  border: 1.5px solid var(--espresso);
  background: var(--gold); color: var(--espresso);
  font-size: 12.5px; font-weight: 700; cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.2s;
}
.adn-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 2px 0 var(--espresso); }
.adn-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
.adn-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.adn-btn.green { background: var(--espresso); color: var(--offwhite); }
.adn-btn.burgundy { background: var(--burgundy); color: var(--offwhite); border-color: var(--burgundy); }
.adn-btn.burgundy:hover:not(:disabled) { box-shadow: 0 2px 0 rgba(88,24,34,0.35); }
.adn-btn.maroon { background: var(--maroon); color: var(--offwhite); }
.adn-btn.cream { background: var(--offwhite); color: var(--espresso); }
.adn-btn.yellow { background: var(--ivory); color: var(--espresso); }
.adn-btn.ghost { background: transparent; color: var(--offwhite); border-color: rgba(251,248,242,0.7); }
.adn-btn.ghost:hover:not(:disabled) { box-shadow: 0 2px 0 rgba(251,248,242,0.5); }
.adn-btn.block { width: 100%; }
.adn-btn.small { padding: 3px 10px; font-size: 12px; }
.adn-spin { animation: adn-spin 0.8s linear infinite; }
.adn-spin-slow { animation: adn-spin 7s linear infinite; }

/* Cards */
.adn-card { background: var(--ivory); border-radius: 14px; padding: 10px; display: flex; flex-direction: column; }
.adn-panel { background: var(--offwhite); border-radius: 10px; padding: 12px; flex: 1; }
.adn-pop { animation: adn-pop 0.5s cubic-bezier(.2,1.2,.4,1) both; }

@keyframes adn-morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
}
@keyframes adn-drift {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(18px, 10px) rotate(14deg); }
}
@keyframes adn-spin { to { transform: rotate(360deg); } }
@keyframes adn-pop {
  from { opacity: 0; transform: translateY(14px) scale(0.97); }
  to { opacity: 1; transform: none; }
}
@keyframes adn-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* Stepper */
.adn-stepper { display: flex; align-items: center; padding: 2px 4px; }
.adn-step { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.adn-step:last-child { flex: none; }
.adn-step::after {
  content: ''; flex: 1; height: 1px; margin: 0 12px;
  background: var(--taupe); transition: background 0.3s;
}
.adn-step:last-child::after { display: none; }
.adn-step.done::after { background: var(--burgundy); }
.adn-dot {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  background: transparent; color: var(--espresso);
  border: 1px solid var(--taupe);
  transition: background 0.3s, border-color 0.3s;
}
.adn-step.on .adn-dot { background: var(--gold); border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,167,101,0.3); }
.adn-step.done .adn-dot { background: var(--burgundy); border-color: var(--burgundy); color: var(--offwhite); }
.adn-step-label { font-size: 12.5px; font-weight: 600; white-space: nowrap; opacity: 0.55; }
.adn-step.on .adn-step-label, .adn-step.done .adn-step-label { opacity: 1; }

/* Step heads */
.adn-card-head { display: flex; align-items: center; gap: 8px; padding: 0 4px 8px; flex-wrap: wrap; }
.adn-card-head h2 { margin: 0; font-size: 18px; color: var(--espresso); }
.adn-num {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--espresso); color: var(--offwhite);
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--display); font-weight: 600; font-size: 13px; flex-shrink: 0;
}
.adn-sub { margin: 0 0 8px; font-size: 12.5px; font-weight: 500; opacity: 0.8; }
.adn-hint { font-size: 12.5px; font-weight: 600; }

.adn-iconbtn { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 8px; display: inline-flex; transition: background 0.15s, transform 0.15s; }
.adn-iconbtn:hover { background: rgba(43,24,16,0.1); transform: rotate(-8deg) scale(1.1); }
.adn-iconbtn.danger:hover { background: rgba(92,16,32,0.12); }

/* Form */
.adn-toprow { display: flex; flex-direction: column; gap: 3px; margin-bottom: 10px; max-width: 360px; }
.adn-toprow label { font-size: 12px; font-weight: 600; }

.adn-textarea {
  width: 100%; min-height: 88px; resize: vertical;
  padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--taupe); background: var(--paper); color: var(--ink);
  font-family: inherit; font-size: 13px; font-weight: 500; line-height: 1.5; outline: none;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.adn-textarea:focus, .adn-input:focus, .adn-select:focus {
  border-color: var(--burgundy); box-shadow: 0 0 0 3px rgba(88,24,34,0.12);
}
.adn-error { margin: 8px 0 0; font-size: 12.5px; font-weight: 700; color: var(--maroon); }
.adn-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
.adn-foot p { margin: 0; font-size: 12px; font-weight: 500; opacity: 0.7; }

.adn-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
.adn-field label { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; font-size: 12px; font-weight: 600; }
.adn-field .wrap { position: relative; }
.adn-field .wrap svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.adn-input {
  width: 100%; padding: 5px 12px 5px 30px; border-radius: 999px;
  border: 1px solid var(--taupe); background: var(--paper); color: var(--ink);
  font-family: inherit; font-size: 13px; font-weight: 600; outline: none;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.adn-select {
  width: 100%; max-width: 360px; padding: 6px 14px; border-radius: 999px;
  border: 1px solid var(--taupe); background: var(--paper); color: var(--ink);
  font-family: inherit; font-size: 13px; font-weight: 600; outline: none;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.adn-alert { margin-top: 10px; padding: 7px 12px; border-radius: 10px; background: var(--maroon); color: var(--offwhite); font-size: 12.5px; font-weight: 600; animation: adn-shake 0.4s ease; }

/* Loader + notice */
.adn-cooking { background: var(--espresso); color: var(--offwhite); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.adn-cooking .adn-display { font-size: clamp(17px, 2vw, 21px); text-align: center; animation: adn-pop 0.5s ease both; }
.adn-bounce { display: flex; gap: 6px; }
.adn-bounce i { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); animation: adn-bounce 0.9s ease-in-out infinite; }
.adn-bounce i:nth-child(2) { animation-delay: 0.15s; background: var(--maroon-soft); }
.adn-bounce i:nth-child(3) { animation-delay: 0.3s; background: var(--offwhite); }
.adn-note { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: var(--offwhite); border: 1.5px dashed var(--espresso); font-size: 12.5px; font-weight: 600; }

/* Variations */
.adn-var-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
.adn-var-grid.single { grid-template-columns: minmax(0, 1fr); }
.adn-count { padding: 2px 9px; border-radius: 999px; background: var(--espresso); color: var(--offwhite); font-size: 12px; font-weight: 600; }
.adn-vcard {
  background: var(--ivory); border-radius: 14px; padding: 10px;
  display: flex; flex-direction: column; gap: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
  animation: adn-pop 0.5s cubic-bezier(.2,1.2,.4,1) both;
}
.adn-vcard:nth-child(2) { animation-delay: 0.1s; }
.adn-vcard:hover { transform: translateY(-2px); }
.adn-vcard.sel { box-shadow: 0 0 0 2px var(--offwhite), 0 0 0 4px var(--accent); }
.adn-vtop { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.adn-tag { padding: 2px 9px; border-radius: 999px; background: var(--accent); color: var(--offwhite); font-size: 12px; font-weight: 600; }
.adn-score { display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 999px; background: var(--offwhite); color: var(--accent); font-size: 12px; font-weight: 700; }
.adn-vcard h3 { margin: 6px 2px 0; font-size: 20px; color: var(--accent); }
.adn-vlabel { margin: 2px 2px 0; font-size: 12px; font-weight: 700; }
.adn-expl { margin: 5px 2px 0; font-size: 12.5px; font-weight: 500; line-height: 1.5; color: var(--ink); }
.adn-chips { display: flex; flex-wrap: wrap; gap: 5px; margin: 6px 2px 0; }
.adn-chips span { font-size: 12px; font-weight: 600; padding: 2px 9px; border-radius: 999px; background: var(--offwhite); }
.adn-cost { display: flex; justify-content: space-between; align-items: flex-end; gap: 8px; padding: 0 2px; flex-wrap: wrap; }
.adn-cost-group { display: flex; gap: 16px; }
.adn-cost small { display: block; font-size: 12px; font-weight: 600; opacity: 0.7; }
.adn-cost strong { display: block; margin-top: 1px; font-family: var(--display); font-weight: 600; font-size: 19px; line-height: 1; }
.adn-selected-flag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; animation: adn-pop 0.4s ease both; }
.adn-days { background: var(--offwhite); border-radius: 10px; padding: 8px; max-height: 360px; overflow-y: auto; }
.adn-days-title { margin: 0 0 6px; font-size: 12px; font-weight: 700; }
.adn-days-title em { font-style: normal; font-weight: 500; margin-left: 8px; color: var(--maroon); }
.adn-stack { display: flex; flex-direction: column; gap: 5px; }
.adn-day { border-radius: 10px; background: var(--paper); border: 1.5px solid rgba(43,24,16,0.14); overflow: hidden; }
.adn-day-head { width: 100%; display: flex; align-items: center; gap: 8px; padding: 5px 10px; background: transparent; border: none; cursor: pointer; text-align: left; color: var(--espresso); }
.adn-day-head.open { border-bottom: 1.5px solid rgba(43,24,16,0.1); }
.adn-day-no { width: 18px; height: 18px; border-radius: 50%; background: var(--espresso); color: var(--offwhite); display: inline-flex; align-items: center; justify-content: center; font-family: var(--display); font-weight: 600; font-size: 12px; flex-shrink: 0; }
.adn-day-title { flex: 1; font-size: 12.5px; font-weight: 700; color: var(--ink); }
.adn-day-body { padding: 7px 9px 9px; display: flex; flex-direction: column; gap: 5px; }
.adn-act { display: flex; align-items: flex-start; gap: 8px; padding: 4px 8px; border-radius: 8px; background: rgba(201,167,101,0.2); border: 1.5px solid transparent; animation: adn-slide 0.3s ease both; }
.adn-act.editing { background: #fff; border-color: var(--gold); }
.adn-act-ico { width: 18px; height: 18px; border-radius: 50%; background: var(--paper); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.adn-act-copy { flex: 1; min-width: 0; }
.adn-act-copy small { display: block; margin-top: 3px; color: #74675b; font-size: 11.5px; line-height: 1.45; }
.adn-act p { margin: 0; flex: 1; font-size: 12.5px; font-weight: 500; line-height: 1.45; color: var(--ink); }
.adn-act-tools { display: flex; gap: 2px; flex-shrink: 0; }
.adn-inline-input { flex: 1; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--taupe); background: #fff; font-family: inherit; font-size: 12.5px; font-weight: 600; color: var(--ink); outline: none; }
.adn-inline-input.title { border-color: var(--taupe); }
.adn-inline-input:focus { border-color: var(--burgundy); }
.adn-add { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 4px 10px; border-radius: 999px; border: 1.5px dashed var(--espresso); background: transparent; color: var(--espresso); font-size: 12.5px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.adn-add:hover { background: rgba(43,24,16,0.08); }
.adn-add-row { display: flex; align-items: center; gap: 6px; padding: 3px 8px; border-radius: 999px; background: #fff; border: 1.5px solid var(--gold); }
.adn-add-row input { flex: 1; border: none; outline: none; background: transparent; font-family: inherit; font-size: 12.5px; font-weight: 600; color: var(--ink); }

/* Approval bar */
.adn-approval {
  position: sticky; bottom: 12px; z-index: 30;
  background: var(--maroon); color: var(--offwhite);
  border-radius: 14px; padding: 8px 14px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  box-shadow: 0 0 0 2px var(--offwhite), 0 8px 20px rgba(30,17,11,0.25);
  animation: adn-rise-bar 0.4s cubic-bezier(.2,1.2,.4,1) both;
}
.adn-approval h4 { margin: 0; font-size: 17px; }
.adn-approval p { margin: 2px 0 0; font-size: 12px; font-weight: 500; opacity: 0.9; max-width: 34em; }
.adn-approval-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }

/* Toast */
.adn-toast { position: fixed; bottom: 20px; right: 20px; z-index: 999; display: flex; align-items: center; gap: 8px; min-width: 240px; max-width: 340px; padding: 8px 14px; border-radius: 12px; border: 1.5px solid var(--ink); font-size: 12.5px; font-weight: 600; animation: adn-toast-in 0.4s cubic-bezier(.2,1.3,.4,1) both; }
.adn-toast.success { background: var(--espresso); color: var(--offwhite); }
.adn-toast.draft { background: var(--ivory); color: var(--espresso); }
.adn-toast.error, .adn-toast.reject { background: var(--maroon); color: var(--offwhite); }
.adn-toast p { margin: 0; flex: 1; }
.adn-toast button { background: none; border: none; cursor: pointer; padding: 2px; display: flex; color: inherit; }

@keyframes adn-slide { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: none; } }
@keyframes adn-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes adn-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
@keyframes adn-toast-in { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
@keyframes adn-rise-bar { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }

@media (max-width: 860px) { .adn-var-grid { grid-template-columns: minmax(0, 1fr); } .adn-hero { padding: 14px 16px 16px; } }
@media (max-width: 640px) {
  .adn-fields { grid-template-columns: 1fr; }
  .adn-approval-actions { justify-content: flex-start; }
  .adn-step:not(.on) .adn-step-label { display: none; }
  .adn-step::after { margin: 0 8px; }
}
@media (prefers-reduced-motion: reduce) {
  .adn-root *, .adn-root *::before, .adn-root *::after, .adn-toast { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
  .adn-cities-viewport { overflow-x: auto; -webkit-mask-image: none; mask-image: none; }
  .adn-cities-track { animation: none !important; }
}
`

// ── Decorative pieces ─────────────────────────────────────────────────────────

function Splat({ className = '', size = 120, color = '#C9A765' }) {
  return (
    <svg className={className} viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
      <g fill={color}>
        <circle cx="100" cy="100" r="44" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
          <ellipse
            key={a}
            cx="100"
            cy="32"
            rx="16"
            ry={a % 90 === 0 ? 34 : 22}
            transform={`rotate(${a} 100 100)`}
          />
        ))}
      </g>
    </svg>
  )
}

function CookingPanel() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI(p => (p + 1) % COOKING_LINES.length), 1800)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="adn-cooking" role="status" aria-live="polite">
      <Splat size={36} color="#C9A765" className="adn-spin-slow" />
      <p key={i} className="adn-display">{COOKING_LINES[i]}</p>
      <div className="adn-bounce" aria-hidden="true"><i /><i /><i /></div>
    </div>
  )
}

// Auto-scrolling strip of major tourism cities (UI only, no title, no box)
function CitiesScroller() {
  // Rendered twice so the loop is seamless (the track moves -50%).
  const loop = [...CITIES, ...CITIES]

  return (
    <section className="adn-cities" aria-label="Popular tourism cities in India">
      <div className="adn-cities-viewport">
        <div className="adn-cities-track">
          {loop.map(([city, icon], i) => (
            <div
              key={`${city}-${i}`}
              className="adn-city"
              aria-hidden={i >= CITIES.length ? 'true' : undefined}
            >
              <span className="adn-city-ico" aria-hidden="true">{icon}</span>
              <b>{city}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  return (
    <div className={`adn-toast ${type}`} role="status">
      {type === 'success' && <CheckCircle size={16} />}
      {type === 'draft' && <Save size={16} />}
      {type !== 'success' && type !== 'draft' && <XCircle size={16} />}

      <p>{message}</p>

      <button onClick={onClose} aria-label="Dismiss">
        <X size={13} />
      </button>
    </div>
  )
}

// ── Editable Day Card ─────────────────────────────────────────────────────────

function EditableDayCard({
  dayData,
  dayIndex,
  onUpdateTitle,
  onUpdateActivity,
  onDeleteActivity,
  onAddActivity,
}) {
  const [expanded, setExpanded] = useState(dayIndex < 2)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingIdx, setEditingIdx] = useState(null)
  const [titleVal, setTitleVal] = useState(dayData.title)
  const [activityVals, setActivityVals] = useState([
    ...dayData.activities.map(activity =>
      typeof activity === 'string' ? activity : activity.name || 'Activity'
    ),
  ])
  const [newActivity, setNewActivity] = useState('')
  const [addingNew, setAddingNew] = useState(false)

  const saveTitle = () => {
    onUpdateTitle(dayIndex, titleVal)
    setEditingTitle(false)
  }

  const saveActivity = (actIdx) => {
    onUpdateActivity(
      dayIndex,
      actIdx,
      activityVals[actIdx]
    )
    setEditingIdx(null)
  }

  const handleAddActivity = () => {
    if (!newActivity.trim()) return

    onAddActivity(dayIndex, newActivity.trim())

    setActivityVals(prev => [
      ...prev,
      newActivity.trim(),
    ])

    setNewActivity('')
    setAddingNew(false)
  }

  return (
    <div className="adn-day">
      {/* Day header */}

      <div className={`adn-day-head ${expanded ? 'open' : ''}`}>
        <span className="adn-day-no">{dayData.day}</span>

        {editingTitle ? (
          <input
            autoFocus
            className="adn-inline-input title"
            value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e =>
              e.key === 'Enter' && saveTitle()
            }
          />
        ) : (
          <span
            className="adn-day-title"
            style={{ cursor: 'text' }}
            onClick={() => setEditingTitle(true)}
          >
            {titleVal}
          </span>
        )}

        <button
          className="adn-iconbtn"
          onClick={() => setEditingTitle(true)}
          title="Edit day title"
        >
          <Edit3 size={12} color="#2B1810" />
        </button>

        <button
          className="adn-iconbtn"
          onClick={() => setExpanded(p => !p)}
          aria-label={expanded ? 'Collapse day' : 'Expand day'}
        >
          {expanded ? (
            <ChevronUp size={13} color="#2B1810" />
          ) : (
            <ChevronDown size={13} color="#2B1810" />
          )}
        </button>
      </div>

      {/* Activities */}

      {expanded && (
        <div className="adn-day-body">
          {activityVals.map((activity, actIdx) => (
            <div
              key={actIdx}
              className={`adn-act ${editingIdx === actIdx ? 'editing' : ''}`}
              style={{ animationDelay: `${actIdx * 45}ms` }}
            >
              <div className="adn-act-ico">
                {timeIcons[actIdx % 3]}
              </div>

              {editingIdx === actIdx ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                  }}
                >
                  <input
                    autoFocus
                    className="adn-inline-input"
                    value={activityVals[actIdx]}
                    onChange={e => {
                      const copy = [...activityVals]
                      copy[actIdx] = e.target.value
                      setActivityVals(copy)
                    }}
                    onKeyDown={e =>
                      e.key === 'Enter' &&
                      saveActivity(actIdx)
                    }
                  />

                  <button
                    className="adn-iconbtn"
                    onClick={() => saveActivity(actIdx)}
                    aria-label="Save activity"
                  >
                    <Check size={13} color="#2B1810" />
                  </button>
                </div>
              ) : (
                <div className="adn-act-copy">
                  <p>{activity}</p>
                  {dayData.activities[actIdx]?.description && (
                    <small>{dayData.activities[actIdx].description}</small>
                  )}
                </div>
              )}

              {editingIdx !== actIdx && (
                <div className="adn-act-tools">
                  <button
                    className="adn-iconbtn"
                    onClick={() =>
                      setEditingIdx(actIdx)
                    }
                    aria-label="Edit activity"
                  >
                    <Edit3 size={11} color="#2B1810" />
                  </button>

                  <button
                    className="adn-iconbtn danger"
                    onClick={() => {
                      const copy =
                        activityVals.filter(
                          (_, i) => i !== actIdx
                        )

                      setActivityVals(copy)

                      onDeleteActivity(
                        dayIndex,
                        actIdx
                      )
                    }}
                    aria-label="Delete activity"
                  >
                    <Trash2 size={11} color="#5C1020" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add activity */}

          {addingNew ? (
            <div className="adn-add-row">
              <Plus size={12} color="#A9803A" />

              <input
                autoFocus
                value={newActivity}
                onChange={e =>
                  setNewActivity(e.target.value)
                }
                onKeyDown={e => {
                  if (e.key === 'Enter')
                    handleAddActivity()

                  if (e.key === 'Escape')
                    setAddingNew(false)
                }}
                placeholder="Type new activity and press Enter..."
              />

              <button
                className="adn-btn small green"
                onClick={handleAddActivity}
              >
                Add
              </button>

              <button
                className="adn-iconbtn"
                onClick={() => setAddingNew(false)}
                aria-label="Cancel"
              >
                <X size={12} color="#2B1810" />
              </button>
            </div>
          ) : (
            <button
              className="adn-add"
              onClick={() => setAddingNew(true)}
            >
              <Plus size={12} />
              Add activity
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Variation Card ────────────────────────────────────────────────────────────

function VariationCard({
  variation,
  onSelect,
  selected,
  onDaysChange,
}) {
  const [localDays, setLocalDays] = useState(
    variation.days.map(d => ({
      ...d,
      activities: [...d.activities],
    }))
  )

  const updateTitle = (dayIdx, val) => {
    const copy = [...localDays]

    copy[dayIdx] = {
      ...copy[dayIdx],
      title: val,
    }

    setLocalDays(copy)
    onDaysChange(copy)
  }

  const updateActivity = (
    dayIdx,
    actIdx,
    val
  ) => {
    const copy = [...localDays]

    const current = copy[dayIdx].activities[actIdx]
    copy[dayIdx].activities[actIdx] = typeof current === 'string'
      ? val
      : { ...current, name: val }

    setLocalDays(copy)
    onDaysChange(copy)
  }

  const deleteActivity = (
    dayIdx,
    actIdx
  ) => {
    const copy = [...localDays]

    copy[dayIdx].activities =
      copy[dayIdx].activities.filter(
        (_, i) => i !== actIdx
      )

    setLocalDays(copy)
    onDaysChange(copy)
  }

  const addActivity = (
    dayIdx,
    activity
  ) => {
    const copy = [...localDays]

    copy[dayIdx].activities = [
      ...copy[dayIdx].activities,
      activity,
    ]

    setLocalDays(copy)
    onDaysChange(copy)
  }

  const [expandedDays, setExpandedDays] =
    useState([0])

  const toggleDay = i => {
    setExpandedDays(p =>
      p.includes(i)
        ? p.filter(d => d !== i)
        : [...p, i]
    )
  }

  // UI-only accent: espresso for budget, deep maroon for experience.
  const accent = variation.type === 'budget' ? '#2B1810' : '#6B1426'

  return (
    <div
      className={`adn-vcard ${selected ? 'sel' : ''}`}
      style={{ '--accent': accent }}
    >
      {/* Header */}

      <div>
        <div className="adn-vtop">
          <span className="adn-tag">Version {variation.id}</span>

          <span className="adn-score">
            <Star size={11} fill="currentColor" />
            {variation.score}
          </span>
        </div>

        <h3 className="adn-display">{variation.title}</h3>
        <p className="adn-vlabel">{variation.scoreLabel}</p>
        <p className="adn-expl">{variation.explanation}</p>

        <div className="adn-chips">
          {variation.highlights.map(
            (h, index) => (
              <span key={`${h}-${index}`}>{h}</span>
            )
          )}
        </div>
      </div>

      {/* Cost row */}

      <div className="adn-cost">
        <div className="adn-cost-group">
          <div>
            <small>Total cost</small>
            <strong>{variation.totalCost}</strong>
          </div>

          <div>
            <small>Duration</small>
            <strong>{localDays.length} Days</strong>
          </div>
        </div>

        {selected && (
          <span className="adn-selected-flag">
            <CheckCircle size={14} />
            Selected for editing
          </span>
        )}
      </div>

      {/* Day-by-day */}

      <div className="adn-days">
        <p className="adn-days-title">
          {selected
            ? 'Edit day-by-day plan'
            : 'Day-by-day plan'}

          {selected && (
            <em>Click any activity to edit</em>
          )}
        </p>

        {selected ? (
          <div className="adn-stack">
            {localDays.map((day, i) => (
              <EditableDayCard
                key={i}
                dayData={day}
                dayIndex={i}
                onUpdateTitle={updateTitle}
                onUpdateActivity={
                  updateActivity
                }
                onDeleteActivity={
                  deleteActivity
                }
                onAddActivity={addActivity}
              />
            ))}
          </div>
        ) : (
          <div className="adn-stack">
            {localDays.map((day, i) => (
              <div key={i} className="adn-day">
                <button
                  className={`adn-day-head ${expandedDays.includes(i) ? 'open' : ''}`}
                  onClick={() =>
                    toggleDay(i)
                  }
                >
                  <span className="adn-day-no">{day.day}</span>

                  <span className="adn-day-title">{day.title}</span>

                  {expandedDays.includes(i) ? (
                    <ChevronUp size={13} color="#2B1810" />
                  ) : (
                    <ChevronDown size={13} color="#2B1810" />
                  )}
                </button>

                {expandedDays.includes(i) && (
                  <div className="adn-day-body">
                    {day.activities.map(
                      (act, ai) => (
                        <div
                          key={ai}
                          className="adn-act"
                          style={{ animationDelay: `${ai * 45}ms` }}
                        >
                          <div className="adn-act-ico">
                            {timeIcons[ai % 3]}
                          </div>

                          <div className="adn-act-copy">
                            <p>{typeof act === 'string' ? act : `${act.name}${act.location ? ` — ${act.location}` : ''}`}</p>
                            {typeof act !== 'string' && act.description && (
                              <small>{act.description}</small>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Select */}

      <button
        className={`adn-btn block ${selected ? 'cream' : ''}`}
        style={{
          background: selected ? undefined : accent,
          color: selected ? accent : '#FBF8F2',
        }}
        onClick={() =>
          onSelect(variation.id)
        }
      >
        {selected ? (
          <>
            <CheckCircle size={14} />
            Editing version {variation.id}
          </>
        ) : (
          <>Select &amp; edit version {variation.id}</>
        )}
      </button>
    </div>
  )
}

// ── Approval Bar ──────────────────────────────────────────────────────────────

function ApprovalBar({ selectedId, onApprove, onDraft, onReject, onDownloadPDF, loading, pdfLoading, leadSelected }) {
  return (
    <div className="adn-approval">
      <div>
        <h4 className="adn-display">
          Ready to finalise version {selectedId}?
        </h4>

        <p>
          Approve to save to the lead, save as draft to revisit later, or reject to start over.
        </p>
      </div>

      <div className="adn-approval-actions">
        <button
          className="adn-btn cream"
          onClick={onDownloadPDF}
          disabled={loading || pdfLoading || !leadSelected}
        >
          {pdfLoading ? (
            <>
              <Loader size={13} className="adn-spin" />
              Preparing PDF...
            </>
          ) : (
            <>
              <Download size={14} />
              Download PDF
            </>
          )}
        </button>

        <button
          className="adn-btn ghost"
          onClick={onReject}
          disabled={loading}
        >
          <XCircle size={14} />
          Reject
        </button>

        <button
          className="adn-btn yellow"
          onClick={onDraft}
          disabled={loading || !leadSelected}
        >
          <Save size={14} />
          Save as draft
        </button>

        <button
          className="adn-btn"
          onClick={onApprove}
          disabled={loading || !leadSelected}
        >
          {loading ? (
            <>
              <Loader size={13} className="adn-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              Approve
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function Itinerary() {
  // Lead context — read from /itinerary?leadId=...
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const leadId   = params.get('leadId')
  const itineraryId = params.get('itineraryId')
  const [lead, setLead] = useState(null)
  const [leads, setLeads] = useState([])
  const [selectedLeadId, setSelectedLeadId] = useState(leadId || '')
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadError, setLeadError] = useState('')

  const [rawQuery, setRawQuery]           = useState('')
  const [parsed, setParsed]               = useState(null)
  const [variations, setVariations]       = useState(null)
  const [previousVariations, setPreviousVariations] = useState(null)
  const [selectedId, setSelectedId]       = useState(null)
  const [editedDays, setEditedDays]       = useState({})
  const [parsing, setParsing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [parseError, setParseError]       = useState(null)
  const [generationError, setGenerationError] = useState(null)
  const [toast, setToast]                 = useState(null)
  const [isRegenerate, setIsRegenerate]   = useState(false)


  const exampleQuery = `Customer: Priya Sharma\nMessage: Hi, we're a honeymoon couple planning a trip to Bali in late December. Our budget is around ₹85,000 for 2 people for 7 nights. We love beaches, spa treatments, romantic dinners, and some cultural sightseeing. Would prefer private experiences where possible. Can you suggest a good itinerary?`

  // Load leads for sidebar access, where the user must select a customer.
  useEffect(() => {
    let cancelled = false
    const loadLeads = async () => {
      setLeadsLoading(true)
      setLeadError('')
      try {
        const res = await api.get('/leads')
        const data = Array.isArray(res.data) ? res.data : (res.data?.leads || res.data?.data || [])
        if (!cancelled) {
          setLeads(Array.isArray(data) ? data : [])
          if (leadId) {
            const matched = data.find(item => String(item.id) === String(leadId))
            if (matched) setLead(matched)
          }
        }
      } catch {
        if (!cancelled) setLeadError('Could not load customers. Please refresh and try again.')
      } finally {
        if (!cancelled) setLeadsLoading(false)
      }
    }
    loadLeads()
    return () => { cancelled = true }
  }, [leadId])

  // Load a lead passed through the URL and prefill its inquiry.
  useEffect(() => {
    if (!leadId) return
    setSelectedLeadId(String(leadId))
    getLeadById(leadId)
      .then(res => {
        setLead(res.data)
        setRawQuery(res.data.inquiry_text || res.data.inquiryMessage || '')
      })
      .catch(() => {
        setLeadError('Could not load the selected customer.')
      })
  }, [leadId])

  const handleLeadChange = async (value) => {
    setSelectedLeadId(value)
    setLeadError('')
    setParsed(null)
    setVariations(null)
    setSelectedId(null)
    if (!value) {
      setLead(null)
      setRawQuery('')
      return
    }
    const matchingLead = leads.find(item => String(item.id) === String(value))
    setLead(matchingLead || null)
    if (matchingLead) {
      setRawQuery(matchingLead.inquiry_text || matchingLead.inquiryMessage || matchingLead.message || '')
    }
    try {
      const res = await getLeadById(value)
      setLead(res.data)
      setRawQuery(res.data.inquiry_text || res.data.inquiryMessage || res.data.message || matchingLead?.inquiry_text || '')
    } catch {
      if (!matchingLead) setLeadError('Could not load the selected customer details.')
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })

    setTimeout(
      () => setToast(null),
      4000
    )
  }

  // ── Parse ──────────────────────────────────────────────────────────────────

  const handleParse = async () => {
    if (!rawQuery.trim()) {
      setParseError(
        'Please enter a customer inquiry first.'
      )
      return
    }

    try {
      setParsing(true)
      setParseError(null)

      const res = await api.post(
        '/ai/parse-query',
        {
          message: rawQuery,
        }
      )

      setParsed(res.data)
    } catch (error) {
      console.error(
        'Parse query failed:',
        error
      )

      setParsed(null)

      setParseError(
        'Unable to parse the customer inquiry. Please check that the backend is running.'
      )
    } finally {
      setParsing(false)
    }
  }

  // ── Generate ───────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!parsed) {
      setGenerationError('Please parse the customer inquiry before generating an itinerary.');
      return;
    }

    if (!parsed.destination || !parsed.duration_days || !parsed.budget_total) {
      setGenerationError('Destination, duration, and budget are required. Please review the extracted fields.');
      return;
    }

    try {
      setGenerating(true);
      setGenerationError(null);

      if (variations) {
        setPreviousVariations(variations);
      }

      setSelectedId(null);
      setEditedDays({});

      // The backend mounts aiRoutes at /api/ai and exposes /generate-itinerary.
      const res = await api.post('/ai/generate-itinerary', {
        ...parsed,
        duration_days: Number(parsed.duration_days),
        budget_total: Number(parsed.budget_total),
        group_size: Number(parsed.group_size || 2),
        interests: Array.isArray(parsed.interests)
          ? parsed.interests
          : typeof parsed.interests === 'string'
            ? parsed.interests.split(',').map(item => item.trim()).filter(Boolean)
            : [],
      });

      console.log('AI GENERATION RESPONSE:', res.data);

      // aiController returns { output_id, variations, ranked, explanation }.
      const options = Array.isArray(res.data?.variations)
        ? res.data.variations
        : [];

      if (options.length === 0) {
        throw new Error('The backend response did not contain any valid itinerary variations.');
      }

      const interests = Array.isArray(parsed.interests)
        ? parsed.interests
        : typeof parsed.interests === 'string'
          ? parsed.interests.split(',').map(item => item.trim()).filter(Boolean)
          : [];

      const formattedVariations = options.map((option, index) => {
        const isBudget = option.type === 'budget';
        const itinerary = option.itinerary || {};
        const sourceDays = Array.isArray(itinerary.days) ? itinerary.days : [];

        if (sourceDays.length === 0) {
          throw new Error(`The ${option.type || `variation ${index + 1}`} itinerary contains no days.`);
        }

        const days = sourceDays.map((day, dayIndex) => ({
          ...day,
          day: Number(day.day ?? day.day_number ?? dayIndex + 1),
          title: day.title || day.activities?.[0]?.name || `Day ${dayIndex + 1}`,
          activities: Array.isArray(day.activities)
            ? day.activities.map(activity =>
                typeof activity === 'string' ? { name: activity } : activity
              )
            : [],
        }));

        const totalCost = sourceDays.reduce(
          (sum, day) => sum + Number(day.estimated_cost || 0),
          0
        );

        return {
          id: option.type || `version-${index + 1}`,
          type: option.type || 'standard',
          title: isBudget ? 'Budget Optimised' : 'Experience Optimised',
          score: isBudget ? 88 : 92,
          scoreLabel: isBudget ? 'Budget Focused' : 'Experience Focused',
          scoreColor: isBudget ? '#0369a1' : '#7c3aed',
          scoreBg: isBudget ? '#eff6ff' : '#f5f3ff',
          explanation: isBudget
            ? 'Designed to maximise value while staying within the available budget.'
            : 'Designed to prioritise memorable experiences while respecting the budget.',
          totalCost: `₹${totalCost.toLocaleString('en-IN')}`,
          highlights: interests,
          days,
          // Preserve the raw generated itinerary and AI log ID for downstream actions.
          itinerary,
          output_id: res.data?.output_id ?? null,
        };
      });

      setVariations(formattedVariations);
      setIsRegenerate(false);
      console.log('FORMATTED VARIATIONS:', formattedVariations);
    } catch (error) {
      console.error('Itinerary generation failed:', error);
      setVariations([]);
      setGenerationError(
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        'Unable to generate itinerary options. Please check the backend and try again.'
      );
    } finally {
      setGenerating(false);
    }
  };

  // ── PDF download ───────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!selectedLeadId) {
      showToast('Please select a customer before downloading the itinerary PDF.', 'error')
      return
    }

    const finalDays =
      editedDays[selectedId] ||
      variations?.find(v => v.id === selectedId)?.days

    if (!finalDays?.length) {
      showToast('Select a valid itinerary before downloading its PDF.', 'error')
      return
    }

    try {
      setPdfLoading(true)

      // Save the selected version as a draft first so the PDF endpoint receives a database ID.
      const saveResponse = await api.post('/itinerary/save', {
        title: finalDays?.[0]?.title
          ? `Travel Itinerary - ${finalDays[0].title}`
          : 'Travel Itinerary',

        leadId: selectedLeadId,

        days: finalDays.map((day, index) => ({
          ...day,
          day_number: Number(day.day_number ?? day.day ?? index + 1),
        })),

        status: 'draft',
      })

      const savedData = saveResponse.data?.itinerary || saveResponse.data?.data || saveResponse.data
      const itineraryId = savedData?.id ?? savedData?.itinerary_id ?? savedData?.itineraryId

      if (!itineraryId) {
        throw new Error('The save endpoint did not return an itinerary ID.')
      }

      const pdfResponse = await api.post(
        '/pdf/itinerary',
        { itinerary_id: itineraryId },
        { responseType: 'blob' }
      )

      const blob = new Blob([pdfResponse.data], { type: 'application/pdf' })
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `itinerary-${itineraryId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)

      showToast('Itinerary PDF downloaded successfully.')
    } catch (error) {
      console.error('Itinerary PDF download failed:', error)
      showToast(
        error.response?.data?.message || error.message || 'Could not generate the itinerary PDF. Please try again.',
        'error'
      )
    } finally {
      setPdfLoading(false)
    }
  }

  // ── Approval actions ───────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!selectedLeadId) {
      showToast('Please select a customer before approving an itinerary.', 'error')
      return
    }

    const selectedVariation = variations?.find(
      v => v.id === selectedId
    )

    const finalDays =
      editedDays[selectedId] || selectedVariation?.days

    if (!finalDays?.length) {
      showToast('Select a valid itinerary before approving.', 'error')
      return
    }

    try {
      setApproving(true)

      // 1. Save the selected itinerary and retrieve its database ID.
      const saveResponse = await api.post('/itinerary/save', {
        leadId: Number(selectedLeadId),
        title: selectedVariation?.title || 'Travel Itinerary',
        days: finalDays.map((day, index) => ({
          ...day,
          day_number: Number(day.day_number ?? day.day ?? index + 1),
        })),
        status: 'approved',
      })

      const savedData =
        saveResponse.data?.itinerary ||
        saveResponse.data?.data ||
        saveResponse.data

      const savedItineraryId = Number(
        savedData?.id ?? savedData?.itinerary_id ?? savedData?.itineraryId
      )

      if (!Number.isInteger(savedItineraryId) || savedItineraryId <= 0) {
        throw new Error('The itinerary was saved, but its ID was not returned.')
      }

      // 2. Create the booking. The backend creates its required internal
      // quotation record automatically, so the frontend does not call /quotation.
      await api.post('/bookings', {
        leadId: Number(selectedLeadId),
        itineraryId: savedItineraryId,
      })

      // 3. The Bookings page loads the newly created booking and lead details.
      navigate('/bookings')
    } catch (error) {
      console.error('Booking approval failed:', error)
      showToast(
        error.response?.data?.message ||
          error.message ||
          'Could not complete the booking. Please try again.',
        'error'
      )
    } finally {
      setApproving(false)
    }
  }

  const handleDraft = async () => {
    if (!selectedLeadId) {
      showToast('Please select a customer before saving a draft.', 'error')
      return
    }

    const finalDays =
      editedDays[selectedId] ||
      variations?.find(v => v.id === selectedId)?.days

    if (!finalDays?.length) {
      showToast('Select a valid itinerary before saving a draft.', 'error')
      return
    }

    try {
      setApproving(true)
      const selectedVariation = variations?.find(
        v => v.id === selectedId
      )

      await api.post('/itinerary/save', {
        leadId: selectedLeadId,
        title: selectedVariation?.title || 'Travel Itinerary',
        days: finalDays.map((day, index) => ({
          ...day,
          day_number: Number(day.day_number ?? day.day ?? index + 1),
        })),
        status: 'draft',
      })

      navigate(`/leads/${selectedLeadId}`, { state: { saved: true } })
    } catch {
      showToast('Could not save the draft. Please try again.', 'error')
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    try {
      await api.post('/ai/feedback', { action: 'reject', versionId: selectedId })
    } catch {}
    showToast('Itinerary rejected. You can regenerate with changes.', 'reject')
    setSelectedId(null)
  }

  const handleFieldChange = (
    field,
    value
  ) => {
    setParsed(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // Resolve the selected customer immediately from the list, even while details are loading.
  const selectedLead = lead || leads.find(item => String(item.id) === String(selectedLeadId)) || null
  const selectedLeadName = selectedLead
    ? (selectedLead.name || selectedLead.customer_name || selectedLead.customerName || `Lead #${selectedLead.id}`)
    : null

  // UI-only: which stage of the flow the person is on (drives the stepper).
  const stage = selectedId && variations?.length ? 4 : variations?.length ? 3 : parsed ? 2 : 1

  return (
    <div
      className="adn-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        isolation: 'isolate',
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: '10px',
      }}
    >
      <style>{css}</style>

      {/* Full-screen cream backdrop */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          backgroundColor: '#FBF8F2',
        }}
      />

      {/* Hero */}

      <header className="adn-hero">
        <div className="adn-blob one" aria-hidden="true" />
        <div className="adn-blob two" aria-hidden="true" />
        <div className="adn-blob three" aria-hidden="true" />
        <Splat className="adn-splat" size={48} />

        <h1 className="adn-display">
          {selectedLeadName ? `Building itinerary for ${selectedLeadName}` : 'Itinerary Builder'}
        </h1>
        <p>
          {selectedLead
            ? `Customer inquiry and itinerary options for Lead #${selectedLead.id}`
            : 'Select a customer, then parse their inquiry and generate personalised itinerary variations.'}
        </p>
      </header>

      {/* Tourism cities scroller */}

      <CitiesScroller />

      {/* Progress: all four steps in one row, joined by a thin line */}

      <nav className="adn-stepper" aria-label={`Step ${stage} of 4`}>
        {STAGE_LABELS.map((label, i) => {
          const n = i + 1
          const state = n === stage ? 'on' : n < stage ? 'done' : 'todo'
          return (
            <div
              key={n}
              className={`adn-step ${state}`}
              aria-current={n === stage ? 'step' : undefined}
            >
              <span className="adn-dot">{n < stage ? <Check size={11} /> : n}</span>
              <span className="adn-step-label">{label}</span>
            </div>
          )
        })}
      </nav>

      {/* ── Step 1: Customer + Inquiry (merged) ───────────────────────────── */}
      <div className="adn-card">
        <div className="adn-card-head">
          <span className="adn-num">1</span>
          <h2 className="adn-display">Customer inquiry</h2>
          <button
            className="adn-btn small cream"
            style={{ marginLeft: 'auto' }}
            onClick={() => setRawQuery(exampleQuery)}
          >
            Load example
          </button>
        </div>

        <div className="adn-panel">
          {/* Customer selection is needed when opening the builder without a lead in the URL. */}
          {!leadId && (
            <div className="adn-toprow">
              <label htmlFor="customer-select">Customer</label>
              <select
                id="customer-select"
                className="adn-select"
                value={selectedLeadId}
                onChange={e => handleLeadChange(e.target.value)}
                disabled={leadsLoading}
              >
                <option value="">{leadsLoading ? 'Loading customers...' : 'Choose a customer'}</option>
                {leads.map(item => (
                  <option key={item.id} value={String(item.id)}>
                    {item.name || item.customer_name || item.customerName || `Lead #${item.id}`} (Lead #{item.id})
                  </option>
                ))}
              </select>
              {leadError && <p className="adn-error" style={{ margin: '4px 0 0' }}>{leadError}</p>}
              {!leadsLoading && !leadError && leads.length === 0 && (
                <p className="adn-hint" style={{ margin: '4px 0 0' }}>
                  No customers found. Add a lead before saving an itinerary.
                </p>
              )}
            </div>
          )}

          <textarea
            className="adn-textarea"
            value={rawQuery}
            onChange={e => {
              setRawQuery(e.target.value)
              setParseError(null)
            }}
            placeholder="Paste the customer's WhatsApp message, email, or inquiry here..."
            rows={6}
          />

          {parseError && <p className="adn-error">{parseError}</p>}

          <div className="adn-foot">
            <p>
              {rawQuery.length} characters. AI will pull out destination, budget, preferences and more.
            </p>

            <button
              className="adn-btn burgundy"
              onClick={handleParse}
              disabled={parsing}
            >
              {parsing ? (
                <>
                  <Loader size={14} className="adn-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Parse query
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Step 2 */}

      {parsed && (
        <div className="adn-card adn-pop">
          <div className="adn-card-head">
            <span className="adn-num">2</span>

            <h2 className="adn-display">
              {isRegenerate
                ? 'Modify fields & regenerate'
                : 'Extracted fields'}
            </h2>

            <span
              className="adn-hint"
              style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <CheckCircle size={13} />
              AI parsed successfully. Review and edit if needed.
            </span>
          </div>

          <div className="adn-panel">
            <p className="adn-sub">
              Review the extracted details. Correct any field before generating.
            </p>

            <div className="adn-fields">
              {fieldConfig.map(
                ({
                  key,
                  label,
                  icon: Icon,
                  type,
                  placeholder,
                }) => (
                  <div key={key} className="adn-field">
                    <label>
                      {label}
                    </label>

                    <div className="wrap">
                      <input
                        className="adn-input"
                        type={type}
                        value={
                          parsed[key] ??
                          ''
                        }
                        placeholder={
                          placeholder
                        }
                        onChange={e =>
                          handleFieldChange(
                            key,
                            e.target.value
                          )
                        }
                      />
                      <Icon size={13} color="#2B1810" />
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Errors */}

            {generationError && (
              <div className="adn-alert" role="alert">
                {generationError}
              </div>
            )}

            {/* Buttons */}

            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              {variations && (
                <button
                  className="adn-btn cream"
                  onClick={() => {
                    setIsRegenerate(true)
                    handleGenerate()
                  }}
                  disabled={generating}
                >
                  <RefreshCw size={13} />
                  Regenerate with changes
                </button>
              )}

              <button
                className="adn-btn"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader size={14} className="adn-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    Generate itinerary
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generating */}

      {generating && <CookingPanel />}

      {/* Previous */}

      {previousVariations &&
        variations && (
          <div className="adn-note">
            <RotateCcw size={13} />
            Previous version replaced. Showing the newly generated itinerary below.
          </div>
        )}

      {/* Step 3 */}

      {variations && (
        <div>
          <div
            className="adn-card-head"
            style={{ padding: '0 4px 8px' }}
          >
            <span className="adn-num">3</span>

            <h2 className="adn-display" style={{ margin: 0, fontSize: '18px', color: '#2B1810' }}>
              Generated itinerary
            </h2>

            <span className="adn-count">
              {variations.length}{' '}
              {variations.length ===
              1
                ? 'version'
                : 'versions'}
            </span>

            {!selectedId && (
              <p className="adn-hint" style={{ margin: 0, marginLeft: 'auto' }}>
                Select a version to enable editing
              </p>
            )}
          </div>

          <div className={`adn-var-grid ${variations.length === 1 ? 'single' : ''}`}>
            {variations.map(
              variation => (
                <VariationCard
                  key={
                    variation.id
                  }
                  variation={
                    variation
                  }
                  selected={
                    selectedId ===
                    variation.id
                  }
                  onSelect={id =>
                    setSelectedId(
                      selectedId ===
                        id
                        ? null
                        : id
                    )
                  }
                  onDaysChange={
                    days =>
                      setEditedDays(
                        prev => ({
                          ...prev,
                          [variation.id]:
                            days,
                        })
                      )
                  }
                />
              )
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: Approval Bar ──────────────────────────────────────────── */}
      {selectedId && variations && (
        <ApprovalBar
          selectedId={selectedId}
          onApprove={handleApprove}
          onDraft={handleDraft}
          onReject={handleReject}
          onDownloadPDF={handleDownloadPDF}
          loading={approving}
          pdfLoading={pdfLoading}
          leadSelected={Boolean(selectedLeadId)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default Itinerary
