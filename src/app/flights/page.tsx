import FlightSearch from "../components/flight-search"

export default function FlightsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-6">Find Your Flight</h1>
      <div className="max-w-4xl mx-auto">
        <FlightSearch />
      </div>
    </div>
  )
}

