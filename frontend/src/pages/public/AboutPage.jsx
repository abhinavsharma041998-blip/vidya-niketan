import { GraduationCap, Target, Eye, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-20">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-16 mb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-montserrat font-black mb-3">About Us</h1>
          <p className="text-blue-200 text-lg">Empowering students with quality computer education since 2016</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">Our Story</p>
            <h2 className="text-3xl font-montserrat font-bold text-gray-900 dark:text-white mb-6">Building Careers Through Quality Education</h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-4">Vidya Niketan Education Centre was established with a single mission: to provide affordable, quality computer education to every student regardless of their background.</p>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-4">Over the years, we have trained hundreds of students who are now working in reputed companies, running their own businesses, or pursuing higher studies in computer science.</p>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Our team of experienced faculty, modern lab facilities, and practical curriculum make us the preferred choice for computer education in the region.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: <Target className="w-6 h-6" />, title: 'Our Mission', text: 'To make quality computer education accessible and affordable for all students.' },
              { icon: <Eye className="w-6 h-6" />, title: 'Our Vision', text: 'To be the leading computer education institute producing job-ready professionals.' },
              { icon: <Heart className="w-6 h-6" />, title: 'Our Values', text: 'Integrity, Excellence, Innovation, and Student-first approach in everything we do.' },
              { icon: <GraduationCap className="w-6 h-6" />, title: 'Our Commitment', text: 'Continuous learning, updated curriculum, and lifelong support for our students.' },
            ].map((item, i) => (
              <div key={i} className="card p-5">
                <div className="text-blue-600 mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Team section placeholder */}
        <div className="text-center">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">Our Team</p>
          <h2 className="text-3xl font-montserrat font-bold text-gray-900 dark:text-white mb-4">Expert Faculty Members</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Our faculty members are industry professionals with years of teaching experience, dedicated to your success.</p>
        </div>
      </div>
    </div>
  );
}
