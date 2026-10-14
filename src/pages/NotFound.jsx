import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="bg-white">
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <span className="inline-flex w-16 h-16 rounded-2xl bg-zinc-100 items-center justify-center mb-6">
          <FileQuestion className="w-8 h-8 text-zinc-500" />
        </span>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-3">
          Page not found
        </h1>
        <p className="text-zinc-600 mb-8">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
