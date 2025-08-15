import axios from 'axios';

interface GuardianArticle {
  id: string;
  type: string;
  sectionName: string;
  webPublicationDate: string;
  webUrl: string;
  apiUrl: string;
  fields?: {
    thumbnail?: string;
    bodyText?: string;
  };
}

interface GuardianResponse {
  response: {
    status: string;
    userTier: string;
    total: number;
    startIndex: number;
    pageSize: number;
    currentPage: number;
    pages: number;
    orderBy: string;
    results: GuardianArticle[];
  };
}

export class GuardianApiService {
  private apiKey: string;
  private baseUrl: string;
  private sections = [
    { name: 'opinion', guardianSection: 'commentisfree' },
    { name: 'environment', guardianSection: 'environment' },
    { name: 'technology', guardianSection: 'technology' },
    { name: 'science', guardianSection: 'science' }
  ];

  constructor() {
    this.apiKey = process.env.GUARDIAN_API_KEY!;
    this.baseUrl = process.env.GUARDIAN_API_URL || 'https://content.guardianapis.com';
  }

  async fetchArticles(count: number = 50): Promise<GuardianArticle[]> {
    const articlesPerSection = Math.ceil(count / this.sections.length);
    const allArticles: GuardianArticle[] = [];

    for (const section of this.sections) {
      try {
        console.log(`Fetching articles from section: ${section.name} (Guardian section: ${section.guardianSection})`);
        const articles = await this.fetchArticlesBySection(section, articlesPerSection);
        console.log(`Found ${articles.length} articles from ${section.name} section`);
        allArticles.push(...articles);
      } catch (error) {
        console.error(`Error fetching articles from ${section.name}:`, error);
      }
    }

    console.log(`Total articles found: ${allArticles.length}`);
    // Shuffle and return requested count
    const shuffled = allArticles.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private async fetchArticlesBySection(section: { name: string; guardianSection: string }, count: number): Promise<GuardianArticle[]> {
    try {
      const queryParams: any = {
        'api-key': this.apiKey,
        'show-fields': 'thumbnail,bodyText',
        'page-size': count,
        'order-by': 'newest',
        'from-date': this.getDateDaysAgo(7), // Last 7 days
        'show-elements': 'image'
      };

      // Use the correct Guardian section name
      queryParams.section = section.guardianSection;

      console.log(`Querying Guardian API for section: ${section.name} (${section.guardianSection}) with params:`, queryParams);

      const response = await axios.get<GuardianResponse>(`${this.baseUrl}/search`, {
        params: queryParams,
        timeout: 30000
      });

      console.log(`Guardian API response for ${section.name}:`, {
        status: response.data.response.status,
        total: response.data.response.total,
        results: response.data.response.results.length
      });

      if (response.data.response.status === 'ok') {
        const filteredArticles = response.data.response.results.filter(article => 
          article.fields?.bodyText && 
          article.fields.bodyText.length > 500 // Ensure substantial content
        );
        
        // Update sectionName to our standardized name for consistency
        const articlesWithStandardizedSection = filteredArticles.map(article => ({
          ...article,
          sectionName: section.name // Use our standardized section name
        }));
        
        console.log(`Filtered articles from ${section.name}: ${articlesWithStandardizedSection.length}`);
        return articlesWithStandardizedSection;
      }

      return [];
    } catch (error) {
      console.error(`Guardian API error for section ${section.name}:`, error);
      
      // If commentisfree fails for opinion, try alternative approaches
      if (section.name === 'opinion') {
        console.log('Trying alternative opinion query...');
        try {
          const altResponse = await axios.get<GuardianResponse>(`${this.baseUrl}/search`, {
            params: {
              'api-key': this.apiKey,
              'tag': 'tone/comment',
              'show-fields': 'thumbnail,bodyText',
              'page-size': count,
              'order-by': 'newest',
              'from-date': this.getDateDaysAgo(7),
            },
            timeout: 30000
          });

          if (altResponse.data.response.status === 'ok') {
            const altFilteredArticles = altResponse.data.response.results.filter(article => 
              article.fields?.bodyText && 
              article.fields.bodyText.length > 500
            );
            
            return altFilteredArticles.map(article => ({
              ...article,
              sectionName: 'opinion'
            }));
          }
        } catch (altError) {
          console.error('Alternative opinion query also failed:', altError);
        }
      }
      
      throw error;
    }
  }

  async fetchSingleArticle(articleId: string): Promise<GuardianArticle | null> {
    try {
      const response = await axios.get<GuardianResponse>(`${this.baseUrl}/${articleId}`, {
        params: {
          'api-key': this.apiKey,
          'show-fields': 'thumbnail,bodyText'
        },
        timeout: 30000
      });

      if (response.data.response.status === 'ok' && response.data.response.results.length > 0) {
        return response.data.response.results[0];
      }

      return null;
    } catch (error) {
      console.error(`Error fetching single article ${articleId}:`, error);
      return null;
    }
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  // Utility method to extract clean text from HTML
  static cleanBodyText(htmlText: string): string {
    // Remove HTML tags and clean up text
    return htmlText
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  // Count words in text
  static countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  // Count characters in text
  static countCharacters(text: string): number {
    return text.length;
  }
}