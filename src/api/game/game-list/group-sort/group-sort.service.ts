import { type Prisma, type ROLE } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { v4 } from 'uuid';

import { ErrorResponse, type IGroupSortJson, prisma } from '@/common';
import { FileManager } from '@/utils';

import {
  type ICheckAnswer,
  type ICreateGroupSort,
  type IUpdateGroupSort,
} from './schema';

export abstract class GroupSortService {
  private static groupSortSlug = 'group-sort';

  static async createGroupSort(data: ICreateGroupSort, user_id: string) {
    await this.existGameCheck(data.name);

    const newGameId = v4();
    const gameTemplateId = await this.getGameTemplateId();

    // Handle thumbnail image conversion from base64 to file
    let thumbnailImagePath = '';

    if (data.thumbnail_image) {
      try {
        const file = this.base64ToFile(
          data.thumbnail_image,
          `thumbnail_${Date.now()}.png`,
        );
        thumbnailImagePath = await FileManager.upload(
          `game/group-sort/${newGameId}`,
          file,
        );
      } catch (error) {
        console.error('Failed to process thumbnail image:', error);
        thumbnailImagePath = '';
      }
    }

    // Handle item images conversion from base64 to file
    const processedCategories = await Promise.all(
      data.categories.map(async category => ({
        category_name: category.category_name,
        items: await Promise.all(
          category.items.map(async item => ({
            item_text: item.item_text,
            item_image: item.item_image
              ? await this.base64ToFilePath(item.item_image, newGameId)
              : null,
            item_hint: item.item_hint || undefined,
          })),
        ),
      })),
    );

    const groupSortJson: IGroupSortJson = {
      score_per_item: data.score_per_item,
      time_limit: data.time_limit,
      is_category_randomized: data.is_category_randomized,
      is_item_randomized: data.is_item_randomized,
      categories: processedCategories,
    };

    const newGame = await prisma.games.create({
      data: {
        id: newGameId,
        game_template_id: gameTemplateId,
        creator_id: user_id,
        name: data.name,
        description: data.description,
        thumbnail_image: thumbnailImagePath,
        is_published: data.is_publish_immediately,
        game_json: groupSortJson as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    });

    return newGame;
  }

  static async getGroupSortGameDetail(
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findFirst({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        creator_id: true,
        game_json: true,
      },
    });

    if (!game)
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort game not found',
      );

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'You are not authorized to access this game',
      );

    const gameJson = game.game_json as unknown as IGroupSortJson;

    return {
      id: game.id,
      name: game.name,
      description: game.description,
      thumbnail_image: game.thumbnail_image,
      is_published: game.is_published,
      score_per_item: gameJson.score_per_item,
      time_limit: gameJson.time_limit,
      is_category_randomized: gameJson.is_category_randomized,
      is_item_randomized: gameJson.is_item_randomized,
      categories: gameJson.categories,
    };
  }

  static async updateGroupSort(
    game_id: string,
    data: IUpdateGroupSort,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: { creator_id: true, game_json: true },
    });

    if (!game)
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort game not found',
      );

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'You are not authorized to edit this game',
      );

    let updatedGameJson: IGroupSortJson | undefined;

    if (data.categories) {
      const gameJson = game.game_json as unknown as IGroupSortJson;

      updatedGameJson = {
        score_per_item: data.score_per_item ?? gameJson.score_per_item,
        time_limit: data.time_limit ?? gameJson.time_limit,
        is_category_randomized:
          data.is_category_randomized ?? gameJson.is_category_randomized,
        is_item_randomized:
          data.is_item_randomized ?? gameJson.is_item_randomized,
        categories: data.categories.map(category => ({
          category_name: category.category_name,
          items: category.items.map(item => ({
            item_text: item.item_text,
            item_image: item.item_image || null,
            item_hint: item.item_hint || undefined,
          })),
        })),
      } as IGroupSortJson;
    }

    const updateData: Prisma.GamesUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;

    // Handle thumbnail image update from base64 to file
    if (data.thumbnail_image !== undefined) {
      try {
        if (data.thumbnail_image) {
          // Delete old thumbnail if it exists
          const currentGame = await prisma.games.findUnique({
            where: { id: game_id },
            select: { thumbnail_image: true },
          });

          if (currentGame?.thumbnail_image) {
            await FileManager.remove(currentGame.thumbnail_image);
          }

          // Upload new thumbnail
          const file = this.base64ToFile(
            data.thumbnail_image,
            `thumbnail_${Date.now()}.png`,
          );
          updateData.thumbnail_image = await FileManager.upload(
            `game/group-sort/${game_id}`,
            file,
          );
        } else {
          updateData.thumbnail_image = '';
        }
      } catch (error) {
        console.error('Failed to process thumbnail image:', error);
        // Don't update thumbnail if there's an error
      }
    }

    if (data.is_publish !== undefined) {
      updateData.is_published = data.is_publish;
      console.log(
        `Updating publish status for game ${game_id}: ${data.is_publish}`,
      );
    }

    // Handle categories update with item image conversion
    if (updatedGameJson !== undefined) {
      const processedCategories = await Promise.all(
        updatedGameJson.categories.map(async category => ({
          category_name: category.category_name,
          items: await Promise.all(
            category.items.map(async item => ({
              item_text: item.item_text,
              item_image: item.item_image
                ? await this.base64ToFilePath(item.item_image, game_id)
                : null,
              item_hint: item.item_hint || undefined,
            })),
          ),
        })),
      );

      updateData.game_json = {
        ...updatedGameJson,
        categories: processedCategories,
      } as unknown as Prisma.InputJsonValue;
    }

    // Ensure at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return { id: game_id };
    }

    const updatedGame = await prisma.games.update({
      where: { id: game_id },
      data: updateData,
      select: { id: true },
    });

    return updatedGame;
  }

  static async deleteGroupSort(
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: { creator_id: true },
    });

    if (!game)
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort game not found',
      );

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'You are not authorized to delete this game',
      );

    // Delete associated files
    await FileManager.removeFolder(`uploads/game/group-sort/${game_id}`);

    await prisma.games.delete({
      where: { id: game_id },
    });

    return { success: true };
  }

  static async getGroupSortPlay(
    game_id: string,
    isPublic: boolean,
    user_id?: string,
  ) {
    const game = await prisma.games.findFirst({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        creator_id: true,
        game_json: true,
      },
    });

    if (!game)
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort game not found',
      );

    if (isPublic && !game.is_published) {
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort game not found',
      );
    }

    if (!isPublic && game.creator_id !== user_id) {
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'You are not authorized to access this game',
      );
    }

    const gameJson = game.game_json as unknown as IGroupSortJson;

    const categoriesWithIds = gameJson.categories.map((cat, catIndex) => ({
      id: `cat-${catIndex}`,
      name: cat.category_name,
      items: cat.items.map((item, itemIndex) => ({
        id: `item-${catIndex}-${itemIndex}`,
        text: item.item_text,
        image: item.item_image || null,
        hint: item.item_hint || undefined,
      })),
    }));

    let finalCategories = categoriesWithIds;

    if (gameJson.is_category_randomized) {
      finalCategories = [...categoriesWithIds].sort(() => Math.random() - 0.5);
    }

    if (gameJson.is_item_randomized) {
      finalCategories = finalCategories.map(cat => ({
        ...cat,
        items: [...cat.items].sort(() => Math.random() - 0.5),
      }));
    }

    return {
      id: game.id,
      name: game.name,
      description: game.description,
      thumbnail_image: game.thumbnail_image,
      is_published: game.is_published,
      game_data: {
        categories: finalCategories,
        timeLimit: gameJson.time_limit,
        scorePerItem: gameJson.score_per_item,
      },
    };
  }

  static async checkAnswer(game_id: string, data: ICheckAnswer) {
    const game = await prisma.games.findFirst({
      where: {
        id: game_id,
        is_published: true,
      },
      select: {
        id: true,
        game_json: true,
      },
    });

    if (!game)
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort game not found',
      );

    const gameJson = game.game_json as unknown as IGroupSortJson;

    // Calculate total items from all categories
    let totalItemsInGame = 0;

    for (const cat of gameJson.categories) {
      totalItemsInGame += cat.items.length;
    }

    const categoryMap = new Map<string, number>();

    for (const [catIndex, cat] of gameJson.categories.entries()) {
      for (const [itemIndex] of cat.items.entries()) {
        categoryMap.set(`item-${catIndex}-${itemIndex}`, catIndex);
      }
    }

    let correctCount = 0;

    for (const answer of data.answers) {
      const correctCategoryIndex = categoryMap.get(answer.item_id);
      const answerCategoryIndex = Number.parseInt(
        answer.category_id.replace('cat-', ''),
      );

      if (correctCategoryIndex === answerCategoryIndex) {
        correctCount++;
      }
    }

    const score = correctCount * gameJson.score_per_item;
    const maxScore = totalItemsInGame * gameJson.score_per_item;
    const percentage =
      totalItemsInGame > 0 ? (correctCount / totalItemsInGame) * 100 : 0;

    return {
      correct_count: correctCount,
      total_count: totalItemsInGame,
      score,
      max_score: maxScore,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  private static async getGameTemplateId() {
    const gameTemplate = await prisma.gameTemplates.findUnique({
      where: {
        slug: this.groupSortSlug,
      },
      select: {
        id: true,
      },
    });

    if (!gameTemplate)
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort template not found',
      );

    return gameTemplate.id;
  }

  private static async existGameCheck(name: string) {
    const existingGame = await prisma.games.findFirst({
      where: {
        name,
      },
    });

    if (existingGame)
      throw new ErrorResponse(
        StatusCodes.CONFLICT,
        'Game with this name already exists',
      );
  }

  /**
   * Convert base64 string to File object
   */
  private static base64ToFile(base64String: string, fileName: string): File {
    // Extract base64 data part
    let base64Data = base64String;

    // If it has data URL prefix, extract the base64 part after comma
    if (base64String.startsWith('data:')) {
      const parts = base64String.split(',');
      base64Data = parts.length > 1 ? parts[1] : base64String;
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Create blob and file
    const blob = new Blob([buffer], { type: 'image/png' });

    return new File([blob], fileName, { type: 'image/png' });
  }

  /**
   * Convert base64 image to file path if it's a base64 string, otherwise return as-is if it's already a file path
   */
  private static async base64ToFilePath(
    imageData: string,
    gameId: string,
  ): Promise<string | null> {
    // Check if it's a base64 string (starts with 'data:' or very long string)
    if (!imageData || typeof imageData !== 'string') {
      return null;
    }

    if (imageData.startsWith('data:') || imageData.length > 500) {
      try {
        const fileName = `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}.png`;

        const file = this.base64ToFile(imageData, fileName);

        const filePath = await FileManager.upload(
          `game/group-sort/${gameId}`,
          file,
        );

        return filePath;
      } catch (error) {
        console.error('Failed to convert base64 to file path:', error);

        return null;
      }
    }

    // If it's already a file path, return as-is
    return imageData;
  }
}
