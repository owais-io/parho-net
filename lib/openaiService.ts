import OpenAI from 'openai';

export interface ArticleSummary {
  heading: string;
  category: string;
  summary: string; // 500-word summary in paragraphs
  tldr: string[];  // 3 bullet points
  faqs: FAQ[];     // 5 FAQs
}

interface FAQ {
  question: string;
  answer: string;
}

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  async summarizeArticle(bodyText: string, originalSection: string): Promise<{
    summary: ArticleSummary;
    tokensUsed: number;
    estimatedCost: number;
  }> {
    try {
      const cleanText = this.cleanText(bodyText);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert news summarizer. Create engaging, informative summaries that capture readers' attention. Use simple vocabulary, third person perspective, and a conversational tone similar to how ChatGPT responds to users. Always respond with valid JSON.`
          },
          {
            role: "user",
            content: `Summarize this Guardian article from the ${originalSection} section. Follow these requirements:

1. Create a compelling heading (not the original title)
2. Categorize in max 3 words (like "Climate Tech", "AI Ethics", "Space Science")  
3. Write a 500-word summary that:
   - Starts with a hook sentence to capture attention
   - Is broken into 3-5 paragraphs
   - Uses conversational, ChatGPT-like tone
   - Uses simple vocabulary and third person
   - Maintains engaging flow throughout

4. Provide 3 TLDR bullet points (key takeaways)
5. Create 5 relevant FAQs with concise answers

Article text: ${cleanText}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "article_summary",
            schema: {
              type: "object",
              properties: {
                heading: {
                  type: "string",
                  description: "Engaging headline for the summary"
                },
                category: {
                  type: "string",
                  description: "Category in maximum 3 words"
                },
                summary: {
                  type: "string",
                  description: "500-word summary broken into 3-5 paragraphs separated by \\n\\n"
                },
                tldr: {
                  type: "array",
                  items: { type: "string" },
                  description: "3 bullet points summarizing key takeaways",
                  minItems: 3,
                  maxItems: 3
                },
                faqs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      answer: { type: "string" }
                    },
                    required: ["question", "answer"]
                  },
                  description: "5 relevant FAQs about the article",
                  minItems: 5,
                  maxItems: 5
                }
              },
              required: ["heading", "category", "summary", "tldr", "faqs"],
              additionalProperties: false
            }
          }
        },
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      const summary: ArticleSummary = JSON.parse(content);
      
      // Validate the response
      this.validateSummary(summary);

      const tokensUsed = response.usage?.total_tokens || 0;
      const estimatedCost = this.calculateCost(tokensUsed, 'gpt-4o');

      return {
        summary,
        tokensUsed,
        estimatedCost
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON response from OpenAI');
      }
      throw error;
    }
  }

  private cleanText(text: string): string {
    // Remove HTML tags and excessive whitespace
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000); // Limit input length to avoid token limits
  }

  private validateSummary(summary: ArticleSummary): void {
    if (!summary.heading || summary.heading.length < 5) {
      throw new Error('Heading too short - minimum 5 characters required');
    }
    
    if (!summary.category || summary.category.split(' ').length > 3) {
      throw new Error('Category must be maximum 3 words');
    }
    
    if (!summary.summary || summary.summary.length < 200) {
      throw new Error('Summary too short - minimum 200 characters required');
    }
    
    if (!Array.isArray(summary.tldr) || summary.tldr.length !== 3) {
      throw new Error('TLDR must have exactly 3 points');
    }
    
    if (!Array.isArray(summary.faqs) || summary.faqs.length !== 5) {
      throw new Error('Must have exactly 5 FAQs');
    }
    
    // Validate FAQ structure
    summary.faqs.forEach((faq, index) => {
      if (!faq.question || !faq.answer) {
        throw new Error(`FAQ ${index + 1} missing question or answer`);
      }
    });
  }

  private calculateCost(tokens: number, model: string): number {
    // GPT-4o pricing (as of 2024)
    const inputCostPer1K = 0.005;   // $0.005 per 1K input tokens
    const outputCostPer1K = 0.015;  // $0.015 per 1K output tokens
    
    // Rough estimation: assume 70% input, 30% output
    const inputTokens = Math.floor(tokens * 0.7);
    const outputTokens = Math.floor(tokens * 0.3);
    
    const inputCost = (inputTokens / 1000) * inputCostPer1K;
    const outputCost = (outputTokens / 1000) * outputCostPer1K;
    
    return inputCost + outputCost;
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