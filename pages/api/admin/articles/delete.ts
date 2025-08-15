import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { articleIds } = req.body;

  if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
    return res.status(400).json({ error: 'Invalid article IDs' });
  }

  try {
    // Log admin action
    await prisma.adminLog.create({
      data: {
        action: articleIds.length > 1 ? 'BULK_DELETE' : 'DELETE_ARTICLE',
        details: { articleIds, count: articleIds.length },
        userEmail: session.user?.email || '',
      }
    });

    // Soft delete articles (set deletedAt timestamp)
    await prisma.guardianArticle.updateMany({
      where: {
        guardianId: { in: articleIds }
      },
      data: {
        deletedAt: new Date(),
        status: 'UNPUBLISHED'
      }
    });

    // Soft delete associated summaries
    await prisma.openaiSummary.updateMany({
      where: {
        guardianId: { in: articleIds }
      },
      data: {
        deletedAt: new Date()
      }
    });

    // Note: We keep the ProcessedArticleId records to prevent re-processing
    console.log(`Soft deleted ${articleIds.length} articles by ${session.user?.email}`);

    return res.status(200).json({ 
      success: true, 
      message: `Successfully deleted ${articleIds.length} articles`,
      deletedCount: articleIds.length
    });

  } catch (error) {
    console.error('Error deleting articles:', error);
    return res.status(500).json({ error: 'Failed to delete articles' });
  } finally {
    await prisma.$disconnect();
  }
}