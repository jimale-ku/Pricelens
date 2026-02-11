import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionGuard } from '../subscriptions/guards/subscription.guard';
import { RequireSubscription } from '../subscriptions/decorators/require-subscription.decorator';
import { ReceiptsService } from './receipts.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** In-memory uploaded file (multer memoryStorage) */
interface UploadedFilePayload {
  buffer?: Buffer;
  mimetype?: string;
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  size?: number;
}

@ApiTags('receipts')
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post('analyze-sample')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @RequireSubscription('BASIC')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyze a sample receipt (for testing without uploading)' })
  async analyzeSample() {
    return this.receiptsService.analyzeSampleReceipt();
  }

  @Post('analyze')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @RequireSubscription('BASIC')
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('receipt', {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        receipt: { type: 'string', format: 'binary', description: 'Receipt image file' },
      },
      required: ['receipt'],
    },
  })
  @ApiOperation({ summary: 'Analyze receipt image with AI and extract line items' })
  async analyze(@UploadedFile() file: UploadedFilePayload) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Send a multipart form field named "receipt" with the image.');
    }
    const buffer = file.buffer;
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new BadRequestException('Invalid file. Please upload a receipt image (JPEG, PNG, or WebP).');
    }
    const mime = file.mimetype || 'image/jpeg';
    if (!ALLOWED_MIMES.includes(mime)) {
      throw new BadRequestException('Invalid file type. Use JPEG, PNG, or WebP.');
    }
    return this.receiptsService.analyzeReceiptImage(buffer, mime);
  }
}
