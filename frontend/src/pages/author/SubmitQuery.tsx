export function SubmitQuery() {
  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Submit Support Query
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Have a question about your books, royalties, or distribution? Send us a ticket.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
        <div className="text-3xl mb-2">✍️</div>
        <h3 className="text-base font-semibold text-stone-900">Support Query Form</h3>
        <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
          Query submission with book selector, character counter, and AI triage routing (scaffolded in T12a, full form in T12b).
        </p>
      </div>
    </div>
  );
}
