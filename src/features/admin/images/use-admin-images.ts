import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminImagesApi, putToPresignedUrl } from './admin-images.api';

const key = (mealId: string) => ['admin', 'recipe-images', mealId] as const;

export function useRecipeImages(mealId: string) {
  return useQuery({
    queryKey: key(mealId),
    queryFn: () => adminImagesApi.list(mealId),
  });
}

/** Fetched on demand, when an operator opens the prompt panel. */
export function useImagePrompt(mealId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'recipe-image-prompt', mealId],
    queryFn: () => adminImagesApi.prompt(mealId),
    enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * The upload, as one operation.
 *
 * Three steps — presign, PUT, confirm — but one thing from the operator's
 * point of view, so a failure at any step leaves nothing half-done in the UI.
 */
export function useUploadImage(mealId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const issued = await adminImagesApi.requestUpload(mealId, {
        content_type: file.type,
        content_length: file.size,
      });
      await putToPresignedUrl(issued.url, file);
      return adminImagesApi.confirmUpload(mealId, issued.image_id, file.type);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: key(mealId) });
    },
  });
}

export function useGenerateImage(mealId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (promptOverride?: string) => adminImagesApi.generate(mealId, promptOverride),
    onSuccess: () => {
      // The job writes the image, so the list is refetched when it lands
      // rather than optimistically.
      void client.invalidateQueries({ queryKey: key(mealId) });
    },
  });
}

export function useImageActions(mealId: string) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: key(mealId) });

  const publish = useMutation({
    mutationFn: (imageId: string) => adminImagesApi.publish(mealId, imageId),
    onSuccess: () => { void refresh(); },
  });

  const reject = useMutation({
    mutationFn: (input: { imageId: string; reason: string }) =>
      adminImagesApi.reject(mealId, input.imageId, input.reason),
    onSuccess: () => { void refresh(); },
  });

  const setPrimary = useMutation({
    mutationFn: (imageId: string) => adminImagesApi.setPrimary(mealId, imageId),
    onSuccess: () => { void refresh(); },
  });

  const remove = useMutation({
    mutationFn: (imageId: string) => adminImagesApi.remove(mealId, imageId),
    onSuccess: () => { void refresh(); },
  });

  return { publish, reject, setPrimary, remove };
}
