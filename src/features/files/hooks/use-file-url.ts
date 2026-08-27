import { useQuery } from '@tanstack/react-query';

import { filesApi } from '../services/files.api';

/**
 * Resolves a stored file id to a currently-valid url.
 *
 * Presigned urls expire, so the answer is deliberately NOT cached for long:
 * `staleTime` sits well inside the signature's lifetime, and the query refetches
 * rather than handing back a link that has since died.
 */
export function useFileUrl(fileId: string | null) {
  return useQuery({
    queryKey: ['file', fileId],
    queryFn: () => filesApi.get(fileId ?? ''),
    enabled: fileId !== null,
    // The backend signs downloads for an hour; refreshing at 45 minutes means
    // a url handed out at the edge of the window still has real time left.
    staleTime: 45 * 60 * 1000,
  });
}
