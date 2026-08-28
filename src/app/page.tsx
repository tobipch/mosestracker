import { redirect } from 'next/navigation';
import { imBund } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Der Weg gabelt sich: angemeldet zur Steintafel, sonst zum Dornbusch. */
export default async function Start() {
  redirect((await imBund()) ? '/tafel' : '/dornbusch');
}
