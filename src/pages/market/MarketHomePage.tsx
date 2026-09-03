import { useCallback, useEffect, useState } from "react"
import { Search } from "lucide-react"
import { api } from "../../lib/api"
import type { Business, Page, Product } from "../../lib/types"
import { ProductCard } from "../../components/market/ProductCard"
import { BusinessCard } from "../../components/market/BusinessCard"
import { PageHeader } from "../../components/ui/PageHeader"
import { Button } from "../../components/ui/Button"
import { EmptyState, ErrorState } from "../../components/ui/StatePanel"
import { SkeletonGrid } from "../../components/ui/Skeleton"

type MarketTab = "products" | "businesses"

export function MarketHomePage() {
  const [tab, setTab] = useState<MarketTab>("products")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [page, setPage] = useState<Page<Product> | null>(null)
  const [businessPage, setBusinessPage] = useState<Page<Business> | null>(null)
  const [pageNum, setPageNum] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    (nextPage: number, replace: boolean) => {
      const params = new URLSearchParams({ page: String(nextPage), size: "12" })
      if (query.trim()) params.set("q", query.trim())
      if (!query.trim() && category.trim()) params.set("category", category.trim())

      api
        .get<Page<Product>>(`/products?${params.toString()}`)
        .then((result) => {
          setPage((prev) => (replace || !prev ? result : { ...result, content: [...prev.content, ...result.content] }))
          setError(null)
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Could not load the market"))
    },
    [query, category],
  )

  const loadBusinesses = useCallback(
    (nextPage: number, replace: boolean) => {
      const params = new URLSearchParams({ page: String(nextPage), size: "12" })
      if (category.trim()) params.set("category", category.trim())

      api
        .get<Page<Business>>(`/businesses?${params.toString()}`)
        .then((result) => {
          setBusinessPage((prev) =>
            replace || !prev ? result : { ...result, content: [...prev.content, ...result.content] },
          )
          setError(null)
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Could not load businesses"))
    },
    [category],
  )

  useEffect(() => {
    setPageNum(0)
    if (tab === "products") {
      load(0, true)
    } else {
      loadBusinesses(0, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, tab])

  function clearFilters() {
    setQuery("")
    setCategory("")
  }

  const hasFilters = Boolean(query.trim() || category.trim())

  return (
    <div className="page">
      <PageHeader title="MoMoMarket" subtitle="Discover sellers and products from the community." />

      <div className="tab-bar" role="tablist">
        {(["products", "businesses"] as MarketTab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "products" ? "Products" : "Businesses"}
          </button>
        ))}
      </div>

      <div className="market-search row wrap">
        {tab === "products" && (
          <div className="search-input-wrap">
            <Search size={16} aria-hidden="true" className="search-input-icon" />
            <input
              className="market-search-input search-input-with-icon"
              placeholder="Search products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}
        <input
          className="market-search-input"
          placeholder="Filter by category…"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={tab === "products" && Boolean(query.trim())}
          style={{ maxWidth: 220 }}
        />
      </div>

      {error && <ErrorState description={error} onRetry={() => (tab === "products" ? load(0, true) : loadBusinesses(0, true))} />}

      {tab === "products" ? (
        page === null ? (
          <SkeletonGrid count={6} columns="product-grid" />
        ) : page.content.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try a different search or check back soon — new sellers join every day."
            action={hasFilters ? <Button variant="ghost" onClick={clearFilters}>Clear search</Button> : undefined}
          />
        ) : (
          <>
            <div className="product-grid">
              {page.content.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {!page.last && (
              <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const next = pageNum + 1
                    setPageNum(next)
                    load(next, false)
                  }}
                >
                  Load more
                </Button>
              </div>
            )}
          </>
        )
      ) : businessPage === null ? (
        <SkeletonGrid count={6} columns="business-grid" />
      ) : businessPage.content.length === 0 ? (
        <EmptyState
          title="No businesses found"
          description="Try a different category, or check back soon as new sellers join."
          action={category ? <Button variant="ghost" onClick={clearFilters}>Clear filter</Button> : undefined}
        />
      ) : (
        <>
          <div className="business-grid">
            {businessPage.content.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
          {!businessPage.last && (
            <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
              <Button
                variant="ghost"
                onClick={() => {
                  const next = pageNum + 1
                  setPageNum(next)
                  loadBusinesses(next, false)
                }}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
