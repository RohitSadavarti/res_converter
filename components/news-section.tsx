"use client"

import { useState, useEffect } from "react"
import { Newspaper, Clock } from "lucide-react"
import { NewsArticleModal } from "./news-article-modal"
import { Skeleton } from "@/components/ui/skeleton"
import type { NewsArticle } from "@/lib/news-api"
import { sampleNewsData } from "@/lib/news-api"

function NewsArticleSkeleton() {
  return (
    <div className="flex flex-col bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="aspect-[16/9] w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

export function NewsSection() {
  const [newsData, setNewsData] = useState<{ articles: NewsArticle[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Simulate fetching news data
    const fetchNews = async () => {
      try {
        setLoading(true)
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setNewsData(sampleNewsData)
      } catch (err) {
        setError("Failed to load news")
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedArticle(null)
  }

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="aspect-[16/10] rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <NewsArticleSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !newsData?.articles?.length) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Unable to load news</h2>
          <p className="text-muted-foreground">{error || "No articles available at the moment."}</p>
        </div>
      </section>
    )
  }

  const articles = newsData.articles.slice(0, 6)
  const featuredArticle = articles[0]
  const otherArticles = articles.slice(1)

  return (
    <>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Latest News</h2>
              <p className="text-muted-foreground">Stay updated with the latest headlines</p>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Newspaper className="h-5 w-5" />
              <span className="text-sm font-medium">Live Updates</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Featured Article */}
            <div
              className="group relative overflow-hidden rounded-2xl bg-card border border-border cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg"
              onClick={() => handleArticleClick(featuredArticle)}
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={featuredArticle.urlToImage || "/placeholder.svg?height=400&width=600&query=news"}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
                    {featuredArticle.source.name}
                  </span>
                  <span className="text-white/70 text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(featuredArticle.publishedAt)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {featuredArticle.title}
                </h3>
                <p className="text-white/70 text-sm line-clamp-2">{featuredArticle.description}</p>
              </div>
            </div>

            {/* Other Articles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherArticles.map((article, index) => (
                <div
                  key={index}
                  className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                  onClick={() => handleArticleClick(article)}
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={article.urlToImage || "/placeholder.svg?height=200&width=300&query=news article"}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-primary font-medium">{article.source.name}</span>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-muted-foreground text-xs">{formatDate(article.publishedAt)}</span>
                    </div>
                    <h4 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Article Detail Modal */}
      <NewsArticleModal article={selectedArticle} isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  )
}
