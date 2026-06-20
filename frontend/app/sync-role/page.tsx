import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function SyncRolePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }

  const { role } = await searchParams

  if (role === 'entrepreneur' || role === 'investor') {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: role }
    })

    let needsProfileComplete = false;

    // Sync with backend
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/sync-clerk-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerk_id: userId,
          email: user.emailAddresses[0]?.emailAddress || '',
          full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          role: role
        })
      });
      const data = await response.json();
      
      // Save internal user_id in Clerk metadata for easy access later
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { 
          role: role,
          internal_id: data.user_id 
        }
      })

      if (!data.profile_complete) {
        needsProfileComplete = true;
      }
    } catch (e) {
      console.error("Failed to sync user with backend", e)
    }

    // Wait, let's keep needsProfileComplete variable out of the way, just skip to dashboard

    if (role === 'investor') {
      redirect('/investor/dashboard')
    } else {
      redirect('/dashboard')
    }
  }

  // Fallback
  redirect('/')
}
