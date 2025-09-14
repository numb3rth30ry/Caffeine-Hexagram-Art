import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-muted-foreground">
          © 2025. Built with{' '}
          <Heart className="inline h-4 w-4 text-red-500 mx-1" />
          using{' '}
          <a 
            href="https://caffeine.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
