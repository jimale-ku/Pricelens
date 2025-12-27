import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('lists')
@Controller('lists')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shopping list' })
  @ApiResponse({ status: 201, description: 'List created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Req() req: any, @Body() dto: CreateListDto) {
    return this.listsService.createList(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user lists' })
  @ApiResponse({ status: 200, description: 'Returns all user lists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Req() req: any) {
    return this.listsService.getUserLists(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific list with all items' })
  @ApiResponse({ status: 200, description: 'Returns list details' })
  @ApiResponse({ status: 404, description: 'List not found' })
  @ApiResponse({ status: 403, description: 'Access forbidden' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.listsService.getListById(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update list name or description' })
  @ApiResponse({ status: 200, description: 'List updated successfully' })
  @ApiResponse({ status: 404, description: 'List not found' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateListDto) {
    return this.listsService.updateList(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a list and all its items' })
  @ApiResponse({ status: 200, description: 'List deleted successfully' })
  @ApiResponse({ status: 404, description: 'List not found' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.listsService.deleteList(req.user.userId, id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to list' })
  @ApiResponse({ status: 201, description: 'Item added successfully' })
  @ApiResponse({ status: 404, description: 'List or product not found' })
  addItem(@Req() req: any, @Param('id') id: string, @Body() dto: AddItemDto) {
    return this.listsService.addItemToList(req.user.userId, id, dto);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Update item quantity or notes' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  updateItem(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.listsService.updateListItem(req.user.userId, id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove item from list' })
  @ApiResponse({ status: 200, description: 'Item removed successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  removeItem(@Req() req: any, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.listsService.removeItemFromList(req.user.userId, id, itemId);
  }

  @Post(':id/items/:itemId/purchase')
  @ApiOperation({ summary: 'Mark item as purchased or unpurchased' })
  @ApiResponse({ status: 200, description: 'Item status updated' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  markPurchased(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body('isPurchased') isPurchased: boolean,
  ) {
    return this.listsService.markItemPurchased(req.user.userId, id, itemId, isPurchased);
  }

  @Get(':id/total')
  @ApiOperation({ summary: 'Get estimated total cost of list' })
  @ApiResponse({ status: 200, description: 'Returns total cost estimate' })
  @ApiResponse({ status: 404, description: 'List not found' })
  getTotal(@Req() req: any, @Param('id') id: string) {
    return this.listsService.getTotalEstimatedCost(req.user.userId, id);
  }
}
