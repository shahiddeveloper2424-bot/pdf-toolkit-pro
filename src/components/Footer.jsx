import { Link } from 'react-router-dom';
import { FileStack } from 'lucide-react';
import { tools } from '../data/tools.js';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-[#a7a2c0] mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center">
                <FileStack className="w-5 h-5 text-white" />
              </span>
              <span className="text-lg font-bold text-white tracking-tight">
                PDF Toolkit <span className="text-brand-200">Pro</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Professional PDF tools with real visual page previews — running
              entirely in your browser. Your files never leave your device.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.18em] mb-4">
              Tools
            </h4>
            <ul className="space-y-2.5">
              {tools.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    to={`/tools/${tool.slug}`}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.18em] mb-4">
              Private by design
            </h4>
            <p className="text-sm leading-relaxed">
              No backend, no database, no accounts. Every page you see is rendered
              on your own device.
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs">© 2026 PDF Toolkit Pro. All rights reserved.</p>
          <p className="text-xs">Made for people who value their privacy.</p>
        </div>
      </div>
    </footer>
  );
}
