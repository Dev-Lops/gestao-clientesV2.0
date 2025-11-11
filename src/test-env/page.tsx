export default function TestEnv() {
  return (
    <div>
      <h1>Firebase API Key:</h1>
      <p>{process.env.NEXT_PUBLIC_FIREBASE_API_KEY}</p>
    </div>
  )
}
