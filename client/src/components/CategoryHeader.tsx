import { Category } from "@/types";

interface CategoryHeaderProps {
  category: Category;
  showMore?: () => void;
}

export default function CategoryHeader({ category, showMore }: CategoryHeaderProps) {
  return (
    <div className="flex items-center mb-4">
      <h4 className="text-xl font-semibold capitalize">{category.name}</h4>
      <span className="ml-3 text-xs px-2 py-1 bg-[#5865F2] rounded-full">
        {category.commandCount} commands
      </span>
      
      {showMore && (
        <button 
          onClick={showMore}
          className="ml-auto text-[#5865F2] hover:underline text-sm font-medium flex items-center"
        >
          Show more {category.name} commands
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
