// ...existing code...
// (Deklarasi GroupSortController tunggal, semua endpoint digabung di bawah ini)
import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  type AuthedRequest,
  SuccessResponse,
  validateAuth,
  validateBody,
} from '@/common';

import { GroupSortService } from './group-sort.service';
import {
  CheckAnswerSchema,
  CreateGroupSortSchema,
  type ICheckAnswer,
  type ICreateGroupSort,
  type IUpdateGroupSort,
  UpdateGroupSortSchema,
} from './schema';

export const GroupSortController = Router()
  // Support PATCH dengan path pendek agar frontend tidak perlu diubah
  .patch(
    '/:game_id',
    validateAuth({}),
    validateBody({ schema: UpdateGroupSortSchema.pick({ is_publish: true }) }),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        // Type-safe FormData/JSON fallback
        let is_publish: boolean | string | undefined;
        const body = request.body as Record<string, unknown>;

        if (
          typeof body.is_publish === 'boolean' ||
          typeof body.is_publish === 'string'
        ) {
          is_publish = body.is_publish;
        } else if (Object.keys(body).length === 1) {
          const key = Object.keys(body)[0];

          try {
            const parsed: unknown = JSON.parse(key);

            if (
              typeof parsed === 'object' &&
              parsed !== null &&
              Object.prototype.hasOwnProperty.call(parsed, 'is_publish')
            ) {
              const value = (parsed as Record<string, unknown>).is_publish;

              if (typeof value === 'boolean' || typeof value === 'string') {
                is_publish = value;
              }
            }
          } catch {
            is_publish = undefined;
          }
        }

        const publishValue =
          typeof is_publish === 'string'
            ? is_publish === 'true'
            : Boolean(is_publish);
        const updatedGame = await GroupSortService.updateGroupSort(
          request.params.game_id,
          { is_publish: publishValue },
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Group Sort game publish status updated successfully',
          updatedGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        console.error(
          'Update GroupSort PATCH (short) Error:',
          error,
          request.body,
        );

        return next(error);
      }
    },
  )
  // Support PATCH with FormData for publish/unpublish via /api/game/game-type/group-sort/:game_id
  .patch(
    '/game-type/group-sort/:game_id',
    validateAuth({}),
    validateBody({ schema: UpdateGroupSortSchema.pick({ is_publish: true }) }),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        let is_publish: boolean | string | undefined;
        const body = request.body as Record<string, unknown>;

        if (
          typeof body.is_publish === 'boolean' ||
          typeof body.is_publish === 'string'
        ) {
          is_publish = body.is_publish;
        } else if (Object.keys(body).length === 1) {
          const key = Object.keys(body)[0];

          try {
            const parsed: unknown = JSON.parse(key);

            if (
              typeof parsed === 'object' &&
              parsed !== null &&
              Object.prototype.hasOwnProperty.call(parsed, 'is_publish')
            ) {
              const value = (parsed as Record<string, unknown>).is_publish;

              if (typeof value === 'boolean' || typeof value === 'string') {
                is_publish = value;
              }
            }
          } catch {
            is_publish = undefined;
          }
        }

        const publishValue =
          typeof is_publish === 'string'
            ? is_publish === 'true'
            : Boolean(is_publish);
        const updatedGame = await GroupSortService.updateGroupSort(
          request.params.game_id,
          { is_publish: publishValue },
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Group Sort game publish status updated successfully',
          updatedGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        console.error('Update GroupSort Publish Status Error:', error);

        return next(error);
      }
    },
  )
  .put(
    '/:game_id',
    validateAuth({}),
    validateBody({
      schema: UpdateGroupSortSchema,
    }),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        let is_publish: boolean | string | undefined;
        const body = request.body as Record<string, unknown>;

        if (
          typeof body.is_publish === 'boolean' ||
          typeof body.is_publish === 'string'
        ) {
          is_publish = body.is_publish;
        } else if (Object.keys(body).length === 1) {
          const key = Object.keys(body)[0];

          try {
            const parsed: unknown = JSON.parse(key);

            if (
              typeof parsed === 'object' &&
              parsed !== null &&
              Object.prototype.hasOwnProperty.call(parsed, 'is_publish')
            ) {
              const value = (parsed as Record<string, unknown>).is_publish;

              if (typeof value === 'boolean' || typeof value === 'string') {
                is_publish = value;
              }
            }
          } catch {
            is_publish = undefined;
          }
        }

        const publishValue =
          typeof is_publish === 'string'
            ? is_publish === 'true'
            : Boolean(is_publish);
        const updatedGame = await GroupSortService.updateGroupSort(
          request.params.game_id,
          { ...request.body, is_publish: publishValue } as IUpdateGroupSort,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Group Sort game updated successfully',
          updatedGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        console.error('Update GroupSort PUT Error:', error);

        return next(error);
      }
    },
  )
  .post(
    '/',
    validateAuth({}),
    validateBody({
      schema: CreateGroupSortSchema,
    }),
    async (
      request: AuthedRequest<{}, {}, ICreateGroupSort>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const newGame = await GroupSortService.createGroupSort(
          request.body,
          request.user!.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Group Sort game created successfully',
          newGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await GroupSortService.getGroupSortGameDetail(
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get Group Sort game detail successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .patch(
    '/:game_id',
    validateAuth({}),
    validateBody({
      schema: UpdateGroupSortSchema,
    }),
    async (
      request: AuthedRequest<{ game_id: string }, {}, IUpdateGroupSort>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const updatedGame = await GroupSortService.updateGroupSort(
          request.params.game_id,
          request.body,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Group Sort game updated successfully',
          updatedGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        console.error('Update GroupSort Error:', error);

        return next(error);
      }
    },
  )
  .delete(
    '/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        await GroupSortService.deleteGroupSort(
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Group Sort game deleted successfully',
          { success: true },
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/:game_id/play/public',
    async (
      request: Request<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await GroupSortService.getGroupSortPlay(
          request.params.game_id,
          true,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get Group Sort game successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/:game_id/play/private',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await GroupSortService.getGroupSortPlay(
          request.params.game_id,
          false,
          request.user!.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get Group Sort game successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .post(
    '/:game_id/check-answer',
    validateAuth({ optional: true }),
    validateBody({
      schema: CheckAnswerSchema,
    }),
    async (
      request: AuthedRequest<{ game_id: string }, {}, ICheckAnswer>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const result_data = await GroupSortService.checkAnswer(
          request.params.game_id,
          request.body,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Answer checked successfully',
          result_data,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  );
