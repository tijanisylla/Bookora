import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section
      id="cta"
      className="bg-brand py-16 sm:py-20"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2
          id="cta-heading"
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          Ready to Find Your Dream Home?
        </h2>
        <p className="mt-4 text-lg text-blue-100">
          We are here to help you find the perfect property that fits your
          needs.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="inline-flex min-w-[200px] items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand shadow-sm transition hover:bg-slate-50"
          >
            Get started now
          </Link>
          <Link
            to="/sell"
            className="inline-flex min-w-[200px] items-center justify-center rounded-lg border-2 border-white px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Sell your property
          </Link>
        </div>
      </div>
    </section>
  );
}
