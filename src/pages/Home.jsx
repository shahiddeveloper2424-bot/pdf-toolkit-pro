import Hero from '../components/Hero.jsx';
import ToolsGrid from '../components/ToolsGrid.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import PrivacySection from '../components/PrivacySection.jsx';
import Faq from '../components/Faq.jsx';

export default function Home() {
  return (
    <main>
      <Hero />
      <ToolsGrid />
      <HowItWorks />
      <PrivacySection />
      <Faq />
    </main>
  );
}
