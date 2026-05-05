import Link from 'next/link';
import ToolPage from '../components/ToolPage';
import './home.css';

export const metadata = {
  title: 'Auxbox Tools — Free Online Tools',
  description:
    'Free online tools for students and professionals. QR code generator, CGPA calculator, and more.',
};

const TOOLS = [
  {
    href: '/cgpa-calculator',
    icon: '🎓',
    name: 'CGPA Calculator',
    description:
      'Calculate your cumulative GPA and CGPA with precision. Supports custom grade scales and saves your data locally.',
    cta: 'Open tool',
  },
  {
    href: '/qr-code-generator',
    icon: '⬛',
    name: 'QR Code Generator',
    description:
      'Generate offline QR codes instantly — with or without a logo. The QR code embeds your link directly, no internet needed to scan.',
    cta: 'Open tool',
  },
  {
    href: '/salary-raise-calculator',
    icon: '💰',
    name: 'Salary Raise Calculator',
    description:
      'See exactly what a raise looks like across hourly, weekly, monthly and annual pay. Edit any field and the rest update in real time.',
    cta: 'Open tool',
  },
  {
    href: '/password-generator',
    icon: '🔐',
    name: 'Password Generator',
    description:
      'Generate strong, cryptographically random passwords entirely in your browser. Tune length and character classes, see live entropy and strength.',
    cta: 'Open tool',
  },
  {
    href: '/wheel-spinner',
    icon: '🎯',
    name: 'Wheel Spinner',
    description:
      'Random picker for any list. Choose Quick Pick or a colourful Spin Wheel — fair (cryptographic randomness) and fully offline.',
    cta: 'Open tool',
  },
  {
    href: '/markdown-preview',
    icon: '📝',
    name: 'Markdown Preview',
    description:
      'Type GitHub-flavored markdown on the left, see safe rendered HTML on the right. Auto-saved, sanitized, and runs entirely in your browser.',
    cta: 'Open tool',
  },
  {
    href: '/markdown-to-pdf',
    icon: '📄',
    name: 'Markdown to PDF',
    description:
      'Type markdown, pick a print preset (default, academic, or minimal), and save as a clean paginated PDF — using your browser, no upload.',
    cta: 'Open tool',
  },
  {
    href: '/date-calculator',
    icon: '📅',
    name: 'Date Calculator',
    description:
      'Find the difference between two dates, or your age from a date — in years, months, days, weeks, hours, and working days. Calculated locally.',
    cta: 'Open tool',
  },
  {
    href: '/stopwatch',
    icon: '⏱️',
    name: 'Stopwatch',
    description:
      'Big-display stopwatch with laps, keyboard shortcuts, and a tab-title timer. Survives reload and runs entirely in your browser.',
    cta: 'Open tool',
  },
  {
    href: '/pomodoro-timer',
    icon: '🍅',
    name: 'Pomodoro Timer',
    description:
      'Focus timer with configurable work and break durations, daily history, sound cue, and optional desktop notifications. Runs entirely in your browser.',
    cta: 'Open tool',
  },
  {
    href: '/cron-explainer',
    icon: '⏰',
    name: 'Cron Expression Explainer',
    description:
      'Decode any cron expression into plain English and see the next 5 fire times in your local time zone. One-click presets for common patterns.',
    cta: 'Open tool',
  },
  {
    href: '/pdf-merger',
    icon: '📎',
    name: 'PDF Merger',
    description:
      'Combine multiple PDFs into one. Drag to reorder, optionally pick per-file page ranges, and download — files never leave your browser.',
    cta: 'Open tool',
  },
];

export default function Home() {
  return (
    <ToolPage
      title="Auxbox Tools"
      tagline="Free, simple tools that work — no sign-up, no nonsense."
    >
      <div className="home-tools-grid">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="home-tool-card">
            <div className="home-tool-icon">{tool.icon}</div>
            <h2 className="home-tool-name">{tool.name}</h2>
            <p className="home-tool-desc">{tool.description}</p>
            <span className="home-tool-cta">{tool.cta} →</span>
          </Link>
        ))}
      </div>
    </ToolPage>
  );
}
