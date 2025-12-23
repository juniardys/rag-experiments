import { ApiProperty } from '@nestjs/swagger';

export class ChatResponseDto {
  @ApiProperty({
    description: 'Natural language explanation of the results',
    example: 'Based on your query, I found 5 KOLs matching your criteria...',
  })
  explanation: string;

  @ApiProperty({
    description: 'Key insights extracted from the data',
    example: ['Found 5 KOLs in fashion niche', 'Top performer has 250k followers'],
    type: [String],
  })
  insights: string[];

  @ApiProperty({
    description: 'Raw data from the executor',
    example: { type: 'kol_recommendation', count: 5, kols: [] },
  })
  data: any;
}

