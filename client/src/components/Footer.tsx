import { ThemeToggle } from "./ThemeToggle";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          © 2024 LandHacker. All rights reserved.
        </p>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
