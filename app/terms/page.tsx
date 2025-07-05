export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing and using MeCare, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">2. Use License</h2>
              <p className="text-gray-600 leading-relaxed">
                Permission is granted to temporarily download one copy of MeCare for personal, non-commercial transitory viewing only.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">3. Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">4. Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal health information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">5. Medical Disclaimer</h2>
              <p className="text-gray-600 leading-relaxed">
                MeCare is for informational purposes only and is not intended as medical advice. Always consult with healthcare professionals for medical concerns.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">6. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at support@mecare.app
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
