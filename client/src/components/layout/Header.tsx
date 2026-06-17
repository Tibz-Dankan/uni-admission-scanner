import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="leading-tight">
            Soroti University
            <span className="block text-xs font-normal text-muted-foreground">
              Admission Form Scanner
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="hover:text-primary">
            Upload
          </Link>
          <Link to="/admissions" className="hover:text-primary">
            Admissions
          </Link>
        </nav>
      </div>
    </header>
  );
}
