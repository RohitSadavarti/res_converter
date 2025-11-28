"use client"

import { X, Clock, User, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { NewsArticle } from "@/lib/news-api"

interface NewsArticleModalProps {
  article: NewsArticle | null
  isOpen: boolean
  onClose: () => void
}

export function NewsArticleModal({ article, isOpen, onClose }: NewsArticleModalProps) {
  if (!isOpen || !article) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] mx-4 bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
        {/* Header Image */}
        {article.urlToImage && (
          <div className="relative h-64 w-full">
            <img
              src={article.urlToImage || "/placeholder.svg"}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>
        )}

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Source Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {article.source.name}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground mb-4 leading-tight">{article.title}</h2>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            {article.author && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{article.author}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          </div>

          {/* Description */}
          {article.description && (
            <p className="text-foreground/90 text-lg leading-relaxed mb-6">{article.description}</p>
          )}

          {/* Content */}
          {article.content && (
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">{article.content.replace(/\[\+\d+ chars\]/, "")}</p>
            </div>
          )}

          {/* Read Full Article Button */}
          <div className="mt-8 pt-6 border-t border-border">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Read Full Article
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
