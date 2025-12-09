import { type NextFunction, type Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  type AuthedRequest,
  SuccessResponse,
  validateAuth,
  validateBody,
} from '@/common';

import { type ISubmitScore, SubmitScoreSchema } from './schema';
import { ScoreService } from './score.service';

export const ScoreController = Router()
  .post(
    '/submit',
    validateAuth({}),
    validateBody({ schema: SubmitScoreSchema }),
    async (
      request: AuthedRequest<{}, {}, ISubmitScore>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const score = await ScoreService.submitScore(
          request.user!.user_id,
          request.body,
        );

        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Score submitted successfully',
          score,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/highest/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const highestScore = await ScoreService.getHighestScore(
          request.user!.user_id,
          request.params.game_id,
        );

        const result = new SuccessResponse(
          StatusCodes.OK,
          'Highest score retrieved successfully',
          highestScore || { score: 0 },
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/history/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const limit = request.query.limit
          ? Number.parseInt(request.query.limit as string)
          : 10;

        const history = await ScoreService.getUserGameHistory(
          request.user!.user_id,
          request.params.game_id,
          limit,
        );

        const result = new SuccessResponse(
          StatusCodes.OK,
          'Game history retrieved successfully',
          history,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/leaderboard/:game_id',
    validateAuth({ optional: true }),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const limit = request.query.limit
          ? Number.parseInt(request.query.limit as string)
          : 10;

        const leaderboard = await ScoreService.getGameLeaderboard(
          request.params.game_id,
          limit,
        );

        const result = new SuccessResponse(
          StatusCodes.OK,
          'Leaderboard retrieved successfully',
          leaderboard,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/user/all-scores',
    validateAuth({}),
    async (request: AuthedRequest, response: Response, next: NextFunction) => {
      try {
        const allScores = await ScoreService.getUserAllScores(
          request.user!.user_id,
        );

        const result = new SuccessResponse(
          StatusCodes.OK,
          'All user scores retrieved successfully',
          allScores,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  );
