import { redirect } from 'next/navigation'

export default async function Home() {
  // Skip auth check for testing
  redirect('/prompt')
}
