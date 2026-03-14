"use client";

export default function CharityCard({ charity, selected, onToggle, isTopMatch }) {
  const {
    name,
    category,
    description,
    image,
    emoji,
    supporterCount = 0,
    color = "#E0D5CB",
  } = charity;

  return (
    <button
      type="button"
      onClick={() => onToggle?.(charity)}
      className="w-full text-left rounded-xl border border-[#E0D5CB] bg-[#FFF8F2] overflow-hidden transition-all hover:border-[#5C4A38] focus:outline-none focus:ring-2 focus:ring-[#5C4A38] focus:ring-offset-2"
    >
      <div className="relative">
        <div
          className="h-20 flex items-center justify-center text-3xl"
          style={{ backgroundColor: color }}
        >
          {image ? (
            <img src={image} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{emoji || "❤️"}</span>
          )}
        </div>
        {isTopMatch && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium text-white bg-[#2E2218]">
            Top match
          </span>
        )}
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#5C4A38] flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wider text-[#9C8B7E] mb-1">
          {category || "Nonprofit"}
        </p>
        <h3 className="font-semibold text-[#2E2218] mb-2">{name}</h3>
        <p className="text-sm text-[#5C4A38] line-clamp-2 mb-2">{description}</p>
        <p className="text-sm text-[#9C8B7E]">
          👥 {supporterCount ?? 0} people are supporting this
        </p>
      </div>
    </button>
  );
}
