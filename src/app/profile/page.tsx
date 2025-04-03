import ProfileView from "../components/profile/profile-view"

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-6">Your Profile</h1>
      <ProfileView />
    </div>
  )
}

