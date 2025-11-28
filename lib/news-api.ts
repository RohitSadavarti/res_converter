export interface NewsArticle {
  source: {
    id: string | null
    name: string
  }
  author: string | null
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string | null
}

export interface NewsResponse {
  status: string
  totalResults: number
  articles: NewsArticle[]
}

// Sample news data for demonstration
export const sampleNewsData: NewsResponse = {
  status: "ok",
  totalResults: 6,
  articles: [
    {
      source: { id: "techcrunch", name: "TechCrunch" },
      author: "Sarah Chen",
      title: "AI Revolution: How Machine Learning is Transforming Healthcare in 2025",
      description:
        "Artificial intelligence continues to reshape the healthcare industry, with new breakthroughs in early disease detection and personalized treatment plans.",
      url: "https://example.com/ai-healthcare",
      urlToImage: "/ai-healthcare.png",
      publishedAt: "2025-11-28T09:00:00Z",
      content:
        "The healthcare industry is experiencing a profound transformation thanks to advances in artificial intelligence and machine learning. From early disease detection to personalized treatment plans, AI is revolutionizing how we approach medicine. Hospitals around the world are implementing AI-powered diagnostic tools that can detect conditions like cancer, heart disease, and neurological disorders with unprecedented accuracy. These systems analyze medical images, patient histories, and genetic data to provide doctors with insights that were previously impossible to obtain.",
    },
    {
      source: { id: "wired", name: "Wired" },
      author: "Michael Torres",
      title: "Electric Vehicles Hit Major Milestone with 50% Market Share",
      description: "For the first time, electric vehicles have captured more than half of all new car sales globally.",
      url: "https://example.com/ev-milestone",
      urlToImage: "/electric-vehicle-charging.png",
      publishedAt: "2025-11-27T14:30:00Z",
      content:
        "Electric vehicles have officially crossed a historic threshold, capturing more than 50% of global new car sales for the first time. This milestone represents a dramatic shift in consumer preferences and marks a turning point in the automotive industry's transition away from internal combustion engines.",
    },
    {
      source: { id: "reuters", name: "Reuters" },
      author: "Emma Williams",
      title: "Global Climate Summit Reaches Historic Agreement on Carbon Reduction",
      description: "World leaders commit to ambitious new targets for reducing carbon emissions by 2030.",
      url: "https://example.com/climate-summit",
      urlToImage: "/climate-summit-conference.jpg",
      publishedAt: "2025-11-27T11:00:00Z",
      content:
        "In a landmark decision, representatives from 195 countries have agreed to new binding targets for carbon emission reductions. The agreement sets ambitious goals for transitioning to renewable energy and implementing carbon capture technologies.",
    },
    {
      source: { id: "bbc", name: "BBC News" },
      author: "James Wilson",
      title: "Space Tourism Company Announces First Commercial Moon Flight",
      description: "Private space company reveals plans for civilian lunar orbit mission scheduled for 2027.",
      url: "https://example.com/moon-tourism",
      urlToImage: "/spacecraft-moon-tourism.jpg",
      publishedAt: "2025-11-26T16:45:00Z",
      content:
        "A major breakthrough in space tourism was announced today as a private aerospace company revealed plans for the first commercial flight around the Moon. The mission, scheduled for 2027, will carry paying passengers on a week-long journey.",
    },
    {
      source: { id: "verge", name: "The Verge" },
      author: "Lisa Park",
      title: "Breakthrough in Quantum Computing Promises Faster Drug Discovery",
      description: "New quantum processor achieves milestone that could accelerate pharmaceutical research.",
      url: "https://example.com/quantum-drugs",
      urlToImage: "/quantum-computer.png",
      publishedAt: "2025-11-26T08:20:00Z",
      content:
        "Scientists have achieved a major breakthrough in quantum computing that could revolutionize drug discovery. The new quantum processor can simulate molecular interactions with unprecedented accuracy, potentially reducing drug development time from years to months.",
    },
    {
      source: { id: "nytimes", name: "New York Times" },
      author: "David Brown",
      title: "Renewable Energy Now Powers 40% of Global Electricity",
      description: "Solar and wind energy continue rapid growth, marking another record year for clean power.",
      url: "https://example.com/renewable-record",
      urlToImage: "/solar-wind-landscape.png",
      publishedAt: "2025-11-25T19:15:00Z",
      content:
        "Renewable energy sources now account for 40% of global electricity generation, according to new data released by the International Energy Agency. Solar and wind power led the growth, with installations reaching record levels across Asia, Europe, and North America.",
    },
  ],
}
