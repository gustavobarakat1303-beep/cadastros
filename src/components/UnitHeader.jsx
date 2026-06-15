export default function UnitHeader({ unit, subtitle }) {
  return (
    <div className="flex flex-col items-center text-center mb-8">
      {unit.logo ? (
        <img
          src={unit.logo}
          alt={unit.name}
          className="h-36 w-36 rounded-full object-cover mb-4 shadow-lg ring-1 ring-white/10"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : null}
      <h1 className="text-2xl font-bold">{unit.name}</h1>
      {subtitle ? <p className="text-gray-400 mt-1">{subtitle}</p> : null}
    </div>
  )
}
