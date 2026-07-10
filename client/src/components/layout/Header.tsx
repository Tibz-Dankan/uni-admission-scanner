import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export default function Header() {
  const navigate = useNavigate();
  const auth = useAuthStore((state) => state.auth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  function handleLogout() {
    clearAuth();
    navigate("/signin", { replace: true });
  }

  return (
    <header className="border-b border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/sun-logo.png" alt="Soroti University" className="h-10 w-auto" />
          <span className="hidden text-xs font-normal text-muted-foreground min-[680px]:block">
            Admission Form Scanner
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          {auth && (
            <>
              <Link to="/" className="hover:text-primary">
                Upload
              </Link>
              <Link to="/admissions" className="hover:text-primary">
                Admissions
              </Link>
              <span className="text-muted-foreground">
                {auth.user.firstName} {auth.user.lastName}
              </span>
              <button onClick={handleLogout} className="hover:text-primary">
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
