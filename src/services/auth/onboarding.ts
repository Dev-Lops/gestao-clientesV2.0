import { getFirestore, Timestamp } from 'firebase-admin/firestore'

type OnboardingPayload = {
  uid: string
  email: string
  name: string
}

type OnboardingResult = {
  created: boolean
  updated: boolean
  hasOrganization: boolean
}

export async function handleUserOnboarding({
  uid,
  email,
  name,
}: OnboardingPayload): Promise<OnboardingResult> {
  const db = getFirestore()
  const userRef = db.collection('users').doc(uid)
  const snapshot = await userRef.get()

  if (!snapshot.exists) {
    await userRef.set({
      email,
      name,
      orgId: null,
      role: 'OWNER',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    return {
      created: true,
      updated: false,
      hasOrganization: false,
    }
  }

  const data = snapshot.data() as Record<string, unknown>
  const updates: Record<string, unknown> = {}

  if (!data.email) {
    updates.email = email
  }

  if (!data.name) {
    updates.name = name
  }

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = Timestamp.now()
    await userRef.update(updates)

    return {
      created: false,
      updated: true,
      hasOrganization: Boolean(data.orgId),
    }
  }

  return {
    created: false,
    updated: false,
    hasOrganization: Boolean(data.orgId),
  }
}
