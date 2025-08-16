import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Utility function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 60) // Limit length to 60 characters
    .replace(/-+$/, ''); // Remove trailing hyphen if substring cut in middle of word
}

// Ensure slug is unique by appending number if needed
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.openaiSummary.findUnique({
      where: { slug },
      select: { guardianId: true }
    });
    
    // If no existing slug found, or it's the same article we're updating
    if (!existing || existing.guardianId === excludeId) {
      return slug;
    }
    
    // Try with counter
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

async function addSlugsToExistingArticles() {
  console.log('🔄 Adding slugs to existing articles...');
  
  try {
    // Get all summaries without slugs
    const summariesWithoutSlugs = await prisma.openaiSummary.findMany({
      where: {
        slug: null,
        heading: {
          not: ''
        },
        processingStatus: 'COMPLETED'
      },
      select: {
        guardianId: true,
        heading: true
      }
    });

    console.log(`📊 Found ${summariesWithoutSlugs.length} articles to process`);

    let processed = 0;
    let errors = 0;

    for (const summary of summariesWithoutSlugs) {
      try {
        const baseSlug = generateSlug(summary.heading);
        const uniqueSlug = await ensureUniqueSlug(baseSlug, summary.guardianId);
        
        await prisma.openaiSummary.update({
          where: { guardianId: summary.guardianId },
          data: { slug: uniqueSlug }
        });

        processed++;
        console.log(`✅ ${processed}/${summariesWithoutSlugs.length}: ${summary.heading} -> ${uniqueSlug}`);
      } catch (error) {
        errors++;
        console.error(`❌ Error processing ${summary.guardianId}:`, error);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully processed: ${processed}`);
    console.log(`❌ Errors: ${errors}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addSlugsToExistingArticles();