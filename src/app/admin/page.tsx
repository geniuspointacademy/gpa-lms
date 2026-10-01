export default function AdminPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gpa-navy mb-6">Admin Panel</h1>
      <div className="bg-white p-6 rounded-lg border">
        <p className="text-gray-600">
          Admin tools will appear here. (Protected route — will require admin role.)
        </p>
      </div>
    </div>
  )
}
