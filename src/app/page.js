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
