// types/siteMetadata.d.ts
declare module '@/data/siteMetadata' {
  interface AnalyticsConfig {
    umamiAnalytics?: {
      umamiWebsiteId?: string
      src?: string
    }
    // Add other analytics providers if used
  }

  interface SearchConfig {
    provider: 'kbar' | 'algolia'
    kbarConfig?: {
      searchDocumentsPath: string
    }
    algoliaConfig?: {
      appId: string
      apiKey: string
      indexName: string
    }
  }

  const siteMetadata: {
    [x: string]: ReactNode
    title: string
    author: string
    headerTitle: string | JSX.Element
    description: string
    language: string
    theme: string
    siteUrl: string
    siteRepo: string
    siteLogo: string
    socialBanner: string
    mastodon?: string
    email?: string
    github?: string
    x?: string
    facebook?: string
    youtube?: string
    linkedin?: string
    threads?: string
    instagram?: string
    medium?: string
    bluesky?: string
    locale: string
    stickyNav?: boolean
    analytics?: AnalyticsConfig
    search?: SearchConfig
  }

  export default siteMetadata
}
