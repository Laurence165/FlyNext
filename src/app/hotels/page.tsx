import HotelSearch from "../components/hotel-search"

export default function HotelsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-6">Find Your Perfect Stay</h1>
      <div className="max-w-4xl mx-auto space-y-8">
        <HotelSearch />
      </div>
    </div>
  )
}

