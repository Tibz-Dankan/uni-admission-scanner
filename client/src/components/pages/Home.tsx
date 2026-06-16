import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Uni Admission Scanner
        </h1>
      </main>
      <Footer />
    </div>
  );
}
