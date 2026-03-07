import {
  deleteFile,
  getSignedUrl,
  uploadPublicFile,
  validateFile,
} from './storage';

// Basic File polyfill for Jest environment if not present
if (typeof File === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).File = class FileMock extends Blob {
    name: string;
    lastModified: number;
    constructor(chunks: BlobPart[], name: string, options?: FilePropertyBag) {
      super(chunks, options);
      this.name = name;
      this.lastModified = Date.now();
    }
  };
}

const createClientMock = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => createClientMock(),
}));

describe('validateFile', () => {
  const makeFile = (sizeBytes: number, type: string) =>
    new File([new ArrayBuffer(sizeBytes)], 'file.bin', { type });

  it('returns error when file is too large', () => {
    const file = makeFile(3 * 1024 * 1024, 'image/png'); // 3MB
    const error = validateFile(file, { maxSizeMB: 2, allowedTypes: ['image/png'] });
    expect(error).toMatch(/must be under 2 MB/);
  });

  it('returns error when file type is not allowed', () => {
    const file = makeFile(1000, 'application/pdf');
    const error = validateFile(file, {
      maxSizeMB: 2,
      allowedTypes: ['image/png', 'image/jpeg'],
    });
    expect(error).toMatch(/is not allowed/);
  });

  it('returns null for valid files', () => {
    const file = makeFile(1000, 'image/png');
    const error = validateFile(file, {
      maxSizeMB: 2,
      allowedTypes: ['image/png'],
    });
    expect(error).toBeNull();
  });
});

describe('storage Supabase wrappers', () => {
  const storageMock = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    createClientMock.mockReturnValue({ storage: storageMock });
    storageMock.from.mockReset();
  });

  it('uploadPublicFile returns error message on failure', async () => {
    const upload = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'upload failed' },
    });
    storageMock.from.mockReturnValue({ upload });

    const file = new File([new ArrayBuffer(10)], 'file.png', { type: 'image/png' });
    const result = await uploadPublicFile('bucket', 'path/file.png', file);

    expect(result.error).toBe('upload failed');
    expect(result.path).toBe('');
  });

  it('deleteFile returns boolean based on Supabase error', async () => {
    const remove = jest
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'failed' } });
    storageMock.from.mockReturnValue({ remove });

    await expect(deleteFile('bucket', 'path')).resolves.toBe(true);
    await expect(deleteFile('bucket', 'path')).resolves.toBe(false);
  });

  it('getSignedUrl returns null when Supabase errors', async () => {
    const createSignedUrl = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'failed' } });
    storageMock.from.mockReturnValue({ createSignedUrl });

    const url = await getSignedUrl('bucket', 'path');
    expect(url).toBeNull();
  });
});

