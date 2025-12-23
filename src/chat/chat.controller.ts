import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process a natural language query',
    description:
      'Takes a natural language query and returns AI-generated response. Uses LLM with tool calling to automatically select and execute the appropriate tools.',
  })
  @ApiResponse({
    status: 200,
    description: 'Query processed successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  async chat(@Body() request: ChatRequestDto): Promise<ChatResponseDto> {
    return await this.chatService.processQuery(request.query, request.userId);
  }
}

