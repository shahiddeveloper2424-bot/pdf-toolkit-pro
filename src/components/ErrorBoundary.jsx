import React from 'react';
import { TriangleAlert, RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Catches unexpected render/processing crashes so one failing tool
 * never blanks the whole application. Offers a retry without losing
 * the page.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <span className="inline-flex w-12 h-12 rounded-xl bg-red-100 items-center justify-center mb-4">
            <TriangleAlert className="w-6 h-6 text-red-600" />
          </span>
          <h2 className="text-lg font-bold text-zinc-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-zinc-600 mb-6 max-w-md mx-auto leading-relaxed">
            This part of the app ran into an unexpected error. Your files never
            left your device — nothing was uploaded or lost.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try again
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 bg-white border border-zinc-300 px-5 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
            >
              <Home className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
