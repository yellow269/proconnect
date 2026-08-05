
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; location?: string }>
}) {
  const params = await searchParams;
  const category = params.category ?? params.q ?? "All Services";

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-4xl font-bold mb-4">
        Search Results
      </h1>

      <p className="text-gray-600 mb-8">
        Showing professionals for:
      </p>

      <div className="rounded-lg border p-6 bg-white shadow">
        <h2 className="text-2xl font-semibold">
          {category}
        </h2>

        <p className="mt-2 text-gray-500">
          Search functionality will be added in the next module.
        </p>
      </div>
    </main>
  );
}