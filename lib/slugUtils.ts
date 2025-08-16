/**
 * Generate a SEO-friendly slug from article heading
 */
export function generateSlug(title: string): string {
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

/**
 * Ensure slug is unique by appending number if needed
 */
export async function ensureUniqueSlug(
  baseSlug: string, 
  prisma: any, 
  excludeId?: string
): Promise<string> {
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

/**
 * Generate slug and ensure it's unique
 */
export async function createUniqueSlug(
  title: string, 
  prisma: any, 
  excludeId?: string
): Promise<string> {
  const baseSlug = generateSlug(title);
  return await ensureUniqueSlug(baseSlug, prisma, excludeId);
}