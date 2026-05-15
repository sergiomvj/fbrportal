import { createSupabaseServerClient } from '@/lib/supabase-admin';
import { bucketForStoragePath, isSignedUrlExpired } from '@/lib/mkt/storage';
import { jsonError } from '../_shared';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const path = url.searchParams.get('path');
    const expires = url.searchParams.get('expires');

    if (!path || !expires) {
      return Response.json({ message: 'Missing path or expires parameter' }, { status: 400 });
    }

    if (isSignedUrlExpired(expires)) {
      return Response.json({ message: 'Download link expired' }, { status: 403 });
    }

    const bucket = bucketForStoragePath(path);

    const supabase = createSupabaseServerClient();
    
    // Create a 60 seconds signed URL for the redirect
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);

    if (error || !data) {
      throw new Error(error?.message || 'Failed to generate download URL');
    }

    // Redirect to the actual signed URL
    return Response.redirect(data.signedUrl);
  } catch (error) {
    return jsonError(error);
  }
}
