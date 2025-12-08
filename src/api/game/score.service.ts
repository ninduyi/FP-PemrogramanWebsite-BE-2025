import { type GameScores } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { ErrorResponse, prisma } from '@/common';

import { type ISubmitScore } from './schema';

export abstract class ScoreService {
  static async submitScore(
    userId: string,
    scoreData: ISubmitScore,
  ): Promise<GameScores> {
    // Check if game exists and is published
    const game = await prisma.games.findUnique({
      where: { id: scoreData.game_id },
      select: { id: true, is_published: true },
    });

    if (!game) {
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Game not found',
      );
    }

    if (!game.is_published) {
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'Cannot submit score for unpublished game',
      );
    }

    // Create score record
    const score = await prisma.gameScores.create({
      data: {
        user_id: userId,
        game_id: scoreData.game_id,
        score: scoreData.score,
        time_spent: scoreData.time_spent,
        game_data: scoreData.game_data,
      },
    });

    return score;
  }

  static async getHighestScore(
    userId: string,
    gameId: string,
  ): Promise<GameScores | null> {
    const highestScore = await prisma.gameScores.findFirst({
      where: {
        user_id: userId,
        game_id: gameId,
      },
      orderBy: {
        score: 'desc',
      },
    });

    return highestScore;
  }

  static async getUserGameHistory(
    userId: string,
    gameId: string,
    limit: number = 10,
  ): Promise<GameScores[]> {
    const history = await prisma.gameScores.findMany({
      where: {
        user_id: userId,
        game_id: gameId,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    });

    return history;
  }

  static async getGameLeaderboard(
    gameId: string,
    limit: number = 10,
  ): Promise<Array<{user_id: string; username: string; highest_score: number; total_plays: number}>> {
    const leaderboard = await prisma.gameScores.groupBy({
      by: ['user_id'],
      where: {
        game_id: gameId,
      },
      _max: {
        score: true,
      },
      _count: true,
      orderBy: {
        _max: {
          score: 'desc',
        },
      },
      take: limit,
    });

    // Get user details
    const result = await Promise.all(
      leaderboard.map(async (entry: { user_id: string; _max: { score: number | null }; _count: number }) => {
        const user = await prisma.users.findUnique({
          where: { id: entry.user_id },
          select: { username: true },
        });

        return {
          user_id: entry.user_id,
          username: user?.username || 'Unknown',
          highest_score: entry._max.score || 0,
          total_plays: entry._count,
        };
      }),
    );

    return result;
  }

  static async getUserAllScores(userId: string): Promise<Array<{game_id: string; game_name: string; highest_score: number; total_plays: number; last_played: Date}>> {
    const scores = await prisma.gameScores.groupBy({
      by: ['game_id'],
      where: {
        user_id: userId,
      },
      _max: {
        score: true,
        created_at: true,
      },
      _count: true,
      orderBy: {
        _max: {
          created_at: 'desc',
        },
      },
    });

    // Get game details
    const result = await Promise.all(
      scores.map(async (entry: { game_id: string; _max: { score: number | null; created_at: Date | null }; _count: number }) => {
        const game = await prisma.games.findUnique({
          where: { id: entry.game_id },
          select: { name: true },
        });

        return {
          game_id: entry.game_id,
          game_name: game?.name || 'Unknown',
          highest_score: entry._max.score || 0,
          total_plays: entry._count,
          last_played: entry._max.created_at || new Date(),
        };
      }),
    );

    return result;
  }

  // TAMBAHAN: Global Leaderboard untuk semua Group Sort games
  static async getGlobalGroupSortLeaderboard(
    limit: number = 10,
  ): Promise<Array<{user_id: string; username: string; total_score: number; total_plays: number}>> {
    // Get game template ID for Group Sort
    const groupSortTemplate = await prisma.gameTemplates.findUnique({
      where: { slug: 'group-sort' },
      select: { id: true },
    });

    if (!groupSortTemplate) {
      return [];
    }

    // Get all Group Sort games
    const groupSortGames = await prisma.games.findMany({
      where: {
        game_template_id: groupSortTemplate.id,
      },
      select: { id: true },
    });

    const gameIds = groupSortGames.map(g => g.id);

    if (gameIds.length === 0) {
      return [];
    }

    // Group by user and sum all scores across all Group Sort games
    const leaderboard = await prisma.gameScores.groupBy({
      by: ['user_id'],
      where: {
        game_id: {
          in: gameIds,
        },
      },
      _sum: {
        score: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          score: 'desc',
        },
      },
      take: limit,
    });

    // Get user details
    const result = await Promise.all(
      leaderboard.map(async (entry: { user_id: string; _sum: { score: number | null }; _count: number }) => {
        const user = await prisma.users.findUnique({
          where: { id: entry.user_id },
          select: { username: true },
        });

        return {
          user_id: entry.user_id,
          username: user?.username || 'Unknown',
          total_score: entry._sum.score || 0,
          total_plays: entry._count,
        };
      }),
    );

    return result;
  }
}