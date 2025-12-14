"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"

interface Category {
  id: string
  name: string
  slug: string
}

interface CategoryFiltersProps {
  categories: Category[]
}

export function CategoryFilters({ categories }: CategoryFiltersProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const selectedCategory = searchParams.get("category") || "All"

  const handleCategoryClick = (categorySlug: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (categorySlug === "All") {
      params.delete("category")
    } else {
      params.set("category", categorySlug)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="sticky top-14 z-40 bg-background px-4 py-3">
      <div className="flex items-center justify-between gap-2 w-full">
        <button
          onClick={() => handleCategoryClick("All")}
          className={`px-4 py-1.5 rounded-full text-sm font-light whitespace-nowrap transition-colors flex-shrink-0 ${
            selectedCategory === "All"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground hover:bg-muted/80"
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.slug)}
            className={`px-4 py-1.5 rounded-full text-sm font-light whitespace-nowrap transition-colors flex-shrink-0 ${
              selectedCategory === category.slug
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
}

